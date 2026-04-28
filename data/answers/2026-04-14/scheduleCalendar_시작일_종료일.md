# scheduleCalendar 처음 로딩 시 달력 시작일/종료일 확인 방법

안녕하세요.
인스웨이브 기술지원팀입니다.

scheduleCalendar 컴포넌트의 처음 로딩 시 달력에 표시되는 시작일/종료일을 확인하는 방법에 대해 안내드립니다.

## 원인 분석

`setOption("dateSet", ...)` 이벤트는 이전달/다음달 버튼 클릭 시에만 발생하므로, 초기 로딩 시점에서는 해당 이벤트로 날짜 범위를 확인할 수 없습니다.

## 해결 방법

### `getView()` API 사용

`getView()` API를 사용하면 현재 달력의 view 정보를 조회할 수 있습니다. 반환값은 Moment.js 객체를 포함하며, `.format()`으로 날짜 문자열을 추출할 수 있습니다.

**반환 객체 구조:**
```javascript
{
    name: "month",
    type: "month",
    title: "2026년 4월",
    intervalStart: Moment,  // 해당 월 시작 (4/1)
    intervalEnd: Moment,    // 해당 월 끝 (5/1, exclusive)
    start: Moment,          // 달력에 실제 표시되는 시작일 (3/29)
    end: Moment             // 달력에 실제 표시되는 종료일 (5/10, exclusive)
}
```

**`intervalStart`/`intervalEnd`** — 해당 월의 범위 (4/1 ~ 5/1, Moment.js 객체)

문의하신 "달력에 보이는 시작일/종료일"(3/29 ~ 5/9)은 `intervalStart` 기준으로 계산하여 구합니다.

```javascript
scwin.onpageload = function() {
    setTimeout(function() {
        var viewInfo = scheduleCalendar1.getView();
        var monthStart = viewInfo.intervalStart;  // Moment 객체 (4월 1일)

        // 달력 표시 시작일 = 해당 월 1일이 속한 주의 일요일
        var calStart = monthStart.clone().startOf("week");
        // 달력 표시 종료일 = 시작일 + 42일(6주) - 1일
        var calEnd = calStart.clone().add(41, "days");

        console.log("달력 시작일: " + calStart.format("YYYYMMDD"));  // "20260329"
        console.log("달력 종료일: " + calEnd.format("YYYYMMDD"));    // "20260509"
    }, 100);
};
```

※ 월간 달력은 항상 6주(42일)를 표시하므로, 월 1일이 속한 주의 첫째 날(일요일)부터 42일이 보이는 범위입니다.

※ 위 코드는 유사 사례 기반 참고용입니다. 실제 동작 확인 후 적용해주세요.

### 주의사항

- `onpageload` 시점에 scheduleCalendar 렌더링이 완료되지 않을 수 있으므로 `setTimeout`으로 약간의 지연을 주거나, `oneventafterallrender` 이벤트(버전에 따라 지원 여부 다름)를 활용하시기 바랍니다.
- `end`는 FullCalendar 정책상 **exclusive**(해당일 미포함)이므로, 실제 마지막 표시일은 `end`의 전날입니다.
- 이후 이전달/다음달 버튼 클릭 시에는 기존에 사용하시던 `setOption("dateSet", ...)` 방식으로 날짜 범위를 확인하시면 됩니다.

## 출처

| # | 출처 유형 | 세부 항목 | 유사도 |
|---|----------|----------|--------|
| 1 | API 가이드 (AI) | scheduleCalendar getView() | 0.9381 |
| 2 | API 가이드 (SP4) | scheduleCalendar getView() | 0.9378 |
| 3 | W-Tech QNA | scheduleCalendar oneventafterallrender 관련 문의 | 0.9337 |
| 4 | API 가이드 (AI) | scheduleCalendar initialDate 속성 | 0.7925 |

감사합니다.
