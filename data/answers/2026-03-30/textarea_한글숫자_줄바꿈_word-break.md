# textarea 한글+숫자 입력 시 숫자 전체가 다음 줄로 내려가는 현상

## 문의 요약
- **내용**: textarea에 붙여넣기로 입력 시 한글과 숫자가 붙어있으면 줄바꿈 시점에서 숫자 전체가 다음 줄로 내려가는 현상

---

## 답변

안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

textarea에서 한글+숫자 조합 입력 시 숫자 블록이 통째로 다음 줄로 내려가는 현상과 관련하여 확인 후 답변드립니다.

### 원인

이 현상은 브라우저의 기본 줄바꿈(word-wrap) 동작 때문입니다.
브라우저는 기본적으로 **단어 단위**로 줄바꿈을 수행하는데, 한글 뒤에 연속된 숫자(예: `가나다라12345678`)가 오면 숫자 부분을 하나의 단어로 인식하여 통째로 다음 줄로 이동시킵니다.

### 해결 방법

textarea 컴포넌트에 CSS `word-break: break-all` 속성을 적용하시면, 글자 단위로 줄바꿈이 되어 숫자가 통째로 내려가는 현상을 방지할 수 있습니다.

#### 방법 1: 개별 textarea에 style 직접 적용

```xml
<xf:textarea id="textarea1" style="word-break:break-all;"></xf:textarea>
```

#### 방법 2: CSS 클래스로 적용

```css
/* stylesheet_ext.css 또는 공통 CSS에 추가 */
.txt_break_all textarea {
    word-break: break-all;
}
```

```xml
<xf:textarea id="textarea1" class="txt_break_all"></xf:textarea>
```

#### 방법 3: 프로젝트 전체 textarea에 일괄 적용

공통 CSS 파일(stylesheet_ext.css 등)에 아래 스타일을 추가하면 프로젝트 내 모든 textarea에 적용됩니다.

```css
textarea {
    word-break: break-all;
}
```

### word-break 속성 참고

| 값 | 동작 |
|---|---|
| `normal` | 기본값. 단어 단위로 줄바꿈 (숫자/영문이 통째로 내려감) |
| `break-all` | 글자 단위로 줄바꿈 (어떤 문자든 영역 끝에서 바로 줄바꿈) |
| `keep-all` | CJK(한중일) 텍스트에서 단어 단위 줄바꿈 유지 |

> **참고:** `word-break: break-all` 적용 시 영문 단어도 중간에서 잘릴 수 있습니다. 한글+숫자 혼합 입력이 주 용도라면 `break-all`이 적합하며, 영문 가독성도 고려해야 하는 경우 `overflow-wrap: break-word`를 함께 사용하시는 것도 방법입니다.

감사합니다.

---

## 출처
- [W-Tech QNA] GridView/textarea word-wrap: break-word, white-space: normal CSS 적용 사례
- [W-Tech QNA] textarea wrap="off" 속성 관련 답변
- WebSquare 공식 문서 기반 일반 안내
