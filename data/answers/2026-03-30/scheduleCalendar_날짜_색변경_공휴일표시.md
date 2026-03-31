# scheduleCalendar 날짜 색변경 및 공휴일명 표시

## 문의 요약
- **등록일**: 2026.03.26 09:17:34
- **프로젝트**: 수협은행 BPR 시스템 (Bpr관리)
- **버전**: AI 버전
- **내용**: scheduleCalendar에서 특정 날짜를 색변경 및 날짜 옆에 공휴일명 표시 (예: 3월5일 빨간색, "5 창립기념일")

---

## 답변

안녕하세요.
인스웨이브 기술지원팀 담당자 프로입니다.

scheduleCalendar에서 특정 날짜의 색 변경 및 공휴일명 표시와 관련하여 확인 후 답변드립니다.

두 가지 방법을 조합하여 구현하실 수 있습니다.

---

### 1. 특정 요일 색상 변경 — `setDayNameStyle` API 활용

특정 요일의 날짜 숫자 색상 및 배경색을 변경할 때는 `setDayNameStyle` API를 사용합니다.

```javascript
// 예시: 일요일 날짜 숫자를 빨간색으로 변경
var options = {
    sun : {
        header : {
            "color" : "#ff0000"
        },
        body : {
            background : { "background-color" : "#ff0000", "opacity" : "0.2" },
            num : { "color" : "#ff0000" }
        }
    }
};
scheduleCalendar1.setDayNameStyle(options);
```

### 2. 특정 날짜(공휴일) 개별 색상 변경 + 공휴일명 표시 — `themeColumn` + `rendering: "background"` 활용

공휴일처럼 **특정 날짜를 지정**하여 색상을 변경하고 공휴일명을 표시하려면, DataList에 공휴일 일정을 등록하고 `themeColumn`을 활용합니다.

**XML 설정:**
```xml
<w2:scheduleCalendar id="scheduleCalendar1"
    defaultView="month"
    weekends="true"
    style="width:100%; height:600px;">
</w2:scheduleCalendar>

<w2:dataList id="dataList1">
    <w2:column id="title" dataType="text"></w2:column>
    <w2:column id="start" dataType="text"></w2:column>
    <w2:column id="end" dataType="text"></w2:column>
    <w2:column id="themeColumn" dataType="text"></w2:column>
</w2:dataList>
```

**Script (onpageload 등에서 호출):**
```javascript
scwin.onpageload = function() {
    // 공휴일 데이터 세팅
    var holidays = [
        {
            title: "창립기념일",
            start: "2026-03-05",
            end: "2026-03-05",
            themeColumn: '{ "rendering":"background", "backgroundColor":"#ffcccc", "textColor":"#ff0000" }'
        },
        {
            title: "삼일절",
            start: "2026-03-01",
            end: "2026-03-01",
            themeColumn: '{ "rendering":"background", "backgroundColor":"#ffcccc", "textColor":"#ff0000" }'
        }
    ];

    for (var i = 0; i < holidays.length; i++) {
        var idx = dataList1.insertRow();
        dataList1.setCellData(idx, "title", holidays[i].title);
        dataList1.setCellData(idx, "start", holidays[i].start);
        dataList1.setCellData(idx, "end", holidays[i].end);
        dataList1.setCellData(idx, "themeColumn", holidays[i].themeColumn);
    }

    // 일요일 날짜 색상 빨간색 지정
    var dayStyle = {
        sun : {
            header : { "color" : "#ff0000" },
            body : {
                num : { "color" : "#ff0000" }
            }
        }
    };
    scheduleCalendar1.setDayNameStyle(dayStyle);
};
```

### 3. 날짜 셀에 직접 텍스트 추가 (CSS + dayCellDidMount 활용)

AI 버전(6.0)은 FullCalendar v5 기반이므로 `dayCellDidMount` 훅을 활용하여 날짜 셀에 공휴일명을 직접 렌더링할 수 있습니다.

```javascript
scwin.onpageload = function() {
    // 공휴일 목록 정의
    var holidayMap = {
        "2026-03-01": "삼일절",
        "2026-03-05": "창립기념일",
        "2026-05-05": "어린이날"
    };

    // FullCalendar dayCellDidMount 옵션 설정
    var calendarEl = document.querySelector("#scheduleCalendar1 .fc");
    if (calendarEl && calendarEl._calendar) {
        calendarEl._calendar.setOption("dayCellDidMount", function(info) {
            var dateStr = info.date.toISOString().slice(0, 10);
            if (holidayMap[dateStr]) {
                // 날짜 숫자 색상 변경
                var numEl = info.el.querySelector(".fc-daygrid-day-number");
                if (numEl) {
                    numEl.style.color = "#ff0000";
                }
                // 공휴일명 텍스트 추가
                var topEl = info.el.querySelector(".fc-daygrid-day-top");
                if (topEl) {
                    var holidaySpan = document.createElement("span");
                    holidaySpan.style.cssText = "color:#ff0000; font-size:11px; margin-left:4px;";
                    holidaySpan.textContent = holidayMap[dateStr];
                    topEl.appendChild(holidaySpan);
                }
            }
        });
        calendarEl._calendar.render();
    }
};
```

> **참고:** `dayCellDidMount`를 통한 직접 DOM 조작은 FullCalendar 내부 구조에 의존하므로, 엔진 업데이트 시 동작이 달라질 수 있습니다. 안정적인 방법은 **방법 2(themeColumn + 일정 등록)**를 우선 적용하시고, 날짜 옆 텍스트 표시가 반드시 필요한 경우 방법 3을 보조로 사용하시는 것을 권장드립니다.

감사합니다.

---

## 출처
- [Gmail 기술문의] 국회 차세대 인사 프로젝트 — 주말/공휴일 색깔 변경 답변
- [W-Tech QNA] 소방장비구축프로젝트 — setDayNameStyle + themeColumn 샘플 답변
- [W-Tech QNA] KBS아트비전 — themeColumn 데이터별 색상 지정 답변
- [W-Tech QNA] 농협GA포탈 — scheduleCalendar_day_color.xml 샘플 답변
