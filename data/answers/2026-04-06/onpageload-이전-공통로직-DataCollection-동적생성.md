## onpageload 이전에 공통로직으로 DataCollection 동적 생성하는 방법

안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

onpageload 이전에 공통 DataCollection 동적 생성과 관련하여 확인 후 답변드립니다.

---

### 1. 원인 분석

WebSquare 페이지의 스크립트 실행 순서는 다음과 같습니다:

```
initScript → onpageload → postScript
```

`initScript`는 `client.config.xml`에 설정하는 공통 스크립트로, **모든 화면(MDI 메뉴, 팝업 포함)의 onpageload 이전에 실행**됩니다. 따라서 initScript에서 DataCollection을 동적 생성하면 모든 화면에서 공통으로 사용할 수 있습니다.

WebSquare AI 버전에서도 이 방식은 동일하게 적용됩니다. 기본적인 initScript 활용 방법에 변경은 없으며, AI 버전에서도 `$p.data.create` API와 `initScript` 설정을 그대로 사용하시면 됩니다.

---

### 2. 해결 방법

#### Step 1. client.config.xml에 initScript 설정

`client.config.xml`에 아래와 같이 initScript를 등록합니다:

```xml
<initScript><![CDATA[
    // 공통 DataMap 동적 생성
    $p.data.create({
        "id": "commonDataMap",
        "type": "dataMap",
        "option": {
            "baseNode": "map"
        },
        "columnInfo": [
            { "id": "userId",    "type": "text", "name": "사용자ID" },
            { "id": "userName",  "type": "text", "name": "사용자명" },
            { "id": "deptCode",  "type": "text", "name": "부서코드" },
            { "id": "authLevel", "type": "text", "name": "권한레벨" }
        ]
    });

    // 공통 DataList 동적 생성
    $p.data.create({
        "id": "commonCodeList",
        "type": "dataList",
        "option": {
            "baseNode": "list",
            "repeatNode": "map"
        },
        "columnInfo": [
            { "id": "code",     "type": "text" },
            { "id": "codeName", "type": "text" }
        ]
    });
]]></initScript>
```

#### Step 2. scriptPrecedence 설정 확인

스크립트 실행 순서(initScript → onpageload → postScript)를 보장하려면 `client.config.xml`에 다음 설정이 필요합니다:

```xml
<scriptPrecedence value="true" />
```

> **주의:** `scriptPrecedence`가 `true`로 설정되어 있지 않으면, 특정 페이지에서 initScript와 onpageload의 실행 순서가 보장되지 않을 수 있습니다.

#### Step 3. 각 화면(MDI/팝업)의 onpageload에서 공통 DataCollection 활용

```javascript
scwin.onpageload = function() {
    // initScript에서 이미 생성된 commonDataMap 사용 가능
    var userId = commonDataMap.get("userId");
    console.log("현재 사용자: " + userId);

    // 화면별 고유 로직 수행
};
```

#### XML 문자열 방식 (대안)

JSON 객체 대신 XML 문자열로도 생성 가능합니다:

```javascript
var dcStr = '<w2:dataCollection xmlns:w2="http://www.inswave.com/websquare">'
          + '  <w2:dataMap baseNode="map" id="commonDataMap">'
          + '    <w2:keyInfo>'
          + '      <w2:key id="userId" type="text" />'
          + '      <w2:key id="userName" type="text" />'
          + '    </w2:keyInfo>'
          + '  </w2:dataMap>'
          + '</w2:dataCollection>';
$p.data.create(dcStr);
```

---

### 3. 추가 확인 사항

- **동적 생성된 DataCollection 확인**: Ctrl+우클릭 > "dataCollection 보기"에서는 동적 생성 항목이 표시되지 않습니다. 콘솔에서 `WebSquare.util.viewCollection()` 실행 시 확인 가능합니다.
- **참고 가이드**: 동적 DataCollection 생성 가이드 — https://docs1.inswave.com/ws5_sp5_example/sp5_ex_P00046
- **initScript 관련 영상**: https://youtu.be/54iqywe5iF0?feature=shared
- **initScript 가이드**: https://docs1.inswave.com/sp5_user_guide/0b2522fda37f4e81#b

감사합니다.

---

### 출처

| # | 출처 유형 | 출처 위치 | 세부 항목 | 유사도 |
|---|-----------|-----------|-----------|--------|
| 1 | W-Tech QNA | wtech.inswave.kr | 공통 DataCollection 전역 동적 생성 (initScript) | 0.9410 |
| 2 | W-Tech QNA | wtech.inswave.kr | initScript vs onpageload 실행 순서 | 0.9208 |
| 3 | W-Tech QNA | wtech.inswave.kr | 글로벌 onload 펑션 → initScript 추천 | 0.8308 |
| 4 | 개발 가이드 (AI) | SPA 설정 | scriptPrecedence 실행 순서 보장 설정 | 0.7858 |
| 5 | API 가이드 (AI) | $p.data.create | DataList/DataMap 동적 생성 API | 0.9117 |
| 6 | W-Tech QNA | wtech.inswave.kr | $p.data.create API 사용법 | 0.9328 |
| 7 | W-Tech QNA | wtech.inswave.kr | 동적 생성 DataCollection 콘솔 확인법 | 0.5287 |
