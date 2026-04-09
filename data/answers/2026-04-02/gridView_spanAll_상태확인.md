안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

그리드뷰에서 spanAll의 현재 상태(true/false) 확인 방법과 관련하여 확인 후 답변드립니다.

## 원인 분석

`spanAll()`은 drilldown 컬럼의 전체 데이터를 펼치거나 접는 **동작 API**로, 현재 펼침/접힘 상태를 반환하는 별도의 getter API는 제공되지 않습니다.

## 해결 방법

### 방법 1: 초기 상태 제어 — `showDepth` 속성

drilldown 컬럼의 `showDepth` 값을 설정하면 초기 로딩 시 펼침 깊이를 지정할 수 있으며, 이 값이 spanAll의 초기 상태로 적용됩니다.

```xml
<w2:column inputType="drilldown" showDepth="0" />  <!-- 접힌 상태로 시작 -->
```

### 방법 2: 플래그 변수로 상태 추적

spanAll 호출 시 변수에 상태를 저장하여 직접 관리하는 방식입니다.

```javascript
var _isSpanOpen = false;  // 초기 접힌 상태 (showDepth에 맞게 설정)

// 펼치기/접기 토글
function toggleSpanAll() {
    _isSpanOpen = !_isSpanOpen;
    gridView1.spanAll(_isSpanOpen);
}

// 현재 상태 확인이 필요한 곳에서
if (_isSpanOpen) {
    // 펼쳐진 상태일 때 처리
} else {
    // 접힌 상태일 때 처리
}
```

### spanAll API 참고

```javascript
gridView1.spanAll(true);   // 접혀 있는 데이터를 모두 펼침
gridView1.spanAll(false);  // 펼쳐진 데이터를 모두 접음
gridView1.spanAll(2);      // depth가 2까지인 데이터를 모두 펼침
```

## 추가 참고 사항

- `showDepth` 속성은 gridView column의 property 탭에서 설정 가능합니다.
- 헤더 클릭으로 토글하려면 `onheaderdblclick` 이벤트에서 `spanAll()`을 호출하는 방식을 사용할 수 있습니다.

---

**참고 자료 (RAG 검색 유사도):**

| # | 출처 | 내용 요약 | 유사도 |
|---|------|-----------|--------|
| 1 | [API 가이드 SP4] spanAll(openFlag) | drilldown gridView 전체 펼침/접기 API | 0.9372 |
| 2 | [API 가이드 AI] spanAll(openInfo) | spanAll API 설명 (Boolean/Number) | 0.9000 |
| 3 | [W-Tech QNA] spanAll 상태 확인 문의 | showDepth로 초기 상태 설정, spanAll 직접 상태 반환 API 없음 | 0.8918 |
| 4 | [W-Tech QNA] drilldown 접힌 상태 로드 | showDepth="0" 및 spanAll API 안내 | 0.8895 |

감사합니다.
