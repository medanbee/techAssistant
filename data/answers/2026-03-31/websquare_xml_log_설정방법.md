# websquare.xml 파일 내 log 설정 방법

- **문의일시**: 2026-03-31
- **분류**: 엔진/설정
- **답변 근거**: 내부 데이터 기반 (RAG 유사 사례 참고)

## 문의 내용

websquare.xml 파일 내 log 설정 방법

## 답변

안녕하세요.
인스웨이브 기술지원팀 담당자 프로입니다.

websquare.xml 파일 내 log 설정 방법과 관련하여 확인 후 답변드립니다.

### 설정 위치

`WEBSQUARE_HOME/config/websquare.xml` 파일 내 `<Logger>` 태그에서 설정합니다.

### Logger 설정 속성

| 속성 | 설명 | 값 |
|---|---|---|
| `level` | Log Level 설정 | OFF, SEVERE, WARNING, INFO, CONFIG, FINE, FINER, FINEST, ALL |
| `console` | STDOUT 로그 출력 여부 | `true` (출력) / `false` (미출력) |
| `dir` | Log Directory 경로 | 로그 파일 저장 디렉토리 |
| `thread` | Thread 이름 출력 여부 | `true` / `false` (기본값) |
| `lineNumber` | 에러 LineNumber 출력 여부 | `true` / `false` (기본값) |
| `retentionPeriod` | Log 보관 주기 | 지정 안 하면 모든 Log 보관, 초과 시 자동 삭제 |
| `pattern` | 로그 출력 패턴 | 예: `%d{ISO8601} [%t/%c/%p] [%l] %m` |
| `logSize` | 로그 파일 크기 (MB 단위) | 미설정 시 무제한, 설정 시 파일명에 순서 포함 |
| `logCount` | 로테이트 파일 개수 | 1 이상, logSize 설정 시에만 유효 |

### Log Level 우선순위 (높은 순)

```
OFF > SEVERE > WARNING > INFO > CONFIG > FINE > FINER > FINEST > ALL
```

### 설정 예시

```xml
<!-- websquare.xml Logger 설정 -->
<Logger level="INFO" console="true" dir="/logs/websquare" 
        thread="false" lineNumber="false" 
        retentionPeriod="30" logSize="100" logCount="5"
        pattern="%d{ISO8601} [%t/%c/%p] [%l] %m">
    <!-- Package별 Log Level 설정 -->
    <package level="FINE" value="websquare.http"/>
    <package level="WARNING" value="websquare.xml"/>
</Logger>
```

### 주요 참고 사항

- **`console="true"` 설정 필수** — 이 설정이 되어야 WAS 콘솔에 웹스퀘어 로그가 표시됩니다.
- `logSize`를 설정하면 로그 파일이 지정된 크기를 초과할 때 자동으로 로테이트됩니다. `logSize`가 설정되고 `logCount`가 없으면 기본값 1로 설정됩니다.
- `logSize`가 미설정이고 `logCount`만 설정된 경우 `logCount`는 무시됩니다.
- `dir` 속성에서 `-Dcom.inswave.logSpace` JVM 옵션으로 지정된 값이 dir과 subDir 사이에 폴더명으로 들어갑니다.
- 로그 경로가 하드코딩되어 있는 경우 서버 환경 이전 시 문제가 될 수 있으므로, 상대 경로 또는 JVM 옵션 활용을 권장합니다.

감사합니다.

[출처: Gmail 기술문의 - websquare.xml Logger 설정 가이드 | W-Tech QNA - 의무사령부 통합관제시스템 로그 경로 문제 | Confluence 기술지식DB - web.xml WEBSQUARE_HOME 설정]
