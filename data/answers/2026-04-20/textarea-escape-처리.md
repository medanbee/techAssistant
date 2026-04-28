안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

textarea escape 처리와 관련하여 유사 사례 기반으로 안내드립니다.

## 원인 분석

WebSquare의 `textbox`, `span` 등 일부 출력성 컴포넌트는 `escape` 속성을 제공하여 `<`, `>`, `&`, `"` 등 HTML 특수문자를 안전하게 표시하거나(`escape="true"`) HTML 태그로 해석(`escape="false"`)할 수 있습니다.

반면 **`textarea` 컴포넌트는 `escape` 속성을 지원하지 않습니다.** 내부적으로 `<textarea>` 태그의 특성상 입력값을 그대로 텍스트로만 표현하기 때문에 별도의 escape 옵션이 제공되지 않는 구조입니다.

## 해결 방법

기존 유사 사례(조달청 / 주택도시보증공사 차세대)에서 안내된 방식과 동일하게, 브라우저 표준 API인 **`DOMParser().parseFromString()`** 을 이용해 직접 escape 해제 후 setValue 하는 방식을 권장드립니다.

### 코드 예시

```javascript
// HTML Escape 문자열을 원문으로 복원 후 textarea에 세팅
function fn_setTextareaValue(htmlEscapedStr) {
    var doc = new DOMParser().parseFromString(htmlEscapedStr, "text/html");
    var decoded = doc.documentElement.textContent;
    textarea1.setValue(decoded);
}

// 사용 예
// DB에 "&lt;div&gt;내용&lt;/div&gt;" 형태로 저장된 값을 textarea에 복원 표시
fn_setTextareaValue(dbValue);
```

반대로, textarea 입력값을 저장 시 escape 처리가 필요하면 아래와 같이 치환하시면 됩니다.

```javascript
function fn_escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;");
}

var safeValue = fn_escapeHtml(textarea1.getValue());
```

※ 위 코드는 유사 사례 기반 참고용입니다. 실제 동작 확인 후 적용해주세요.

## 추가 확인 사항

- `textarea`에 HTML 태그 자체를 **렌더링**하고자 하시는 경우라면, `textarea`는 그 자체로 `<textarea>` 엘리먼트이므로 내부에 HTML 태그를 해석하지 않습니다. 이 경우 `textbox(multiLine)` 또는 `output`/`span(escape="false")` 계열로 컴포넌트 교체를 검토해주세요.
- `gridView` 컬럼 내 textarea 사용 시 줄바꿈 유지가 필요하면, 해당 컬럼 `escape="false"` + `displayFormatter`에서 `\n → <br>` 치환 방식이 별도 사례로 안내되어 있습니다.
- 사용 중이신 **WebSquare 엔진 버전**과 **적용 위치(일반 화면 / gridView 내부)** 를 회신 주시면 보다 구체적인 안내가 가능합니다.

## 출처

| # | 유사도 | 데이터 유형 | 출처 |
|---|--------|------------|------|
| 1 | 0.9376 | Gmail 기술문의 | 고객사 A — textarea escape 처리 가이드 전달 (DOMParser 방식) |
| 2 | 0.9347 | Gmail 기술문의 | 고객사 B 차세대 — textarea escape 처리 문의 (DOMParser 방식) |
| 3 | 0.8980 | W-Tech QNA | textarea 입력값을 span/textbox로 표시 시 escape 속성 확인 |
| 4 | 0.8843 | WebSquare 컴포넌트 가이드 | 60. escape 설정 (XSS 방지용 속성 설명) |
| 5 | 0.8818 | W-Tech QNA | gridView 내 textarea 줄바꿈 유지 — escape="false" + displayFormatter |

※ 본 답변은 AI가 기존 기술지원 사례를 기반으로 생성한 답변입니다.
감사합니다.
