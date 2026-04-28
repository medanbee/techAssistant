안녕하세요.
인스웨이브 기술지원팀입니다.

Any-ID 연동 관련 문의 확인하였습니다.

---

## 먼저 안내드릴 사항

질문하신 `customArgumentResolvers`에 등록된 웹스퀘어용 어댑터 클래스(`WebSquareArgumentResolver`, `CustomWqArgumentResolver`, `WqAdapter` 계열 등)는 **웹스퀘어 엔진에 포함된 리소스가 아니라, 인스웨이브가 "서버 프레임워크 연동 심화가이드"와 함께 샘플 Java 소스로 배포**하는 파일입니다. 고객사에서 해당 샘플을 프로젝트에 import하여 그대로 사용하거나 필요에 따라 커스터마이징해 사용하시는 구조입니다.

따라서 이번 이슈는 엔진 동작 자체의 문제라기보다는 **Spring MVC 레이어의 설정 이슈**에 해당합니다. 저희 지원 범위 내에서 가이드 수준의 원인 분석과 방향 안내는 드릴 수 있으나, 실제 설정 수정 및 원인 확정은 귀사 개발팀에서 `dispatcher-servlet.xml` 및 어댑터 클래스 소스를 직접 확인하신 뒤 진행 부탁드립니다.

---

## 일반적인 원인 (참고용)

`@RequestBody` + `application/json` 호출에서 415 Unsupported Media Type 이 발생하고, 인터셉터의 `postHandle`까지 진입하지 않는 경우는 아래 패턴이 가장 흔합니다.

1. **`AnnotationMethodHandlerAdapter`(Spring 3.1부터 deprecated) 사용** 중이면서 `messageConverters`에 `MappingJackson2HttpMessageConverter`가 등록되어 있지 않은 경우. JSON body를 소비할 수 있는 converter가 없어, 어댑터 단계에서 `HttpMediaTypeNotSupportedException`이 발생하고 컨트롤러 디스패치 전에 415가 반환됩니다. 이 경우 `preHandle`은 통과하지만 `postHandle` / 컨트롤러는 호출되지 않는 증상과 일치합니다.
2. 커스텀 ArgumentResolver 자체가 `@RequestBody`를 차단하지는 않습니다. 다만 레거시 어댑터 설정에 웹스퀘어 연동용 converter / resolver만 등록되어 있어, 결과적으로 표준 JSON 요청을 받을 수 있는 구성이 아닌 경우가 많습니다.

즉, 말씀하신 "어댑터 때문에 `@RequestBody`가 동작하지 않는 것인지, 이런 방식의 호출이 원천 불가능한 것인지"에 대한 답은 — **원천 불가능한 것은 아니며, 설정 보완으로 사용 가능**합니다.

---

## 해결 방향 (참고용)

### (권장) Any-ID 연동 API만 별도 URL 패턴 + 별도 DispatcherServlet 으로 분리

Any-ID 연동 API는 웹스퀘어 화면 요청과 성격이 다르므로, 별도 `DispatcherServlet`으로 분리하여 표준 Spring MVC 설정(`<mvc:annotation-driven>` + Jackson converter)을 사용하시면 기존 웹스퀘어 어댑터 구성을 건드리지 않고 `@RequestBody`를 그대로 활용 가능합니다.

### 기존 DispatcherServlet 유지가 필요한 경우

- `messageConverters`에 `MappingJackson2HttpMessageConverter`를 명시적으로 추가하거나,
- Spring 3.1+ 환경이라면 `RequestMappingHandlerAdapter` 기반 구성(인스웨이브 심화가이드의 `CustomRequestMappingHandlerAdapter` 샘플)으로 전환하시는 방법이 있습니다.

---

## 참고 가이드

- 서버 프레임워크 연동 가이드 — WebSquare JSON 어댑터 연동 / DefaultAdapterServlet
  https://docs1.inswave.com/sp4_user_guide/7b75b1c1b873ba77

---

## 추가 확인 요청

정확한 원인 파악을 위해 아래 정보를 공유해 주시면 도움이 됩니다.

1. 웹스퀘어 엔진 버전 (미리보기 → Ctrl + 우클릭 → Version 정보)
2. Spring Framework / 전자정부프레임워크 버전
3. 현재 `dispatcher-servlet.xml` 전체 (특히 `AnnotationMethodHandlerAdapter`, `customArgumentResolvers`, `messageConverters` 부분)
4. **현재 사용 중인 어댑터 클래스의 정확한 패키지 · 클래스명** — 해당 샘플이 인스웨이브가 배포한 버전과 일치하는지 추가 확인이 가능합니다.
5. 문제의 컨트롤러 메서드 시그니처(`@RequestMapping`, `@RequestBody` 선언부)

※ 위 안내는 일반적인 Spring MVC 구성 기준 참고용입니다. 귀사 프로젝트의 Spring / 전자정부프레임워크 버전에 따라 적용 방식이 달라질 수 있으므로, 실제 설정 적용은 개발팀에서 검토 후 진행 부탁드립니다.

---

## 출처

| # | 데이터 유형 | 출처 위치 | 세부 항목 | 유사도 |
|---|-----------|---------|---------|-------|
| 1 | Gmail 기술문의 | 웹스퀘어 관련 로그 분석 요청 회신 | CustomWqArgumentResolver.java는 웹스퀘어 엔진에 포함된 리소스가 아님 명시, Spring MVC 연동 과정 이슈로 판단 | 0.9129 |
| 2 | W-Tech QNA | 에이텍 - 전자정부+웹스퀘어 세팅 | 고객이 심화가이드의 샘플 파일(CustomWqArgumentResolver, UiAdaptor, WqAdapter, WqAdapterViewByMap, WqDTO) import | 0.7777 |
| 3 | W-Tech QNA | 전자정부프레임웍 1.0→3.6 업그레이드 파라미터 전달 문제 | CustomRequestMappingHandlerAdapter / WebSquareArgumentResolver / WqAdapter 샘플 다운로드 요청, MessageConverter 설정 가이드 언급 | 0.8957 |
| 4 | Confluence DB | 전자정부프레임웍 연계샘플 | Spring 3.1+ HandlerMethodArgumentResolver 사용 권장, Custom Resolver 우선순위 관련 | 0.8233 |
| 5 | W-Tech QNA | 수출입은행 - spring3.2 연동 request parameter 미수신 | DispatcherServlet 사용 시 파라미터 미전달 사례 | 0.5241 |
| 6 | W-Tech QNA | KDB생명 VOC 고도화 - 415 응답 | Submission 호출 시 415 발생 패턴 | 0.7206 |
| 7 | 공식 문서 | WebSquare JSON 어댑터 연동 - DefaultAdapterServlet | docs1.inswave.com/sp4_user_guide | - |

감사합니다.
