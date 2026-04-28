# 그리드 높이조절 관련 문의 (위로 증가 / TABLE 사이즈 고정)

- **문의일시**: 2026-04-23
- **분류**: GridView > 레이아웃/사이즈
- **답변 근거**: 일반 기술 지식 + RAG 일부 참고 (문의 1·2 모두 정확히 매칭되는 내부 사례 없음)

## 문의 내용

1. 그리드에서 헤더 더블클릭 이벤트 및 `setGridHeight` 사용 시 그리드 사이즈가 **아래로** 증가하는데, 아래는 고정 상태에서 **위로** 사이즈 증가가 가능한가요?
2. TABLE 구조 안에 그리드를 담아둔 상태에서 datalist가 여러 건 추가됐을 때 그리드 mouseover 이벤트 및 `setGridHeight` 셋팅 시 **TABLE 사이즈도 같이 늘어**나는데, TABLE 사이즈는 늘어나지 않고 그리드만 아래로 늘어진 것처럼 사이즈 증가가 가능한가요?

## 답변

안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

※ 내부 데이터 기준 두 문의 모두 동일 시나리오의 명시 사례가 없어, WebSquare 공식 동작과 일반적인 레이아웃 기술 기반으로 안내드립니다. 정확한 적용은 실제 화면 구조 확인이 필요합니다.

## 1. 문의 1 — 그리드를 "위로" 증가시키는 방법

### (1) 기본 동작

WebSquare gridView의 `setGridHeight(height)`는 **그리드 컴포넌트 자체의 height만 변경**합니다. 화면에서 시각적으로 "아래로 늘어나는 것처럼" 보이는 이유는 일반적인 블록 레이아웃에서 컴포넌트의 좌상단(top-left)이 기준점이기 때문이며, gridView 자체에 "위 방향으로 확장"하는 옵션은 제공되지 않습니다.

### (2) 해결 방안 — 컨테이너 CSS로 기준점을 하단으로 변경

그리드를 감싸는 wrapper의 위치를 **하단 고정**으로 만들면, gridView height가 늘어날 때 시각적으로 위로 확장됩니다.

#### 방안 A) wrapper에 `position:absolute; bottom:0;` 적용

```xml
<xf:group id="gridWrap" style="position:relative; width:100%; height:600px;">
    <xf:group id="gridInner" style="position:absolute; left:0; right:0; bottom:0;">
        <w2:gridView id="gridView1" style="width:100%;" ... />
    </xf:group>
</xf:group>
```

```javascript
// 헤더 더블클릭 시 그리드 높이 증가 → 시각적으로 위로 확장됨
scwin.gridView1_onheaderdblclick = function (headerId) {
    var newHeight = gridView1.getHeight() + 100;  // 예: 100px씩 증가
    gridView1.setGridHeight(newHeight);
};
```

> ※ 위 코드는 일반적인 CSS 레이아웃 기술 기반 참고용입니다. 실제 화면의 wrapper 구조에 맞게 조정 후 동작 확인이 필요합니다.

#### 방안 B) `display:flex; flex-direction:column-reverse;` 적용

flex 컨테이너를 column-reverse로 하면 자식이 하단부터 쌓이므로 그리드가 늘어날 때 위로 확장됩니다.

```xml
<xf:group style="display:flex; flex-direction:column-reverse; height:600px;">
    <w2:gridView id="gridView1" style="width:100%;" ... />
</xf:group>
```

### (3) 주의 사항

- `position:absolute` 사용 시 wrapper에 반드시 `position:relative`와 `height` 지정 필요
- gridView의 `drawType="virtual"`(기본) 환경에서는 height 변경 직후 가상 렌더링 재계산이 필요합니다. 깜빡임이 보이면 `setGridHeight` 호출 후 `refreshAllSizing()`을 추가로 호출해 보세요.

## 2. 문의 2 — TABLE 안에 그리드 + datalist 증가 시 TABLE 사이즈 고정

### (1) 원인

`<table>`은 표준 HTML 레이아웃 특성상 **자식 콘텐츠의 크기에 맞춰 자동으로 확장**됩니다. gridView가 TABLE의 `<td>` 내부에 있으면, 그리드 height가 커질 때 셀 height가 커지고 결과적으로 TABLE 전체가 늘어납니다. WebSquare gridView에는 "부모 사이즈에 영향 주지 않기" 옵션이 별도로 제공되지 않으므로, **레이아웃 구조 자체로 해결**해야 합니다.

### (2) 해결 방안

#### 방안 A) (가장 권장) TABLE 셀 height 고정 + 그리드 영역에 overflow 처리

TABLE 셀의 height를 고정하고 내부 그리드 wrapper에 스크롤을 두는 방식입니다.

```xml
<table style="width:100%; table-layout:fixed;">
    <tr>
        <td style="height:300px; vertical-align:top;">  <!-- 셀 height 고정 -->
            <xf:group style="position:relative; width:100%; height:100%; overflow:hidden;">
                <w2:gridView id="gridView1" style="width:100%; height:100%;" ... />
            </xf:group>
        </td>
    </tr>
</table>
```

이 구조에서는 `setGridHeight`로 그리드 높이를 키워도 wrapper의 `overflow:hidden`이 잘라내고, TABLE 자체는 늘어나지 않습니다. 그리드 안쪽에서 자체 스크롤로 데이터를 처리하시면 됩니다.

#### 방안 B) 그리드를 TABLE 위에 absolute 배치

TABLE 구조는 그대로 두고, gridView만 별도 레이어로 띄워 TABLE 레이아웃에 영향을 주지 않게 합니다.

```xml
<div style="position:relative;">
    <table style="width:100%;"> ... </table>
    <xf:group style="position:absolute; top:50px; left:0; width:100%;">
        <w2:gridView id="gridView1" style="width:100%;" ... />
    </xf:group>
</div>
```

#### 방안 C) (장기) TABLE → div 레이아웃 전환

장기적으로는 화면을 `<table>` 기반에서 `<xf:group>`/`<div>` 기반의 flex/grid 레이아웃으로 변경하시는 것이 가장 안정적입니다. WebSquare 표준 컴포넌트들은 div 기반 레이아웃에서 사이즈 제어가 더 명확하게 동작합니다.

### (3) `visibleRowNum` + `initFixedHeightByRowNum` 보조 활용

데이터 건수에 따라 그리드가 의도치 않게 늘어나는 현상이 함께 발생하면, 아래 속성으로 초기 높이를 고정해 두는 것도 도움이 됩니다.

```xml
<w2:gridView id="gridView1"
             visibleRowNum="10"
             initFixedHeightByRowNum="10"
             ... />
```

> 참고: `initFixedHeightByRowNum`은 최초 렌더링 시 `visibleRowNum` 기준으로 GridView 높이를 초기화하는 속성입니다 (소계 행 수 포함).

## 3. 추가 확인 요청

위 가이드는 일반 레이아웃 기술 기반 안내이며, 실제 화면 구조에 따라 동작이 달라질 수 있습니다. 아래 정보 회신 부탁드립니다.

1. **현재 화면 XML 구조** (TABLE/그리드 영역 부분만이라도) — `<table>` 기반인지 `<xf:group>` 기반인지
2. **엔진 버전 정보** (Version 정보의 전체 문자열 — `setGridHeight` 동작이 빌드별로 차이 있을 수 있음)
3. **그리드의 `drawType`, `autoFit`, `visibleRowNum`** 설정값
4. **재현 가능한 샘플 화면** — 가능하다면 첨부

---

## 출처

| # | 데이터 유형 | 출처 | 세부 항목 | 유사도 |
|---|---|---|---|---|
| 1 | Gmail 기술문의 | gridView 헤더 더블클릭 시 컬럼 사이즈 자동 확장 | `onheaderdblclick` + `setColumnWidth` 활용 (참고) | 0.8900 |
| 2 | Confluence 기술지식DB(Inside) | 그리드 행 높이 변경 후 스크롤 정렬 문제 | `scrollRowHeight="true"` 비공개 속성 (참고) | 0.8394 |
| 3 | W-Tech QNA | 데이터 1건인데 그리드 잔상 남는 현상 | `visibleRowNum`/CSS height 충돌 사례 | 0.8230 |
| 4 | W-Tech QNA | 그리드 폭 더블클릭 자동 맞춤 가능 여부 | gridView는 폭 자동 맞춤 미지원, `setColumnWidth` 사용 | 0.8177 |
| 5 | W-Tech QNA | 소계 적용 후 스크롤 시 그리드 height 증가 | `initFixedHeightByRowNum` 적용 권장 | 0.5291 |
| 6 | W-Tech QNA | 데이터 로드 후 setStyle/setSize 미동작 | 데이터 로드 후 height 조절 시 원래 크기로 복귀 사례 | 0.5284 |

※ 본 답변은 AI가 기존 기술지원 사례를 기반으로 생성한 답변입니다. 위로 확장 / TABLE 고정 시나리오는 내부 사례에 정확히 매칭되는 케이스가 없어 일반 레이아웃 기술을 함께 안내했으니, 코드 적용 전 반드시 동작 확인 부탁드립니다.
감사합니다.
