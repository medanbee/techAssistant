# GridView maxLength 입력 완료 시 다음 컬럼 자동 포커스 이동

- **문의일시**: 2026-03-31
- **분류**: GridView
- **답변 근거**: 내부 데이터 기반 (RAG 유사 사례 참고)

## 문의 내용

그리드 컬럼에 maxLength=2.2, dataType="float", applyFormat="true", autoDecimalPoint="true" 위와 같이 속성이 설정되어 있어 4자리 숫자를 입력하면 자동 소수점 변환이 되는데, e.g. 2222 -> 22.22
이렇게 그리드뷰에서 maxLength까지 다 입력하면 다음 컬럼으로 자동 focus 되도록 하는 방법이 있을까요?

## 답변

안녕하세요.
인스웨이브 기술지원팀 담당자 프로입니다.

그리드뷰에서 maxLength까지 입력 완료 시 다음 컬럼으로 자동 포커스 이동하는 방법과 관련하여 확인 후 답변드립니다.

### 원인 분석

GridView에는 maxLength 도달 시 자동으로 다음 셀로 포커스를 이동하는 내장 속성이 별도로 제공되지 않습니다. `autoDecimalPoint="true"` 환경에서 `2222` 입력 → `22.22` 자동 변환 후 다음 컬럼으로 넘어가려면, **이벤트 핸들러를 통한 커스텀 처리**가 필요합니다.

### 해결 방법

**방법 1) `onkeydown` 이벤트에서 입력값 길이 체크 후 `setFocusedCell`로 포커스 이동**

```javascript
scwin.gridView1_onkeydown = function(e) {
    var row = gridView1.getFocusedRowIndex();
    var col = gridView1.getFocusedColumnIndex();
    var cellValue = e.target.value;
    var maxLen = 5; // "22.22" = 5자리 (소수점 포함)
    
    if (cellValue.length >= maxLen) {
        var nextCol = parseInt(col) + 1;
        setTimeout(function() {
            gridView1.setFocusedCell(row, nextCol, true); // 세 번째 인자 true: 편집모드 진입
        }, 0);
    }
};
```

> **참고:** `onkeydown` 이벤트 내에서 `setFocusedCell` 호출 시, 이미 키 이벤트가 진행 중이므로 `setTimeout`으로 감싸서 비동기 처리해야 정상 동작합니다.

**방법 2) `enterKeyMove` 속성 활용 (Enter 키 기반 이동)**

입력 완료 후 사용자가 Enter 키로 다음 셀로 이동하는 방식입니다.

```xml
<gridView id="gridView1" enterKeyMove="editRight" ...>
```

- `"editRight"` : 편집 모드 진입 후, Enter 키 입력 시 오른쪽 셀로 이동
- `"editDown"` : 편집 모드 진입 후, Enter 키 입력 시 아래쪽 셀로 이동

### 추가 확인 사항

- **`ignoreNonEditableCell="true"`** 속성을 함께 설정하시면, readOnly 셀은 건너뛰고 편집 가능한 다음 셀로 포커스가 이동됩니다.
- `autoDecimalPoint="true"` 적용 시 실제 셀 값에 소수점이 포함되므로, 길이 체크 시 소수점 문자를 포함한 길이(`"22.22"` = 5자)로 비교해야 합니다.
- 사용 중이신 WebSquare 엔진 버전 정보를 함께 알려주시면 보다 정확한 안내가 가능합니다.

감사합니다.

[출처: 개발가이드 샘플 - GridView enterKeyMove 사용법 | W-Tech QNA - ignoreNonEditableCell 속성 | 개발가이드 샘플 - GridView setFocusedCell 사용법 | API 가이드 (AI) - gridView onkeydown 이벤트]
