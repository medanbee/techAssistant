/**
 * API 검증 모듈
 * 답변에 포함된 WebSquare API/이벤트/속성명이 RAG 데이터에 실제 존재하는지 검증
 */

const { execSync } = require('child_process');
const path = require('path');

// WebSquare API/이벤트/속성 패턴 추출용 정규식
const API_PATTERNS = [
  // API 메서드: getCellData(), setFocusedCell(), removeFocusedCell() 등
  /\b(get[A-Z]\w+|set[A-Z]\w+|remove[A-Z]\w+|add[A-Z]\w+|insert[A-Z]\w+|delete[A-Z]\w+|create[A-Z]\w+|execute[A-Z]\w+|open[A-Z]\w+|close[A-Z]\w+)\s*\(/g,
  // 이벤트: oncellclick, onkeydown, oneditend, onviewchange 등
  /\b(on[a-z]{2,}(?:[a-z]*)?)\b/g,
  // 속성: enterKeyMove, focusMode, ignoreNonEditableCell 등 (camelCase, XML 속성)
  /\b([a-z]+(?:[A-Z][a-z]+){1,})\s*[=:"]/g,
];

// 검증 제외 목록 — 일반 JS/DOM API
const EXCLUDE_LIST = new Set([
  'addEventListener', 'removeEventListener', 'preventDefault', 'stopPropagation',
  'getElementById', 'querySelector', 'querySelectorAll', 'getAttribute', 'setAttribute',
  'appendChild', 'createElement', 'insertBefore', 'removeChild',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'parseInt', 'parseFloat', 'toString', 'indexOf', 'substring', 'replace',
  'onclick', 'onload', 'onchange', 'onsubmit', 'onfocus', 'onblur',
  'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup', 'onmouseover',
  'console', 'document', 'window', 'JSON', 'encodeURIComponent',
  'textContent', 'innerHTML', 'fontWeight', 'fontSize', 'marginLeft',
  'backgroundColor', 'borderColor', 'textColor', 'borderBottom',
]);

class ApiVerifier {
  constructor() {
    this.searcherPath = path.join(__dirname, '../rag/searcher.py');
    this.pythonPath = process.env.PYTHON_PATH || (process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe')
      : 'python3');
  }

  /**
   * 답변 텍스트에서 WebSquare API/이벤트/속성명 추출
   */
  extractApiNames(answerText) {
    const found = new Set();

    for (const pattern of API_PATTERNS) {
      // 정규식 lastIndex 리셋을 위해 새 인스턴스 생성
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(answerText)) !== null) {
        const name = match[1];
        if (name && name.length >= 4 && !EXCLUDE_LIST.has(name)) {
          found.add(name);
        }
      }
    }

    return [...found];
  }

  /**
   * 단일 API명이 RAG 데이터에 존재하는지 검증
   */
  verifyOne(apiName) {
    try {
      const script = `
import sys, json
sys.path.insert(0, 'src')
from rag.searcher import RAGSearcher
s = RAGSearcher()
r = s.collection.query(
    query_texts=['${apiName}'],
    n_results=1,
    where_document={'$contains': '${apiName}'},
    include=['metadatas', 'distances']
)
if r['metadatas'][0]:
    m = r['metadatas'][0][0]
    d = r['distances'][0][0]
    print(json.dumps({'found': True, 'source': m.get('source',''), 'score': round(1-d, 4)}))
else:
    print(json.dumps({'found': False}))
`.trim().replace(/\n/g, '; ');

      // Python은 -c로 멀티라인 실행 불가하므로 파일로 실행
      const result = execSync(
        `${this.pythonPath} -u -c "${script.replace(/"/g, '\\"')}"`,
        { encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] }
      );

      // stdout에서 JSON 라인 찾기
      const lines = result.trim().split('\n');
      for (const line of lines.reverse()) {
        try {
          return JSON.parse(line);
        } catch {
          continue;
        }
      }
      return { found: false };
    } catch {
      return { found: false, error: true };
    }
  }

  /**
   * Python 스크립트를 통한 배치 검증 (효율적)
   */
  verifyBatch(apiNames) {
    if (apiNames.length === 0) return [];

    try {
      const namesJson = JSON.stringify(apiNames);
      const scriptPath = path.join(__dirname, '_verify_batch.py');
      const fs = require('fs');

      // 임시 Python 스크립트 생성
      fs.writeFileSync(scriptPath, `
import sys, json
sys.path.insert(0, 'src')

# stderr로 모델 로딩 로그 리다이렉트
import io
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from rag.searcher import RAGSearcher
searcher = RAGSearcher()

names = json.loads('${namesJson.replace(/'/g, "\\'")}')
results = []

for name in names:
    try:
        r = searcher.collection.query(
            query_texts=[name],
            n_results=1,
            where_document={'$contains': name},
            include=['metadatas', 'distances']
        )
        if r['metadatas'][0]:
            m = r['metadatas'][0][0]
            d = r['distances'][0][0]
            results.append({'name': name, 'found': True, 'source': m.get('source',''), 'score': round(1-d, 4)})
        else:
            results.append({'name': name, 'found': False})
    except Exception as e:
        results.append({'name': name, 'found': False, 'error': str(e)})

# 결과를 stdout 마지막에 JSON으로 출력
print('VERIFY_RESULT:' + json.dumps(results, ensure_ascii=False))
`, 'utf8');

      const output = execSync(
        `${this.pythonPath} -u "${scriptPath}"`,
        { encoding: 'utf8', timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'] }
      );

      // 임시 파일 삭제
      try { fs.unlinkSync(scriptPath); } catch {}

      // VERIFY_RESULT: 접두사로 결과 파싱
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.startsWith('VERIFY_RESULT:')) {
          return JSON.parse(line.substring('VERIFY_RESULT:'.length));
        }
      }
      return apiNames.map(name => ({ name, found: false, error: 'parse_failed' }));
    } catch (err) {
      console.warn('[API 검증] 배치 검증 실패:', err.message);
      return apiNames.map(name => ({ name, found: false, error: err.message }));
    }
  }

  /**
   * 답변 전체 검증
   *
   * @param {string} answerText - 생성된 답변 텍스트
   * @returns {object} - { verified, unverified, warnings, summary }
   */
  verify(answerText) {
    const apiNames = this.extractApiNames(answerText);

    if (apiNames.length === 0) {
      return { verified: [], unverified: [], warnings: [], summary: '검증 대상 API 없음' };
    }

    console.log(`[API 검증] ${apiNames.length}개 API명 검증 중: ${apiNames.join(', ')}`);

    const results = this.verifyBatch(apiNames);

    const verified = results.filter(r => r.found);
    const unverified = results.filter(r => !r.found);

    const warnings = unverified.map(r =>
      `⚠️ "${r.name}" — RAG 데이터에서 확인되지 않음. 실제 존재 여부 확인 필요.`
    );

    if (verified.length > 0) {
      console.log(`[API 검증] ✅ 확인됨: ${verified.map(r => r.name).join(', ')}`);
    }
    if (unverified.length > 0) {
      console.log(`[API 검증] ⚠️ 미확인: ${unverified.map(r => r.name).join(', ')}`);
    }

    return {
      verified,
      unverified,
      warnings,
      summary: `검증 ${apiNames.length}건: ✅ ${verified.length}건 확인, ⚠️ ${unverified.length}건 미확인`,
    };
  }
}

module.exports = ApiVerifier;
