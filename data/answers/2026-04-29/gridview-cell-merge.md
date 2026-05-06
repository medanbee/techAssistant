# 그리드뷰 셀 머지하는 방법

> 작성일: 2026-04-29
> 작성: Claude (RAG 부분 인덱싱 30% 상태에서 작성, 인덱싱 완료 후 재검증 권장)

## 문의 내용

그리드뷰 셀 머지하는 방법

## 답변

안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

GridView 셀 병합과 관련하여 안내드립니다.

### 원인 분석

GridView에서 셀 병합은 **두 가지 방식**으로 구현됩니다:

| 방식 | 설명 | 사용 시점 |
|---|---|---|
| `colmerge` 속성 | 동일 컬럼에서 같은 값을 자동 병합 | 화면 정의 시점 (정적) |
| `mergeCell(mergeInfo)` 메소드 | 스크립트로 동적 병합 | 데이터 로드 후 / 사용자 액션 시 |
| `mergeFocusedCell()` 메소드 | 포커스된 셀 위주 병합 | 사용자 인터랙션 |

### 해결 방법

#### 1. 정적 컬럼 병합 — `colmerge` 속성

XML 정의에서 컬럼에 `colmerge="true"` 지정:

```xml
<col id="dept" colmerge="true" displayName="부서" />
```

같은 값이 연속될 때 자동으로 셀이 합쳐집니다.

#### 2. 동적 병합 — `mergeCell()`

스크립트로 특정 영역 병합:

```javascript
var grid = WebSquare.getComponentById("grdMain");
grid.mergeCell({
  startRow: 0,
  endRow: 2,
  startCol: 1,
  endCol: 1
});
```

#### 3. 포커스 셀 병합 — `mergeFocusedCell()`

```javascript
var grid = WebSquare.getComponentById("grdMain");
grid.mergeFocusedCell();
```

> ※ 위 코드는 유사 사례 기반 참고용입니다. 실제 동작 확인 후 적용해주세요.

### 추가 확인 사항

정확한 사용법 안내를 위해 아래 정보를 추가로 전달 부탁드립니다:

- 사용 중인 WebSquare 버전 (예: 5.0_5.5315B)
- 병합하려는 셀의 패턴 (행 단위 / 컬럼 단위 / 사각형 영역)
- 데이터 로드 시점 자동 병합인지, 사용자 액션 후 병합인지

감사합니다.

## 참고 자료

| RAG 검색 결과 | 매칭도 | 출처 |
|---|---|---|
| `WebSquare.uiplugin.gridView mergeFocusedCell() 사용법` | 88% | API 가이드 (AI) |
| `WebSquare.uiplugin.gridView mergeCell(mergeInfo) 사용법` | 88% | API 가이드 (AI) |
| `Merge - Shorts` | 92% | Confluence PA |
| `그리드뷰 콜머지 정상/비정상 사례` | 53% | W-Tech QNA |
| `그리드에서 아래 5개 컬럼이 모두 동일한 경우 하나의 병합 그룹` | 88% | W-Tech QNA |

## 메타

- LLM: Claude (manual, RAG 인덱싱 진행 중에 작성)
- RAG 인덱싱 상태: 30% (8,600/28,214건)
- 검증된 API: `colmerge`, `mergeCell`, `mergeFocusedCell` (어제 인덱스 결과 기반)
- 권고: 인덱싱 완료 후 `/api/answer` 재호출하여 정식 답변 확보
