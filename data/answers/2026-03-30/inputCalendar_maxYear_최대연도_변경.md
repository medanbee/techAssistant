# inputCalendar maxYear 최대 연도 변경 방법

## 문의 요약
- **내용**: inputCalendar에서 연도가 최대 2025로만 설정되어 있는데 수정하는 방법

---

## 답변

안녕하세요.
인스웨이브 기술지원팀 담당자 프로입니다.

inputCalendar의 최대 연도(maxYear) 설정 변경과 관련하여 확인 후 답변드립니다.

### 설정 방법 (2가지)

#### 방법 1: config.xml (또는 config.js) 전역 설정 — 프로젝트 전체 적용

config.xml 파일에서 `<inputCalendar>` 태그 안에 maxYear 속성을 추가/수정합니다.

**config.xml 방식:**
```xml
<inputCalendar>
    <minYear value="1900"/>
    <maxYear value="2040"/>
</inputCalendar>
```

**config.js 방식:**
```json
"inputCalendar": {
    "minYear": { "@value": "1900" },
    "maxYear": { "@value": "2040" }
}
```

#### 방법 2: 개별 컴포넌트에 속성 직접 설정 — 특정 화면만 적용

Source 탭에서 해당 inputCalendar 컴포넌트에 maxYear 속성을 직접 추가합니다.

```xml
<xf:inputCalendar id="inputCalendar1" maxYear="2040" minYear="1900"
    calendarValueType="yearMonthDate" />
```

> **우선순위:** 개별 컴포넌트에 설정한 maxYear가 config.xml의 전역 설정보다 우선합니다.

### 변경 후에도 적용이 안 되는 경우 확인사항

1. **브라우저 캐시 삭제** 후 재확인 (Ctrl + Shift + Delete)
2. **개발자 도구(F12) → 네트워크 탭**에서 config.xml(또는 config.js)이 정상적으로 호출되는지 확인
3. 호출된 config 파일에 **maxYear 값이 실제로 변경**되어 있는지 확인 (다른 경로의 config 파일을 불러오고 있지는 않은지)
4. 개별 컴포넌트에 별도로 maxYear가 설정되어 있으면 config 전역 설정이 무시되므로, **컴포넌트 속성도 함께 확인**

감사합니다.

---

## 출처
- [Gmail 기술문의] 신한DS 감사시스템 — inputCalendar 최대/최소 연도 설정 방법 답변
- [W-Tech QNA] 근로복지공단 직장보육시스템 — config.xml maxYear 변경 후 미적용 현상 답변
