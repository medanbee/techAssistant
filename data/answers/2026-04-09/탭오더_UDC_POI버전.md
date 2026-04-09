안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

문의하신 3건에 대해 확인 후 답변드립니다.

---

## 1. 디자인탭 탭오더에서 EXC(Extended Component)에 nextTabID가 적용되지 않는 현상

디자인탭 Tab Order 편집모드에서 기본 컴포넌트를 상속(extend)한 EXC(확장 컴포넌트)에 대해 숫자는 부여되지만 실제 nextTabID 속성에 반영되지 않는 현상에 대해 확인하였습니다.

현재 디자인탭의 Tab Order 편집모드는 WebSquare 기본 내장 컴포넌트를 대상으로 동작하며, EXC와 같은 확장 컴포넌트에 대해서는 정상 반영되지 않는 제약이 있습니다. 해당 현상에 대해 연구소 측에 확인을 요청드리겠습니다.

### 현재 우회 방법

디자인탭 Tab Order 편집모드 대신, 스크립트에서 직접 nextTabID를 설정하는 방식을 사용할 수 있습니다.

```javascript
// 스크립트에서 직접 탭 순서 지정
컴포넌트ID.setNextTabID("다음컴포넌트ID", "wframeID");
```

---

## 2. 디자인탭 탭오더 기능의 UDC 지원 여부

현재 **UDC는 Tab Order를 지원하지 않습니다.** 이는 WebSquare Studio의 알려진 제약사항입니다.

다만 유사 사례로, 일반 컴포넌트에서 UDC 컴포넌트로 nextTabID를 지정할 때 UDC 첫 번째 컴포넌트의 속성이 readOnly인 경우 nextTabID가 정상 동작하지 않는 현상이 확인되어 **엔진 패치가 예정**되어 있습니다. 해당 패치에서 UDC 탭오더 지원 범위가 어디까지인지 연구소 측에 확인하여 안내드리겠습니다.

### 현재 우회 방법

UDC 내부의 포커스 가능한 컴포넌트에 대해 스크립트로 `setNextTabID()`를 직접 호출하여 탭 순서를 지정할 수 있습니다.

```javascript
// 일반 컴포넌트 → UDC 내부 컴포넌트
input1.setNextTabID("udcInnerInput1", "udcWframe1");

// UDC 내부 컴포넌트 → 일반 컴포넌트
udcInnerInput2.setNextTabID("input2");
```

---

## 3. WebSquare 엔진의 POI 5.x 버전 지원 여부

확인 결과, **POI 5.1.x 버전은 지원 가능**합니다.

- 기존에는 POI 5.x를 공식 지원하지 않았으나, JDK 11 환경에서 POI 4.x 사용 시 CPU 과부하 문제 등으로 인해 **POI 5.1.x 버전용 라이브러리가 별도 제공**된 사례가 있습니다.
- 단, **POI 5.2.x 이상**에서는 `getCell` 동작이 변경되어 엑셀 업로드가 정상 동작하지 않으므로, **POI 5.1.x 버전을 사용**해야 합니다.
- 기존 운영 서버의 엔진은 그대로 사용하시고, POI 5.1.x 관련 lib만 교체하면 됩니다.

사용 중이신 버전(`6.0_0.1204B.20250122.153015_1.8`, WebSquare AI 6.0)에서 POI 5.1.x 적용이 필요하시면 해당 라이브러리를 전달드리겠습니다.

감사합니다.

---

### 참고 출처

| # | 문의 | 출처 | 내용 | 유사도 |
|---|------|------|------|--------|
| 1 | 탭오더/UDC | Gmail 기술문의 | UDC nextTabID 미동작 현상 → 엔진 패치 예정 (AI V6.0 동일 버전) | 0.8536 |
| 2 | UDC | W-Tech QNA | UDC는 tabOrder 미지원 | 0.5231 |
| 3 | 탭오더 | WebSquare 개발 가이드 (SP4) | 탭 키 이동 순서 설정 가이드 | 0.5243 |
| 4 | 탭오더 | API 가이드 (AI) | setNextTabID API 사용법 | 0.8257 |
| 5 | UDC | WebSquare 개발 가이드 (AI) | 확장 컴포넌트(UDC/TTC/EXC) 개요 | 0.5217 |
| 6 | POI | Gmail 기술문의 | 근로복지공단 POI 5.1.x 라이브러리 전달 (JDK 11 CPU 과부하 대응) | 0.5192 |
| 7 | POI | Gmail 기술문의 (JIRA WESD-1861) | POI 5.4.0 업데이트 검토 → AI SP1에서 지원 예정 | 0.8921 |
| 8 | POI | W-Tech QNA | POI 5.x 호환 websquare ai jar 요청 (한국투자증권) | 0.5195 |
