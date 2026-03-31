# openPopup (type:window) Edge IE모드에서 경로 오류

## 문의 요약
- **버전**: WebSquare SP2
- **내용**: $w.openPopup (type:window) 사용 시 Edge IE모드 환경의 특정 사용자에서 "경로가 잘못됐다"는 에러 발생

---

## 답변

안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

openPopup(type:window) 사용 시 Edge IE모드 환경에서 특정 사용자에게 경로 오류가 발생하는 현상과 관련하여 확인 후 답변드립니다.

※ 내부 데이터 기준 확인된 동일 사례가 없어, WebSquare 공식 문서 및 일반적인 기술 지식을 기반으로 안내드립니다. 정확한 내용은 추가 확인이 필요할 수 있습니다.

---

### 예상 원인

Edge IE모드에서 `type:"window"` 팝업 사용 시 경로 오류가 **특정 사용자에게만** 발생하는 경우, 아래 원인들을 순서대로 확인해 주시기 바랍니다.

#### 1. Edge IE모드 사이트 목록(SiteList) 설정 누락

Edge IE모드는 관리자가 설정한 **Enterprise Site List**에 등록된 URL만 IE모드로 동작합니다.
`type:"window"`로 열리는 팝업 URL이 사이트 목록에 **등록되지 않은 경우**, 팝업이 Edge 모드로 전환되면서 경로를 찾지 못하는 오류가 발생할 수 있습니다.

**확인 방법:**
- Edge 주소창에 `edge://compat/enterprise` 입력하여 Enterprise Site List 확인
- 팝업에서 열리는 URL(전체 경로)이 목록에 포함되어 있는지 확인
- 포함되어 있지 않다면 IT 관리자에게 해당 URL 추가 요청

#### 2. 팝업 URL 경로의 인코딩 문제

IE모드에서는 URL에 한글 또는 특수문자가 포함된 경우 인코딩 처리가 Edge 표준모드와 다르게 동작할 수 있습니다.
openPopup의 url 파라미터에 한글이나 특수문자가 포함되어 있다면 `encodeURIComponent()`로 인코딩 처리를 확인해 주세요.

#### 3. 보안 영역(Zone) 설정 차이

IE모드는 Internet Explorer의 보안 영역(인터넷/로컬 인트라넷/신뢰할 수 있는 사이트) 설정을 따릅니다.
**특정 사용자 PC**에서만 발생한다면 해당 PC의 보안 영역 설정이 다른 사용자와 다를 수 있습니다.

**확인 방법:**
- 제어판 > 인터넷 옵션 > 보안 탭
- 해당 사이트가 "신뢰할 수 있는 사이트" 또는 "로컬 인트라넷"에 등록되어 있는지 확인
- 정상 동작하는 사용자 PC의 설정과 비교

#### 4. Edge IE모드에서 window.open 팝업 차단

Edge IE모드에서 팝업 차단 설정이 활성화되어 있으면 `type:"window"` (내부적으로 window.open 사용) 팝업이 차단되면서 비정상적인 오류 메시지가 표시될 수 있습니다.

**확인 방법:**
- Edge 설정 > 쿠키 및 사이트 권한 > 팝업 및 리디렉션
- 해당 사이트가 "허용" 목록에 등록되어 있는지 확인
- IE 인터넷 옵션 > 개인 정보 > 팝업 차단 설정도 함께 확인

#### 5. 상대 경로 vs 절대 경로 문제

openPopup의 url 파라미터가 상대 경로인 경우, IE모드에서 base URL 해석이 달라 경로를 찾지 못할 수 있습니다.

```javascript
// 상대 경로 (문제 가능성 있음)
$w.openPopup("/ui/popup/sample.xml", { type: "window" ... });

// 절대 경로로 변경 테스트
$w.openPopup(location.protocol + "//" + location.host + "/ui/popup/sample.xml", { type: "window" ... });
```

---

### 확인 요청 사항

보다 정확한 원인 파악을 위해 아래 정보를 추가로 확인 부탁드립니다.

1. **에러 메시지 전문** (스크린샷 또는 텍스트)
2. **openPopup 호출 코드** (url, 옵션 파라미터)
3. **정상 동작 PC vs 오류 발생 PC의 차이점** (Edge 버전, IE모드 설정, 보안 영역 설정)
4. **Edge IE모드 Enterprise Site List** 등록 현황
5. **사용 중인 웹스퀘어 엔진 버전** (미리보기에서 Ctrl+마우스 우클릭 > 디버그 메뉴 > Version 정보)

감사합니다.

---

## 출처
- WebSquare 공식 문서 기반 일반 안내
