/**
 * /api/answer 라우트 — 문의 → 답변 생성 파이프라인
 */

const express = require('express');
const AnswerPipeline = require('../../generator/pipeline');
const { toSources, calculateConfidence } = require('../../rag/parseRagResults');

const router = express.Router();
const pipeline = new AnswerPipeline();

const CONFIDENCE_THRESHOLD = 60;

// POST /api/answer — W-Tech 표준 응답
router.post('/', async (req, res) => {
  const { question, version, topK, categoryFilter } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: '문의 내용(question)을 입력해주세요.' });
  }

  try {
    const result = await pipeline.process(question, {
      version,
      topK: topK || 8,
      categoryFilter,
    });

    const cases = result.ragResults.cases || [];
    const sources = toSources(cases);
    const confidence = calculateConfidence(cases);

    // 신뢰도 미달 → failReason 02
    if (confidence < CONFIDENCE_THRESHOLD) {
      return res.json({
        draftAnswer: '',
        confidence: 0,
        sources: [],
        failReason: '02',
        failDescription: `유사 사례 부족으로 신뢰도 ${confidence}% (${CONFIDENCE_THRESHOLD}% 미만)`,
      });
    }

    res.json({
      draftAnswer: result.answer,
      confidence,
      sources,
      attachments: [],
    });
  } catch (err) {
    console.error('[API] 답변 생성 실패:', err);
    res.json({
      draftAnswer: '',
      confidence: 0,
      sources: [],
      failReason: '04',
      failDescription: `시스템 오류: ${err.message}`,
    });
  }
});

// POST /api/answer/stream — SSE 스트리밍 (진행 상태 전달)
router.post('/stream', async (req, res) => {
  const { question, version, topK, categoryFilter } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: '문의 내용(question)을 입력해주세요.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    send('status', { step: 'classify', message: '문의 분류 중...' });

    const result = await pipeline.process(question, {
      version,
      topK: topK || 8,
      categoryFilter,
    });

    send('status', { step: 'done', message: '답변 생성 완료' });
    send('result', {
      answer: result.answer,
      classification: result.classification,
      sources: {
        count: result.ragResults.resultCount,
        hasRagResults: result.hasRagResults,
      },
      verification: {
        verified: result.verification.verified,
        unverified: result.verification.unverified,
        summary: result.verification.summary,
      },
      usage: result.usage,
      model: result.model,
      savedPath: result.savedPath,
    });
  } catch (err) {
    send('error', { message: err.message });
  } finally {
    res.end();
  }
});

// POST /api/answer/follow-up — 재답변 (대화 맥락 유지) · W-Tech 표준 응답
router.post('/follow-up', async (req, res) => {
  const { originalQuestion, previousAnswer, followUp, version, topK } = req.body;

  if (!originalQuestion || !previousAnswer || !followUp) {
    return res.status(400).json({
      error: 'originalQuestion, previousAnswer, followUp 모두 필요합니다.',
    });
  }

  try {
    const result = await pipeline.processFollowUp(
      { originalQuestion, previousAnswer, followUp },
      { version, topK: topK || 8 }
    );

    const cases = result.ragResults.cases || [];
    const sources = toSources(cases);
    const confidence = calculateConfidence(cases);

    if (confidence < CONFIDENCE_THRESHOLD) {
      return res.json({
        draftAnswer: '',
        confidence: 0,
        sources: [],
        failReason: '02',
        failDescription: `유사 사례 부족으로 신뢰도 ${confidence}% (${CONFIDENCE_THRESHOLD}% 미만)`,
      });
    }

    res.json({
      draftAnswer: result.answer,
      confidence,
      sources,
      attachments: [],
    });
  } catch (err) {
    console.error('[API] 재답변 생성 실패:', err);
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
