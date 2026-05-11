/**
 * AI 답변 초안 생성기
 * Claude Sonnet 4 API + RAG 컨텍스트 기반
 */

const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { loadConfig } = require('../utils/config');
const { getPromptPolicyInstructions } = require('./answerPolicy');

const MAX_CONTEXT_PER_ITEM = 2000;
const MAX_TOTAL_CONTEXT = 16000;

function buildSystemPrompt(answerConfig, hasRagResults, answerPolicy) {
  const name = answerConfig?.responderName || '담당자';
  const template = answerConfig?.template
    || '안녕하세요.\n인스웨이브 기술지원팀 {{name}} 프로입니다.\n\n{{topic}}과 관련하여 확인 후 답변드립니다.\n\n{{content}}\n\n감사합니다.';

  const ragRule = hasRagResults
    ? '1. **참고자료 기반만 답변** — 제공된 참고 사례를 근거로만 답변합니다. 추측 금지.'
    : `1. **내부 데이터 없음 안내** — 참고 사례가 없으므로 WebSquare 공식 문서 및 일반적인 기술 지식을 기반으로 답변합니다.
   답변 본문 맨 앞에 반드시 아래 문구를 포함하십시오:
   "※ 내부 데이터 기준 확인된 사례가 없어, WebSquare 공식 문서 및 일반적인 기술 지식을 기반으로 안내드립니다. 정확한 내용은 추가 확인이 필요할 수 있습니다."
   답변 본문 맨 끝에 반드시 추가 정보 요청을 포함하십시오:
   "정확한 확인을 위해 아래 정보를 추가로 전달 부탁드립니다.
   - 사용 중인 WebSquare 버전 및 빌드일
   - 관련 에러 메시지 또는 로그
   - 재현 방법"`;

  return `당신은 인스웨이브 WebSquare 기술지원 전문가입니다.

아래 규칙을 반드시 준수하여 답변을 작성하십시오:

${ragRule}
1-1. **답변 정책 준수** - 아래 정책은 백엔드가 문의 유형을 판단한 결과입니다. 반드시 이 정책에 맞춰 답변 강도와 표현을 조절하십시오.
${getPromptPolicyInstructions(answerPolicy)}
2. **답변 구조** — 원인 분석 → 해결 방법 → 추가 확인 사항 순서로 작성합니다.
3. **기술지원 답변 톤**
   - 문의에서 확인된 현상은 먼저 명확하게 요약하고, 가장 가능성 높은 원인 흐름을 실무자가 이해할 수 있게 설명합니다.
   - 원인 분석은 과도하게 소극적으로 쓰지 말고, "이 현상은 ~ 과정에서 발생할 수 있습니다"처럼 기술적으로 자연스럽게 작성합니다.
   - 단, 참고자료로 확정할 수 없는 패치 이력, 엔진 결함, 특정 빌드 수정 여부는 추가 확인 사항으로 분리합니다.
   - 해결 방법은 권장 조치 → 대안/우회 방법 → 확인 방법 순서로 정리합니다.
   - 표는 API/속성/옵션을 비교할 때만 사용하고, 간단한 설명은 문장이나 bullet로 작성합니다.
4. **코드 예시 규칙**
   - 참고자료에 코드 예시가 있으면 해당 코드를 우선 활용합니다 (검증된 코드).
   - 참고자료에 정확히 매칭되는 코드가 없어 새로 작성하는 경우, 코드 블록 아래에 반드시 "※ 위 코드는 유사 사례 기반 참고용입니다. 실제 동작 확인 후 적용해주세요."를 표기합니다.
   - WebSquare 엔진에서만 동작하는 코드는 직접 테스트할 수 없으므로, 검증되지 않은 코드임을 명시합니다.
5. **표 형식 활용** — 속성/옵션은 표 형태로 정리합니다.
6. **출처/유사도/참고자료 본문 미포함** — 참고한 사례의 출처, RAG 유사도 점수, "참고 자료" 섹션 등은 답변 본문에 절대 포함하지 마십시오. 이 정보는 응답의 별도 sources 필드로 자동 전달됩니다. 답변 본문에는 답변 내용만 작성하십시오.
7. **API/이벤트/속성명 정확성**
   - 참고자료에 존재하지 않는 WebSquare API, 이벤트, 속성명을 절대 만들어내지 마십시오.
   - 다른 컴포넌트의 API를 해당 컴포넌트에도 있다고 추측하지 마십시오. 참고자료에서 정확히 확인된 것만 사용합니다.
   - 확실하지 않은 API는 "확인이 필요합니다"로 표기합니다.
8. **버그/패치 표현 제한**
   - 참고자료에 동일 현상과 동일 조건에서 패치로 해결되었다는 내용이 명시된 경우에만 "패치로 해결", "개선된 이력", "엔진 내부 문제"라고 표현합니다.
   - 유사 기능 사례만 있는 경우에는 "관련 가능성이 있습니다", "정확한 엔진 빌드 확인이 필요합니다"처럼 보수적으로 표현합니다.
   - "유사 사례 #1", "참고자료 #3" 같은 내부 번호를 답변 본문에 쓰지 마십시오.
9. **개인정보 제외** — 개인명, 이메일, 회사명, 프로젝트명 등 식별 정보를 절대 포함하지 않습니다.
10. **버전 고려** — WebSquare 버전, POI/servlet 버전 호환성을 반드시 고려합니다.
11. **버전 존재 검증** — 답변에 특정 소프트웨어 버전을 언급할 때, 해당 버전이 실제 존재하는지 확인합니다.
   - 엔진 파일명에서 버전을 추출할 때 네이밍 규칙에 주의: 예) "poi4_1.8"은 "POI 4.x + Java 1.8"이지 "POI 4.1.8"이 아닙니다.
   - Apache POI 4.x 마지막 버전은 4.1.2입니다. (4.1.8은 존재하지 않음)
   - 파일명의 _1.5, _1.8 접미사는 Java/Servlet 버전을 의미합니다.
12. **정보 부족 시** — 사용 중인 버전, 라이브러리, 에러 메시지를 확인하는 추가 질문을 포함합니다.

답변은 반드시 아래 템플릿 형식으로 작성하십시오:
---
${template.replace('{{name}}', name)}
---
- {{topic}}에는 고객 문의 주제를 간결하게 넣으십시오.
- {{content}}에는 실제 답변 내용을 넣으십시오.
- 존댓말 사용
- 간결하고 명확하게 작성`;
}

class AnswerGenerator {
  constructor(config) {
    const fullConfig = loadConfig();
    this.provider = fullConfig.llmProvider || 'anthropic';
    this.answerConfig = fullConfig.answer;

    if (this.provider === 'gemini') {
      const cfg = config || fullConfig.gemini || {};
      if (!cfg.apiKey) throw new Error('Gemini API 키가 설정되지 않았습니다 (config.gemini.apiKey).');
      this.geminiClient = new GoogleGenerativeAI(cfg.apiKey);
      this.model = cfg.model || 'gemini-2.0-flash';
    } else {
      const cfg = config || fullConfig.anthropic || {};
      if (!cfg.apiKey) throw new Error('Anthropic API 키가 설정되지 않았습니다 (config.anthropic.apiKey).');
      this.client = new Anthropic({ apiKey: cfg.apiKey });
      this.model = cfg.model || 'claude-sonnet-4-20250514';
    }
  }

  /**
   * LLM 호출 통합 — provider별 API 차이 흡수
   * 반환: { text, inputTokens, outputTokens, model }
   */
  async _callLLM(systemPrompt, userMessage) {
    if (this.provider === 'gemini') {
      const model = this.geminiClient.getGenerativeModel({
        model: this.model,
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: 4096 },
      });
      const response = result.response;
      const usage = response.usageMetadata || {};
      return {
        text: response.text(),
        inputTokens: usage.promptTokenCount || 0,
        outputTokens: usage.candidatesTokenCount || 0,
        model: this.model,
      };
    }

    // Anthropic
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model,
    };
  }

  /**
   * 답변 초안 생성
   *
   * @param {string} question - 고객 기술문의 내용
   * @param {string} ragContext - RAG 검색 결과 컨텍스트
   * @param {object} options - 추가 옵션
   * @returns {object} - { answer, usage, model, hasRagResults }
   */
  async generate(question, ragContext, options = {}) {
    const hasRagResults = !!(ragContext && !ragContext.includes('관련 사례를 찾지 못했습니다'));
    const systemPrompt = buildSystemPrompt(this.answerConfig, hasRagResults, options.answerPolicy);
    const userMessage = this._buildUserMessage(question, ragContext, options, hasRagResults);

    const llm = await this._callLLM(systemPrompt, userMessage);

    return {
      answer: llm.text,
      hasRagResults,
      usage: { inputTokens: llm.inputTokens, outputTokens: llm.outputTokens },
      model: llm.model,
    };
  }

  /**
   * 사용자 메시지 구성
   */
  _buildUserMessage(question, ragContext, options, hasRagResults) {
    let message = '';

    // RAG/MCP 컨텍스트
    if (hasRagResults) {
      const trimmedContext = ragContext.substring(0, MAX_TOTAL_CONTEXT);
      message += `## 참고 자료 (RAG 검색 결과 및 MCP 공식 스펙)\n\n${trimmedContext}\n\n`;
    } else {
      message += `## 참고 사례\n\n내부 데이터에서 관련 사례를 찾지 못했습니다. 일반적인 WebSquare 기술 지식을 기반으로 답변해 주세요.\n\n`;
    }

    // 버전 정보
    if (options.version) {
      message += `## 고객 환경\n- WebSquare 버전: ${options.version}\n`;
      if (options.libraries) message += `- 관련 라이브러리: ${options.libraries}\n`;
      message += '\n';
    }

    // 고객 문의
    message += `## 고객 문의 내용\n\n${question}\n\n`;
    message += hasRagResults
      ? '위 참고 자료를 기반으로 기술지원 답변 초안을 작성해 주세요.'
      : 'WebSquare 공식 문서 및 일반적인 기술 지식을 기반으로 기술지원 답변 초안을 작성해 주세요.';

    return message;
  }

  /**
   * 추가 문의에 대한 재답변 생성 (대화 맥락 유지)
   *
   * @param {string} originalQuestion - 원래 문의
   * @param {string} previousAnswer - AI 첫 답변
   * @param {string} followUp - 고객 추가 질문
   * @param {string} ragContext - RAG 검색 결과 컨텍스트
   * @param {object} options - 추가 옵션
   * @returns {object} - { answer, usage, model, hasRagResults }
   */
  async followUp(originalQuestion, previousAnswer, followUp, ragContext, options = {}) {
    const hasRagResults = !!(ragContext && !ragContext.includes('관련 사례를 찾지 못했습니다'));
    const systemPrompt = buildSystemPrompt(this.answerConfig, hasRagResults, options.answerPolicy);

    let message = '';

    if (hasRagResults) {
      const trimmedContext = ragContext.substring(0, MAX_TOTAL_CONTEXT);
      message += `## 참고 자료 (RAG 검색 결과 및 MCP 공식 스펙)\n\n${trimmedContext}\n\n`;
    }

    if (options.version) {
      message += `## 고객 환경\n- WebSquare 버전: ${options.version}\n\n`;
    }

    message += `## 원래 문의\n\n${originalQuestion}\n\n`;
    message += `## 이전 AI 답변\n\n${previousAnswer}\n\n`;
    message += `## 고객 추가 문의\n\n${followUp}\n\n`;
    message += '위 대화 맥락을 바탕으로, 고객의 추가 문의에 대한 답변을 작성해 주세요. 이전 답변과 중복되는 내용은 최소화하고, 추가 문의에 집중하여 답변합니다.';

    const llm = await this._callLLM(systemPrompt, message);

    return {
      answer: llm.text,
      hasRagResults,
      usage: { inputTokens: llm.inputTokens, outputTokens: llm.outputTokens },
      model: llm.model,
    };
  }

  /**
   * 미확인 API를 제외하고 답변 재생성
   *
   * @param {string} question - 원본 문의
   * @param {string} ragContext - RAG 컨텍스트
   * @param {string} previousAnswer - 이전 답변
   * @param {string[]} invalidApis - 미확인 API 목록
   * @param {object} options - 추가 옵션
   * @returns {object} - { answer, usage, model, hasRagResults }
   */
  async regenerate(question, ragContext, previousAnswer, invalidApis, options = {}) {
    const hasRagResults = !!(ragContext && !ragContext.includes('관련 사례를 찾지 못했습니다'));
    const systemPrompt = buildSystemPrompt(this.answerConfig, hasRagResults, options.answerPolicy);

    const userMessage = this._buildUserMessage(question, ragContext, options, hasRagResults);

    const regenerateInstruction = `
## 이전 답변 (수정 필요)

${previousAnswer}

## 수정 지시

위 답변에서 아래 API/이벤트/속성은 내부 데이터에서 확인되지 않았습니다. **존재하지 않는 API입니다.**
${invalidApis.map(api => `- ${api}`).join('\n')}

위 미확인 API를 모두 제거하고, RAG 검색 결과에서 확인된 실제 API만 사용하여 답변을 다시 작성해 주세요.
존재 여부가 불확실한 API는 사용하지 마세요.`;

    const llm = await this._callLLM(systemPrompt, userMessage + '\n\n' + regenerateInstruction);

    return {
      answer: llm.text,
      hasRagResults,
      usage: { inputTokens: llm.inputTokens, outputTokens: llm.outputTokens },
      model: llm.model,
    };
  }
}

module.exports = AnswerGenerator;
