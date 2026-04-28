# gridView 가로스크롤 시 맨왼쪽 셀 sticky 현상

**문의일**: 2026-04-20
**프로젝트**: HUG 차세대 구축
**엔진**: WebSquare AI 6.0_0.1438B.20260120.11392_1.8

---

안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

gridView `autoFit="none"` + `rowNumVisible="true"` 상태에서 가로스크롤 시 맨 왼쪽 셀 width가 변하면서 sticky처럼 보이는 현상과 관련하여 유사 사례 기반으로 안내드립니다.

## 1. 원인 분석

### (1) rowNum/rowStatus 컬럼은 기본적으로 fixed 영역으로 생성됨
WebSquare gridView 스펙상 `rowNumVisible="true"` 또는 `rowStatusVisible="true"` 가 설정되면 해당 컬럼들은 **무조건 fixed 컬럼 영역으로 생성**됩니다. 따라서 가로스크롤이 발생해도 rowNum/rowStatus 컬럼은 좌측에 sticky 형태로 고정되어 보이는 것은 **정상 동작**입니다.

> 참고: `getFixedColumnLastIndex()`는 `fixedColumn=0` 인 경우에도 rowNum/rowStatus 두 컬럼을 포함하여 "2"를 반환합니다.

### (2) 가로스크롤 시 colgroup 내 col width가 변화하는 현상
`drawType="virtual"`(기본값) 모드의 gridView는 **화면에 보이는 row/column만 DOM을 생성**하는 가상 렌더링 방식입니다. 이 때문에 가로스크롤이 발생할 때 보이지 않는 영역의 `<col>` width가 동적으로 0 또는 다른 값으로 재계산되는 현상이 개발자도구상으로 관찰될 수 있습니다. 화면에서는 fixed 영역(rowNum)이 그대로 보이므로 sticky처럼 인식되는 것입니다.

## 2. 해결 방안

### 방안 1) rowNum 컬럼 width를 명시적으로 고정 (권장)
`rowNumWidth` 속성을 명시적으로 지정하면 가로스크롤 중 너비 흔들림을 줄일 수 있습니다.

```xml
<gridView id="gridView1"
          autoFit="none"
          rowNumVisible="true"
          rowNumWidth="40"
          keepDefaultColumnWidth="true"
          ... >
```

- `rowNumWidth` : rowNum 컬럼의 고정 너비 (px)
- `keepDefaultColumnWidth="true"` : autoFit 적용 여부와 무관하게 rowNum/rowStatus 너비를 고정

> ※ `keepDefaultColumnWidth`는 본래 autoFit 설정 시 rowNum/rowStatus 너비 고정을 위한 속성이지만, 컬럼 너비 안정화에 도움이 됩니다.

### 방안 2) drawType="native" 로 변경 (가상 스크롤 비활성화)
가상 렌더링을 사용하지 않으면 `<col>` width 동적 변경 현상이 사라집니다.

```xml
<gridView id="gridView1"
          drawType="native"
          height="500"
          autoFit="none"
          rowNumVisible="true"
          ... >
```

**제약사항**:
- `drawType="native"` 사용 시 `height` 필수 지정 (`visibleRowNum` 무시됨)
- 데이터가 많은 경우 전체 row를 그리므로 렌더링 성능 저하 가능 → 데이터 적은 경우에만 권장

### 방안 3) fixedColumn 명시적 확인
`fixedColumn` 속성이 의도치 않게 설정되어 있는지 확인하시고, 가로스크롤 사용 시 명시적으로 `fixedColumn="0"` 으로 두시기 바랍니다.

```javascript
// 동적으로 해제
gridView1.setFixedColumn(0);
```

> ※ `fixedColumn="0"` 으로 설정해도 `rowNumVisible="true"` 상태에서는 rowNum 컬럼이 좌측 fixed 영역으로 남는 것이 스펙입니다. 이 동작 자체를 완전히 제거하려면 `rowNumVisible="false"` 로 변경하셔야 합니다.

## 3. 추가 확인 사항

문의주신 엔진(`6.0_0.1438B.20260120`)은 WebSquare AI 6.0 신버전으로, 내부 사례DB에서 동일 빌드의 가로스크롤 col width 변경 관련 보고는 확인되지 않았습니다. 보다 정확한 분석을 위해 아래 정보를 추가 공유 부탁드립니다.

1. **재현 화면의 gridView 속성 설정** (소스 공유 어려우시면 주요 속성만이라도)
   - `autoFit`, `drawType`, `fixedColumn`, `rowNumVisible`, `rowNumWidth`, `rowStatusVisible`, `overflowX` 값
2. **컬럼 수와 컬럼별 width 설정** (px 고정 / `*` / 미지정 여부)
3. **현상 발생 브라우저** (Chrome/Edge/IE) 및 상세 버전
4. **현상 캡처 영상 또는 개발자도구 colgroup 변화 캡처**
5. **방안 1, 2 적용 후에도 동일 현상 재현 여부**

코드 예시는 일반적인 설정 가이드 기반의 참고용이므로 실제 동작 확인 후 적용 부탁드립니다.

---

## 출처

| # | 데이터 유형 | 출처 | 세부 항목 | 유사도 |
|---|---|---|---|---|
| 1 | W-Tech QNA | 그리드뷰 rowNumVisible 가로스크롤 문의 | `fixedColumn` 명시 확인 안내 | 0.8103 |
| 2 | W-Tech QNA | rownum/rowstatus fixed 컬럼 처리 | rowNum/rowStatus는 무조건 fixed 영역 | 0.8636 |
| 3 | API 가이드 (AI) | `keepDefaultColumnWidth` 속성 | autoFit 시 rowNum/rowStatus 너비 고정 | 0.9008 |
| 4 | W-Tech QNA | `rowNumWidth` autoFit 미적용 안내 | `keepDefaultColumnWidth="true"` 적용 권장 | 0.8523 |
| 5 | Gmail 기술문의 | drawType 안내 (농협은행 자금세탁방지) | virtual vs native 렌더링 방식 차이 | 0.8737 |
| 6 | API 가이드 (AI) | `setFixedColumn(fixedColumnNum)` | 세로 틀고정 동적 해제 | 0.8657 |
| 7 | API 가이드 (AI) | `setRowNumColumnWidth(size)` | rowNum 컬럼 너비 동적 변경 | 0.7879 |

※ 본 답변은 AI가 기존 기술지원 사례를 기반으로 생성한 답변입니다.
감사합니다.
