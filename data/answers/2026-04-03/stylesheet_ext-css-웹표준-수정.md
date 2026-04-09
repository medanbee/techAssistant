안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

stylesheet_ext.css 웹표준 검사 오류 보완과 관련하여 확인 후 답변드립니다.

## 결론

`stylesheet_ext.css`는 **다른 CSS와 합쳐져 자동 생성되는 파일이 아닙니다.** 엔진에 포함된 스킨 CSS 파일로, **직접 수정이 가능**합니다.

---

## stylesheet_ext.css 파일 설명

`stylesheet_ext.css`는 WebSquare 엔진의 기본 스킨 CSS 파일입니다. `config.xml`의 `<stylesheet>` 태그 설정에 따라 `stylesheet.css` 또는 `stylesheet_ext.css` 중 하나를 로딩하는 구조입니다.

**파일 경로**: `/websquare/_websquare_/skin/` 또는 `/websquare/skin/` 하위

`config.xml`에서 아래와 같이 설정되어 있을 경우 `stylesheet_ext.css`를 사용하게 됩니다:

```xml
<stylesheet value="stylesheet_ext.css" />
```

이 파일은 자동 병합이나 빌드로 생성되는 것이 아니라, 엔진 배포 시 함께 제공되는 **정적 파일**이므로 직접 편집하셔도 됩니다.

---

## stylesheet.original.css 수정이 반영되지 않는 이유

`stylesheet.original.css`는 엔진의 원본 백업 파일이며, 실제 런타임에서 로딩되는 파일이 아닙니다. `config.xml`의 `<stylesheet>` 설정에 지정된 파일만 실제로 브라우저에서 로딩되므로, `stylesheet.original.css`를 수정해도 화면에 반영되지 않습니다.

---

## 보완 작업 방법

### 방법 1: stylesheet_ext.css 직접 수정 (가능)

해당 파일을 직접 열어 IE CSS hack, 오타 등을 수정하시면 됩니다.

**주의사항**:
- 엔진 업데이트(패치) 시 해당 파일이 덮어씌워질 수 있으므로, **수정 전 반드시 백업**해 두시기 바랍니다.
- 수정 후 브라우저 캐시로 인해 즉시 반영되지 않을 수 있습니다. 캐시를 무효화하려면 `{context-root}/websquare/suffix.txt` 파일의 내용을 변경해 주시면 됩니다.

### 방법 2: 별도 CSS 파일로 오버라이드 (권장)

엔진 업데이트 시 수정 내용이 유실되는 것을 방지하려면, 별도 CSS 파일에서 오버라이드하는 방식을 권장드립니다.

`config.xml`의 `earlyImportList`에 보완용 CSS를 추가 등록합니다:

```xml
<stylesheet value="stylesheet_ext.css">
    <earlyImportList value="/websquare/css/custom_fix.css" />
</stylesheet>
```

이렇게 하면 `stylesheet_ext.css`는 원본 그대로 유지하면서, `custom_fix.css`에서 웹표준에 맞지 않는 스타일만 오버라이드할 수 있습니다.

### CSS 우선순위 (숫자가 높을수록 우선)

1. `stylesheet.css` 또는 `stylesheet_ext.css` (엔진 기본 스타일시트)
2. `all.css` (stylesheet를 커스터마이징하여 사용하는 파일)
3. `content.css` (업무 화면용 CSS)
4. `earlyImportList`에 등록된 CSS
5. 화면 XML 내 인라인 스타일

---

## 일반적인 웹표준 검사 오류 유형 및 조치 예시

| 오류 유형 | 예시 | 조치 방법 |
|-----------|------|-----------|
| IE CSS hack | `*display: inline;`, `_height: 0;` | 해당 속성 삭제 또는 `@supports`/미디어쿼리로 대체 |
| 벤더 프리픽스 | `-ms-filter`, `-webkit-` | W3C 표준 속성으로 대체 (경고 수준이면 유지 가능) |
| 오타/잘못된 속성값 | `heigth`, `colr` 등 | 올바른 속성명으로 수정 |
| 잘못된 단위 | `0px` → `0` | 불필요한 단위 제거 |

> **참고**: IE CSS hack(`*`, `_` 접두사 등)은 IE 지원이 필요 없는 환경이라면 삭제하셔도 무방합니다. IE 지원이 여전히 필요한 경우에는 삭제 시 IE에서 레이아웃이 깨질 수 있으니 주의가 필요합니다.

---

## 추가 확인 사항

1. **사용 중인 WebSquare 엔진 버전**을 알려주시면, 해당 버전의 stylesheet_ext.css에서 알려진 이슈가 있는지 추가 확인이 가능합니다.
2. **IE 지원 필요 여부**를 확인해 주시면, IE CSS hack 삭제 가능 여부를 판단하는 데 도움이 됩니다.
3. **웹표준 검사에서 발생하는 구체적인 오류 목록**을 공유해 주시면 항목별 조치 방안을 안내드릴 수 있습니다.

---

**출처**

| # | 데이터 유형 | 출처 | 세부 항목 | 유사도 |
|---|------------|------|----------|--------|
| 1 | W-Tech QNA | - | CSS 파일 경로 및 stylesheet_ext.css 설명 | 0.7515 |
| 2 | W-Tech QNA | - | stylesheet_ext.css 버전 변경 시 CSS 적용 이슈 | 0.8292 |
| 3 | W-Tech QNA | - | gridView CSS 수정 위치 및 우선순위 안내 | 0.8696 |
| 4 | W-Tech QNA | - | config.xml earlyImportList CSS 설정 | 0.9255 |
| 5 | W-Tech QNA | - | earlyImportList 역할 및 CSS 로딩 방식 | 0.8112 |

감사합니다.
