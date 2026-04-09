## initScript에서 파라미터 전달받는 방법

안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

initScript에서의 파라미터 전달 방법과 관련하여 확인 후 답변드립니다.

---

※ 내부 데이터 기준 확인된 사례가 없어, WebSquare 공식 문서 및 일반적인 기술 지식을 기반으로 안내드립니다. 정확한 내용은 추가 확인이 필요할 수 있습니다.

---

### 1. initScript의 특성

`initScript`는 `client.config.xml`에 정의되는 **전역 공통 스크립트**로, 모든 화면의 `onpageload` 이전에 실행됩니다. 별도의 파라미터를 인자로 받는 구조가 아니라, 화면 로딩 시 자동으로 실행되는 스크립트 블록입니다.

따라서 **initScript 자체에 파라미터를 직접 전달하는 방식은 없습니다.**

### 2. initScript에서 값을 참조하는 방법

initScript 내에서 값이 필요한 경우, 아래와 같은 방법으로 참조할 수 있습니다.

#### 방법 1: 전역 변수 참조

메인 화면에서 전역 변수로 설정한 값을 initScript에서 참조할 수 있습니다.

```javascript
// 메인 화면 (index.xml 등)
var globalUserInfo = { userId: "admin", authLevel: "1" };

// initScript에서 참조
<initScript><![CDATA[
    if (typeof globalUserInfo !== "undefined") {
        console.log("사용자:", globalUserInfo.userId);
    }
]]></initScript>
```

#### 방법 2: $p.getParameter() 사용 (※ 확인 필요)

`$p.getParameter()`는 MDI/팝업 오픈 시 전달된 파라미터를 받는 API입니다. 다만, initScript 실행 시점(onpageload 이전)에 이 API가 정상 동작하는지는 엔진 버전에 따라 다를 수 있으므로 실제 테스트가 필요합니다.

```javascript
// client.config.xml - initScript
<initScript><![CDATA[
    var param1 = $p.getParameter("param1");
    if (param1) {
        console.log("전달받은 파라미터:", param1);
    }
]]></initScript>
```

#### 방법 3: URL 쿼리 파라미터 참조

```javascript
// initScript에서 URL 파라미터 직접 파싱
<initScript><![CDATA[
    var urlParams = new URLSearchParams(window.location.search);
    var userType = urlParams.get("userType");
]]></initScript>
```

### 3. 정리

| 방법 | 설명 | 사용 시점 |
|------|------|-----------|
| `$p.getParameter()` | 화면 오픈 시 전달된 파라미터 참조 (※ initScript 시점 동작 여부 확인 필요) | MDI/팝업 오픈 시 |
| 전역 변수 | 메인 화면에서 설정한 전역 변수 참조 | 항상 |
| URL 쿼리 파라미터 | `window.location.search`에서 파싱 | 최초 진입 시 |

기존 WebSquare 5 버전과 WebSquare AI 버전에서 위 방법들은 동일하게 적용됩니다.

### 4. 추가 확인 요청

- 구체적으로 어떤 값을 initScript에 전달하고 싶으신지, 어떤 상황에서 전달이 필요한지 알려주시면 최적의 방안을 안내드리겠습니다.
- 사용 중인 **WebSquare 엔진 버전** 정보도 부탁드립니다.

감사합니다.

---

### 출처

| # | 출처 유형 | 출처 위치 | 세부 항목 | 유사도 |
|---|-----------|-----------|-----------|--------|
| 1 | W-Tech QNA | wtech.inswave.kr | initScript 사용 가이드 (MDI/팝업 공통 DataCollection) | 0.9246 |
| 2 | W-Tech QNA | wtech.inswave.kr | startApplication 파라미터 전달 방법 | 0.8218 |
| 3 | WebSquare 공식 문서 기반 일반 안내 | - | initScript 파라미터 참조 방법 | - |
