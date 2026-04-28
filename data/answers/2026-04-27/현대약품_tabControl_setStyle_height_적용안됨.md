안녕하세요.
인스웨이브 기술지원팀입니다.

tabControl의 setStyle("height", ...) 적용 이슈와 관련하여 확인 후 답변드립니다.

## 원인 분석

`tabControl`은 내부적으로 탭 영역 + 컨텐츠 영역으로 구성된 **복합(compound) 컴포넌트**입니다.
복합 컴포넌트의 경우 최외곽 div 한 곳에만 스타일이 적용되어, `setStyle("height", "843px")`을 호출해도
실제 탭 컨텐츠 영역 높이까지 동기화되지 않아 화면상 변화가 없는 것처럼 보입니다.
(grid/gridView 등도 동일한 사유로 setStyle의 width/height 변경이 정상 동작하지 않습니다.)

따라서 tabControl의 크기 변경은 setStyle이 아닌 **tabControl 전용 API**를 사용하셔야 합니다.

## 해결 방법

용도에 맞춰 아래 두 API 중 하나를 사용해주세요. **숫자(px)만 전달**하며, 문자열("843px")이 아닌 Number 타입이어야 합니다.

### 1) tabControl 전체 높이를 변경할 때
```javascript
// 잘못된 사용 (적용 안 됨)
// tabControl1.setStyle("height", "843px");

// 권장 사용
tabControl1.setHeight(843);
```

| API | 설명 |
|---|---|
| `tabControl.setHeight(height)` | tabControl 자체의 height를 px 단위로 설정 (Number, "px" 문자 불필요) |
| `tabControl.setWidth(width)`   | tabControl 자체의 width를 px 단위로 설정 |

### 2) 탭 헤더는 그대로 두고, 컨텐츠 영역 높이만 변경할 때
```javascript
// 컨텐츠 영역(본문) 높이만 843px로 변경
tabControl1.setContentsHeight(843);
```

`setContentsHeight(height)`는 탭 헤더를 제외한 본문 영역 높이만 px 단위로 설정합니다.

### 3) frameMode="iframe" 인 경우 참고
탭 컨텐츠를 `frameMode="iframe"`으로 사용 중이라면, content 영역이 독립 iframe으로 렌더링되어
스타일 변경이 안쪽 화면에 전달되지 않습니다. 이 경우에도 `setContentsHeight()` 또는
tabControl 자체에 width/height를 직접 지정하는 방식으로 처리하셔야 합니다.

## 추가 확인 사항

현재 사용 중인 엔진 버전(`5.0_1.2668B.20170605.202941_1.6`, 2017년 6월 빌드)은 SP1 초기 빌드입니다.
참고로 SP4 일부 빌드(`5.0_4.5171B.20240320.111802`)에서 **"탭이 두 줄일 경우 text-indent / height 스타일이 적용되지 않던 버그(WESD-1634)"** 가 수정된 이력이 있어,
혹시 두 줄 탭 구조에서 height 자체가 무시되는 별도 증상이 있다면 엔진 패치 적용도 함께 검토해보시면 좋겠습니다.

위 해결 방법(`setHeight` / `setContentsHeight`)은 SP1 ~ 최신 빌드 모두에서 동일하게 사용 가능합니다.

## 출처

| # | 자료 | 항목 | 유사도 |
|---|---|---|---|
| 1 | API 가이드 | `WebSquare.uiplugin.tabControl.setHeight(height)` | 0.881 |
| 2 | API 가이드 | `WebSquare.uiplugin.tabControl.setWidth(width)` | 0.884 |
| 3 | API 가이드 | `WebSquare.uiplugin.tabControl.setContentsHeight(height)` | 0.925 |
| 4 | W-Tech QNA | grid/gridView setStyle 미지원 (복합 컴포넌트) | 0.876 |
| 5 | W-Tech QNA | TabControl frameMode="iframe" 본문 높이 설정 (setContentsHeight 안내) | 0.880 |
| 6 | 릴리즈 노트 (SP4) | tabControl 두 줄 탭 height 스타일 미적용 버그 수정 (WESD-1634) | 0.888 |

감사합니다.
