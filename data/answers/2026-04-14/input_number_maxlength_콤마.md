# InputBox number 타입 maxlength에 콤마(,)가 길이를 차지하는 문제

안녕하세요.
인스웨이브 기술지원팀입니다.

InputBox에 `applyFormat="all"`, `displayFormat="#,###"` 적용 시 콤마(,)가 maxlength 길이를 차지하는 문제에 대해 안내드립니다.

## 원인 분석

- `applyFormat="all"` 설정 시, 입력 중에도 포맷이 적용되어 콤마(,)가 포함된 상태로 length가 계산됩니다.
- `byteCheckIgnoreChar`는 **`maxByteLength`** 속성과 함께 동작하는 속성으로, **`maxlength`** 속성에는 적용되지 않습니다. 이것이 `byteCheckIgnoreChar=","` 적용 후에도 현상이 동일한 원인입니다.

## 해결 방법

### `maxByteLength` + `byteCheckIgnoreChar` 사용 (권장)

기존 `maxlength`를 **`maxByteLength`**로 변경하고, `byteCheckIgnoreChar=","`를 적용합니다.
`byteCheckIgnoreChar`는 `maxByteLength`와 쌍으로 동작하며, `maxlength`와는 동작하지 않습니다.

```xml
<w2:inputBox
    dataType="number"
    applyFormat="all"
    displayFormat="#,###"
    maxByteLength="10"
    byteCheckIgnoreChar=","
/>
```

### 속성 대응 관계 정리

| 길이 제한 속성 | 콤마 제외 속성 | SP5 지원 |
|--------------|--------------|---------|
| `maxByteLength` | `byteCheckIgnoreChar=","` | O |
| `maxlength` | `lengthCheckIgnoreChar=","` | AI 버전에서 확인, SP5 미확인 |

## 추가 참고

- 부호(-, +) 입력이 필요한 경우, `adjustMaxLength="true"` 속성을 추가하면 부호 문자도 maxlength에서 제외됩니다.

## 출처

| # | 출처 유형 | 세부 항목 | 유사도 |
|---|----------|----------|--------|
| 1 | API 가이드 (AI) | input lengthCheckIgnoreChar 속성 | 0.9231 |
| 2 | W-Tech QNA | FDS 금액입력 maxlength 부호 제외 문의 | 0.9210 |
| 3 | W-Tech QNA | InputBox 숫자 최대값 제한 (maxByteLength + byteCheckIgnoreChar) | 0.9389 |
| 4 | API 가이드 (AI) | input adjustMaxLength 속성 | 0.8212 |

감사합니다.
