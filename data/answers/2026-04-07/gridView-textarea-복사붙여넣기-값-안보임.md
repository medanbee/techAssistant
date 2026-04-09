## gridView Textarea 셀 복사/붙여넣기 시 값 안 보이는 현상

안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

gridView에서 Textarea 셀의 Ctrl+V 붙여넣기 후 값이 화면에 안 보이는 현상과 관련하여 확인 후 답변드립니다.

---

### 1. 원인 분석

말씀하신 현상은 **Ctrl+V로 붙여넣기 후 포커스 이동 → Ctrl+Z(실행취소) 또는 Ctrl+X(잘라내기) 반복 시** 화면 표시 값과 DataList 값이 불일치하는 것으로, gridView의 내부 편집 상태(edit mode)와 DataList 반영 타이밍 간의 동기화 문제로 보입니다.

구체적으로:
- 셀에 Ctrl+V로 값을 붙여넣으면 화면(DOM)에는 값이 표시되지만, 포커스 이동 전에는 DataList에 반영되지 않을 수 있습니다.
- 이 상태에서 Ctrl+Z로 되돌리거나 Ctrl+X로 잘라내면, 화면 표시와 DataList 값이 불일치하게 됩니다.
- Validation 시 화면에는 값이 보이지만 DataList에는 값이 없어 검증이 정상 동작하지 않습니다.

### 2. 해결 방법

#### 방법 1: oncustompaste 이벤트에서 DataList 직접 반영

`oncustompaste` 이벤트를 사용하면 붙여넣기 동작을 커스터마이징하여 DataList에 즉시 반영할 수 있습니다. 이벤트 파라미터는 **ClipboardEvent(e)** 객체입니다.

```javascript
scwin.gridView1_oncustompaste = function(e) {
    // ClipboardEvent에서 붙여넣기 데이터 추출
    var pasteData = (e.clipboardData || window.clipboardData).getData("text");

    // 현재 포커스된 셀 위치
    var rowIdx = gridView1.getFocusedRowIndex();
    var colIdx = gridView1.getFocusedColumnID();

    // DataList에 직접 값 반영
    dataList1.setCellData(rowIdx, colIdx, pasteData);

    // 기본 붙여넣기 동작 방지 (중복 입력 방지)
    e.preventDefault();
};
```

#### 방법 2: checkEditOnPaste 속성 설정

`checkEditOnPaste="true"` 속성을 적용하면, 편집모드 상태에서 Ctrl+V로 붙여넣기할 때 셀 단위로 정확하게 데이터가 반영됩니다.

```xml
<w2:gridView id="gridView1" dataList="dataList1"
    checkEditOnPaste="true" ... />
```

#### 방법 3: onafterpaste 이벤트에서 강제 동기화

붙여넣기 완료 후 화면과 DataList를 강제로 동기화합니다.

```javascript
scwin.gridView1_onafterpaste = function(info) {
    // 붙여넣기 후 현재 셀의 값을 DataList에 강제 반영
    var rowIdx = gridView1.getFocusedRowIndex();
    var colIdx = gridView1.getFocusedColumnID();
    var cellValue = gridView1.getCellData(rowIdx, colIdx);
    dataList1.setCellData(rowIdx, colIdx, cellValue);
};
```

### 3. 추가 확인 사항

- 사용 버전이 **5.0_4.4344B (2021.03.02)**로 확인됩니다. 이 버전에서 Ctrl+V/Z/X 관련 알려진 이슈가 있을 수 있으며, **엔진 업데이트를 통해 해결될 수 있는지 확인이 필요**합니다.
- `preventPaste` 속성이 적용되어 있다면 해제 여부를 확인해 주세요.
- Textarea inputType 셀에서만 발생하는지, 일반 text inputType에서도 동일한지 확인이 필요합니다.
- 재현 가능한 **최소 샘플 화면(xml)**을 보내주시면 정확한 원인 파악 후 엔진 핫픽스 검토가 가능합니다.

감사합니다.

---

### 출처

| # | 출처 유형 | 출처 위치 | 세부 항목 | 유사도 |
|---|-----------|-----------|-----------|--------|
| 1 | W-Tech QNA | wtech.inswave.kr | gridView preventAddRowOnPaste 붙여넣기 | 0.9427 |
| 2 | API 가이드 (AI) | gridView.checkEditOnPaste | 편집모드 Ctrl+V 붙여넣기 셀 반영 | 0.8049 |
| 3 | Confluence 기술지식DB | Inside | 다중선택 셀 붙여넣기 oncustompaste | 0.8583 |
| 4 | API 가이드 (AI) | gridView.checkDisabledOnCut | Ctrl+X 잘라내기 제어 | 0.9294 |
| 5 | API 가이드 (AI) | gridView.copyOption | 복사 시 DataList vs display 기준 | 0.8537 |
| 6 | W-Tech QNA | wtech.inswave.kr | linkedDataList Ctrl+V 안 됨 | 0.5402 |
