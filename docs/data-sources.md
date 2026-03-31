# 데이터 소스 및 수집 방법 정의

## W-Tech 가이드

| 데이터 | 하위 항목 | 수집 방법 | 비고 |
|--------|-----------|-----------|------|
| API 가이드 | 웹스퀘어2, SP1~SP5, AI | 로컬 HTML 파싱 (cheerio) | `data/raw/wtech-guide/api-guide/` |
| 릴리즈 노트 | 웹스퀘어2, SP1~SP5, AI | 로컬 HTML 파싱 (cheerio) | `data/raw/wtech-guide/release-notes/` |
| 개발 가이드 | 웹스퀘어2, SP1~SP5, AI | 로컬 HTML 파싱 (cheerio) | `data/raw/wtech-guide/dev-guide/` |
| 컴포넌트 가이드 | | 로컬 HTML 파싱 (cheerio) | `data/raw/wtech-guide/component-guide/` |
| 컴포넌트 예제 모음(WRE) 가이드 | | 로컬 HTML 파싱 (cheerio) | `data/raw/wtech-guide/wre-guide/` |
| 퍼블리싱 가이드 | | 로컬 HTML 파싱 (cheerio) | `data/raw/wtech-guide/publishing-guide/` |
| 스니핏 가이드 | | 로컬 HTML 파싱 (cheerio) | `data/raw/wtech-guide/snippet-guide/` |
| 접근성 가이드 | | 로컬 HTML 파싱 (cheerio) | `data/raw/wtech-guide/accessibility-guide/` |

## W-Tech Q&A

| 데이터 | 수집 방법 | 비고 |
|--------|-----------|------|
| 기술문의 | Puppeteer 크롤링 (`wtechCollector.js`) | `data/raw/wtech-qa/qna_data.json` |
| 자주 찾는 문의(FAQ) | Puppeteer 크롤링 (`wtechFaqCollector.js`) | `data/raw/wtech-qa/faq_data.json` |

## Gmail

| 데이터 | 수집 방법 | 비고 |
|--------|-----------|------|
| Gmail 기술문의 | IMAP 2-Phase 수집 (`gmailCollector.js`) | `data/raw/gmail_qa.json` |

## Confluence / JIRA

| 데이터 | 수집 방법 | 비고 |
|--------|-----------|------|
| 기술지식 DB | Confluence REST API + Puppeteer (`confluenceCollector.js`) | `data/raw/confluence/confluence_db_data.json` |
| 기술지식 DB 내부용 | Confluence REST API + Puppeteer (`confluenceCollector.js`) | `data/raw/confluence/confluence_inside_data.json` |
| JIRA | 미구현 | `data/raw/jira/` (비어있음) |

## 기타

| 데이터 | 수집 방법 | 비고 |
|--------|-----------|------|
| 개발가이드 샘플 | 로컬 파일 수집 | `data/raw/dev-guide-sample/` (컴포넌트별 샘플 코드) |
