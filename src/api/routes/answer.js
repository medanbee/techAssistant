/**
 * /api/answer 라우트 — 문의 → 답변 생성 파이프라인
 */

const express = require('express');
const AnswerPipeline = require('../../generator/pipeline');

const router = express.Router();
const pipeline = new AnswerPipeline();

// POST /api/answer — 일반 JSON 응답
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

    res.json({
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
    console.error('[API] 답변 생성 실패:', err);
    res.status(500).json({ error: '답변 생성 중 오류가 발생했습니다.', detail: err.message });
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

module.exports = router;
