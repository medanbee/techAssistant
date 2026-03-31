# WebSquare SP4 구동 방식 및 .wq 요청 WAS 처리 여부

- **문의일시**: 2026-03-31
- **분류**: 엔진/설정
- **답변 근거**: 내부 데이터 기반 (RAG 유사 사례 참고)

## 문의 내용

SP4 구동방식, 웹스퀘어(.wq) 요청이 WAS에 타는가?

## 답변

안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

WebSquare SP4 구동 방식 및 .wq 요청의 WAS 처리 여부와 관련하여 확인 후 답변드립니다.

### WebSquare SP4 구동 방식

WebSquare SP4는 **클라이언트 기반 렌더링 엔진**입니다. 별도의 플러그인 설치 없이, 브라우저에서 JavaScript 라이브러리 형태로 자동 로드되어 실행됩니다.

#### 동작 흐름

```
[브라우저] → websquare.html 요청
         → WebSquare 엔진(JS) 자동 로드
         → 화면 XML(.xml) 파싱 + 컴포넌트 렌더링
         → 사용자 조작 / 서버 통신(submission)
```

1. **최초 접근** — 브라우저가 `websquare.html`을 호출하면, 이 파일 안에서 WebSquare 엔진(JavaScript)이 자동으로 로드됩니다.
2. **화면 렌더링** — 엔진이 화면 XML을 읽어 HTML 컴포넌트로 변환하여 브라우저에 렌더링합니다. 이 과정은 **클라이언트(브라우저)에서** 처리됩니다.
3. **서버 통신** — `submission` 등을 통해 필요한 시점에만 WAS와 통신합니다.

> WebSquare 엔진은 플러그인이 아닌 **JavaScript 라이브러리** 형태이며, 별도 설치 없이 브라우저에서 자동 로드됩니다.

### .wq 요청은 WAS를 타는가?

**예, .wq 요청은 WAS(서블릿)를 타며 처리됩니다.**

`web.xml`에 아래와 같이 서블릿 매핑이 설정되어 있으며, `.wq` 확장자 요청은 `DefaultRequestDispatcher` 서블릿이 처리합니다.

```xml
<!-- web.xml 서블릿 매핑 -->
<servlet>
    <servlet-name>websquareDispatcher</servlet-name>
    <servlet-class>websquare.http.DefaultRequestDispatcher</servlet-class>
    <init-param>
        <param-name>WEBSQUARE_HOME</param-name>
        <param-value>/websquare_home 경로</param-value>
    </init-param>
</servlet>

<servlet-mapping>
    <servlet-name>websquareDispatcher</servlet-name>
    <url-pattern>*.wq</url-pattern>
</servlet-mapping>
```

#### .wq 요청 처리 과정

```
[브라우저] → *.wq 요청
         → WAS (Tomcat/JEUS/WebLogic 등)
         → websquareDispatcher (DefaultRequestDispatcher)
         → WEBSQUARE_HOME/config/websquare.xml 설정 참조
         → 서버 로직 처리 (submission, 파일업로드 등)
         → 응답 반환
```

| 요청 유형 | WAS 경유 여부 | 설명 |
|---|---|---|
| `.wq` 요청 | **O (서블릿 처리)** | submission, 서버 통신, 파일 업/다운로드 등 |
| `.xml` 화면 파일 | △ (정적 리소스) | 웹서버/WAS에서 정적 파일로 서빙 |
| WebSquare 엔진 JS | △ (정적 리소스) | `_websquare_` 폴더의 JS/CSS 파일 |
| `config.xml` | X (클라이언트) | 브라우저에서 직접 읽는 클라이언트 설정 파일 |
| `websquare.xml` | O (서버) | WAS 기동 시 서버에서 로드하는 서버 설정 파일 |

### 참고: SP1 → SP4 주요 차이

SP4에서는 일부 API 호출 방식이 변경되었습니다. 예를 들어 submission 생성 시 `$w.createSubmission` → `$p.createSubmission`으로 변경이 필요합니다.

감사합니다.

[출처: W-Tech QNA - WebSquare 아키텍처 구조 문의 답변 | Confluence 기술지식DB(Inside) - 서버 설치가이드 (web.xml 서블릿 매핑) | Confluence 기술지식DB(Inside) - web.xml WEBSQUARE_HOME 설정 | Confluence 기술지식DB(Inside) - 프로젝트 오픈 전 점검사항 | W-Tech QNA - SP1→SP4 submission API 변경]
