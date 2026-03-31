# ScheduleCalendar 특정 날짜 색변경 및 공휴일명 표시

- **문의일시**: 2026-03-31
- **분류**: 입력 컴포넌트
- **답변 근거**: 내부 데이터 기반 (RAG 유사 사례 참고)

## 문의 내용

scheduleCalendar에서 특정날짜를 색변경 및 날짜옆에 공휴일명 표시되도록

예) 3월5일 날짜 빨간색 , 창립기념일
[5    창립기념일]

간단한 샘플 부탁드립니다

## 답변

안녕하세요.
인스웨이브 기술지원팀 담당자 프로입니다.

ScheduleCalendar에서 특정 날짜 색변경 및 공휴일명 표시와 관련하여 확인 후 답변드립니다.

### 원인 분석

ScheduleCalendar에서 날짜(숫자) 자체의 색상 변경이나 날짜 옆에 공휴일명을 텍스트로 추가하는 기능은 **별도 API로 제공되지 않습니다.** 다만, 아래 두 가지 방법을 조합하여 구현이 가능합니다.

### 해결 방법

**1) 일정 색상 변경 — `themeColumn` 속성 활용**

일정의 색상은 `themeColumn`을 통해 지정할 수 있습니다. dataList에 theme 정보를 JSON 형식으로 넣으면 일정별 색상 커스터마이징이 가능합니다.

| themeColumn JSON 키 | 설명 |
|---|---|
| color | 글자색 |
| backgroundColor | 배경색 |
| borderColor | 테두리색 |
| textColor | 텍스트색 |
| rendering | 렌더링 방식 (예: "background") |

```javascript
// dataList에 공휴일 데이터 설정 예시
var holidays = [
    {
        "startColumn": "20260305",
        "endColumn": "20260305",
        "titleColumn": "창립기념일",
        "themeColumn": JSON.stringify({
            "backgroundColor": "red",
            "borderColor": "red",
            "textColor": "white"
        })
    }
];
dataList1.setJSON(holidays);
```

**2) 날짜 숫자 색상 변경 + 공휴일명 텍스트 표시 — `oneventafterallrender` 이벤트에서 DOM 조작**

날짜 숫자 자체를 빨간색으로 바꾸고, 날짜 옆에 공휴일명을 표시하려면 `oneventafterallrender` 이벤트에서 DOM을 직접 조작하는 방식으로 구현해야 합니다.

```javascript
scwin.scheduleCalendar1_oneventafterallrender = function() {
    // 공휴일 목록 정의
    var holidays = {
        "20260305": "창립기념일",
        "20260301": "삼일절",
        "20260505": "어린이날"
    };
    
    // 달력의 모든 날짜 셀을 순회
    var dayCells = document.querySelectorAll("#mf_scheduleCalendar1 .fc-day-top");
    
    dayCells.forEach(function(cell) {
        var dateStr = cell.getAttribute("data-date");
        if (!dateStr) return;
        
        var dateKey = dateStr.replace(/-/g, ""); // "2026-03-05" → "20260305"
        
        if (holidays[dateKey]) {
            // 날짜 숫자 색상 변경
            var dayNumber = cell.querySelector(".fc-day-number");
            if (dayNumber) {
                dayNumber.style.color = "red";
                dayNumber.style.fontWeight = "bold";
            }
            
            // 공휴일명 텍스트 추가
            var holidaySpan = document.createElement("span");
            holidaySpan.style.color = "red";
            holidaySpan.style.fontSize = "11px";
            holidaySpan.style.marginLeft = "4px";
            holidaySpan.textContent = holidays[dateKey];
            cell.appendChild(holidaySpan);
        }
    });
};
```

### 추가 확인 사항

- `oneventafterallrender` 이벤트는 달력이 렌더링될 때마다 호출되므로, 월 이동 시에도 자동으로 공휴일이 표시됩니다.
- 공휴일 데이터를 DB에서 관리하시는 경우, 서버에서 조회한 데이터를 위 `holidays` 객체에 매핑하여 사용하시면 됩니다.
- ScheduleCalendar는 내부적으로 fullCalendar 라이브러리를 사용하므로, DOM 셀렉터는 엔진 버전에 따라 다를 수 있습니다. 사용 중인 WebSquare AI 6.0 버전에서 개발자 도구로 실제 DOM 구조를 확인해 주시기 바랍니다.

감사합니다.

[출처: W-Tech QNA - 수협은행 BPR scheduleCalendar 동일 문의 답변 | W-Tech QNA - 대구상수도 ScheduleCalendar 휴일 표현 | W-Tech QNA - 부천대학교 themeColumn 활용 사례]
