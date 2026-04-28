# [AI] 메뉴 클릭 시 생성된 탭을 다시 클릭할 때 이벤트 / openMenu 기존 탭 이동 시 재조회

- **문의일시**: 2026-04-23
- **분류**: TabControl > 이벤트/메뉴
- **답변 근거**: 내부 데이터 기반 (RAG 유사 사례 참고)

## 문의 내용

메뉴 클릭 시 탭이 나타나는데, 그 탭을 다시 클릭할 때 알 수 있는 이벤트가 있을까요?

또는,

```javascript
var option = { isHistory: false, closeable: false, openAction: "exist" };
$c.win.openMenu("게시판", url, "화면명", "", option);
```

위와 같이 호출했을 때 `openAction:"exist"` 옵션으로 기존 탭으로 이동했을 때, **화면 내 tabControl 안의 리스트를 다시 조회**하고 싶습니다. (내부에 또 다른 tabControl이 있는 구조)

## 답변

안녕하세요.
인스웨이브 기술지원팀 AI 자동 답변입니다.

메뉴 오픈 시 생성된 탭을 다시 클릭했을 때 이벤트 처리 및 화면 재조회 방법과 관련하여 유사 사례 기반으로 안내드립니다.

## 1. 탭 클릭 이벤트 — `ontabclick`

WebSquare `tabControl`은 탭이 클릭될 때마다 발생하는 **`ontabclick`** 이벤트를 제공합니다. (이미 활성화된 탭을 다시 클릭하는 경우에도 발생합니다.)

```xml
<w2:tabControl id="tabControl1" ev:ontabclick="scwin.tabControl1_ontabclick" ... />
```

```javascript
scwin.tabControl1_ontabclick = function (tabID, idx) {
    // tabID : 클릭된 탭의 엔진 내부 ID
    // idx   : 클릭된 탭의 index
    console.log("탭 클릭:", tabID, idx);

    // 여기서 화면 재조회 로직 호출
    scwin.fnSearch();  // 예: 그리드 재조회 함수
};
```

| 파라미터 | 타입 | 설명 |
|---|---|---|
| tabID | String | 클릭된 탭의 엔진 내부 ID |
| idx | Number | 클릭된 탭의 index |

> 참고: 탭 변경 직전에 동작이 필요하면 `onbeforeselect` 이벤트도 함께 활용 가능합니다.

## 2. `openAction:"exist"`로 기존 탭 이동 시 화면 재조회

### (1) 동작 특성

`$c.win.openMenu(..., { openAction:"exist" })` 옵션은 **이미 열려 있는 동일 메뉴 탭이 있으면 새로 만들지 않고 기존 탭을 활성화**합니다. 이 경우 화면(xml)은 **재로드되지 않으므로** `onpageload`가 다시 실행되지 않고, 화면 내부 컴포넌트들의 데이터도 그대로 유지됩니다. 그래서 별도로 재조회 트리거가 필요합니다.

### (2) 권장 방안 — 상위 탭 영역의 `ontabclick`에서 화면 함수 호출

메뉴 탭(상위 tabControl)의 `ontabclick`에서, 활성화된 탭 화면 내부의 재조회 함수를 호출하는 것이 가장 단순합니다.

```javascript
// 상위 메뉴 탭 (예: $c 프레임워크가 관리하는 탭)
// 프로젝트 공통 코드에서 관리되는 탭이라면 해당 공통 코드의 ontabclick에 추가
scwin.menuTab_ontabclick = function (tabID, idx) {
    var $p = scwin.getActiveTabPage();  // 활성 탭의 page 핸들 (프로젝트 공통 helper)
    if ($p && typeof $p.fnSearch === "function") {
        $p.fnSearch();   // 탭 화면 내부의 재조회 함수 호출
    }
};
```

> ※ 위 코드는 일반 패턴 기반 참고용입니다. `$c.win` 계열은 프로젝트 공통 프레임워크(MDI 매니저)에서 wrapping된 함수일 가능성이 높아, **활성 탭의 page 핸들을 가져오는 helper 함수가 프로젝트 공통 코드에 이미 정의되어 있을 가능성이 큽니다.** 사용 중인 프레임워크의 가이드를 우선 확인 부탁드립니다.

### (3) 화면 전체를 새로고침하는 방법 — `$p.reinitialize()`

탭 화면을 통째로 새로 그리고 싶으시면 (xml 재로드, `onpageload` 재실행 포함) `$p.reinitialize()`를 사용합니다.

```javascript
scwin.menuTab_ontabclick = function (tabID, idx) {
    var $p = scwin.getActiveTabPage();
    if ($p) {
        $p.reinitialize();   // 해당 탭 화면 전체 재초기화
    }
};
```

| API | 설명 |
|---|---|
| `$p.reinitialize()` | 현재 페이지를 통째로 재초기화 (xml 재로드, onpageload 재실행) |

> 주의: `reinitialize()`는 화면을 통째로 다시 그리므로 사용자 입력값이 모두 초기화됩니다. **부분 재조회만 필요하면 (1)/(2)처럼 화면 내부 함수를 직접 호출**하시는 것을 권장합니다.

### (4) 화면 내부 tabControl 리스트만 재조회하고 싶은 경우

문의 본문에 "**내부에 tabControl이 있습니다**"로 적어주신 케이스라면, 메뉴 탭 클릭 후 활성 탭 화면의 내부 tabControl 데이터만 갱신하는 흐름이 적절합니다.

```javascript
// 상위 메뉴 탭 ontabclick
scwin.menuTab_ontabclick = function (tabID, idx) {
    var $p = scwin.getActiveTabPage();
    if (!$p) return;

    // 화면 내부 tabControl 의 현재 활성 탭만 재조회
    if (typeof $p.fnReloadCurrentInnerTab === "function") {
        $p.fnReloadCurrentInnerTab();
    }
};

// 활성 탭 화면(xml) 측에 helper 정의
scwin.fnReloadCurrentInnerTab = function () {
    var idx = innerTabControl.getActiveIndex();   // 현재 활성 탭 index
    scwin.fnLoadDataByTabIndex(idx);              // 탭 index별 조회 함수
};
```

> ※ 위 코드는 일반 패턴 기반의 참고용입니다. 실제 동작 확인 후 적용해주세요.

## 3. 정리

| 시나리오 | 권장 방법 |
|---|---|
| 탭 클릭 자체를 감지 | `tabControl`의 `ontabclick` 이벤트 |
| `openAction:"exist"`로 기존 탭 이동 후 부분 재조회 | 상위 메뉴 탭의 `ontabclick`에서 활성 page 핸들의 재조회 함수 호출 |
| 탭 화면 전체 새로고침 | `$p.reinitialize()` |
| 화면 내부 tabControl 데이터만 갱신 | 활성 page에 helper 정의 후 ontabclick에서 호출 |

## 4. 추가 확인 요청

`$c.win.openMenu`는 **프로젝트 공통 프레임워크의 wrapping 함수**일 가능성이 높아, 상위 메뉴 탭이 어떤 컴포넌트인지에 따라 ontabclick 등록 위치가 달라집니다. 정확한 가이드를 위해 아래 정보 회신 부탁드립니다.

1. **상위 메뉴 탭이 표준 `tabControl` 컴포넌트인지, MDI/WindowContainer 기반인지**
2. **`$c.win.openMenu`의 정의 위치** (프로젝트 공통 js 파일명/위치)
3. **엔진 버전** (Version 정보 전체 문자열)
4. 가능하면 **메뉴 탭 + 내부 tabControl 구조의 화면 XML 일부**

---

## 출처

| # | 데이터 유형 | 출처 | 세부 항목 | 유사도 |
|---|---|---|---|---|
| 1 | W-Tech QNA | WindowContainer/openMenu 일괄 오픈 시 영역 계산 이슈 | `gcm.win.openMenu` 사용 사례 (프레임워크 wrapping 패턴) | 0.9264 |
| 2 | 개발가이드 샘플 | TabControl `onscrollleftbtnclick`/`onsubmenubtnclick` 등 | tabControl 이벤트 구성 (참고) | 0.8695 |
| 3 | Confluence UXDB | 03.레이아웃(tabControl 구조) | `addTab` 등 동적 탭 생성 가이드 (참고) | 0.7901 |
| 4 | W-Tech QNA | 탭 클릭 시 컨텐츠 인지 방법 | `ontabclick` 이벤트 사용 권장 | 0.5240 |
| 5 | W-Tech QNA | 탭 변경 시 페이지 새로고침 | `ontabclick` + `$p.reinitialize()` 패턴 | 0.5226 |
| 6 | API 가이드 (AI) | tabControl 일반 이벤트 (`onbeforeselect` 등) | 탭 변경 전 처리 (참고) | 0.7749 |

※ 본 답변은 AI가 기존 기술지원 사례를 기반으로 생성한 답변입니다.
감사합니다.
