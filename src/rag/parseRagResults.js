/**
 * Python searcher.py 출력 파싱 공용 모듈
 *
 * 입력: Python stdout 원본 텍스트
 * 출력: cases 배열 [{rank, title, source, similarity, match, content}]
 */

function parseRagResults(output) {
  if (!output) return [];

  const cases = [];
  const pattern = /#(\d+)\s+\[최종:\s*([\d.]+)\s*\|.*?\]\s*(.*)/g;
  let match;

  while ((match = pattern.exec(output)) !== null) {
    const rank = parseInt(match[1], 10);
    const similarityRaw = parseFloat(match[2]);
    const source = match[3].trim();

    const startIdx = match.index + match[0].length;
    const nextMatch = output.indexOf('\n#', startIdx);
    const block = output.slice(startIdx, nextMatch === -1 ? undefined : nextMatch).trim();

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
      similarity: `${(similarityRaw * 100).toFixed(1)}%`,
      match: Math.round(similarityRaw * 100),
      content: contentLines.join('\n').trim() || title,
    });
  }

  return cases;
}

/**
 * 데이터 소스 → W-Tech type 코드 매핑
 */
function getSourceType(source) {
  if (!source) return 'doc';
  const lower = source.toLowerCase();
  if (lower.includes('qna')) return 'board';
  if (lower.includes('faq')) return 'faq';
  if (source.includes('Gmail') || source.includes('메일') || source.includes('이메일')) return 'email';
  if (lower.includes('confluence')) return 'wiki';
  if (lower.includes('api guide') || source.includes('API 가이드')) return 'api-guide';
  if (source.includes('릴리즈') || lower.includes('release')) return 'release-note';
  if (source.includes('가이드') || lower.includes('guide')) return 'guide';
  return 'doc';
}

/**
 * cases 배열 → W-Tech 표준 sources 구조로 변환
 * [{title, meta, match, type}]
 */
function toSources(cases) {
  return cases.map(c => ({
    title: c.title,
    meta: c.source,
    match: `${c.match}% 일치`,
    type: getSourceType(c.source),
  }));
}

/**
 * 신뢰도 계산 — Top-3 유사도 평균
 *
 * @param {Array} cases - parseRagResults 결과
 * @returns {number} 0~100 정수
 */
function calculateConfidence(cases) {
  if (!cases || cases.length === 0) return 0;

  const top3 = cases.slice(0, 3);
  const sum = top3.reduce((acc, c) => acc + c.match, 0);
  return Math.round(sum / top3.length);
}

module.exports = { parseRagResults, toSources, calculateConfidence, getSourceType };
