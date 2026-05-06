# AutoComplete - 목록에 없는 값으로 setValue 가능하게 하기

> 작성일: 2026-04-30
> 답변: Claude (RAG 28,214건 인덱스 기반)

## 문의 내용

오토컴플릿에서 그 가지고 있는 value에 없는 값으로 setValue 못하는건가

## 답변

안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

AutoComplete가 가진 데이터 목록에 없는 값을 `setValue`로 설정하지 못하는 문제, **`valueNotInList` 속성**으로 해결할 수 있습니다.

### 원인 분석

AutoComplete는 기본적으로 `valueNotInList="false"` (목록에 없는 값 거부)로 동작합니다. 그래서 `setValue("목록에없는값")` 호출하면 무시되거나 빈 값으로 처리됩니다.

### 해결 방법

#### 1. XML에서 속성 지정 (권장)

```xml
<xf:input id="acTest" type="autoComplete"
          valueNotInList="true"
          ... />
```

`valueNotInList="true"` 로 설정하면 목록에 없는 값도 `setValue()`로 넣을 수 있습니다.

#### 2. 동적 변경

```javascript
var ac = WebSquare.getComponentById("acTest");
ac.setValueNotInList(true);
ac.setValue("목록에 없는 임의의 값");
```

> ※ `setValueNotInList()` 메소드는 RAG에서 직접 매칭이 약합니다. 동작 안 하면 XML 속성으로 미리 지정하세요.

### 관련 속성 (RAG 검증)

같은 패턴이 다른 컴포넌트에도 있어요:

| 컴포넌트 | 속성 | 매칭도 |
|---|---|---:|
| `autoComplete` | `valueNotInList` | 86% |
| `selectbox` | `valueNotInList` | 76% |
| `gridView.column` | `valueNotInList` | 82% |

### 추가 확인 사항

- 해당 속성 변경 후 **이벤트 동작 차이** 있을 수 있음 (`onbeforeselect`, `onchange` 등)
- 빈 값 처리는 `valueNotInList_emptyItem` 같은 별도 옵션 있음 (RAG 78% 매칭)
- 사용 중인 WebSquare 버전 (SP4/SP5/AI)

감사합니다.

## 참고 자료

| 사례 | 매칭도 | 출처 | URL |
|---|---:|---|---|
| AutoComplete valueNotInList 사용법 | 93% | 개발가이드 샘플 | - |
| `autoComplete.valueNotInList 속성` | 86% | API 가이드 (AI) | https://docs.inswave.com/support/api/ws5_ai/6.0_0.1550R.20260417.145224/index.html |
| 18. AutoComplete | 86% | 컴포넌트 가이드 | https://docs1.inswave.com/component_user_guide |
| `gridView.column.valueNotInList` | 82% | API 가이드 (AI) | (동일) |
| `SelectBox valueNotInList_emptyItem 사용법` | 78% | 개발가이드 샘플 | - |
| `selectbox.valueNotInList 속성` | 76% | API 가이드 (AI) | (동일) |

## 메타

- LLM: Claude (manual, RAG 검색 + 직접 작성)
- 사용 API (RAG 검증됨): `valueNotInList` 속성 (autoComplete/selectbox/gridView.column 공통)
- 검증되지 않은 코드: `setValueNotInList()` 메소드 (RAG 직접 매칭 약함, 동작 시 XML 속성 권장)
