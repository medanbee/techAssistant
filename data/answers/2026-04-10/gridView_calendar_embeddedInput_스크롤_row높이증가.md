안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

GridView calendar 컬럼의 embeddedInput 설정과 스크롤 시 row 높이 증가 현상에 관련하여 확인 후 답변드립니다.

---

## 1. 현상 분석

브라우저 화면 비율이 100%를 초과한 환경에서 `inputType="calendar"` + `embeddedInput="true"` 컬럼이 포함된 GridView를 스크롤할 때 row 높이가 점진적으로 증가하는 현상은 **기존에 접수된 알려진 이슈**입니다.

동일한 현상이 W-Tech QNA에 다수 보고되어 있으며, 연구소에서 확인 중인 사항입니다.

## 2. 해결 방법: `embeddedInput="false"` + `viewType="icon"` + `viewTypeIconImage="true"` 조합

`embeddedInput="false"`로 변경하면 row 높이 증가 문제는 해결되지만, 말씀하신 것처럼 input 영역 편집 불가 및 캘린더 아이콘 미노출 문제가 발생합니다.

이를 해결하기 위해 아래 3가지 속성을 함께 설정해 주시기 바랍니다.

### 설정 방법

**① GridView 속성에 `editModeEvent="onclick"` 설정**

GridView 컴포넌트 전체 속성에서 `editModeEvent`를 `"onclick"`으로 변경합니다. (기본값은 `"ondblclick"`)

```xml
<w2:gridView id="gridView1" editModeEvent="onclick" ...>
```

> 이 설정으로 셀 클릭 시 바로 편집 모드에 진입하여 input 영역을 수정할 수 있게 됩니다.

**② calendar 컬럼에 `viewType="icon"` 설정**

해당 calendar 컬럼의 속성에서 `viewType`을 `"icon"`으로 설정합니다.

```xml
<w2:column width="100" inputType="calendar" id="PDATE" 
      displayMode="label" title="납품가능일" textAlign="center" 
      displayFormatter="comUtil.stringToDateFormat"
      embeddedInput="false" viewType="icon" />
```

**③ Source 탭에서 `viewTypeIconImage="true"` 추가**

Studio의 Source 탭에서 해당 컬럼에 `viewTypeIconImage="true"` 속성을 직접 추가합니다.

```xml
<w2:column width="100" inputType="calendar" id="PDATE" 
      displayMode="label" title="납품가능일" textAlign="center" 
      displayFormatter="comUtil.stringToDateFormat"
      embeddedInput="false" viewType="icon" viewTypeIconImage="true" />
```

> `viewTypeIconImage="true"` 설정 시, 편집 모드에 진입하지 않고도 아이콘 클릭만으로 캘린더 팝업이 바로 열립니다.

### 최종 적용 소스

```xml
<!-- GridView에 editModeEvent="onclick" 추가 -->
<w2:gridView id="gridView1" editModeEvent="onclick" ...>
  ...
  <w2:column width="100" inputType="calendar" style="height:24px" id="PDATE" 
        blockSelect="false" displayMode="label" title="납품가능일" textAlign="center" 
        displayFormatter="comUtil.stringToDateFormat" 
        embeddedInput="false" viewType="icon" viewTypeIconImage="true" />
  ...
</w2:gridView>
```

## 3. 버전 관련 참고사항

현재 사용하시는 엔진 버전이 `websquare_5.0_2.3441B.20190117.164730_1.5`로 비교적 이전 버전입니다. `viewTypeIconImage` 속성은 이후 버전에서 추가/개선된 속성이므로, **해당 버전에서 정상 동작하지 않을 수 있습니다.**

만약 적용 후에도 아이콘이 노출되지 않거나 캘린더가 열리지 않는 경우:
- 엔진 업데이트를 검토해 주시기 바랍니다
- 또는 `editModeEvent="onclick"`만 적용하여 셀 클릭 시 편집 모드로 진입 후 캘린더를 사용하는 방식을 대안으로 고려해 주시기 바랍니다

## 4. 추가 확인 사항

- 브라우저 확대/축소 비율을 100%로 고정할 수 있는 환경이라면, `embeddedInput="true"` 유지가 가장 간단한 해결책입니다
- `blockSelect="false"` 속성이 함께 설정되어 있으므로, `editModeEvent="onclick"` 적용 시 셀 선택/편집 동작이 의도한 대로 동작하는지 확인이 필요합니다

---

### 출처

| # | 데이터 유형 | 출처 | 내용 | 유사도 |
|---|-------------|------|------|--------|
| 1 | W-Tech QNA | W-Tech 게시판 | gridView calendar 스크롤 시 row 높이 자동 증가 현상 보고 | 0.5465 |
| 2 | W-Tech QNA | W-Tech 게시판 | calendar 스크롤 row 높이 증가 후속 문의 (화면비율 관련) | 0.5434 |
| 3 | W-Tech QNA | W-Tech 게시판 | gridView calendar viewType="icon" 아이콘 클릭으로 달력 여는 방법 | 0.8884 |
| 4 | Confluence UXDB | UXDB 기술지식 | gridView calendar 클릭 시 한번에 열기 (editModeEvent+viewType+viewTypeIconImage) | 0.8813 |
| 5 | API 가이드 | WebSquare API | gridView.column viewTypeIconImage 속성 설명 | 0.9140 |
| 6 | API 가이드 | WebSquare API | gridView.column viewType 속성 설명 | 0.9069 |
| 7 | API 가이드 | WebSquare API | gridView editModeEvent 속성 설명 | 0.8012 |

감사합니다.
