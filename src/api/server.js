/**
 * TechAssistant API 서버
 * 기술문의 자동 답변 시스템 REST API
 */

const express = require('express');
const cors = require('cors');
const apiKeyAuth = require('./middleware/auth');
const answerRouter = require('./routes/answer');
const searchRouter = require('./routes/search');
const queueRouter = require('./routes/queue');
const scanRouter = require('./routes/scan');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 헬스 체크 (인증 불필요)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API 라우트
app.use('/api/search', searchRouter);  // 검색은 인증 불필요
app.use('/api/answer', apiKeyAuth, answerRouter);  // 답변 생성은 인증 필요
app.use('/api/scan', scanRouter);  // 신규 문의 스캔
app.use('/api/queue', queueRouter);  // 검수 큐

// 서버 시작
app.listen(PORT, () => {
  console.log(`[TechAssistant API] 서버 시작: http://localhost:${PORT}`);
  console.log(`[TechAssistant API] 헬스 체크: http://localhost:${PORT}/api/health`);
  console.log(`[TechAssistant API] 답변 생성: POST http://localhost:${PORT}/api/answer`);
  console.log(`[TechAssistant API] RAG 검색: POST http://localhost:${PORT}/api/search`);
});

module.exports = app;
