# 텍스트박스 툴팁 개행(줄바꿈) 넣는 방법

> 작성일: 2026-04-30 (사용자 검증 후 갱신)
> 작성: Claude (RAG 28,214건 인덱스 기반 + 사용자 실제 동작 확인)

## 문의 내용

텍스트 박스 툴팁 그 개행이랑 해서 넣는 법

## 답변

안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

textbox 툴팁에 줄바꿈은 **`tooltipFormatter` + `<br>` 태그** 조합으로 처리합니다.

### 결론 (사용자 검증)

WebSquare textbox의 tooltipFormatter는 **HTML로 렌더링**되므로:
- ❌ `\n` (line feed) → 한 줄로 무시됨
- ❌ `&#10;` (HTML 엔티티) → 동일하게 무시됨
- ✅ `<br>` 또는 `<br/>` 태그 → 정상 줄바꿈

### 권장 코드

XML 정의:
```xml
<xf:input id="ipt1" type="text"
          tooltipFormatter="myTooltipFormatter" />
```

스크립트:
```javascript
function myTooltipFormatter(value) {
  return [
    "현재 입력값: " + value,
    "최대 길이: 20자",
    "필수 입력 필드"
  ].join("<br>");
}
```

또는 tooltip 속성 직접 사용 시도:
```xml
<xf:input id="ipt1" type="text"
          tooltip="첫 번째 줄&lt;br&gt;두 번째 줄" />
```
> XML 안에 `<br>` 직접 넣으면 안 되므로 `&lt;br&gt;`로 이스케이프. 단 이 방식은 미검증.

### 보너스 — HTML 태그 활용

`<br>`이 동작하므로 다른 HTML 태그도 가능:
```javascript
function myTooltipFormatter(value) {
  return "<b>현재 값:</b> " + value + "<br>" +
         "<i>최대 길이</i>: 20자<br>" +
         "<span style='color:red'>필수 입력</span>";
}
```

### 추가 확인 사항

- XSS 위험: tooltipFormatter에서 사용자 입력값을 그대로 HTML로 반환하면 XSS 가능 → 사용자 입력 부분은 escape 처리 권장

감사합니다.

## 참고 자료

| 사례 | 매칭도 | 출처 | URL |
|---|---:|---|---|
| `tooltipFormatter 속성` | 91% | API 가이드 (AI) | https://docs.inswave.com/support/api/ws5_ai/6.0_0.1550R.20260417.145224/index.html |
| `tooltipPositionX/Y 속성` | 90% | API 가이드 (AI) | (동일) |
| `tooltipTime 속성` | 90% | API 가이드 (AI) | (동일) |
| `tooltip 속성` | 89% | API 가이드 (AI) | (동일) |
| tooltipDisplay/tooltipFormatter 문의 | 88% | W-Tech QNA | - |

## 메타

- LLM: Claude
- 사용 API (RAG 검증됨): `tooltipFormatter`
- **사용자 검증 결과**: tooltipFormatter는 HTML 렌더링. `<br>` 태그만 줄바꿈 동작. `\n`/`&#10;` 무시
