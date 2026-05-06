# AutoComplete 안에 텍스트 크기 조절

> 작성일: 2026-04-30
> 작성: Claude (RAG 28,214건 인덱스 기반)

## 문의 내용

autoComplete 안에 텍스트 크기 어케 조절해

## 답변

안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

AutoComplete 컴포넌트의 텍스트 크기 조절과 관련하여 안내드립니다.

### 원인 분석

AutoComplete 컴포넌트는 내부적으로 **입력 input** + **드롭다운 결과 영역** 두 부분으로 구성됩니다. 각각 텍스트 크기를 별도로 제어 가능하며, **세 가지 방법**이 있습니다.

| 방식 | 시점 | 추천 상황 |
|---|---|---|
| `style` 속성 | 화면 정의 (정적) | 컴포넌트 1개에 고정 스타일 적용 |
| CSS class | 화면 정의 (정적) | 여러 컴포넌트에 공통 스타일 |
| `setStyle()` 메소드 | 스크립트 (동적) | 사용자 액션/조건에 따라 변경 |

### 해결 방법

#### 1. 정적 — style 속성

```xml
<xf:input id="acTest" type="autoComplete"
          style="font-size:14px;"
          ... />
```

#### 2. 정적 — CSS class

```css
.large-autocomplete input,
.large-autocomplete .w2autocomplete-result {
  font-size: 16px;
}
```

```xml
<xf:input id="acTest" type="autoComplete" class="large-autocomplete" ... />
```

#### 3. 동적 — `setStyle()` 메소드

```javascript
var ac = WebSquare.getComponentById("acTest");
ac.setStyle("fontSize", "14px");
```

원래 스타일로 되돌리려면 `setInitStyle()`:
```javascript
ac.setInitStyle("fontSize");
```

> ※ 위 코드는 유사 사례 기반 참고용입니다. 실제 동작 확인 후 적용해주세요.

### 추가 확인 사항

- 입력 input만 변경할지, 드롭다운 결과 텍스트도 변경할지
- 사용 중인 WebSquare 버전 (SP4/SP5/AI 등)
- 동적 변경 필요 여부 (조건/이벤트에 따라 변경?)

감사합니다.

## 참고 자료

| 사례 | 매칭도 | 출처 | URL |
|---|---:|---|---|
| `WebSquare.uiplugin.autoComplete setStyle(property, value)` | 91% | API 가이드 (AI) | https://docs.inswave.com/support/api/ws5_ai/6.0_0.1550R.20260417.145224/index.html |
| `WebSquare.uiplugin.autoComplete setStyle(propertyName, value)` | 91% | API 가이드 (SP4) | https://docs.inswave.com/websquare/websquare.html?w2xPath=/support/api/ws5_sp4/api.xml |
| `WebSquare.uiplugin.autoComplete setInitStyle(property)` | 91% | API 가이드 (SP4) | (동일) |
| AutoComplete | 88% | Confluence PA | https://inswave01.atlassian.net/wiki/spaces/PA/pages/1245417 |

## 메타

- LLM: Claude (manual, RAG 검색 + 직접 작성)
- 사용 API (RAG 검증됨): `setStyle`, `setInitStyle`
- 검증되지 않은 코드: CSS 셀렉터 `.w2autocomplete-result` (실제 클래스명 확인 필요)
