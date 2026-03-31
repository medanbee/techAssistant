# Maven 프로젝트에서 WebSquare pom.xml 설정 방법

## 문의 요약
- **내용**: Maven 프로젝트에서 WebSquare pom.xml 설정 방법

---

## 답변

안녕하세요.
인스웨이브 기술지원팀 담당자 프로입니다.

Maven 프로젝트에서 WebSquare pom.xml 설정 방법과 관련하여 확인 후 답변드립니다.

---

### 1. WebSquare 엔진 JAR 등록 (system scope)

WebSquare 엔진 JAR은 Maven Central에 등록되어 있지 않으므로, `system` scope로 로컬 경로를 직접 지정합니다.

```xml
<!-- WebSquare 엔진 (필수) -->
<dependency>
    <groupId>websquare</groupId>
    <artifactId>websquare</artifactId>
    <version>5.0</version>
    <scope>system</scope>
    <systemPath>${basedir}/src/main/webapp/WEB-INF/lib/websquare_엔진버전.jar</systemPath>
</dependency>

<!-- WebSquare Adapter (Jackson 연계 미사용 시 필요) -->
<dependency>
    <groupId>websquare</groupId>
    <artifactId>websquare_adapter</artifactId>
    <version>5.0</version>
    <scope>system</scope>
    <systemPath>${basedir}/src/main/webapp/WEB-INF/lib/websquare_adapter_엔진버전.jar</systemPath>
</dependency>
```

> **참고:** Jackson 연계 방식 사용 시 `websquare_adapter` JAR은 불필요하며 제외 가능합니다.

### 2. 필수 의존성 라이브러리

```xml
<dependencies>
    <!-- XML 파싱 -->
    <dependency>
        <groupId>org.antlr</groupId>
        <artifactId>antlr</artifactId>
        <version>3.5.2</version>
    </dependency>

    <!-- 파일 업로드 -->
    <dependency>
        <groupId>commons-fileupload</groupId>
        <artifactId>commons-fileupload</artifactId>
        <version>1.2</version>
    </dependency>
    <dependency>
        <groupId>commons-io</groupId>
        <artifactId>commons-io</artifactId>
        <version>1.4</version>
    </dependency>

    <!-- 로깅 -->
    <dependency>
        <groupId>commons-logging</groupId>
        <artifactId>commons-logging</artifactId>
        <version>1.0.4</version>
    </dependency>

    <!-- XML 처리 -->
    <dependency>
        <groupId>dom4j</groupId>
        <artifactId>dom4j</artifactId>
        <version>1.6.1</version>
    </dependency>

    <!-- JSON 처리 -->
    <dependency>
        <groupId>com.googlecode.json-simple</groupId>
        <artifactId>json-simple</artifactId>
        <version>1.1.1</version>
    </dependency>

    <!-- CSV 다운로드 -->
    <dependency>
        <groupId>net.sf.opencsv</groupId>
        <artifactId>opencsv</artifactId>
        <version>1.8</version>
    </dependency>

    <!-- 엑셀 업/다운로드 (GridView) -->
    <dependency>
        <groupId>org.apache.poi</groupId>
        <artifactId>poi</artifactId>
        <version>3.10-FINAL</version>
    </dependency>
    <dependency>
        <groupId>org.apache.poi</groupId>
        <artifactId>poi-ooxml</artifactId>
        <version>3.10-FINAL</version>
    </dependency>
    <dependency>
        <groupId>org.apache.poi</groupId>
        <artifactId>poi-excelant</artifactId>
        <version>3.10-FINAL</version>
    </dependency>
    <dependency>
        <groupId>org.apache.poi</groupId>
        <artifactId>poi-scratchpad</artifactId>
        <version>3.10-FINAL</version>
    </dependency>

    <!-- StringTemplate (submission 처리) -->
    <dependency>
        <groupId>org.antlr</groupId>
        <artifactId>ST4</artifactId>
        <version>4.0.8</version>
    </dependency>

    <!-- FusionChart 관련 (이미지/PDF 다운로드 사용 시) -->
    <dependency>
        <groupId>org.apache.xmlgraphics</groupId>
        <artifactId>fop</artifactId>
        <version>1.0</version>
    </dependency>

    <!-- XML 처리 -->
    <dependency>
        <groupId>xalan</groupId>
        <artifactId>xalan</artifactId>
        <version>2.7.0</version>
    </dependency>
</dependencies>
```

### 3. SpringBoot 연계 시 추가 설정

SpringBoot 프로젝트의 경우 아래 사항을 추가로 확인합니다.

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.x.x.RELEASE</version>  <!-- 또는 3.x.x -->
</parent>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- 위의 WebSquare 필수 의존성들 추가 -->
</dependencies>
```

**SpringBoot 주의사항:**
- **POI 버전 충돌**: provider 사용 시 POI 4 버전을 사용해야 합니다.
- **batik 라이브러리 충돌**: `org.w3c.dom` 충돌이 발생할 수 있으므로, batik 라이브러리를 제거하거나 `xml-apis`를 exclude 처리합니다.
- **WebSquare 리소스 복사 위치**: SpringBoot에서는 `src/main/resources/static` 하위에 복사합니다 (일반 프로젝트는 `src/main/webapp` 하위).

### 4. 전자정부 프레임워크 연계 시

전자정부 프레임워크 3.5 이상에서는 `xercesImpl.jar` 버전 충돌이 발생할 수 있습니다. 이 경우 WebSquare에서 사용하는 xercesImpl(2.7.1)을 pom.xml에 명시적으로 등록하여 해결합니다.

### 5. 참고 자료

- Confluence 기술지식DB: [SpringBoot] WebSquare 프로젝트 생성 예시
  https://inswave01.atlassian.net/wiki/spaces/DB/pages/230250/SpringBoot+Websquare
- WebSquare 서버 설치 가이드
  https://docs1.inswave.com/sp5_user_guide/13fabf3df143c2f6#5f0fc8f5c63adc38

감사합니다.

---

## 출처
- [Confluence Inside] WebSquare .jar Maven Down — pom.xml dependency 전체 목록
- [Confluence Inside] 전자정부 표준 프레임워크 — Maven WebSquare Dependency Library 등록 가이드
- [Confluence Inside] SpringBoot Jackson 연계 샘플 — SpringBoot pom.xml 전체 예시
- [Gmail 기술문의] 한국투자증권 DDP — SpringBoot WebSquare Project 구성 자료
- [Gmail 기술문의] 가톨릭대학교 — json-simple ClassNotFoundException pom.xml 해결
