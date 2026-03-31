/**
 * W-Tech QNA 게시판 크롤러
 * Puppeteer 기반 기술문의 게시판 Q&A 수집
 */

const puppeteer = require('puppeteer');
const { maskPersonalInfo } = require('../utils/masking');
const { loadConfig } = require('../utils/config');
const fs = require('fs').promises;
const path = require('path');

class WTechCollector {
  constructor(config) {
    this.config = config || loadConfig().wtech;
    this.browser = null;
    this.collectedData = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('[W-Tech] 브라우저 초기화 완료');
  }

  /**
   * 로그인 처리
   */
  async login(page) {
    await page.goto(this.config.loginUrl, { waitUntil: 'networkidle2' });
    await page.type(this.config.selectors.username, this.config.credentials.username);
    await page.type(this.config.selectors.password, this.config.credentials.password);
    await page.click(this.config.selectors.loginButton);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('[W-Tech] 로그인 성공');
  }

  /**
   * 게시판 목록 페이지 크롤링
   */
  async collectListPage(page, pageNum) {
    const listUrl = `${this.config.baseUrl}/qna?page=${pageNum}`;
    await page.goto(listUrl, { waitUntil: 'networkidle2' });

    const items = await page.evaluate((selectors) => {
      const rows = document.querySelectorAll(selectors.listRow);
      return Array.from(rows).map((row) => ({
        id: row.querySelector(selectors.id)?.textContent?.trim(),
        title: row.querySelector(selectors.title)?.textContent?.trim(),
        link: row.querySelector(selectors.titleLink)?.href,
        date: row.querySelector(selectors.date)?.textContent?.trim(),
        category: row.querySelector(selectors.category)?.textContent?.trim(),
      }));
    }, this.config.selectors);

    return items.filter((item) => item.id && item.link);
  }

  /**
   * 개별 Q&A 상세 페이지 크롤링
   */
  async collectDetail(page, item) {
    try {
      await page.goto(item.link, { waitUntil: 'networkidle2' });

      const detail = await page.evaluate((selectors) => {
        return {
          question: document.querySelector(selectors.questionContent)?.innerHTML || '',
          answer: document.querySelector(selectors.answerContent)?.innerHTML || '',
        };
      }, this.config.selectors);

      return {
        id: item.id,
        category: item.category || '',
        subcategory: '',
        question: maskPersonalInfo(this._htmlToText(detail.question)),
        answer: maskPersonalInfo(this._htmlToText(detail.answer)),
        source: 'W-Tech QNA',
        date: item.date || '',
        tags: [],
      };
    } catch (err) {
      console.warn(`[W-Tech] 상세 크롤링 실패 (ID: ${item.id}):`, err.message);
      return null;
    }
  }

  /**
   * HTML을 텍스트로 변환 (코드 블록 보존)
   */
  _htmlToText(html) {
    if (!html) return '';
    return html
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * 전체 수집 실행
   * @param {Object} options
   * @param {string} options.since - 이 날짜 이후 글만 수집 (YYYY-MM-DD), 이전 글 만나면 중단
   */
  async collect(options = {}) {
    const sinceDate = options.since ? new Date(options.since) : null;

    try {
      await this.init();
      const page = await this.browser.newPage();
      await this.login(page);

      let pageNum = 1;
      let hasMore = true;

      while (hasMore) {
        const items = await this.collectListPage(page, pageNum);
        if (items.length === 0) {
          hasMore = false;
          break;
        }

        for (const item of items) {
          // 날짜 필터: since 이전 글이면 수집 중단
          if (sinceDate && item.date) {
            const itemDate = new Date(item.date);
            if (itemDate < sinceDate) {
              console.log(`[W-Tech] ${item.date} 글 도달 — 이번주 수집 완료`);
              hasMore = false;
              break;
            }
          }

          const detail = await this.collectDetail(page, item);
          if (detail) {
            this.collectedData.push(detail);
          }
        }

        console.log(`[W-Tech] 페이지 ${pageNum} 완료: 누적 ${this.collectedData.length}건`);
        pageNum++;
      }

      console.log(`[W-Tech] 수집 완료: 총 ${this.collectedData.length}건`);
      return this.collectedData;
    } finally {
      await this.close();
    }
  }

  async save(outputDir) {
    const outputPath = path.join(outputDir, 'wtech_qa.json');
    await fs.writeFile(outputPath, JSON.stringify(this.collectedData, null, 2), 'utf8');
    console.log(`[W-Tech] 저장 완료: ${outputPath}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = WTechCollector;
