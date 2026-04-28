안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

getCurrentGridStyle / setGridStyle 사용 시 그리드 사라짐 현상과 관련하여 유사 사례 기반으로 안내드립니다.

### 1. 원인 분석

`getCurrentGridStyle()`은 XML **문자열**을 반환합니다. 그런데 `setGridStyle()`은 XML 문자열이 아닌 **XML 파싱된 객체**를 파라미터로 받습니다. 문자열을 그대로 넘기면 그리드가 정상적으로 렌더링되지 않고 사라지는 현상이 발생합니다.

### 2. 해결 방법

`WebSquare.xml.parse()`로 XML 문자열을 파싱한 후 `setGridStyle()`에 전달해야 합니다.

```javascript
hte.anchor2_onclick = function() {
    hte.gridStr = grdItemList.getCurrentGridStyle();
};

hte.anchor12_onclick = function() {
    var gridXml = WebSquare.xml.parse(hte.gridStr, true);
    grdItemList.setGridStyle(gridXml);
};
```

※ 위 코드는 유사 사례 기반 참고용입니다. 실제 동작 확인 후 적용해주세요.

### 3. 추가 확인 사항

- `setGridStyle`은 공식 API 문서에 상세 설명이 없는 비공개 함수였으나, 현재는 사용 가능합니다.
- gridView에 `dynamic="true"` 속성이 설정되어 있어야 `setGridStyle`이 정상 동작합니다.
- 버전에 따라 동작 차이가 있을 수 있으니, 사용 중인 WebSquare 버전을 확인해주세요.
  - SP2: `WebSquare.xml.parse(gridStyle)` (파라미터 1개)
  - SP4/SP5: `WebSquare.xml.parse(gridStyle, true)` (두 번째 파라미터 필요)

※ 본 답변은 AI가 기존 기술지원 사례를 기반으로 생성한 답변입니다.
감사합니다.

---

### 참조 출처

| # | 출처 | 유사도 |
|---|------|--------|
| 1 | W-Tech QNA (setGridStyle 동적 그리드 생성) | 85.7% |
| 2 | W-Tech QNA (WebSquare.xml.parse 동적 그리드) | 85.7% |
| 3 | W-Tech QNA (setGridStyle 사용 가능 여부 문의) | 53.2% |
