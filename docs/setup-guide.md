# 설치 및 설정 가이드

TechAssistant를 처음 설치하는 분을 위한 단계별 가이드입니다.

## 목차

1. [사전 요구사항](#1-사전-요구사항)
2. [프로젝트 클론 및 의존성 설치](#2-프로젝트-클론-및-의존성-설치)
3. [설정 파일 구성](#3-설정-파일-구성)
4. [데이터 수집](#4-데이터-수집)
5. [데이터 통합 및 분류](#5-데이터-통합-및-분류)
6. [RAG 벡터 인덱싱](#6-rag-벡터-인덱싱)
7. [검색 테스트](#7-검색-테스트)
8. [답변 생성](#8-답변-생성)
9. [트러블슈팅](#9-트러블슈팅)

---

## 1. 사전 요구사항

| 항목 | 버전 | 확인 명령어 |
|------|------|-------------|
| Node.js | >= 18 | `node --version` |
| Python | 3.12 권장 | `python --version` |
| pip | 최신 | `pip --version` |
| Git | 최신 | `git --version` |
| Chrome | 최신 (Puppeteer용) | — |

### Windows 추가 사항

- Python 설치 시 "Add Python to PATH" 체크
- Python 경로가 msys64를 가리키는 경우, `PYTHON_PATH` 환경변수를 직접 설정해야 합니다:
  ```
  set PYTHON_PATH=C:\Users\사용자명\AppData\Local\Programs\Python\Python312\python.exe
  ```

---

## 2. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 클론
git clone https://github.com/medanbee/techAssistant.git
cd techAssistant

# Node.js 의존성 설치
npm install

# Python 의존성 설치
pip install -r requirements.txt
```

### Python 패키지 설치 확인

```bash
python -c "import chromadb; print('chromadb OK')"
python -c "from sentence_transformers import SentenceTransformer; print('sentence-transformers OK')"
python -c "from rank_bm25 import BM25Okapi; print('rank_bm25 OK')"
```

모두 OK가 출력되어야 합니다.

---

## 3. 설정 파일 구성

### config.json 생성

```bash
cp config/config.example.json config/config.json
```

`config/config.json`을 열어 아래 항목을 설정합니다:

### 3-1. Gmail 설정 (기술문의 메일 수집용)

```json
{
  "gmail": {
    "user": "your-email@gmail.com",
    "appPassword": "xxxx xxxx xxxx xxxx"
  }
}
```

**Gmail App Password 생성 방법:**
1. Google 계정 > 보안 > 2단계 인증 활성화
2. Google 계정 > 보안 > 앱 비밀번호
3. "메일" 선택 > 비밀번호 생성
4. 생성된 16자리 비밀번호를 `appPassword`에 입력

### 3-2. W-Tech 설정 (QNA 게시판 크롤링용)

```json
{
  "wtech": {
    "baseUrl": "https://실제-wtech-url",
    "credentials": {
      "username": "아이디",
      "password": "비밀번호"
    }
  }
}
```

### 3-3. Confluence 설정

```json
{
  "confluence": {
    "baseUrl": "https://실제-confluence-url",
    "credentials": {
      "username": "아이디",
      "password": "비밀번호"
    }
  }
}
```

### 3-4. Anthropic API 설정 (답변 생성용)

```json
{
  "anthropic": {
    "apiKey": "sk-ant-api03-...",
    "model": "claude-sonnet-4-20250514"
  }
}
```

**API 키 발급:** https://console.anthropic.com > API Keys

> **참고:** RAG 검색만 사용할 경우 Anthropic API 키는 없어도 됩니다. Claude Code에서 직접 답변 생성도 가능합니다.

### 3-5. 답변 템플릿 설정

```json
{
  "answer": {
    "responderName": "본인 이름",
    "template": "안녕하세요.\n인스웨이브 기술지원팀 {{name}} 프로입니다.\n\n{{topic}}과 관련하여 확인 후 답변드립니다.\n\n{{content}}\n\n감사합니다."
  }
}
```

---

## 4. 데이터 수집

### 전체 수집

```bash
npm run collect
```

### 개별 수집

```bash
npm run collect:gmail        # Gmail 기술문의
npm run collect:wtech        # W-Tech QNA
npm run collect:confluence   # Confluence
```

수집된 데이터는 `data/raw/` 폴더에 저장됩니다.

> **참고:** 각 소스별 인증 정보가 config.json에 올바르게 설정되어 있어야 합니다. 인증 오류 발생 시 [트러블슈팅](#9-트러블슈팅) 섹션을 참고하세요.

---

## 5. 데이터 통합 및 분류

```bash
# 데이터 통합 (data/raw/ → data/processed/all_qa.json)
node scripts/merge.js

# 자동 분류 (13개 대분류)
npm run classify
```

통합 후 `data/processed/` 폴더에 아래 파일이 생성됩니다:

| 파일 | 설명 |
|------|------|
| `all_qa.json` | 통합된 Q&A 데이터 |
| `classified_qa.json` | 분류 완료 데이터 |
| `classification_stats.json` | 분류 통계 |
| `category_digests.json` | 카테고리별 다이제스트 |

---

## 6. RAG 벡터 인덱싱

### 최초 인덱싱 (전체)

```bash
npm run index:reset
```

- 임베딩 모델: `intfloat/multilingual-e5-base` (768차원)
- 최초 실행 시 모델 다운로드 (약 1GB)
- 24,000건 기준 약 40분 소요 (CPU)
- `data/chroma/` 폴더에 벡터 DB 생성

### 증분 인덱싱 (추가 데이터만)

```bash
npm run index
```

---

## 7. 검색 테스트

```bash
# RAG 검색 테스트 (하이브리드: 벡터 + BM25)
python src/rag/searcher.py "gridView 셀 병합 방법"
```

출력 예시:
```
검색 쿼리: gridView 셀 병합 방법
검색 결과: 8건

#1 [최종: 0.9365 | 벡터: 0.8942 | BM25: 1.0000] W-Tech QNA
  질문: gridView에서 셀 병합하는 방법 문의
```

검색 결과가 정상적으로 나오면 인덱싱이 완료된 것입니다.

---

## 8. 답변 생성

### 방법 1: Claude Code에서 직접 생성 (추천)

Claude Code 실행 후 기술문의 내용을 입력하면 RAG 검색 → API 검증 → 답변 생성을 수행합니다. Anthropic API 키가 별도로 필요하지 않습니다.

### 방법 2: answer.js 스크립트 (Anthropic API 키 필요)

```bash
node scripts/answer.js "gridView에서 셀 병합하는 방법" --version v5.0
```

파이프라인 자동 실행:
1. 문의 분류
2. RAG 검색
3. Claude API 답변 생성
4. API 검증 (미확인 API 자동 재생성)
5. `data/answers/날짜/주제.md` 자동 저장

### 방법 3: 전체 파이프라인 (수집 → 분류 → 인덱싱)

```bash
npm run pipeline
```

---

## 9. 트러블슈팅

### Python 관련

**문제: `python3` 명령어를 찾을 수 없음 (Windows)**
```bash
# PYTHON_PATH 환경변수 설정
set PYTHON_PATH=C:\Users\사용자명\AppData\Local\Programs\Python\Python312\python.exe
```

**문제: `ModuleNotFoundError`**
```bash
# 의존성 재설치
pip install -r requirements.txt
```

**문제: sentence-transformers 모델 다운로드 실패**
- 사내 프록시 환경이면 `HF_ENDPOINT` 환경변수 설정 필요
- 또는 다른 PC에서 모델을 다운받아 `~/.cache/huggingface/` 폴더에 복사

### 데이터 수집 관련

**문제: Gmail 수집 실패 — `AUTHENTICATIONFAILED`**
- Gmail 2단계 인증 + App Password 확인
- "보안 수준이 낮은 앱" 허용 여부 확인 (App Password 사용 시 불필요)

**문제: W-Tech 수집 실패 — 로그인 오류**
- `config.json`의 W-Tech credentials 확인
- Puppeteer Chrome 경로 확인 (사내 환경에서 Chrome 경로가 다를 수 있음)

**문제: Confluence 수집 실패**
- Confluence API 토큰 또는 쿠키 인증 확인
- 사내 VPN 연결 상태 확인

### 인덱싱 관련

**문제: 인덱싱이 중간에 멈춤**
```bash
# unbuffered 모드로 실행하여 로그 확인
python -u src/rag/indexer.py --reset
```

**문제: ChromaDB 오류 — `embedding dimension mismatch`**
- 임베딩 모델이 변경된 경우 전체 재인덱싱 필요:
```bash
npm run index:reset
```

### 답변 생성 관련

**문제: `answer.js` 실행 시 API 키 오류**
- `config.json`의 `anthropic.apiKey` 확인
- https://console.anthropic.com 에서 키 상태 확인

---

## 디렉토리 구조 참고

```
techAssistant/
├── config/
│   ├── config.example.json  ← 이걸 복사해서 config.json 생성
│   └── config.json          ← 실제 인증 정보 (gitignore)
├── data/
│   ├── raw/                 ← 수집된 원본 데이터 (gitignore)
│   ├── processed/           ← 통합/분류 데이터 (gitignore)
│   ├── chroma/              ← 벡터 DB (gitignore)
│   └── answers/             ← 생성된 답변 파일
├── src/
│   ├── collectors/          ← 데이터 수집 모듈
│   ├── classifier/          ← 자동 분류
│   ├── rag/                 ← RAG 검색 (Python)
│   └── generator/           ← 답변 생성 파이프라인
└── scripts/                 ← CLI 스크립트
```

---

## 빠른 시작 요약

```bash
# 1. 클론 및 설치
git clone https://github.com/medanbee/techAssistant.git
cd techAssistant
npm install
pip install -r requirements.txt

# 2. 설정
cp config/config.example.json config/config.json
# config.json 편집 → 인증 정보 입력

# 3. 데이터 수집 → 통합 → 분류 → 인덱싱
npm run collect
node scripts/merge.js
npm run classify
npm run index:reset

# 4. 검색 테스트
python src/rag/searcher.py "테스트 검색어"

# 5. 답변 생성 (API 키 필요)
node scripts/answer.js "기술문의 내용"
```
