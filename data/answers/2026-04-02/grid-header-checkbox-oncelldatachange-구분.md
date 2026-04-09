안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

그리드 헤더 체크박스 클릭(전체 선택/해제)과 개별 체크박스 클릭을 dataset oncelldatachange 이벤트에서 구분하는 방법과 관련하여 확인 후 답변드립니다.

## 원인 분석

현재 코드에서 `getHeaderValue("colChk")`를 사용하여 헤더 체크 상태로 구분하고 계신데, **전체 체크 시**에는 헤더 값이 체크 상태(`true`)이므로 `!header`가 `false` → 정상적으로 차단됩니다.

하지만 **전체 해제 시**에는 헤더 체크박스가 이미 해제된 상태에서 `oncelldatachange`가 발생하므로 `getHeaderValue()`가 falsy를 반환하고, `!header`가 `true`가 되어 개별 해제와 동일하게 `console.log("bbb")`가 실행되는 것입니다.

추가로 WebSquare 내부 동작상 헤더 체크박스 클릭 시 이벤트 순서가 **`oncelldatachange` → `onheaderclick`** 이므로, onheaderclick에서 플래그를 세팅하는 방식으로는 타이밍상 구분이 어렵습니다.

## 해결 방법

gridView 헤더 컬럼의 **`onChangeFunction`** 속성을 활용합니다.

`onChangeFunction`을 설정하면 **기존 자동 전체선택/해제 동작이 꺼지고**, 지정한 함수가 대신 호출됩니다. 이 함수 안에서 플래그를 먼저 세팅한 후 직접 데이터를 변경하므로, `oncelldatachange` 발생 시점에는 이미 플래그가 `true` 상태가 되어 헤더 클릭과 개별 클릭을 정확히 구분할 수 있습니다.

### 1단계: gridView XML 설정

해당 체크박스 컬럼의 header에 `onChangeFunction` 속성을 추가합니다.
IDE 자동완성이 지원되지 않으므로 **source 탭에서 직접 기입**해야 합니다.

```xml
<w2:column id="colChk" inputType="checkbox" onChangeFunction="hte.fnHeaderChkChange" ...>
```

### 2단계: 스크립트 구현

```javascript
var _isHeaderClick = false;

// onChangeFunction으로 지정한 함수
// 헤더 체크박스 클릭 시 기본 전체선택/해제 동작 대신 이 함수가 호출됨
hte.fnHeaderChkChange = function() {
    _isHeaderClick = true;

    var headerVal = grdItemList.getHeaderValue("colChk");
    var rowCount = dsItemList.getRowCount();

    for (var i = 0; i < rowCount; i++) {
        dsItemList.setCellData(i, "CHK", headerVal ? "1" : "0");
    }

    _isHeaderClick = false;
};

// 데이터셋 oncelldatachange (기존 이벤트 수정)
hte.dsItemList_oncelldatachange = function(info) {
    var row = info.rowIndex;
    var col = info.colID;
    var newData = info.newValue;

    if (col == "CHK" && !_isHeaderClick) {
        if (newData == "1") {
            console.log("aaaa"); // 개별 체크 시에만 실행
        }
        if (newData == "0") {
            console.log("bbb"); // 개별 해제 시에만 실행
        }
    }
};
```

### 동작 원리

**헤더 체크박스 클릭 시 (전체 선택/해제):**
1. `fnHeaderChkChange()` 호출 → `_isHeaderClick = true` 세팅
2. `setCellData()` 반복 → 각 행마다 `oncelldatachange` 발생 → 플래그가 이미 `true`이므로 개별 로직 차단
3. 반복 완료 후 → `_isHeaderClick = false` 초기화

**개별 체크박스 클릭 시:**
1. `fnHeaderChkChange`는 호출되지 않음 → `_isHeaderClick`은 `false` 유지
2. `oncelldatachange` 발생 → `_isHeaderClick`이 `false`이므로 개별 로직 정상 실행

## 추가 참고 사항

- `onChangeFunction` 설정 시 기본 자동 전체선택/해제 동작이 꺼지므로, 위 예시처럼 `getHeaderValue()`와 `setCellData()` 반복으로 전체선택/해제를 직접 구현해야 합니다.
- 기존 코드의 `getCellData(row, col, newData)` 대신 `info.newValue`를 직접 비교하시는 것을 권장드립니다.

---

**참고 자료 (RAG 검색 유사도):**

| # | 출처 | 내용 요약 | 유사도 |
|---|------|-----------|--------|
| 1 | [W-Tech QNA] 헤더 체크박스 전체선택/해제 이벤트 구분 문의 | getHeaderValue()와 getCheckedData()를 사용한 헤더 전체선택/해제 구분 샘플 제공 (onheaderclick 활용) | 0.9434 |
| 2 | [W-Tech QNA] 헤더 inputType checkbox onChangeFunction 설정 | onChangeFunction 설정 시 기존 자동 체크 동작 꺼짐, 샘플 첨부 | 0.8996 |
| 3 | [W-Tech QNA] gridView column onChangeFunction 이상동작 | onChangeFunction 사용 컬럼 관련 엔진 업그레이드 후 이슈 및 대응 사례 | 0.8399 |
| 4 | [W-Tech QNA] 그리드 헤더 체크박스 selectBox onChangeFunction | 헤더 컬럼에 onChangeFunction 속성 사용법, source 탭에서 직접 기입 안내 | 0.8317 |
| 5 | [개발가이드 샘플] checkHeaderOnviewchange gridView | onviewchange 이벤트 — 헤더 체크박스 선택 시 행의 개수만큼 발생, checkHeaderOnviewchange="true" 설정 | 0.9206 |

감사합니다.
