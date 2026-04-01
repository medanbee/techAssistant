# advancedExcelUpload 호출 시 postMessage DOMException 오류 (AI v6.0)

- **문의일시**: 2026-03-31
- **분류**: 엑셀 처리
- **답변 근거**: 일반 기술 지식 기반 (내부 사례 없음)

## 문의 내용

Websquare AI Engine V6.0.0 (6.0_0.1470B.20260206.1161844_1.8)

참조받은 컨피그 파일의 엔진 버전은 v6.0.0 build date: 20250107_0926_x86_64_B

grid.advancedExcelUpload(options) 호출 시:
- DOMException: Failed to execute 'postMessage' on 'Window': function() { ... } could not be cloned

config.xml에 해당 내용을 전부 지우면 엑셀업로드는 작동하나, 화면이 열릴 때:
- Uncaught SyntaxError: Unexpected identifier 'Object'

## 답변

안녕하세요.
인스웨이브 기술지원팀 담당자 프로입니다.

WebSquare AI v6.0 환경에서 `advancedExcelUpload` 호출 시 `postMessage` DOMException 오류 및 config.xml 설정 관련 문의에 대해 확인 후 답변드립니다.

※ 내부 데이터 기준 동일 사례가 없어, WebSquare 공식 문서 및 일반적인 기술 지식을 기반으로 안내드립니다. 정확한 내용은 추가 확인이 필요할 수 있습니다.

### 원인 분석

**`DOMException: Failed to execute 'postMessage' on 'Window': ... could not be cloned`**

이 오류는 `postMessage`로 전달하려는 데이터에 **직렬화(serialize)할 수 없는 객체**(function, DOM 요소 등)가 포함되어 있을 때 발생합니다.

`advancedExcelUpload`는 내부적으로 별도 iframe(`advancedfileUpload.html`)을 열어 엑셀 파일을 처리하며, 부모 창과 iframe 간 `postMessage`로 통신합니다. config.xml에 설정된 특정 항목이 이 통신 과정에서 function 객체를 포함하게 되면 직렬화에 실패하여 위 오류가 발생할 수 있습니다.

### 해결 방법

**1) config.xml에서 원인이 되는 설정 항목 확인**

config.xml에서 `advancedExcelUpload` 관련 설정을 확인합니다. 특히 아래 항목들이 function이나 객체를 참조하고 있는지 확인해 주세요.

```xml
<!-- config.xml 확인 대상 -->
<advancedExcelUploadPopupURL value="..." />
<advancedExcelUploadOptions value="..." />
```

- `advancedExcelUploadPopupURL` — 경로가 현재 엔진 버전과 맞는지 확인
- 참조받은 config.xml(v6.0.0 build date: 20250107)과 현재 엔진(6.0_0.1470B.20260206)의 **버전 차이**가 있으므로, config.xml 설정이 현재 엔진과 호환되지 않을 수 있습니다

**2) config.xml 설정을 현재 엔진 버전에 맞게 업데이트**

엔진 버전이 다르면 config.xml의 설정 구조가 변경되었을 수 있습니다.

```
참조받은 config.xml 엔진: v6.0.0 build date 20250107_0926
현재 사용 엔진:           6.0_0.1470B.20260206.1161844_1.8
```

현재 엔진에 포함된 기본 config.xml과 비교하여 차이를 확인해 주세요. 엔진 배포 파일 내 `websquare/config.xml` 또는 `_websquare_/config.xml`에 기본 설정이 있습니다.

**3) `Uncaught SyntaxError: Unexpected identifier 'Object'` 해결**

config.xml의 특정 설정을 제거하면 엑셀 업로드는 동작하지만 `SyntaxError`가 발생한다면, 해당 config.xml 설정에 **JavaScript 구문 오류**가 있는 것입니다.

확인 방법:
- 브라우저 개발자 도구(F12) > Console 탭에서 오류가 발생하는 **정확한 파일명과 라인 번호** 확인
- config.xml에서 `<script>` 또는 JavaScript 코드가 포함된 설정을 찾아 구문 오류 확인
- 특히 `Object`가 예약어로 충돌하는 위치가 있는지 확인

### 추가 확인 요청 사항

보다 정확한 원인 파악을 위해 아래 정보를 추가로 확인 부탁드립니다.

1. **현재 사용 중인 config.xml 전체** (또는 `advancedExcelUpload` 관련 설정 부분)
2. **`postMessage` 오류의 전체 스택 트레이스** (개발자 도구 Console)
3. **`SyntaxError` 발생 시 정확한 파일명과 라인 번호**
4. **엔진 배포 시 포함된 기본 config.xml과 현재 config.xml의 차이점**

감사합니다.

[출처: WebSquare 공식 문서 기반 일반 안내 | W-Tech QNA - AE관리시스템 advancedExcelUploadPopupURL 경로 설정 | Confluence 기술지식DB - advancedExcelUpload decrypt exception 처리 | W-Tech QNA - 엔진 패치 후 FileType 오류 websquare.xml 설정]
