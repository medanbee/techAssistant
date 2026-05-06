# GridView 셀 병합

- **문의일시**: 2026-04-29
- **분류**: GridView > 셀 병합
- **답변 근거**: 내부 데이터 기반 (RAG 유사 사례 참고)

## 문의 내용

GridView 셀 병합

## 답변

안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

GridView 셀 병합과 관련하여 유사 사례 기반으로 안내드립니다.

## 원인 분석
WebSquare GridView에서 셀을 병합하는 기능은 다양한 시나리오에 맞춰 여러 API를 통해 제공됩니다. 주로 특정 범위의 셀을 동적으로 병합하거나, 특정 규칙에 따라 열 또는 행 단위로 병합하는 방식, 그리고 헤더 영역의 셀을 병합하는 방식이 있습니다.

## 해결 방법

### 1. 데이터 셀 동적 병합 (특정 범위 지정)
`WebSquare.uiplugin.gridView.mergeCell()` API를 사용하여 셀을 병합할 수 있습니다. `mergeInfo` 객체를 통해 병합 대상 셀의 정보를 전달합니다.

**API 명세**
`WebSquare.uiplugin.gridView.mergeCell( mergeInfo )`

| 이름 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| `mergeInfo` | JSON | Y | 병합 대상 셀의 정보를 포함한 객체 | [API 가이드 (AI), #2, 0.8940], [API 가이드 (SP4), #4, 0.8867] |

**예시**
현재 제공된 참고 자료에서는 `mergeInfo` 객체의 구체적인 속성명(예: rowIndex, colIndex, colSpan, rowSpan)이 내부 데이터에서 확인되지 않아, 해당 속성을 활용한 구체적인 코드 예시를 제공하기 어렵습니다.

※ 위 코드는 유사 사례 기반 참고용입니다. 실제 동작 확인 후 적용해주세요.

### 2. 데이터 셀 규칙 기반 병합
열 또는 행의 데이터를 기준으로 유사한 값을 가진 셀들을 자동으로 병합하는 API가 제공됩니다.

**주요 API**

| API | 설명 | 출처 |
|---|---|---|
| `mergeByCol()` | GridView에서 열 기준으로 셀 병합 | [Confluence PA, #1, 0.9383] |
| `mergeByRow()` | GridView에서 행 기준으로 셀 병합 | [Confluence PA, #1, 0.93
