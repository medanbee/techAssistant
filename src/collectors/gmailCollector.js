/**
 * Gmail IMAP 기반 기술문의 자동 크롤러
 *
 * 2-Phase 방식:
 *   Phase 1: UID 경량 검색 (7개 병렬 쿼리)
 *   Phase 2: 30건 배치 본문 다운로드
 *
 * 후처리: 스레드 그룹핑 → Q&A 변환 → 개인정보 마스킹
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { maskPersonalInfo } = require('../utils/masking');
const { convertToQA } = require('../utils/converter');
const { loadConfig } = require('../utils/config');
const fs = require('fs').promises;
const path = require('path');

// Gmail X-GM-RAW 확장 검색 쿼리 (7개 병렬)
const SEARCH_QUERIES = [
  'subject:(기술문의)',
  'subject:(기술지원)',
  'subject:(WebSquare)',
  'subject:(웹스퀘어)',
  'subject:(GridView)',
  'subject:(엑셀 다운로드)',
  'subject:(라이선스)',
];

const BATCH_SIZE = 30;

class GmailCollector {
  constructor(config) {
    this.config = config || loadConfig().gmail;
    this.imap = null;
    this.collectedMails = [];
  }

  /**
   * IMAP 연결 생성
   */
  _createConnection() {
    return new Imap({
      user: this.config.user,
      password: this.config.appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 30000,
      authTimeout: 15000,
    });
  }

  /**
   * IMAP 연결 및 메일박스 오픈
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.imap = this._createConnection();
      this.imap.once('ready', () => {
        this.imap.openBox('INBOX', true, (err) => {
          if (err) return reject(err);
          console.log('[Gmail] IMAP 연결 성공');
          resolve();
        });
      });
      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  /**
   * Phase 1: UID 일괄 검색 (7개 쿼리 병렬 실행)
   */
  async searchUIDs() {
    const allUIDs = new Set();

    const searchPromises = SEARCH_QUERIES.map((query) => {
      return new Promise((resolve, reject) => {
        this.imap.search([['X-GM-RAW', query]], (err, uids) => {
          if (err) return reject(err);
          resolve(uids || []);
        });
      });
    });

    const results = await Promise.allSettled(searchPromises);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        result.value.forEach((uid) => allUIDs.add(uid));
      } else {
        console.warn('[Gmail] 검색 쿼리 실패:', result.reason?.message);
      }
    }

    console.log(`[Gmail] Phase 1 완료: ${allUIDs.size}건 UID 확보`);
    return Array.from(allUIDs);
  }

  /**
   * Phase 2: 배치 단위 본문 다운로드
   */
  async fetchBatch(uids) {
    const mails = [];

    for (let i = 0; i < uids.length; i += BATCH_SIZE) {
      const batch = uids.slice(i, i + BATCH_SIZE);
      const batchMails = await this._fetchMailBatch(batch);
      mails.push(...batchMails);
      console.log(`[Gmail] Phase 2 진행: ${Math.min(i + BATCH_SIZE, uids.length)}/${uids.length}`);
    }

    return mails;
  }

  /**
   * 단일 배치 메일 다운로드
   */
  async _fetchMailBatch(uids) {
    return new Promise((resolve, reject) => {
      const mails = [];
      const fetch = this.imap.fetch(uids, { bodies: '', struct: true });

      fetch.on('message', (msg) => {
        let buffer = '';
        msg.on('body', (stream) => {
          stream.on('data', (chunk) => { buffer += chunk.toString('utf8'); });
        });
        msg.once('end', () => {
          mails.push(buffer);
        });
      });

      fetch.once('error', reject);
      fetch.once('end', () => resolve(mails));
    });
  }

  /**
   * 메일 파싱 및 구조화 (첨부파일 포함)
   */
  async parseMails(rawMails) {
    const parsed = [];

    for (const raw of rawMails) {
      try {
        const mail = await simpleParser(raw);
        const attachments = (mail.attachments || []).map((att) => ({
          filename: att.filename || 'unknown',
          contentType: att.contentType || '',
          size: att.size || 0,
          content: att.content, // Buffer
        }));

        parsed.push({
          subject: mail.subject || '',
          from: mail.from?.text || '',
          to: mail.to?.text || '',
          date: mail.date?.toISOString() || '',
          text: mail.text || '',
          html: mail.html || '',
          messageId: mail.messageId || '',
          inReplyTo: mail.inReplyTo || '',
          references: mail.references || [],
          attachments,
        });
      } catch (err) {
        console.warn('[Gmail] 메일 파싱 실패:', err.message);
      }
    }

    return parsed;
  }

  /**
   * 첨부파일 저장
   */
  async saveAttachments(mails, outputDir) {
    const attachDir = path.join(outputDir, 'gmail_attachments');
    await fs.mkdir(attachDir, { recursive: true });

    let count = 0;
    for (const mail of mails) {
      if (!mail.attachments || mail.attachments.length === 0) continue;

      // 메일별 폴더: 날짜_제목 (파일명 안전 처리)
      const dateStr = mail.date ? mail.date.split('T')[0] : 'unknown';
      const safeSubject = (mail.subject || 'no-subject')
        .replace(/[<>:"/\\|?*\[\]]/g, '_')
        .substring(0, 50)
        .trim();
      const mailDir = path.join(attachDir, `${dateStr}_${safeSubject}`);
      await fs.mkdir(mailDir, { recursive: true });

      for (const att of mail.attachments) {
        if (!att.content) continue;
        const filePath = path.join(mailDir, att.filename);
        await fs.writeFile(filePath, att.content);
        count++;
      }
    }

    console.log(`[Gmail] 첨부파일 저장 완료: ${count}건 → ${attachDir}`);
    return count;
  }

  /**
   * 스레드 그룹핑: inReplyTo/references 기반
   */
  groupByThread(mails) {
    const threads = new Map();

    for (const mail of mails) {
      const threadId = mail.references?.[0] || mail.inReplyTo || mail.messageId;
      if (!threads.has(threadId)) {
        threads.set(threadId, []);
      }
      threads.get(threadId).push(mail);
    }

    // 시간순 정렬
    for (const [, thread] of threads) {
      thread.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    console.log(`[Gmail] 스레드 그룹핑 완료: ${threads.size}개 스레드`);
    return threads;
  }

  /**
   * 전체 크롤링 실행
   */
  async collect() {
    try {
      await this.connect();

      // Phase 1: UID 검색
      const uids = await this.searchUIDs();
      if (uids.length === 0) {
        console.log('[Gmail] 수집할 메일 없음');
        return [];
      }

      // Phase 2: 배치 다운로드
      const rawMails = await this.fetchBatch(uids);
      const parsedMails = await this.parseMails(rawMails);

      // 첨부파일 저장
      this._parsedMails = parsedMails;

      // 스레드 그룹핑
      const threads = this.groupByThread(parsedMails);

      // Q&A 변환 + 개인정보 마스킹
      const qaData = [];
      for (const [, thread] of threads) {
        const qa = convertToQA(thread);
        if (qa) {
          qa.question = maskPersonalInfo(qa.question);
          qa.answer = maskPersonalInfo(qa.answer);
          qa.source = 'Gmail 기술문의';
          qaData.push(qa);
        }
      }

      console.log(`[Gmail] 수집 완료: ${qaData.length}건 Q&A 변환`);
      this.collectedMails = qaData;
      return qaData;
    } finally {
      this.disconnect();
    }
  }

  /**
   * 수집 결과 저장 (Q&A + 첨부파일)
   */
  async save(outputDir) {
    const outputPath = path.join(outputDir, 'gmail_qa.json');
    await fs.writeFile(outputPath, JSON.stringify(this.collectedMails, null, 2), 'utf8');
    console.log(`[Gmail] 저장 완료: ${outputPath}`);

    // 첨부파일 저장
    if (this._parsedMails) {
      await this.saveAttachments(this._parsedMails, outputDir);
    }
  }

  disconnect() {
    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
  }
}

module.exports = GmailCollector;
