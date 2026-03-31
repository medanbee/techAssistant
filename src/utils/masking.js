/**
 * 개인정보 마스킹 유틸리티
 * 개인명, 이메일, 전화번호, 회사명, 프로젝트명 등 식별 정보 제거
 */

// 마스킹 패턴 정의
const PATTERNS = [
  // 이메일
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[이메일]' },
  // 전화번호 (한국)
  { regex: /\d{2,3}-\d{3,4}-\d{4}/g, replacement: '[전화번호]' },
  { regex: /\d{10,11}/g, replacement: '[전화번호]' },
  // IP 주소
  { regex: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g, replacement: '[서버주소]' },
  // 내부 URL
  { regex: /https?:\/\/(?:(?!websquare|inswave|w-tech)[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}[^\s)>\]"]*/gi, replacement: '[URL]' },
];

/**
 * 개인정보 마스킹
 * @param {string} text - 원본 텍스트
 * @returns {string} - 마스킹된 텍스트
 */
function maskPersonalInfo(text) {
  if (!text) return '';

  let masked = text;
  for (const { regex, replacement } of PATTERNS) {
    masked = masked.replace(regex, replacement);
  }

  return masked;
}

module.exports = { maskPersonalInfo };
