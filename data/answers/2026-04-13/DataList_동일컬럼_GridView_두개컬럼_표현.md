안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

DataList의 동일 컬럼을 GridView에서 두 개의 컬럼으로 표현하는 방법에 대해 유사 사례 기반으로 안내드립니다.

### 1. 원인 분석

GridView의 컬럼은 DataList의 컬럼과 1:1로 바인딩되는 구조입니다. 동일한 DataList 컬럼 ID를 GridView의 두 개 컬럼에 직접 바인딩하는 것은 지원되지 않습니다.

### 2. 해결 방법

DataList를 변경하지 않고 GridView에서 두 개 컬럼으로 표현하려면 **customFormatter**를 활용합니다.

```xml
<!-- GridView 컬럼 정의 -->
<w2:column id="EMP_NO" name="사번1" dataType="text" />
<w2:column id="EMP_NO_COPY" name="사번2" dataType="text"
           customFormatter="scwin.fn_empNoCopy" />
```

```javascript
scwin.fn_empNoCopy = function(data, displayData, row, col) {
    return dataList1.getCellData(row, "EMP_NO");
};
```

※ 위 코드는 유사 사례 기반 참고용입니다. 실제 동작 확인 후 적용해주세요.

### 3. 추가 확인 사항

- DataList 자체를 변경하지 않으며, GridView에서 표시용으로만 사용됩니다
- 두 번째 컬럼(`EMP_NO_COPY`)은 DataList에 실제 컬럼이 없어도 표시 가능합니다
- 편집이 필요한 경우, 두 번째 컬럼의 값 변경 시 `oncellchange` 이벤트에서 원본 컬럼에 값을 반영하는 추가 처리가 필요합니다
- `displayFormatter`는 인자가 `data` 하나만 들어오므로 다른 셀 값 참조가 불가합니다. 반드시 `customFormatter`를 사용해야 합니다

※ 본 답변은 AI가 기존 기술지원 사례를 기반으로 생성한 답변입니다.
감사합니다.

---

### 참조 출처

| # | 출처 | 유사도 |
|---|------|--------|
| 1 | 개발가이드 샘플 (importFormatter_dataList 사용법) | 93.3% |
| 2 | W-Tech QNA (importFormatter/displayFormatter 공통 적용) | 90.0% |
| 3 | W-Tech QNA (동적 바인딩 컬럼 변경) | 84.6% |
