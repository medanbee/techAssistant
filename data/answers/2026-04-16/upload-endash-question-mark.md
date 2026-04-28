# 파일 업로드 시 en-dash(–)가 물음표(?)로 변환되는 현상

**버전**: WebSquare SP2

---

안녕하세요.
인스웨이브 기술지원팀입니다.

파일 업로드 시 파일명에 포함된 en-dash(–, U+2013) 문자가 물음표(?)로 치환되는 현상에 대해 안내드립니다.

## 원인 분석

en-dash(`–`, U+2013)는 일반 하이픈(`-`, U+002D)과 다른 유니코드 특수문자입니다.
파일 업로드 과정에서 서버 측 인코딩 설정이 UTF-8이 아닌 경우(ISO-8859-1, EUC-KR 등), 이 문자를 표현할 수 없어 물음표(`?`)로 치환됩니다.

WebSquare 엔진의 파일 업로드 처리 시 아래 인코딩 설정들이 영향을 줍니다:
- `websquare.xml`의 `default_encoding`
- `websquare.xml`의 `upload/encoding`
- WAS Connector의 `URIEncoding`

## 해결 방법

### 1. websquare.xml 인코딩 설정 확인 및 변경

`$WEBSQUARE_HOME/config/websquare.xml` 파일에서 아래 인코딩 관련 설정을 확인해 주세요.

```xml
<!-- 기본 인코딩 -->
<default_encoding value="UTF-8"/>

<!-- POST 파라미터 인코딩 -->
<encoding value="UTF-8"/>

<!-- 업로드 인코딩 -->
<upload>
    <encoding value="UTF-8"/>
</upload>
```

특히 `upload/encoding` 값이 `ISO-8859-1`이나 `EUC-KR`로 되어 있다면 `UTF-8`로 변경 후 WAS 재기동이 필요합니다.

### 2. WAS(Tomcat) Connector 인코딩 확인

Tomcat 사용 시 `server.xml`의 Connector 설정에서 `URIEncoding`이 UTF-8인지 확인해 주세요.

```xml
<Connector port="8080" protocol="HTTP/1.1"
           URIEncoding="UTF-8"
           ... />
```

### 3. (대안) 클라이언트 측 파일명 치환

인코딩 설정 변경이 어려운 환경이라면, 업로드 전 클라이언트 스크립트에서 en-dash를 일반 하이픈으로 치환하는 방법도 있습니다.

※ 위 코드는 유사 사례 기반 참고용입니다. 실제 동작 확인 후 적용해주세요.

```javascript
// 파일명에서 en-dash(–)를 일반 하이픈(-)으로 치환
var fileName = file.name.replace(/\u2013/g, '-');
```

다만 이 방법은 근본적인 해결이 아니므로, 가능하면 서버 인코딩 설정을 UTF-8로 통일하시는 것을 권장합니다.

## 추가 확인 요청 사항

보다 정확한 확인을 위해 아래 정보를 추가로 알려주시면 감사하겠습니다.

1. 현재 `websquare.xml`의 encoding 관련 설정값
2. WAS 종류 및 버전 (Tomcat, JBoss, WebLogic 등)
3. 업로드 컴포넌트 종류 (upload / multiUpload)
4. 정확한 엔진 버전 (미리보기에서 Ctrl+마우스 우클릭 → 디버그 메뉴 → "Version 정보")

감사합니다.

---

**출처:**

| # | 출처 | 유사도 |
|---|------|--------|
| 1 | [Gmail 기술문의] 웹스퀘어 인코딩 설정 가이드 (도이치파이낸셜) | 0.9144 |
| 2 | [Gmail 기술문의] advancedExcelDownload 한글 파일명 깨짐 (JT저축은행) | 0.8637 |
| 3 | [개발 가이드] 46. 서버 - 인코딩 설정 | 0.8522 |
| 4 | [Gmail 기술문의] SP2 환경 파일 업로드 테스트 | 0.7900 |
