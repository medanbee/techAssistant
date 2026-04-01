/**
 * /api/search 라우트 — RAG 검색 + 분류 (API 키 불필요)
 */

const express = require('express');
const { execFileSync } = require('child_process');
const path = require('path');
const Classifier = require('../../classifier/classifier');

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
      timeout: 60000,
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

/**
 * RAG 출력 파싱
 * 형식: #1 [최종: 0.89 | 벡터: 0.90 | BM25: 0.89] 출처
 *         질문: ...
 */
function parseRagResults(output) {
  if (!output) return [];

  const cases = [];
  // #N [최종: X | 벡터: Y | BM25: Z] 출처
  const pattern = /#(\d+)\s+\[최종:\s*([\d.]+)\s*\|.*?\]\s*(.*)/g;
  let match;

  while ((match = pattern.exec(output)) !== null) {
    const rank = parseInt(match[1], 10);
    const similarity = match[2];
    const source = match[3].trim();

    // 이 매치 이후부터 다음 #N 또는 끝까지의 텍스트 추출
    const startIdx = match.index + match[0].length;
    const nextMatch = output.indexOf('\n#', startIdx);
    const block = output.slice(startIdx, nextMatch === -1 ? undefined : nextMatch).trim();

    // "질문:" 라인에서 제목 추출
    const lines = block.split('\n');
    let title = '';
    const contentLines = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('질문:')) {
        title = trimmed.replace('질문:', '').trim();
      } else if (trimmed.startsWith('답변:')) {
        contentLines.push(trimmed.replace('답변:', '').trim());
      } else if (trimmed && trimmed !== '---') {
        contentLines.push(trimmed);
      }
    }

    cases.push({
      rank,
      title: title || `사례 ${rank}`,
      source,
      similarity: `${(parseFloat(similarity) * 100).toFixed(1)}%`,
      content: contentLines.join('\n').trim() || title,
    });
  }

  return cases;
}

module.exports = router;
