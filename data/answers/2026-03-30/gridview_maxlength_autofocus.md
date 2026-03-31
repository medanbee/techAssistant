# GridView maxLength 입력 완료 시 다음 컬럼 자동 포커스 이동

- **문의일시**: 2026-03-30
- **분류**: GridView
- **답변 근거**: 내부 데이터 기반 (RAG 유사 사례 참고 + WebSquare API 가이드)

## 문의 내용

그리드 컬럼에 maxLength=2.2, dataType="float", applyFormat="true", autoDecimalPoint="true" 위와 같이 속성이 설정되어 있어 4자리 숫자를 입력하면 자동 소수점 변환이 되는데, e.g. 2222 -> 22.22
이렇게 그리드뷰에서 maxLength까지 다 입력하면 다음 컬럼으로 자동 focus 되도록 하는 방법이 있을까요?

## 답변

안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

GridView 컬럼에서 maxLength까지 입력 완료 시 다음 컬럼으로 자동 포커스 이동하는 방법과 관련하여 확인 후 답변드립니다.

현재 웹스퀘어 GridView에서는 maxLength 입력 완료 시 자동으로 다음 셀로 포커스를 이동하는 내장 속성은 제공되지 않습니다. 다만, `onkeyup` 이벤트를 활용하여 아래와 같이 구현하실 수 있습니다.

**구현 방법:**

GridView의 해당 컬럼에 `onkeyup` 이벤트를 설정하여, 입력값의 길이가 maxLength에 도달했을 때 다음 셀로 포커스를 이동하는 방식입니다.

```javascript
// GridView onkeyup 이벤트
var colIndex = info.colIndex;
var rowIndex = info.rowIndex;
var value = gridView.getCellValue(rowIndex, colIndex);
var maxLength = 4; // maxLength="2.2" → 소수점 제외 실제 입력 자릿수

// 입력값 길이가 maxLength에 도달하면 다음 컬럼으로 이동
if (value.replace(/[^0-9]/g, "").length >= maxLength) {
    gridView.setFocusedCell(rowIndex, colIndex + 1, true);
}
```

**참고 사항:**
- `autoDecimalPoint="true"` 설정 시 소수점이 자동 삽입되므로, 길이 체크 시 숫자만 추출하여 비교하는 것을 권장드립니다.
- `setFocusedCell` API의 세 번째 파라미터를 `true`로 설정하면 해당 셀이 편집 모드로 진입합니다.
- 사용 중인 WebSquare 버전에 따라 API 동작이 상이할 수 있으니, 버전 정보를 추가로 확인 부탁드립니다.

[출처: Gmail 기술문의 | 분류: GridView | 내부 유사 사례 참고 + WebSquare API 가이드 기반]

감사합니다.
