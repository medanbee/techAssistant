/**
 * Confluence 문서 크롤러
 * Puppeteer + SSO 인증 기반
 *
 * 대상: Inside, UXDB, 기술지식DB, PA, W5C
 */

const puppeteer = require('puppeteer');
const { maskPersonalInfo } = require('../utils/masking');
const { loadConfig } = require('../utils/config');
const fs = require('fs').promises;
const path = require('path');

// Confluence 스페이스별 설정
const SPACES = {
  inside: { key: 'INSIDE', label: 'Confluence Inside' },
  uxdb: { key: 'UXDB', label: 'Confluence UXDB' },
  techdb: { key: 'TECHDB', label: 'Confluence 기술지식DB' },
  pa: { key: 'PA', label: 'Confluence PA' },
  w5c: { key: 'W5C', label: 'Confluence W5C' },
  techdbinside: { key: 'TechDBinside', label: 'Confluence 기술지식DB(Inside)' },
  db: { key: 'DB', label: 'Confluence DB' },
};

class ConfluenceCollector {
  constructor(config) {
    this.config = config || loadConfig().confluence;
    this.browser = null;
    this.collectedData = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('[Confluence] 브라우저 초기화 완료');
  }

  /**
   * SSO 로그인
   */
  async login(page) {
    await page.goto(this.config.loginUrl, { waitUntil: 'networkidle2' });
    await page.type('#username', this.config.credentials.username);
    await page.type('#password', this.config.credentials.password);
    await page.click('#loginButton');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('[Confluence] SSO 로그인 성공');
  }

  /**
   * 특정 스페이스의 페이지 목록 조회
   */
  async getPageList(page, spaceKey) {
    const apiUrl = `${this.config.baseUrl}/rest/api/content?spaceKey=${spaceKey}&limit=100&expand=metadata.labels`;
    const pages = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      await page.goto(`${apiUrl}&start=${start}`, { waitUntil: 'networkidle2' });

      const data = await page.evaluate(() => {
        try {
          return JSON.parse(document.body.innerText);
        } catch {
          return null;
        }
      });

      if (!data?.results?.length) {
        hasMore = false;
        break;
      }

      pages.push(...data.results.map((p) => ({
        id: p.id,
        title: p.title,
        url: `${this.config.baseUrl}${p._links?.webui || ''}`,
      })));

      start += data.results.length;
      hasMore = data.size >= data.limit;
    }

    return pages;
  }

  /**
   * 개별 페이지 본문 수집
   */
  async collectPageContent(page, pageInfo, spaceLabel) {
    try {
      const apiUrl = `${this.config.baseUrl}/rest/api/content/${pageInfo.id}?expand=body.storage`;
      await page.goto(apiUrl, { waitUntil: 'networkidle2' });

      const data = await page.evaluate(() => {
        try {
          return JSON.parse(document.body.innerText);
        } catch {
          return null;
        }
      });

      if (!data?.body?.storage?.value) return null;

      const text = this._htmlToText(data.body.storage.value);
      if (!text || text.length < 50) return null;

      return {
        id: pageInfo.id,
        category: '',
        subcategory: '',
        question: maskPersonalInfo(pageInfo.title),
        answer: maskPersonalInfo(text),
        source: spaceLabel,
        date: '',
        tags: [],
      };
    } catch (err) {
      console.warn(`[Confluence] 페이지 수집 실패 (${pageInfo.title}):`, err.message);
      return null;
    }
  }

  _htmlToText(html) {
    if (!html) return '';
    return html
      .replace(/<ac:structured-macro[^>]*>[\s\S]*?<\/ac:structured-macro>/gi, '')
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * 전체 수집 실행
   */
  async collect(spaceKeys) {
    const targetSpaces = spaceKeys || Object.keys(SPACES);

    try {
      await this.init();
      const page = await this.browser.newPage();
      await this.login(page);

      for (const key of targetSpaces) {
        const space = SPACES[key];
        if (!space) {
          console.warn(`[Confluence] 알 수 없는 스페이스: ${key}`);
          continue;
        }

        console.log(`[Confluence] ${space.label} 수집 시작...`);
        const pageList = await this.getPageList(page, space.key);

        for (const pageInfo of pageList) {
          const content = await this.collectPageContent(page, pageInfo, space.label);
          if (content) {
            this.collectedData.push(content);
          }
        }

        console.log(`[Confluence] ${space.label} 완료: ${pageList.length}건 중 ${this.collectedData.length}건 수집`);
      }

      console.log(`[Confluence] 전체 수집 완료: 총 ${this.collectedData.length}건`);
      return this.collectedData;
    } finally {
      await this.close();
    }
  }

  async save(outputDir) {
    const outputPath = path.join(outputDir, 'confluence_qa.json');
    await fs.writeFile(outputPath, JSON.stringify(this.collectedData, null, 2), 'utf8');
    console.log(`[Confluence] 저장 완료: ${outputPath}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = { ConfluenceCollector, SPACES };
