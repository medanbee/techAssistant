#!/usr/bin/env node
/**
 * 데이터 통합 스크립트
 * data/raw/ 의 원본 크롤링 데이터를 통합 QA 포맷으로 변환하여
 * data/processed/all_qa.json 에 저장
 *
 * 통합 포맷: { question, answer, source, date, tags, category, subcategory }
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const RAW_DIR = path.join(__dirname, '../data/raw');
const OUTPUT_PATH = path.join(__dirname, '../data/processed/all_qa.json');

// 태그 추출 패턴
const TAG_PATTERNS = [
  /gridview/i, /grid/i, /엑셀/i, /excel/i,
  /selectbox/i, /calendar/i, /input/i,
  /popup/i, /tab/i, /dataset/i,
  /submission/i, /ajax/i,
  /라이선스/i, /license/i,
  /보안/i, /xss/i,
  /servlet/i, /jakarta/i,
  /poi/i, /업로드/i, /다운로드/i,
];

function extractTags(text) {
  if (!text) return [];
  return TAG_PATTERNS
    .filter(p => p.test(text))
    .map(p => p.source.replace(/\\/g, ''));
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/^>.*$/gm, '')
    .replace(/\n--\s*\n[\s\S]*$/m, '')
    .replace(/\[image:[^\]]*\]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function loadJSON(filePath) {
  return fs.readFile(filePath, 'utf8').then(JSON.parse);
}

// ── Gmail ──
// 원본: { subject, date, threadId, messageCount, content }
// 전략:
//   1) Q:/A: 접두어가 있으면 그걸로 분리
//   2) messageCount>1이면 content 전체를 답변, subject를 질문으로
//   3) messageCount=1이라도 기술 내용이면 subject=질문, content=답변으로 보존
async function convertGmail() {
  const filePath = path.join(RAW_DIR, 'gmail_qa.json');
  let data;
  try { data = await loadJSON(filePath); } catch { return []; }

  const results = [];
  for (const item of data) {
    let question = '';
    let answer = '';

    // 새 수집기 형식: question/answer 필드가 이미 있는 경우
    if (item.question && item.answer) {
      question = cleanText(item.question);
      answer = cleanText(item.answer);
    }
    // 기존 형식: subject/content 기반 변환
    else {
      const rawContent = item.content || '';
      const content = cleanText(rawContent);
      if (!content || content.length < 20) continue;

      // 방법 1: Q:/A: 접두어로 분리
      const qaMatch = rawContent.match(/Q:\s*([\s\S]*?)(?:\nA:\s*)([\s\S]*)/);
      if (qaMatch) {
        question = cleanText(qaMatch[1]);
        answer = cleanText(qaMatch[2]);
      }
      // 방법 2: subject를 질문으로, content를 답변으로
      else {
        question = cleanText(item.subject || '');
        answer = content;
      }
    }

    if (!question || question.length < 5) continue;
    if (!answer || answer.length < 10) continue;

    results.push({
      category: item.category || '',
      subcategory: item.subcategory || '',
      question,
      answer,
      source: item.source || 'Gmail 기술문의',
      date: item.date || '',
      tags: item.tags || extractTags(question + ' ' + answer),
    });
  }

  console.log(`[Gmail] ${results.length}건 변환 (원본 ${data.length}건)`);
  return results;
}

// ── W-Tech QNA ──
// 원본: { num, status, product, category, title, date, author, views, question, commentCount, comments[] }
async function convertWtechQna() {
  const filePath = path.join(RAW_DIR, 'wtech-qa/qna_data.json');
  let data;
  try { data = await loadJSON(filePath); } catch { return []; }

  const results = [];
  for (const item of data) {
    const question = cleanText(item.question || item.title || '');
    if (!question || question.length < 10) continue;

    // comments 배열에서 답변 추출
    const answerParts = (item.comments || [])
      .map(c => cleanText(c.content || ''))
      .filter(t => t.length > 0);
    const answer = answerParts.join('\n\n---\n\n');

    if (!answer) continue;

    results.push({
      category: '',
      subcategory: '',
      question,
      answer,
      source: 'W-Tech QNA',
      date: item.date || '',
      tags: extractTags(question + ' ' + answer),
    });
  }

  console.log(`[W-Tech QNA] ${results.length}건 변환 (원본 ${data.length}건)`);
  return results;
}

// ── W-Tech FAQ ──
// 원본: { num, product, title, answer }
async function convertWtechFaq() {
  const filePath = path.join(RAW_DIR, 'wtech-qa/faq_data.json');
  let data;
  try { data = await loadJSON(filePath); } catch { return []; }

  const results = [];
  for (const item of data) {
    const question = cleanText(item.title || '');
    const answer = cleanText(item.answer || '');
    if (!question || !answer || answer.length < 10) continue;

    results.push({
      category: '',
      subcategory: '',
      question,
      answer,
      source: 'W-Tech FAQ',
      date: '',
      tags: extractTags(question + ' ' + answer),
    });
  }

  console.log(`[W-Tech FAQ] ${results.length}건 변환 (원본 ${data.length}건)`);
  return results;
}

// ── Confluence ──
// 원본: { space, pageId, title, parent, content, lastModified, labels, url }
async function convertConfluence() {
  const confluenceDir = path.join(RAW_DIR, 'confluence');
  const files = [
    'confluence_inside_data.json',
    'confluence_db_data.json',
    'confluence_uxdb_data.json',
    'confluence_pa_data.json',
    'confluence_w5c_data.json',
    'confluence_techdbinside_data.json',
  ];

  const spaceNames = {
    TechDBinside: 'Confluence 기술지식DB(Inside)',
    TechDB: 'Confluence 기술지식DB',
    UXDB: 'Confluence UXDB',
    PA: 'Confluence PA',
    W5C: 'Confluence W5C',
  };

  const results = [];
  for (const file of files) {
    let data;
    try { data = await loadJSON(path.join(confluenceDir, file)); } catch { continue; }

    for (const item of data) {
      const content = cleanText(item.content || '');
      if (!content || content.length < 20) continue;

      const title = (item.title || '').replace(/^\[.*?\]\s*/, '');
      const spaceName = spaceNames[item.space] || `Confluence ${item.space}`;

      results.push({
        category: '',
        subcategory: '',
        question: title,
        answer: content,
        source: spaceName,
        date: item.lastModified ? item.lastModified.split('T')[0] : '',
        tags: extractTags(title + ' ' + content),
      });
    }
  }

  console.log(`[Confluence] ${results.length}건 변환`);
  return results;
}

// ── API Guide ──
// 원본: { component, title, content, htmlContent }
async function convertApiGuide() {
  const filePath = path.join(RAW_DIR, 'wtech-guide/ws5_api_guide.json');
  let data;
  try { data = await loadJSON(filePath); } catch { return []; }

  const results = [];
  for (const item of data) {
    const content = cleanText(item.content || '');
    if (!content || content.length < 20) continue;

    results.push({
      category: '',
      subcategory: '',
      question: `${item.component} API 사용법`,
      answer: content,
      source: 'WebSquare API Guide',
      date: '',
      tags: extractTags(item.component + ' ' + content),
    });
  }

  console.log(`[API Guide] ${results.length}건 변환 (원본 ${data.length}건)`);
  return results;
}

// ── W-Tech 가이드 (SPA JS 파싱) ──
// dev-guide, release-notes, component-guide, wre-guide, publishing-guide, snippet-guide, accessibility-guide
// 콘텐츠가 resource/script/html_*.js 파일 안에 Http.set('/r/viewer/content/...', {title, html}) 형태로 저장됨

function extractGuideContentFromJs(jsContent) {
  const items = [];
  const contentRegex = /Http\.set\('\/r\/viewer\/content\/[^']+',\s*(\{[\s\S]*?\})\);\s*(?:Http\.set|$)/g;
  let match;
  while ((match = contentRegex.exec(jsContent)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data.html && data.title) {
        const $ = cheerio.load(data.html);
        const text = $.text().replace(/\s+/g, ' ').trim();
        if (text.length >= 30) {
          const title = cheerio.load(data.title).text().trim();
          items.push({ title, content: text });
        }
      }
    } catch { /* skip malformed JSON */ }
  }
  return items;
}

function findGuideJsFile(dirPath) {
  try {
    const scriptDir = path.join(dirPath, 'resource', 'script');
    const files = fsSync.readdirSync(scriptDir);
    const jsFile = files.find(f => f.startsWith('html_') && f.endsWith('.js'));
    return jsFile ? path.join(scriptDir, jsFile) : null;
  } catch { return null; }
}

async function convertWtechGuides() {
  const guideTypes = [
    { dir: 'dev-guide', source: 'WebSquare 개발 가이드', hasVersions: true },
    { dir: 'release-notes', source: 'WebSquare 릴리즈 노트', hasVersions: true },
    { dir: 'component-guide', source: 'WebSquare 컴포넌트 가이드', hasVersions: false },
    { dir: 'wre-guide', source: 'WebSquare WRE 가이드', hasVersions: false },
    { dir: 'publishing-guide', source: 'WebSquare 퍼블리싱 가이드', hasVersions: false },
    { dir: 'snippet-guide', source: 'WebSquare 스니핏 가이드', hasVersions: false },
    { dir: 'accessibility-guide', source: 'WebSquare 접근성 가이드', hasVersions: false },
  ];

  const results = [];

  for (const guide of guideTypes) {
    const baseDir = path.join(RAW_DIR, 'wtech-guide', guide.dir);
    let dirs;
    try { dirs = (await fs.readdir(baseDir)).filter(d => !d.startsWith('.')); } catch { continue; }

    if (guide.hasVersions) {
      // 버전별 하위 폴더 (AI, SP1~SP5, 웹스퀘어2)
      for (const version of dirs) {
        const versionDir = path.join(baseDir, version);
        const stat = fsSync.statSync(versionDir);
        if (!stat.isDirectory()) continue;

        const jsFile = findGuideJsFile(versionDir);
        if (!jsFile) continue;

        const jsContent = await fs.readFile(jsFile, 'utf8');
        const items = extractGuideContentFromJs(jsContent);

        for (const item of items) {
          results.push({
            category: '',
            subcategory: '',
            question: item.title,
            answer: item.content,
            source: `${guide.source} (${version})`,
            date: '',
            tags: extractTags(item.title + ' ' + item.content),
          });
        }
        console.log(`[${guide.dir}/${version}] ${items.length}건 파싱`);
      }
    } else {
      // 단일 폴더 (resource가 루트에 있음)
      const jsFile = findGuideJsFile(baseDir);
      if (!jsFile) continue;

      const jsContent = await fs.readFile(jsFile, 'utf8');
      const items = extractGuideContentFromJs(jsContent);

      for (const item of items) {
        results.push({
          category: '',
          subcategory: '',
          question: item.title,
          answer: item.content,
          source: guide.source,
          date: '',
          tags: extractTags(item.title + ' ' + item.content),
        });
      }
      console.log(`[${guide.dir}] ${items.length}건 파싱`);
    }
  }

  console.log(`[W-Tech 가이드] 총 ${results.length}건 변환`);
  return results;
}

// ── API 가이드 개별 HTML 파싱 ──
// wtech-guide/api-guide/{버전}/html/*.html
async function convertApiGuideHtml() {
  const apiBase = path.join(RAW_DIR, 'wtech-guide', 'api-guide');
  let versions;
  try { versions = (await fs.readdir(apiBase)).filter(d => !d.startsWith('.')); } catch { return []; }

  const results = [];

  for (const version of versions) {
    const htmlDir = path.join(apiBase, version, 'html');
    let files;
    try { files = (await fs.readdir(htmlDir)).filter(f => f.endsWith('.html')); } catch { continue; }

    for (const file of files) {
      const html = await fs.readFile(path.join(htmlDir, file), 'utf8');
      const $ = cheerio.load(html);

      const componentName = file.replace('.html', '');

      // Method Summary 파싱
      const methodSummary = [];
      $('h2').each((_, h2) => {
        if ($(h2).text().trim() === 'Summary') {
          $(h2).nextAll('table').first().find('tr').each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
              methodSummary.push({
                name: $(cells[0]).text().trim(),
                desc: $(cells[1]).text().trim(),
              });
            }
          });
        }
      });

      // Method Detail 전체 텍스트
      let detailText = '';
      $('h2').each((_, h2) => {
        if ($(h2).text().trim() === 'Method Detail') {
          let el = $(h2).next();
          while (el.length && el.prop('tagName') !== 'H2') {
            detailText += el.text().trim() + '\n';
            el = el.next();
          }
        }
      });

      // Property/Event Detail
      let propEventText = '';
      $('h2').each((_, h2) => {
        const sectionName = $(h2).text().trim();
        if (sectionName === 'Property Detail' || sectionName === 'Event Detail') {
          let el = $(h2).next();
          while (el.length && el.prop('tagName') !== 'H2') {
            const t = el.text().trim();
            if (t) propEventText += t + '\n';
            el = el.next();
          }
        }
      });

      const fullContent = [
        methodSummary.map(m => `${m.name}: ${m.desc}`).join('\n'),
        detailText,
        propEventText,
      ].filter(Boolean).join('\n\n');

      if (fullContent.length < 30) continue;

      results.push({
        category: '',
        subcategory: '',
        question: `${componentName} API 레퍼런스 (${version})`,
        answer: cleanText(fullContent),
        source: `WebSquare API Guide (${version})`,
        date: '',
        tags: extractTags(componentName + ' ' + fullContent),
      });
    }

    console.log(`[API Guide HTML/${version}] ${files.length}건 파싱`);
  }

  console.log(`[API Guide HTML] 총 ${results.length}건 변환`);
  return results;
}

// ── 릴리즈 노트 fulltext ──
async function convertReleaseNoteFulltext() {
  const files = [
    { file: 'ai_release_note_fulltext.txt', source: 'WebSquare AI 릴리즈 노트' },
    { file: 'sp5_release_note_fulltext.txt', source: 'WebSquare SP5 릴리즈 노트' },
  ];

  const results = [];

  for (const { file, source } of files) {
    let text;
    try { text = await fs.readFile(path.join(RAW_DIR, 'release_notes', file), 'utf8'); } catch { continue; }
    if (!text || text.length < 50) continue;

    // 버전/주차 단위로 분리 (파트/Week 패턴)
    const sections = text.split(/(?=파트\s|keyboard_arrow_(?:down|right)\n\d+\.)/).filter(s => s.trim().length > 50);

    for (const section of sections) {
      const lines = section.trim().split('\n').filter(l => l.trim() && !l.match(/^(manage_search|download|gesture|vertical_align_top|filter_list|search|menu|keyboard_arrow_\w+)$/));
      if (lines.length < 2) continue;

      const title = lines[0].replace(/^[\d.]+/, '').trim();
      const content = lines.slice(1).join('\n').trim();
      if (!content || content.length < 30) continue;

      results.push({
        category: '',
        subcategory: '',
        question: title,
        answer: cleanText(content),
        source,
        date: '',
        tags: extractTags(title + ' ' + content),
      });
    }
  }

  console.log(`[릴리즈 노트 Fulltext] ${results.length}건 변환`);
  return results;
}

// ── 개발가이드 샘플 XML ──
async function convertDevGuideSamples() {
  const sampleDir = path.join(RAW_DIR, 'dev-guide-sample');
  let components;
  try { components = await fs.readdir(sampleDir); } catch { return []; }

  const results = [];

  for (const component of components) {
    const compDir = path.join(sampleDir, component);
    const stat = fsSync.statSync(compDir);
    if (!stat.isDirectory()) continue;

    // 하위 카테고리 탐색 (예: GridView/Excel, GridView/Sorting 등)
    const subItems = await fs.readdir(compDir);

    for (const sub of subItems) {
      const subPath = path.join(compDir, sub);
      const subStat = fsSync.statSync(subPath);

      if (subStat.isDirectory()) {
        // 하위 폴더 안의 XML 파일들
        let files;
        try { files = (await fs.readdir(subPath)).filter(f => f.endsWith('.xml')); } catch { continue; }

        for (const file of files) {
          const content = await fs.readFile(path.join(subPath, file), 'utf8');
          if (content.length < 30) continue;

          const sampleName = file.replace('.xml', '');
          results.push({
            category: '',
            subcategory: '',
            question: `${component} ${sub} 샘플: ${sampleName}`,
            answer: content.substring(0, 3000),
            source: '개발가이드 샘플',
            date: '',
            tags: extractTags(component + ' ' + sub + ' ' + sampleName),
          });
        }
      } else if (sub.endsWith('.xml')) {
        // 루트의 XML 파일
        const content = await fs.readFile(subPath, 'utf8');
        if (content.length < 30) continue;

        const sampleName = sub.replace('.xml', '');
        results.push({
          category: '',
          subcategory: '',
          question: `${component} 샘플: ${sampleName}`,
          answer: content.substring(0, 3000),
          source: '개발가이드 샘플',
          date: '',
          tags: extractTags(component + ' ' + sampleName),
        });
      }
    }
  }

  console.log(`[개발가이드 샘플] ${results.length}건 변환`);
  return results;
}

// ── 기존 processed 데이터 (sample, guide 등) ──
async function loadExistingProcessed() {
  const processedDir = path.join(__dirname, '../data/processed');
  const files = ['sample_qa.json', 'guide_qa.json', 'api_guide_qa.json'];

  const results = [];
  for (const file of files) {
    try {
      const data = await loadJSON(path.join(processedDir, file));
      if (Array.isArray(data)) {
        results.push(...data);
        console.log(`[기존] ${file}: ${data.length}건`);
      }
    } catch { /* skip */ }
  }
  return results;
}

// ── Main ──
async function main() {
  console.log('=== 데이터 통합 시작 ===\n');

  const [gmail, wtechQna, wtechFaq, confluence, apiGuide, existing, wtechGuides, apiGuideHtml, releaseNotes, devSamples] = await Promise.all([
    convertGmail(),
    convertWtechQna(),
    convertWtechFaq(),
    convertConfluence(),
    convertApiGuide(),
    loadExistingProcessed(),
    convertWtechGuides(),
    convertApiGuideHtml(),
    convertReleaseNoteFulltext(),
    convertDevGuideSamples(),
  ]);

  const allData = [...gmail, ...wtechQna, ...wtechFaq, ...confluence, ...apiGuide, ...existing, ...wtechGuides, ...apiGuideHtml, ...releaseNotes, ...devSamples];

  // 중복 제거 (question 기준)
  const seen = new Set();
  const deduplicated = allData.filter(item => {
    const key = item.question.trim().substring(0, 100);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(deduplicated, null, 2), 'utf8');

  console.log(`\n=== 통합 완료 ===`);
  console.log(`총 변환: ${allData.length}건`);
  console.log(`중복 제거 후: ${deduplicated.length}건`);
  console.log(`출력: ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('통합 실패:', err);
  process.exit(1);
});
