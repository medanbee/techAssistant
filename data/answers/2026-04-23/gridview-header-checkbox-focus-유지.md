# 그리드 헤더 checkbox 선택 시 포커스 유지 방법 문의

- **문의일시**: 2026-04-23
- **분류**: GridView > 포커스/이벤트
- **답변 근거**: 내부 데이터 기반 (RAG 유사 사례 참고)

## 문의 내용

그리드 row에 포커스가 있는 상태에서 그리드 헤더에 있는 전체 선택(`inputType="checkbox"`)을 클릭할 경우 포커스가 사라지는데, 포커스를 유지할 방법이 있을까요?

## 답변

안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

그리드 헤더의 전체선택 체크박스(`inputType="checkbox"`) 클릭 시 body 셀 포커스가 사라지는 현상과 관련하여 유사 사례 기반으로 안내드립니다.

## 1. 원인

WebSquare gridView의 헤더 체크박스는 기본 동작상 클릭 시 **현재 포커스되어 있던 body 셀의 포커스를 제거**하도록 설정되어 있습니다. 이 동작은 **column 속성** 또는 **엔진 전역 설정**으로 변경 가능합니다.

## 2. 해결 방안

### 방안 1) (권장) 헤더 체크박스 컬럼에 `focusOutOnCheckHeaderClick="false"` 지정

체크박스 컬럼 정의에 아래 속성을 추가하시면, 헤더 클릭 시 body 셀 포커스가 그대로 유지됩니다.

```xml
<column id="chk"
        inputType="checkbox"
        focusOutOnCheckHeaderClick="false"
        ... />
```

### 방안 2) (대안) `keepFocusOnCheckHeaderClick="true"` 지정

같은 목적의 속성으로, 신규 AI 엔진 가이드에 명시된 속성입니다. 동일하게 헤더 클릭 시 포커스를 유지합니다.

```xml
<column id="chk"
        inputType="checkbox"
        keepFocusOnCheckHeaderClick="true"
        ... />
```

> ※ 두 속성은 동일한 목적이며, 사용 중인 엔진 빌드에 따라 인식되는 속성이 다를 수 있습니다. **방안 1을 먼저 적용**해보시고, 동작하지 않으면 방안 2로 교체해 보시기 바랍니다.

### 방안 3) 모든 gridView에 일괄 적용 (전역 설정)

특정 화면이 아닌 **프로젝트 전체에 동일하게 적용**하시려면 `websquare/config.xml` 의 gridView 기본 옵션 영역에서 동일 속성을 default로 지정하실 수 있습니다.

```xml
<!-- websquare/config.xml -->
<uiplugin id="gridView">
    <default name="focusOutOnCheckHeaderClick" value="false" />
</uiplugin>
```

화면 단위로 별도 지정이 없는 모든 gridView의 체크박스 컬럼에 적용됩니다.

### 방안 4) (참고) 스크립트로 포커스 복귀

위 속성으로도 해결되지 않거나, 포커스 위치를 직접 제어해야 할 경우 `onheaderclick` 이벤트에서 이전 포커스를 복귀하는 방식도 가능합니다.

```javascript
// 헤더 체크박스 클릭 전에 현재 포커스 셀 좌표 보관 → 클릭 후 복귀
scwin.gridView1_onheaderclick = function (headerId) {
    // 헤더 체크박스 클릭 여부 확인
    var checked = gridView1.getHeaderValue(headerId);

    // 필요 시 후처리 (포커스 강제 이동 등)
    // gridView1.setFocusedCell(rowIndex, colIndex);
};
```

> ※ 위 코드는 유사 사례 기반 참고용입니다. 실제 동작 확인 후 적용해주세요. 특히 row 수가 많을 때 `setFocusedCell`로 강제 이동하면 스크롤이 함께 튈 수 있어, **방안 1/2 속성 적용을 우선 권장**합니다.

## 3. 추가 확인 요청

엔진 빌드(WebSquare AI 5/6 여부)에 따라 적용되는 속성이 달라질 수 있습니다. 방안 1·2 모두 적용해보셔도 동작하지 않을 경우 아래 정보 회신 부탁드립니다.

1. **엔진 버전 정보** (미리보기 → Ctrl+우클릭 → Version 정보의 전체 문자열, 예: `5.0_5.5xxxB.20YYMMDD.xxxxxx_1.8`)
2. **체크박스 컬럼 XML** (현재 사용 중인 column 정의)
3. **브라우저 종류 및 버전** (Chrome/Edge/IE)
4. **재현 가능한 샘플 화면**

---

## 출처

| # | 데이터 유형 | 출처 | 세부 항목 | 유사도 |
|---|---|---|---|---|
| 1 | API 가이드 (AI) | `WebSquare.uiplugin.gridView.column.keepFocusOnCheckHeaderClick` | 체크박스 헤더 클릭 시 포커스 유지 (default false) | 0.9148 |
| 2 | W-Tech QNA | 병합 셀 그리드 헤더 체크박스 전체선택/해제 처리 | `getHeaderValue()`, `getCheckedData()` 활용 사례 | 0.8756 |
| 3 | Confluence 기술지식DB(Inside) | header checkbox 선택 시 body focus 유지 설정 | `focusOutOnCheckHeaderClick="false"` + config.xml 전역 적용 | 0.8712 |
| 4 | W-Tech FAQ | grid focus 상태에서 sort 시 focus 처리 | `filterFocusMode` 속성 (참고) | 0.8572 |
| 5 | API 가이드 (AI) | `WebSquare.uiplugin.gridView.setFocusedHeaderObj(headerId)` | inputType selectbox/checkbox 헤더 포커스 설정 | 0.8072 |
| 6 | W-Tech QNA | 그리드 체크박스 클릭 시 row 포커스 유지 문의 | onrowindexchange 복귀 시 스크롤 튐 → 속성 권장 | 0.7983 |

※ 본 답변은 AI가 기존 기술지원 사례를 기반으로 생성한 답변입니다.
감사합니다.
