안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

에디터 이미지 업로드(imageupload.wq) 및 툴바 설정과 관련하여 확인 후 답변드립니다.

---

### 1. imageupload.wq 이미지 업로드 경로를 CDN 서버로 변경하는 방법

`/websquare/imageupload.wq`는 WebSquare 엔진에서 기본 제공하는 이미지 업로드 서블릿이며, 내부적으로 `websquare.http.controller.upload.DefaultFileUploadController` 클래스와 매핑되어 있습니다.

이 기본 서블릿을 직접 수정하는 것은 권장하지 않으며, 대신 **editor 컴포넌트의 `imageUploadURL` 속성**을 활용하여 업로드 경로를 커스텀 서블릿으로 변경하는 방식을 권장드립니다.

**방법:**

1) CDN 서버로 이미지를 업로드하는 **커스텀 서블릿(또는 컨트롤러)**을 구현합니다.
   - 해당 서블릿은 `"fileName"`을 parameter로 받아서 처리하도록 구현해야 합니다.

2) editor 컴포넌트의 `imageUploadURL` 속성에 커스텀 서블릿 URL을 지정합니다.
```xml
<w2:editor id="editor1" imageUploadURL="/your-context/cdnImageUpload" />
```

3) 업로드된 이미지를 CDN에서 조회할 수 있도록 `imageLoadURL` 속성도 함께 설정합니다.
   - `imageLoadURL`: 업로드된 이미지를 조회하는 URL(servlet)이며, 마찬가지로 `"fileName"`을 parameter로 받아서 처리하도록 구현해야 합니다.
```xml
<w2:editor id="editor1" 
    imageUploadURL="/your-context/cdnImageUpload" 
    imageLoadURL="/your-context/cdnImageLoad" />
```

> **참고:** CKEditor 4.11.3 이상 버전을 사용하시는 경우, 파일 전송 방식이 XHR로 변경되어 `config.filebrowserUploadMethod = 'form';` 설정이 필요할 수 있습니다. `websquare/externalJS/editor{버전}/config_3.js` 파일에서 확인 부탁드립니다.

---

### 2. 게시판별 툴바 설정을 다르게 적용하는 방법

editor 컴포넌트의 **`menubar` 속성**을 이용하여 각 XML 화면별로 툴바 구성을 다르게 설정할 수 있습니다.

`menubar`는 editor에서 표시할 툴바(버튼/기능) 항목을 정의하는 속성으로, `config_3.js`에 정의된 `toolbar_default`, `toolbar_simple`, `toolbar_defaultImage` 중 원하는 설정을 각 editor 컴포넌트에 지정할 수 있습니다.

```xml
<!-- 게시판 A: 전체 기능 툴바 -->
<w2:editor id="editor1" menubar="toolbar_default" />

<!-- 게시판 B: 간소화 툴바 -->
<w2:editor id="editor2" menubar="toolbar_simple" />

<!-- 게시판 C: 이미지 중심 툴바 -->
<w2:editor id="editor3" menubar="toolbar_defaultImage" />
```

이처럼 각 게시판 화면의 XML에서 editor 컴포넌트의 `menubar` 속성값만 다르게 지정하시면, 별도의 추가 작업 없이 게시판마다 서로 다른 툴바 구성을 적용하실 수 있습니다.

---

### 출처
- [W-Tech QNA] 에디터 imageupload.wq / 툴바 관련 기존 답변 사례 (WebSquare 5.0)
- [API 가이드] WebSquare.uiplugin.editor — imageUploadURL, imageLoadURL, menubar 속성
- [Confluence DB] 이미지 업로드 다이얼로그 변경 가이드

감사합니다.
