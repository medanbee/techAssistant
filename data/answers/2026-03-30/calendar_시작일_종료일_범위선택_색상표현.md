# 캘린더에서 시작일~종료일 범위 선택 및 색상 표현

## 문의 요약
- **내용**: 하나의 달력에서 시작일~종료일을 선택하고, 해당 범위를 색상으로 표현하는 방법

---

## 답변

안녕하세요.
인스웨이브 기술지원팀 담당자 프로입니다.

캘린더에서 시작일~종료일 범위 선택 및 색상 표현과 관련하여 확인 후 답변드립니다.

### 결론

WebSquare에서 제공하는 calendar / inputCalendar 컴포넌트에는 **하나의 달력에서 시작일~종료일 범위를 선택하고 색상으로 표현하는 기능이 기본 제공되지 않습니다.**

따라서 아래와 같은 방법으로 구현하셔야 합니다.

---

### 방법 1: inputCalendar 2개 조합 (권장)

가장 일반적이고 안정적인 방법입니다. 시작일/종료일용 inputCalendar를 각각 배치하여 사용합니다.

```xml
<xf:inputCalendar id="ica_startDate" calendarValueType="yearMonthDate"
    displayFormat="yyyy-MM-dd" />
<w2:textBox>~</w2:textBox>
<xf:inputCalendar id="ica_endDate" calendarValueType="yearMonthDate"
    displayFormat="yyyy-MM-dd" />
```

> 실제 프로젝트에서는 이 방식을 UDC(사용자 정의 컴포넌트)로 만들어 기간달력으로 재사용하는 패턴이 일반적입니다.

### 방법 2: calendar 컴포넌트 + 스크립트로 범위 선택 직접 구현

하나의 calendar 컴포넌트에서 클릭 이벤트를 활용하여 시작일/종료일을 순차적으로 선택하고, CSS로 범위를 표현하는 방식입니다.

```xml
<w2:calendar id="calendar1" calendarValueType="yearMonthDate"
    calendarClass="class1" />

<w2:textBox id="tbx_startDate" label="시작일" readOnly="true" />
<w2:textBox id="tbx_endDate" label="종료일" readOnly="true" />
```

```javascript
scwin.clickCount = 0;
scwin.startDate = "";
scwin.endDate = "";

scwin.calendar1_onchange = function(info) {
    var selectedDate = calendar1.getValue();  // yyyyMMdd

    scwin.clickCount++;

    if (scwin.clickCount === 1) {
        // 첫 번째 클릭: 시작일 설정
        scwin.startDate = selectedDate;
        scwin.endDate = "";
        tbx_startDate.setValue(selectedDate);
        tbx_endDate.setValue("");
        // 이전 하이라이트 초기화
        scwin.clearHighlight();
    } else {
        // 두 번째 클릭: 종료일 설정
        scwin.endDate = selectedDate;

        // 시작일 > 종료일이면 swap
        if (scwin.startDate > scwin.endDate) {
            var temp = scwin.startDate;
            scwin.startDate = scwin.endDate;
            scwin.endDate = temp;
        }

        tbx_startDate.setValue(scwin.startDate);
        tbx_endDate.setValue(scwin.endDate);

        // 범위 색상 표현
        scwin.highlightRange(scwin.startDate, scwin.endDate);

        scwin.clickCount = 0;  // 리셋
    }
};

// 날짜 범위 하이라이트
scwin.highlightRange = function(startDate, endDate) {
    scwin.clearHighlight();

    // calendar 컴포넌트 내부 td 요소들을 탐색
    var calendarEl = document.querySelector("#calendar1");
    var tdList = calendarEl.querySelectorAll("td[data-date]");

    tdList.forEach(function(td) {
        var dateVal = td.getAttribute("data-date");  // yyyy-MM-dd 형태
        var dateComp = dateVal.replace(/-/g, "");     // yyyyMMdd로 변환

        if (dateComp >= startDate && dateComp <= endDate) {
            td.style.backgroundColor = "#d4edfa";
            td.style.color = "#0070c0";
        }
    });
};

// 하이라이트 초기화
scwin.clearHighlight = function() {
    var calendarEl = document.querySelector("#calendar1");
    var tdList = calendarEl.querySelectorAll("td[data-date]");

    tdList.forEach(function(td) {
        td.style.backgroundColor = "";
        td.style.color = "";
    });
};
```

> **주의:** calendar 컴포넌트의 내부 DOM 구조는 버전에 따라 다를 수 있습니다.
> 실제 적용 시 개발자 도구(F12)로 td 요소의 속성명(data-date 등)을 확인하신 후 코드를 조정해 주시기 바랍니다.

### 방법 3: scheduleCalendar 활용

scheduleCalendar 컴포넌트를 사용하면 시작일~종료일 기간을 일정(이벤트)으로 등록하여 색상 바(bar)로 표현할 수 있습니다. themeColumn 속성을 통해 색상을 지정 가능합니다.

다만, scheduleCalendar는 일정 관리 목적의 컴포넌트이므로 단순 기간 선택 UI와는 용도가 다른 점 참고 부탁드립니다.

---

### 요약

| 방법 | 장점 | 단점 |
|---|---|---|
| inputCalendar 2개 (UDC) | 안정적, 프로젝트 표준 패턴 | 하나의 달력이 아닌 별도 입력 |
| calendar + 스크립트 직접 구현 | 하나의 달력에서 범위 선택 가능 | DOM 의존적, 버전 변경 시 수정 필요 |
| scheduleCalendar | 기간 표현 기본 지원 | 일정 관리 목적, 입력 UI와 용도 상이 |

프로젝트 요건에 따라 적합한 방법을 선택해 주시기 바랍니다.
단순 조회 조건의 기간 선택이라면 **방법 1(inputCalendar 2개 UDC)**이 가장 안정적이며, 하나의 달력에서 반드시 구현해야 한다면 **방법 2(스크립트 직접 구현)**를 참고해 주시기 바랍니다.

감사합니다.

---

## 출처
※ 내부 데이터 기준 하나의 달력에서 범위 선택 + 색상 표현을 동시에 지원하는 기능에 대한 직접적인 사례가 없어, WebSquare 공식 문서 및 일반적인 기술 지식을 기반으로 안내드립니다. 정확한 내용은 추가 확인이 필요할 수 있습니다.
- [W-Tech QNA] 하나은행 The First 차세대 — 기간달력 UDC inputCalendar 2개 구성 사례
- [개발 가이드] calendar 컴포넌트 — 날짜 선택, disableBeforeDate/disableAfterDate 속성
- WebSquare 공식 문서 기반 일반 안내
