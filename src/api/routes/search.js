/**
 * /api/search 라우트 — RAG 검색 + 분류 (API 키 불필요)
 */

const express = require('express');
const { execFileSync } = require('child_process');
const path = require('path');
const Classifier = require('../../classifier/classifier');
const { parseRagResults, toSources, calculateConfidence } = require('../../rag/parseRagResults');

const router = express.Router();
const classifier = new Classifier();

const searcherPath = path.join(__dirname, '../../rag/searcher.py');
const pythonPath = process.env.PYTHON_PATH || (process.platform === 'win32'
  ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe')
  : 'python3');

router.post('/', (req, res) => {
  const { query, topK, categoryFilter } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: '검색어(query)를 입력해주세요.' });
  }

  try {
    // 분류
    const classification = classifier.classify({ question: query, answer: '' });

    // RAG 검색
    const args = [
      searcherPath,
      query,
      '--top-k', String(topK || 8),
    ];

    if (categoryFilter) {
      args.push('--category', categoryFilter);
    }

    const output = execFileSync(pythonPath, args, {
      encoding: 'utf8',
      timeout: 180000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    });

    // 개별 사례 파싱
    const cases = parseRagResults(output);

    res.json({
      query,
      classification,
      resultCount: cases.length,
      cases,
      rawContext: output,
    });
  } catch (err) {
    console.error('[API] RAG 검색 실패:', err.message);
    res.status(500).json({ error: 'RAG 검색 중 오류가 발생했습니다.', detail: err.message });
  }
});

// POST /api/search/enhanced — W-Tech 표준 응답 (Claude API 미사용 폴백)
router.post('/enhanced', (req, res) => {
  const { query, topK, categoryFilter } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: '검색어(query)를 입력해주세요.' });
  }

  try {
    const args = [
      searcherPath,
      query,
      '--top-k', String(topK || 8),
    ];
    if (categoryFilter) {
      args.push('--category', categoryFilter);
    }

    const output = execFileSync(pythonPath, args, {
      encoding: 'utf8',
      timeout: 180000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    });

    const cases = parseRagResults(output);
    const sources = toSources(cases);
    const confidence = calculateConfidence(cases);

    const draftAnswer = cases.length > 0
      ? `내부 데이터에서 유사 사례 ${cases.length}건을 찾았습니다. 담당자 확인 후 답변 예정입니다.`
      : '내부 데이터에서 유사 사례가 확인되지 않았습니다. 담당자가 직접 답변을 작성합니다.';

    res.json({
      draftAnswer,
      confidence,
      sources,
      attachments: [],
    });
  } catch (err) {
    console.error('[API /search/enhanced] 실패:', err);
    res.json({
      draftAnswer: '',
      confidence: 0,
      sources: [],
      failReason: '04',
      failDescription: `시스템 오류: ${err.message}`,
    });
  }
});

module.exports = router;
