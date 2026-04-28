안녕하세요.
인스웨이브 기술지원팀입니다.

fusionChart의 chartType에 `waterfall2d` 적용 가능 여부 관련하여 확인 후 답변드립니다.

## 원인 분석

WebSquare의 `fusionChart` 컴포넌트는 FusionCharts JavaScript 라이브러리를 감싸고 있는 Wrapper 컴포넌트입니다.
WebSquare 디자이너 속성 패널의 `chartType` 드롭다운 목록에는 **대표적으로 사용하는 차트(Column2D/Bar2D/Pie2D/Line/Area/Scroll/Combination 등)만 노출** 되어 있을 뿐, FusionCharts 라이브러리에서 제공하는 모든 차트가 옵션으로 노출되어 있지는 않습니다.

따라서 목록에 보이지 않는 차트라 하더라도, 사용 중인 FusionCharts 라이브러리 버전이 해당 차트를 지원한다면 chartType 속성에 **직접 문자열로 지정**하여 사용이 가능합니다. (실제로 ScrollArea2D 등도 같은 방식으로 사용 중입니다.)

## 해결 방법

### 1) chartType 속성에 직접 지정 (가장 단순)
디자이너 드롭다운에서 선택할 수 없으므로, **XML 소스 또는 속성 패널에 직접 문자열을 입력**해 주세요.

```xml
<w2:fusionChart id="fusionchart1"
                chartType="waterfall2d"
                ref="dataList1"
                labelNode="label"
                seriesType="simple"
                style="width:600px;height:400px;" />
```

### 2) 동적으로 chartType 변경 시 (changeType API)
페이지 로드 후 코드로 차트 타입을 변경하는 경우 `changeType()` API를 사용합니다. (FusionCharts 3.11 이상에서 지원)
```javascript
fusionchart1.changeType("waterfall2d", {
    ref: "dataList1",
    labelNode: "label",
    seriesColumns: "value"
});
```

### 3) 단순 chartType 변경만으로 렌더링 안 되는 경우 (Scroll/Waterfall 류)
ScrollArea2D 등 일부 chartType은 데이터 바인딩 구조가 일반 차트와 달라서 chartType 지정만으로 그려지지 않고, `setChartColumnRef()` + `draw()` 조합이 필요합니다. waterfall2d도 동일 패턴으로 시도해 보시는 것을 권장드립니다.
```javascript
// 데이터 바인딩 정보 설정 후 강제 draw
fusionchart1.setChartColumnRef({
    ref: "dataList1",
    labelNode: "label",
    seriesColumns: "value"
});
fusionchart1.draw();
```
※ 위 코드는 RAG 내 ScrollArea2D 구현 샘플(Confluence DB) 패턴을 waterfall2d에 맞게 응용한 참고용 예시입니다. 실제 동작 확인 후 적용 부탁드립니다.

## 추가 확인 사항

waterfall2d 차트는 FusionCharts 기본 패키지(FusionCharts XT)가 아닌 **PowerCharts XT 패키지에 포함되어 있는 차트** 입니다. 따라서 정상 적용을 위해서는 아래 두 가지 조건이 함께 충족되어야 합니다.

1. **라이브러리 파일 포함 여부** — `fusioncharts.powercharts.js` 등 PowerCharts 관련 JS 파일이 프로젝트의 fusionCharts 라이브러리 폴더에 포함되어 있는지 확인 필요
2. **라이선스 보유 여부** — FusionCharts Suite XT 또는 PowerCharts XT 라이선스 보유 시 정상 사용 가능 (라이선스 미보유 시 워터마크 표시)

이 두 부분은 프로젝트 환경/라이선스 정책에 따라 결정되므로, 라이브러리 패키지에 PowerCharts JS가 포함되어 있는지 먼저 확인하신 후 위 방법을 적용해 보시기 바랍니다.

또한 답변 정확도를 높이기 위해 아래 정보 추가로 공유해 주시면 도움이 됩니다.
- WebSquare 엔진 버전 (디버그 메뉴 → Version 정보)
- 현재 사용 중인 FusionCharts 라이브러리 버전 (보통 `com/inswave/elfw/fusioncharts/` 또는 `componentList/fusioncharts/` 경로의 js 파일에서 확인)

## 게시판 첨부파일 등록 불가 건

별도 안내 — 게시글 등록 시 첨부파일을 추가하면 등록이 안 되는 증상은 W-Tech QNA 게시판의 첨부 처리(파일 크기/확장자/네트워크 프록시) 이슈일 가능성이 있습니다. 샘플 파일은 메일(인스웨이브 기술지원팀)로 보내주셔도 동일하게 검토 가능하니 그 경로로도 부탁드립니다.

## 출처

| # | 자료 | 항목 | 유사도 |
|---|---|---|---|
| 1 | 개발 가이드 (SP4) | 17.Chart — FusionChart 개요 및 지원 차트 종류 | 0.880 |
| 2 | 컴포넌트 가이드 | 54.FusionChart — Wrapper 컴포넌트 정의, FusionCharts 공식 docs 참고 안내 | 0.882 |
| 3 | API 가이드 | `WebSquare.uiplugin.fusionchart.changeType(chartType, chartColumnRef)` (3.11 이상 지원) | 0.891 |
| 4 | API 가이드 | `WebSquare.uiplugin.fusionchart.chartType` 속성 (OverlappedColumn2D/Bar2D는 3.13 이상) | 0.884 |
| 5 | Confluence DB | ScrollArea2D 구현 샘플 — chartType 만으로 안 되는 차트는 setChartColumnRef + draw() 패턴 | 0.876 |
| 6 | W-Tech QNA | ScrollArea2D 샘플 요청 사례 (FusionCharts 공식 docs 링크 안내) | 0.876 |

---

## 후속 안내 — `fusioncharts.powercharts.js` 위치/획득

### WebSquare 기본 패키지에는 미포함
WebSquare 엔진 기본 패키지는 FusionCharts XT(기본 차트군)만 포함하며, PowerCharts XT(waterfall2d / heatmap / treemap 등)에 해당하는 `fusioncharts.powercharts.js`는 기본 라이브러리에 포함되지 않습니다.
> "웹스퀘어에서 지원하는 FusionCharts는 순수한 FusionCharts만 지원하고 PowerCharts에 속하는 Heat & Tree Maps... 는 미포함"
> — RAG 내 LX PANTOS QMS 트리맵 차트 문의 답변 사례

### 확인해야 할 위치 (이미 포함되어 있는지 점검)
| 후보 경로 | 설명 |
|---|---|
| `websquare/_websquare_/uiplugin/chart/` | WebSquare 엔진 내장 차트 라이브러리 위치 |
| `websquare/externalJS/fusioncharts/` | 외부 차트 라이브러리 관행적 배치 위치 (Highcharts 등도 동일 패턴) |
| `componentList/fusioncharts/` | 일부 프로젝트의 컴포넌트 라이브러리 폴더 |

`fusioncharts*.js`로 파일 검색 시 `fusioncharts.charts.js` 등은 있는데 `fusioncharts.powercharts.js`가 없다면 미포함 상태입니다.

### 획득 방법
FusionCharts 외부 라이브러리이므로 인스웨이브가 별도 배포하지 않습니다. 공식 채널에서 직접 다운로드하셔야 합니다.
1. 공식 사이트 — `https://www.fusioncharts.com/download/fusioncharts-suite-xt`
   Suite XT 다운로드 시 PowerCharts XT 포함, 압축 해제 후 `js/fusioncharts.powercharts.js` 파일 확인 가능
2. npm 패키지 — `https://www.npmjs.com/package/fusioncharts`
   (FusionCharts 3.19 이상은 2023년 5월 이후 릴리즈 엔진 필요 — 호환성 확인 필요)

다운로드 후 위에서 확인한 fusioncharts 라이브러리 폴더에 `fusioncharts.powercharts.js`를 추가하시고, config.xml의 import 목록 또는 화면 script에 import를 추가해 주시면 됩니다.

### 라이선스 주의
PowerCharts XT는 별도 유료 라이선스 제품입니다. 미보유 상태로 사용하면 차트에 "FusionCharts XT Trial" 워터마크가 표시됩니다. 운영 적용 전 사내 구매/관리 부서에 라이선스 보유 여부 확인 부탁드립니다.

### 후속 안내 출처

| # | 자료 | 항목 | 유사도 |
|---|---|---|---|
| 7 | W-Tech QNA (LX PANTOS) | WebSquare 기본 FusionCharts는 순수 FusionCharts만 지원, PowerCharts 미포함 | 0.877 |
| 8 | W-Tech QNA (SKT NOVA) | FusionCharts 외부 라이브러리, npm 다운로드 안내, 3.19 이상 호환 엔진 안내 | 0.866 |
| 9 | Confluence 기술지식DB | Highcharts 라이브러리 추가 사례 — `websquare/externalJS/` 하위 배치, import 방법 | 0.866 |
| 10 | Confluence DB | 엔진 삭제 가능 폴더 목록 — `uiplugin/chart` 폴더 (차트 라이브러리 위치 단서) | 0.866 |

감사합니다.
