# config.xml에 radio 관련 속성 적용 안됨

## 문의
config.xml에 radio 관련 속성을 기재했으나 적용되지 않습니다.

## 답변

안녕하세요.
인스웨이브 기술지원팀 이단비 프로입니다.

config.xml의 radio 속성 적용과 관련하여 확인 후 답변드립니다.

radio, checkbox, checkcombobox, multiselect, slideHide, spinner 등의 컴포넌트는 config.xml에 속성을 설정할 때 **useConfig 속성을 true로 설정**해주셔야 config.xml에 기재된 내용이 적용됩니다.

이는 해당 컴포넌트들이 config.xml의 설정을 적용하겠다는 의미로 useConfig를 명시적으로 활성화해야 하는 구조이기 때문입니다.

### 적용 예시

```xml
<config>
    <component>
        <xf:select1>
            <useConfig>true</useConfig>
            <!-- radio 관련 속성 설정 -->
        </xf:select1>
    </component>
</config>
```

### 참고사항

1. **배포 엔진의 기본 config.xml에 해당 컴포넌트 노드가 없는 경우**, config.xml에 설정 시 별도 확인이 필요합니다.
2. config.xml과 개별 화면 XML에 동일 속성이 설정된 경우, **개별 화면 XML의 속성값이 우선 적용**됩니다. (config.xml → 화면 XML 순서로 로딩되므로 마지막에 적용된 값이 최종 반영)
3. 개별 화면에서 해당 속성에 값을 명시하지 않은 경우(default 상태)에만 config.xml의 설정값이 적용됩니다.

감사합니다.

## 출처
- [W-Tech QNA] config.xml 컴포넌트 기본 속성값 설정 관련 문의 (WebSquare 2.0)
- [W-Tech FAQ] config.xml에서 웹스퀘어 컴포넌트 속성 일괄적용
- [W-Tech QNA] config.xml 속성 우선순위 관련 문의
