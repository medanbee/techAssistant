/**
 * AI 답변 초안 생성기
 * Claude Sonnet 4 API + RAG 컨텍스트 기반
 */

const Anthropic = require('@anthropic-ai/sdk');
const { loadConfig } = require('../utils/config');

const MAX_CONTEXT_PER_ITEM = 2000;
const MAX_TOTAL_CONTEXT = 16000;

function buildSystemPrompt(answerConfig, hasRagResults) {
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

  const sourceRule = hasRagResults
    ? '5. **출처 명시** — 참고한 사례의 출처를 [데이터 유형] + [출처 위치] + [세부 항목] + [버전/시점] 형태로 반드시 포함합니다.'
    : '5. **출처 명시** — 출처를 "WebSquare 공식 문서 기반 일반 안내"로 표기합니다. 내부 데이터 출처를 임의로 만들지 마십시오.';

  return `당신은 인스웨이브 WebSquare 기술지원 전문가입니다.

아래 규칙을 반드시 준수하여 답변을 작성하십시오:

${ragRule}
2. **답변 구조** — 원인 분석 → 해결 방법 → 추가 확인 사항 순서로 작성합니다.
3. **코드/설정 포함** — 가능하면 XML/JavaScript 코드 예시 또는 설정 경로를 포함합니다.
4. **표 형식 활용** — 속성/옵션은 표 형태로 정리합니다.
${sourceRule}
6. **개인정보 제외** — 개인명, 이메일, 회사명, 프로젝트명 등 식별 정보를 절대 포함하지 않습니다.
7. **버전 고려** — WebSquare 버전, POI/servlet 버전 차이를 반드시 고려합니다.
8. **정보 부족 시** — 사용 중인 버전, 라이브러리, 에러 메시지를 확인하는 추가 질문을 포함합니다.

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
    const cfg = config || fullConfig.anthropic;
    this.client = new Anthropic({ apiKey: cfg.apiKey });
    this.model = cfg.model || 'claude-sonnet-4-20250514';
    this.answerConfig = fullConfig.answer;
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
    const systemPrompt = buildSystemPrompt(this.answerConfig, hasRagResults);
    const userMessage = this._buildUserMessage(question, ragContext, options, hasRagResults);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    const answer = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      answer,
      hasRagResults,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      model: response.model,
    };
  }

  /**
   * 사용자 메시지 구성
   */
  _buildUserMessage(question, ragContext, options, hasRagResults) {
    let message = '';

    // RAG 컨텍스트
    if (hasRagResults) {
      const trimmedContext = ragContext.substring(0, MAX_TOTAL_CONTEXT);
      message += `## 참고 사례 (RAG 검색 결과)\n\n${trimmedContext}\n\n`;
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
      ? '위 참고 사례를 기반으로 기술지원 답변 초안을 작성해 주세요.'
      : 'WebSquare 공식 문서 및 일반적인 기술 지식을 기반으로 기술지원 답변 초안을 작성해 주세요.';

    return message;
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
    const systemPrompt = buildSystemPrompt(this.answerConfig, hasRagResults);

    const userMessage = this._buildUserMessage(question, ragContext, options, hasRagResults);

    const regenerateInstruction = `
## 이전 답변 (수정 필요)

${previousAnswer}

## 수정 지시

위 답변에서 아래 API/이벤트/속성은 내부 데이터에서 확인되지 않았습니다. **존재하지 않는 API입니다.**
${invalidApis.map(api => `- ${api}`).join('\n')}

위 미확인 API를 모두 제거하고, RAG 검색 결과에서 확인된 실제 API만 사용하여 답변을 다시 작성해 주세요.
존재 여부가 불확실한 API는 사용하지 마세요.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage + '\n\n' + regenerateInstruction },
      ],
    });

    const answer = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      answer,
      hasRagResults,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      model: response.model,
    };
  }
}

module.exports = AnswerGenerator;
