# WebSquare AI POI 4.1.2 필요 라이브러리 목록

안녕하세요.
인스웨이브 기술지원팀입니다.

WebSquare AI에서 POI 4.1.2 사용 시 필요한 라이브러리 목록에 대해 안내드립니다.

## POI 4.1.2 엔진 제공 방식

WebSquare AI는 POI 4.1.2 버전이 적용된 별도의 엔진 빌드를 제공하고 있습니다.
(예: `6.0_0.1273B.20250611.101354_poi4_1.8_without_testcase.zip`)

해당 엔진에 필요한 라이브러리가 포함되어 있으므로, 기술지원팀에 POI 4.1.2 엔진을 요청하시면 됩니다.

**중요: POI 4.X 버전을 사용하려면 POI 4.X lib로 컴파일된 WebSquare 엔진이 필요합니다.**
기존 POI 3.x 엔진에 POI 4.x JAR만 교체하면 `NoSuchMethodError`가 발생하므로, 반드시 POI 4.1.2용 엔진 빌드를 요청해 주세요.

## POI 관련 교체/추가 대상 JAR 목록

기존 POI 3.x에서 4.1.8로 업그레이드 시, 아래 JAR 파일들이 교체/추가 대상입니다.

### 교체 대상 (기존 POI 3.x → 4.1.8)

| 기존 JAR | 교체 JAR | 비고 |
|----------|----------|------|
| poi-3.x.jar | poi-4.1.8.jar | POI 핵심 라이브러리 |
| poi-ooxml-3.x.jar | poi-ooxml-4.1.8.jar | OOXML(xlsx) 처리 |
| poi-ooxml-schemas-3.x.jar | poi-ooxml-schemas-4.1.8.jar | OOXML 스키마 |
| poi-scratchpad-3.x.jar | poi-scratchpad-4.1.8.jar | 추가 문서 포맷 |
| poi-excelant-3.x.jar | poi-excelant-4.1.8.jar | Ant 연동 (선택) |
| xmlbeans-2.x.jar | xmlbeans-3.1.0.jar | POI 4.x에서 3.1.0 필요 |

### 추가 필요 (POI 4.x 신규 의존성)

| JAR | 버전 | 비고 |
|-----|------|------|
| commons-collections4 | 4.4 | POI 4.x 필수 의존성 |
| commons-compress | 1.21 | 압축 처리 |
| commons-math3 | 3.6.1 | 수학 연산 |
| SparseBitSet | 1.2 | 비트 연산 |
| curvesapi | 1.07 | 차트/곡선 연산 |

### 제거 대상

| JAR | 비고 |
|-----|------|
| xmlbeans-2.x.jar | xmlbeans-3.1.0으로 교체 |
| poi-ooxml-schemas 구버전 | 4.1.8 버전으로 교체 |

## 주의사항

- POI 4.x와 POI 3.x JAR이 동시에 존재하면 충돌이 발생할 수 있으므로, 기존 POI 3.x 관련 JAR은 반드시 제거해 주세요.
- POI 5.2.x 이상에서는 getCell 동작이 달라져 엑셀 업로드에 영향이 있을 수 있으므로, WebSquare AI에서는 POI 4.1.2 또는 5.1.x 버전을 권장합니다.
- JDK 11 환경에서 POI 4.0.x 사용 시 CPU 과부하 이슈가 보고된 바 있으며, 이 경우 POI 5.1.x로 업그레이드를 권장합니다.
- 정확한 라이브러리 세트는 기술지원팀에 POI 4.1.2 엔진 빌드를 요청하시면 검증된 JAR이 포함되어 전달됩니다.

## 출처

| # | 출처 유형 | 세부 항목 | 유사도 |
|---|----------|----------|--------|
| 1 | Gmail 기술문의 | 한국투자증권 DDP - POI 4.1.2 취약점 조치 엔진 전달 | 0.8782 |
| 2 | Gmail 기술문의 | 85공군 정비창 - POI 교체/제거 목록 | 0.9348 |
| 3 | Gmail 기술문의 | 근로복지공단 - POI 5.1.x / JDK 11 CPU 이슈 | 0.8079 |
| 4 | Confluence 기술지식DB | WebSquare .jar Maven pom.xml 정의 | 0.9291 |
| 5 | W-Tech QNA | POI 버전 문제 advancedExcelDownload 오류 | 0.7816 |

감사합니다.
