안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

WebSquare span 컴포넌트에서 onmouseover 이벤트를 활용한 툴팁 동적 제어 방법에 대해 확인 후 답변드립니다.

---

## 1. 현상 분석

WebSquare의 span 컴포넌트는 `tooltip` 속성을 통해 정적 툴팁 표시를 지원하지만, 표시 시간이나 조건 등의 세밀한 제어(예: 2초 이상 호버 시 표시)는 기본 tooltip 속성만으로는 어렵습니다.

또한 span 컴포넌트는 `tooltipDisplay` 지원 컴포넌트 목록에 포함되어 있지 않으며, `setTooltip` API도 지원하지 않습니다.

다만 span 컴포넌트는 `onmouseover(e)`, `onmouseout(e)` 이벤트를 공식 지원하므로, 별도 레이어(Group)와 함께 사용하여 커스텀 툴팁을 구현할 수 있습니다.

## 2. 해결 방법: 별도 레이어(Group) + onmouseover + setStyle

호버 대상 span과 툴팁 레이어를 분리하고, 웹스퀘어 공통 API인 `setStyle`로 툴팁 레이어의 표시/숨김 및 위치를 제어합니다.

### XML 소스

```xml
<body ev:onpageload="scwin.onpageload">
    <!-- 호버 대상 span -->
    <w2:span id="span1" label="마우스를 올려보세요"
        ev:onmouseover="scwin.span1_onmouseover"
        ev:onmouseout="scwin.span1_onmouseout" />

    <!-- 툴팁 레이어 (초기 숨김) -->
    <xf:group id="tooltipLayer"
        style="display:none; position:absolute; background-color:#333; color:#fff;
               padding:5px 10px; border-radius:4px; font-size:12px; z-index:9999;">
        <w2:span id="tooltipText" />
    </xf:group>
</body>
```

### 스크립트

```javascript
var hoverTimer = null;

scwin.span1_onmouseover = function (e) {
    var x = e.clientX;
    var y = e.clientY;

    hoverTimer = setTimeout(function() {
        tooltipText.setValue("표시할 툴팁 내용");
        tooltipLayer.setStyle("left", (x + 10) + "px");
        tooltipLayer.setStyle("top", (y + 10) + "px");
        tooltipLayer.setStyle("display", "block");
    }, 2000);
};

scwin.span1_onmouseout = function (e) {
    if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
    }
    tooltipLayer.setStyle("display", "none");
};
```

## 3. 주요 포인트

- **`setStyle(property, value)`** — 웹스퀘어 컴포넌트 공통 API로, DOM 직접 접근 없이 CSS 속성을 제어합니다.
- **`e.clientX`, `e.clientY`를 setTimeout 밖에서 변수에 저장** — 이벤트 객체는 비동기 콜백 실행 시점에 소멸/재활용될 수 있으므로, 좌표를 미리 저장해야 합니다.
- **호버 대상 span과 툴팁 레이어는 반드시 분리** — 툴팁 레이어(display:none) 안에 호버 대상을 넣으면 화면에 보이지 않습니다.

## 4. 참고 사항

- span 컴포넌트는 `onmouseover(e)`, `onmouseout(e)` 이벤트를 공식 지원합니다.
- span은 `setTooltip` API를 지원하지 않으므로, 별도 레이어(Group) 방식이 유일한 해결 방법입니다.
- 툴팁 내용을 동적으로 변경하려면 `tooltipText.setValue("변경할 내용")`으로 제어합니다.

---

### 출처

| # | 데이터 유형 | 출처 | 내용 | 유사도 |
|---|-------------|------|------|--------|
| 1 | API 가이드 | WebSquare API | span.onmouseover(e) 이벤트 | 0.9315 |
| 2 | API 가이드 | WebSquare API | span.onmouseout(e) 이벤트 | 0.5240 |
| 3 | API 가이드 | WebSquare API | group.setStyle(property, value) — 컴포넌트 공통 CSS 제어 API | 0.9195 |
| 4 | W-Tech QNA | W-Tech 게시판 | 별도 레이어 + onmouseover로 조건부 툴팁 구현 방법 | 0.8283 |
| 5 | 개발 가이드 | WebSquare 가이드 | 툴팁 지원 컴포넌트 목록 및 tooltip vs title 설명 | 0.8771 |

감사합니다.
