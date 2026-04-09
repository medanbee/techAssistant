## Slider 컴포넌트 양쪽 끝 핸들(Range Slider) 사용 가능 여부

안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

Slider 컴포넌트의 양쪽 핸들(Range Slider) 기능과 관련하여 확인 후 답변드립니다.

---

※ 내부 데이터 기준 확인된 사례가 없어, WebSquare 공식 문서 및 일반적인 기술 지식을 기반으로 안내드립니다. 정확한 내용은 추가 확인이 필요할 수 있습니다.

---

### 1. 현재 상황

WebSquare의 Slider 컴포넌트(`w2:slider`)는 **단일 핸들 방식**으로, 하나의 꼭지점을 좌우(또는 상하)로 드래그하여 값을 선택하는 구조입니다.

현재 제공되는 Slider 속성은 다음과 같습니다:

| 속성 | 설명 |
|------|------|
| `minValue` | 최소값 |
| `maxValue` | 최대값 |
| `value` | 초기값 (단일 값) |
| `increment` | 증가 단위 |
| `vertical` | 세로 방향 여부 |
| `setBackground` | 드래그 범위 배경색 채움 |
| `tooltipDisplay` | 값 툴팁 표시 |

`value` 속성이 단일 값만 받기 때문에, **양쪽 끝에서 각각 독립적으로 드래그하는 Range Slider 기능은 기본 제공되지 않습니다.**

### 2. 참고: HTML5에도 네이티브 Range Slider는 없음

HTML5의 `<input type="range">`도 단일 핸들만 지원하므로, 양쪽 핸들 Range Slider는 웹 표준에서도 기본 제공되지 않습니다. 일반적으로 외부 라이브러리를 사용하여 구현합니다.

### 3. 대안

#### 방법 1: 외부 라이브러리 활용 (권장)

WebSquare 화면 내에서 외부 Range Slider 라이브러리를 로드하여 사용하는 방법입니다.

**noUiSlider** (순수 JavaScript, 의존성 없음, 가장 널리 사용)
- 공식 사이트: https://refreshless.com/nouislider/
- CDN으로 로드 후 `w2:html` 컴포넌트 내에서 사용

```xml
<!-- WebSquare 화면에서 외부 JS/CSS 로드 -->
<w2:html id="rangeSliderArea" style="width:400px; height:60px; padding:20px;">
    <div id="rangeSlider"></div>
</w2:html>
```

```javascript
scwin.onpageload = function() {
    // noUiSlider 초기화
    var slider = document.getElementById('rangeSlider');
    noUiSlider.create(slider, {
        start: [20, 80],       // 양쪽 핸들 초기값
        connect: true,          // 핸들 사이 영역 채움
        range: {
            'min': 0,
            'max': 100
        },
        step: 1
    });

    // 값 변경 이벤트
    slider.noUiSlider.on('change', function(values) {
        var minVal = parseInt(values[0]);
        var maxVal = parseInt(values[1]);
        console.log('범위: ' + minVal + ' ~ ' + maxVal);
    });
};
```

**기타 라이브러리:**
- **jQuery UI Slider** — `range: true` 옵션으로 양쪽 핸들 바로 지원 (jQuery 필요)
- **ion.rangeSlider** — jQuery 플러그인, 다양한 스타일 지원

### 4. 첨부 샘플 파일

순수 HTML/CSS/JS 방식의 샘플 파일을 첨부드리니 참고 부탁드립니다.

| 파일 | 설명 |
|------|------|
| `slider-range-sample.xml` | `w2:html` 내에 `input[type=range]` 2개로 구현. 외부 라이브러리 불필요. |

- 두 핸들 사이 구간이 색칠되어 선택 범위를 시각적으로 확인 가능
- 값 교차 방지 로직 포함
- min/max/increment 등 값 조정은 스크립트 내에서 변경 가능

### 5. 추가 확인 요청

- 사용 중인 **WebSquare 엔진 버전**을 알려주시면, 해당 버전에 맞는 CSS 클래스명 확인 및 Range Slider 관련 신규 기능 추가 여부를 확인해 드리겠습니다.
- 구체적인 사용 화면(예: 가격 범위 필터, 날짜 범위 선택 등)을 알려주시면 최적의 구현 방안을 안내드리겠습니다.
- 프로젝트에서 **외부 라이브러리 사용이 가능한지** 확인 부탁드립니다.

감사합니다.

---

### 출처

| # | 출처 유형 | 출처 위치 | 세부 항목 | 유사도 |
|---|-----------|-----------|-----------|--------|
| 1 | WRE 가이드 | WebSquare WRE 가이드 | 31.Slider 소개 및 주요 용도 | 0.9162 |
| 2 | 컴포넌트 가이드 | WebSquare 컴포넌트 가이드 | 36.Slider 개요 및 주요 API | 0.9153 |
| 3 | Confluence UXDB | UXDB | 56.Slider 속성 목록 | 0.7892 |
| 4 | WebSquare 공식 문서 기반 일반 안내 | - | Range Slider 미지원 확인 | - |
