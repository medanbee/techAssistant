/**
 * 답변 생성 파이프라인
 * 문의 입력 → RAG 검색 → 분류 → 답변 생성 → 출력
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Classifier = require('../classifier/classifier');
const AnswerGenerator = require('./answerGenerator');
const ApiVerifier = require('./apiVerifier');

class AnswerPipeline {
  constructor() {
    this.classifier = new Classifier();
    this.generator = new AnswerGenerator();
    this.verifier = new ApiVerifier();
    this.ragSearcherPath = path.join(__dirname, '../rag/searcher.py');
  }

  /**
   * 전체 파이프라인 실행
   *
   * @param {string} question - 고객 기술문의 내용
   * @param {object} options - { version, libraries, topK, categoryFilter }
   * @returns {object} - { answer, classification, ragResults, usage }
   */
  async process(question, options = {}) {
    console.log('[파이프라인] 시작...');

    // 1. 문의 분류
    const classification = this.classifier.classify({ question, answer: '' });
    console.log(`[파이프라인] 분류: ${classification.categoryLabel} > ${classification.subcategoryLabel}`);

    // 2. RAG 검색
    const ragResult = this._searchRAG(question, options);
    console.log(`[파이프라인] RAG 검색: ${ragResult.resultCount}건`);

    // 3. 답변 생성 + API 검증 (최대 3회 재생성)
    const MAX_RETRIES = 3;
    let result = await this.generator.generate(question, ragResult.context, {
      version: options.version,
      libraries: options.libraries,
    });
    console.log(`[파이프라인] 답변 생성 완료 (${result.usage.inputTokens + result.usage.outputTokens} tokens)`);

    let verification = this.verifier.verify(result.answer);
    console.log(`[파이프라인] ${verification.summary}`);

    let retryCount = 0;
    while (verification.unverified.length > 0 && retryCount < MAX_RETRIES) {
      retryCount++;
      const invalidApis = verification.unverified.map(r => r.name);
      console.log(`[파이프라인] 미확인 API 발견 → 재생성 (${retryCount}/${MAX_RETRIES}): ${invalidApis.join(', ')}`);

      result = await this.generator.regenerate(
        question, ragResult.context, result.answer, invalidApis,
        { version: options.version, libraries: options.libraries }
      );
      console.log(`[파이프라인] 재생성 완료 (${result.usage.inputTokens + result.usage.outputTokens} tokens)`);

      verification = this.verifier.verify(result.answer);
      console.log(`[파이프라인] ${verification.summary}`);
    }

    // 재생성 3회 후에도 미확인 API 남아있으면 경고 표시
    if (verification.unverified.length > 0) {
      result.answer += '\n\n---\n⚠️ **검증 경고**: 아래 API/속성은 내부 데이터에서 확인되지 않았습니다. 실제 존재 여부를 확인해주세요.\n';
      for (const item of verification.unverified) {
        result.answer += `- \`${item.name}\`\n`;
      }
    }

    // 4. 답변 파일 저장
    const savedPath = this._saveAnswer(question, result, classification);
    if (savedPath) {
      console.log(`[파이프라인] 답변 저장: ${savedPath}`);
    }

    return {
      question,
      classification,
      ragResults: ragResult,
      answer: result.answer,
      hasRagResults: result.hasRagResults,
      usage: result.usage,
      model: result.model,
      verification,
      savedPath,
    };
  }

  /**
   * RAG 검색 실행 (Python 프로세스 호출)
   */
  _searchRAG(query, options) {
    try {
      const topK = options.topK || 8;
      const pythonPath = process.env.PYTHON_PATH || (process.platform === 'win32'
        ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe')
        : 'python3');
      const args = [
        pythonPath, this.ragSearcherPath,
        JSON.stringify(query),
        '--top-k', String(topK),
      ];

      if (options.categoryFilter) {
        args.push('--category', options.categoryFilter);
      }

      const output = execSync(args.join(' '), {
        encoding: 'utf8',
        timeout: 30000,
      });

      // Python 스크립트의 stdout에서 컨텍스트 파싱
      return {
        context: output,
        resultCount: (output.match(/--- 참고 사례/g) || []).length,
      };
    } catch (err) {
      console.warn('[파이프라인] RAG 검색 실패:', err.message);
      return { context: '', resultCount: 0 };
    }
  }
  /**
   * 답변을 data/answers/날짜/주제.md 로 저장
   */
  _saveAnswer(question, result, classification) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const dirPath = path.join(__dirname, '../../data/answers', today);
      fs.mkdirSync(dirPath, { recursive: true });

      const filename = this._toFilename(question);
      const filePath = path.join(dirPath, `${filename}.md`);

      const basis = result.hasRagResults
        ? '내부 데이터 기반 (RAG 유사 사례 참고)'
        : '일반 기술 지식 기반 (내부 사례 없음)';

      const content = `# ${this._extractTitle(question)}

- **문의일시**: ${today}
- **분류**: ${classification.categoryLabel} > ${classification.subcategoryLabel}
- **답변 근거**: ${basis}

## 문의 내용

${question.trim()}

## 답변

${result.answer.trim()}
`;

      fs.writeFileSync(filePath, content, 'utf8');
      return filePath;
    } catch (err) {
      console.warn('[파이프라인] 답변 저장 실패:', err.message);
      return null;
    }
  }

  /**
   * 문의 내용에서 파일명 생성
   */
  _toFilename(question) {
    return question
      .replace(/[<>:"/\\|?*\r\n]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 60)
      .replace(/_+$/, '')
      .toLowerCase();
  }

  /**
   * 문의 내용에서 제목 추출 (첫 줄 또는 앞 80자)
   */
  _extractTitle(question) {
    const firstLine = question.trim().split('\n')[0].trim();
    return firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;
  }
}

module.exports = AnswerPipeline;
