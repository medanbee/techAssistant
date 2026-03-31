# websquare.xml 파일 내 log 설정 방법

- **문의일시**: 2026-03-30
- **분류**: 엔진/설정
- **답변 근거**: 내부 데이터 기반 (RAG 유사도: 0.74, 0.69)

## 문의 내용

websquare.xml 파일 내 log 설정 방법 어떻게 해?

## 답변

안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

websquare.xml 파일 내 log 설정 방법과 관련하여 확인 후 답변드립니다.

웹스퀘어 로그 설정은 `/websquare_home/config/websquare.xml` 파일의 `<log>` 영역에서 변경하실 수 있으며, 변경 시 서버 재기동이 필요합니다.

**설정 예시:**

```xml
<log>
    <target console="true" description="basic log"
        dir="/log/websquare_log/websquare"
        filename="websquare" level="INFO" lineNumber="true"
        name="websquare" retentionPeriod="10" thread="true"/>
    <target console="true" description="error log"
        dir="/log/websquare_log/exception"
        filename="exception" level="SEVERE" lineNumber="true"
        name="exception" retentionPeriod="10" thread="true"/>
</log>
```

**주요 설정 항목:**

| 속성 | 설명 | 값 |
|------|------|-----|
| level | 로그 레벨 설정 | OFF, SEVERE, WARNING, INFO, CONFIG, FINE, FINER, FINEST, ALL |
| console | WAS 콘솔 로그 출력 여부 | true: 출력 / false: 미출력 |
| dir | 로그 저장 디렉토리 경로 | 절대 경로 지정 |
| filename | 로그 파일명 | 문자열 |
| thread | 로그 출력 시 Thread 이름 포함 여부 | true / false |
| lineNumber | 에러 발생 LineNumber 포함 여부 | true / false |
| retentionPeriod | 로그 보관 주기 (일 단위), 초과 시 자동 삭제 | 숫자 (미지정 시 전체 보관) |
| logSize | 로그 파일 크기 제한 (MB 단위) | 숫자 (미설정 시 무제한) |
| logCount | logSize 초과 시 로테이트 파일 수 | 1 이상 |
| pattern | 로그 출력 포맷 | 예: `%d{ISO8601} [%t/%c/%p] [%l] %m` |

**참고 사항:**
- `console="true"` 설정이 되어 있어야 WAS에 웹스퀘어 로그가 표시됩니다.
- `logSize` 설정 시 로그 파일명에 순서가 포함되며, `logCount` 미지정 시 기본값 1로 설정됩니다.
- log 설정이 적용되지 않는 로그 파일이 있다면, 해당 파일이 웹스퀘어 관련 로그가 아니거나 경로가 상이할 수 있으니 확인 부탁드립니다.

[출처: Gmail 기술문의 | 분류: 엔진/설정 | 유사도: 0.74, 0.69]

감사합니다.
