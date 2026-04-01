/**
 * TechAssistant — RAG 검색 클라이언트
 */

const API_BASE = '';

// ── 초기화 ──
(function init() {
  // 서버 상태 확인
  fetch(`${API_BASE}/api/health`)
    .then(r => r.ok && r.json())
    .then(() => {
      document.getElementById('serverStatus').textContent = '서버 정상';
      document.getElementById('statusDot').classList.add('online');
    })
    .catch(() => {
      document.getElementById('serverStatus').textContent = '서버 연결 실패';
    });

  // 날짜 표시
  const now = new Date();
  const fmt = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  document.getElementById('dateDisplay').textContent = fmt;
})();

// ── 검색 ──
async function doSearch() {
  const query = document.getElementById('question').value.trim();
  if (!query) {
    showToast('문의 내용을 입력해주세요.');
    return;
  }

  const topK = parseInt(document.getElementById('topK').value, 10);
  const btn = document.getElementById('searchBtn');

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = '검색 중...';

  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('classifySection').classList.add('hidden');
  document.getElementById('loadingSection').classList.remove('hidden');

  try {
    const res = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    displayResults(data);
  } catch (err) {
    showToast('오류: ' + err.message);
    document.getElementById('emptyState').classList.remove('hidden');
  } finally {
    document.getElementById('loadingSection').classList.add('hidden');
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = '검색';
  }
}

// ── 결과 표시 ──
function displayResults(data) {
  // 분류 바
  const classifySection = document.getElementById('classifySection');
  if (data.classification) {
    document.getElementById('classifyLabel').textContent =
      `${data.classification.categoryLabel} > ${data.classification.subcategoryLabel}`;
    document.getElementById('resultCount').textContent = `${data.resultCount}건 발견`;
    classifySection.classList.remove('hidden');
  }

  // 카드 생성
  const container = document.getElementById('resultCards');
  container.innerHTML = '';

  if (!data.cases || data.cases.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px">
        <h3>관련 사례를 찾지 못했습니다</h3>
        <p>다른 키워드로 검색해보세요.</p>
      </div>`;
    document.getElementById('resultsSection').classList.remove('hidden');
    return;
  }

  _copyData = data.cases.map((item, idx) => ({
    title: item.title || item.content.split('\n')[0].slice(0, 80) || `사례 ${idx + 1}`,
    content: item.content,
  }));

  data.cases.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${idx * 0.05}s`;

    const title = item.title || item.content.split('\n')[0].slice(0, 80) || `사례 ${idx + 1}`;
    const similarity = item.similarity || '';
    const source = item.source || '';

    card.innerHTML = `
      <div class="result-card-header" onclick="toggleCard(this)">
        <div class="result-title-area">
          <div class="result-rank ${idx < 3 ? 'top' : ''}">${idx + 1}</div>
          <span class="result-title">${escapeHtml(title)}</span>
        </div>
        <div class="result-meta-tags">
          ${similarity ? `<span class="meta-tag similarity">${escapeHtml(similarity)}</span>` : ''}
          ${source ? `<span class="meta-tag source">${escapeHtml(source)}</span>` : ''}
        </div>
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="result-card-body">
        <div class="result-content">${escapeHtml(item.content)}</div>
        <div class="result-card-actions">
          <button class="btn-sm primary" data-copy-idx="${idx}" data-copy-type="content">복사</button>
          <button class="btn-sm ghost" data-copy-idx="${idx}" data-copy-type="full">제목 포함 복사</button>
        </div>
      </div>`;

    container.appendChild(card);
  });

  // 첫 번째 카드 자동 펼치기
  const firstCard = container.querySelector('.result-card');
  if (firstCard) firstCard.classList.add('open');

  document.getElementById('resultsSection').classList.remove('hidden');
}

// ── 카드 토글 ──
function toggleCard(header) {
  header.closest('.result-card').classList.toggle('open');
}

// ── 복사 데이터 저장 ──
let _copyData = [];

// ── 복사 ──
function copyText(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '복사됨!';
    setTimeout(() => btn.textContent = orig, 1200);
  });
}

// 복사 버튼 이벤트 위임
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy-idx]');
  if (!btn) return;
  const idx = parseInt(btn.dataset.copyIdx, 10);
  const item = _copyData[idx];
  if (!item) return;
  const text = btn.dataset.copyType === 'full'
    ? item.title + '\n\n' + item.content
    : item.content;
  copyText(btn, text);
});

// ── Toast ──
let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── HTML 이스케이프 ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Ctrl+Enter ──
document.getElementById('question').addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    doSearch();
  }
});
