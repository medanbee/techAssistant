"""
RAG 3단계: AI 답변 생성
벡터 검색 결과를 컨텍스트로 넣고 Claude API로 답변 생성

사용법: python rag/ask.py "질문"
예시: python rag/ask.py "gridView에서 셀 합치는 방법 알려줘"
"""
import json
import os
import sys

DB_DIR = os.path.join(os.path.dirname(__file__), 'chroma_db')


def search(query, n_results=8):
    """벡터 검색"""
    import chromadb
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

    embedding_fn = SentenceTransformerEmbeddingFunction(
        model_name="paraphrase-multilingual-MiniLM-L12-v2"
    )

    client = chromadb.PersistentClient(path=DB_DIR)
    collection = client.get_collection(
        name="tech_support",
        embedding_function=embedding_fn,
    )

    results = collection.query(
        query_texts=[query],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )

    return results


def build_context(results):
    """검색 결과를 컨텍스트 문자열로 변환"""
    context_parts = []

    for i, (doc, meta, dist) in enumerate(zip(
        results['documents'][0],
        results['metadatas'][0],
        results['distances'][0],
    )):
        similarity = max(0, 1 - dist)
        context_parts.append(
            f"[참고자료 {i+1}] (유사도: {similarity:.0%}, 소스: {meta.get('source', '')})\n"
            f"제목: {meta.get('title', '')}\n"
            f"{doc[:2000]}\n"
        )

    return '\n---\n'.join(context_parts)


def generate_answer_with_api(query, context):
    """Anthropic API로 답변 생성"""
    try:
        import anthropic
    except ImportError:
        print("anthropic 패키지가 필요합니다: pip install anthropic")
        return None

    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key:
        return None

    client = anthropic.Anthropic(api_key=api_key)

    system_prompt = """당신은 인스웨이브 기술지원팀의 WebSquare 전문가입니다.
아래 참고자료를 기반으로 고객의 기술문의에 정확하고 친절하게 답변해주세요.

규칙:
- 참고자료에 있는 내용을 기반으로 답변하세요
- 참고자료에 없는 내용은 추측하지 말고, 확인이 필요하다고 안내하세요
- 코드나 설정 예시가 있으면 포함하세요
- 답변은 한국어로 작성하세요
- 인스웨이브 기술지원팀 답변 형식으로 작성하세요"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": f"참고자료:\n{context}\n\n---\n\n고객 문의: {query}\n\n위 참고자료를 기반으로 답변을 작성해주세요."
            }
        ]
    )

    return message.content[0].text


def generate_answer_template(query, results):
    """API 없이 템플릿 기반 답변 생성 (fallback)"""
    output = []
    output.append("=" * 70)
    output.append("  RAG 검색 결과 기반 답변 자료")
    output.append("=" * 70)
    output.append(f"\n질문: {query}\n")

    output.append("─" * 70)
    output.append("  [가장 관련성 높은 답변]")
    output.append("─" * 70)

    if results['documents'][0]:
        best = results['documents'][0][0]
        meta = results['metadatas'][0][0]
        dist = results['distances'][0][0]
        similarity = max(0, 1 - dist)

        output.append(f"\n출처: {meta.get('title', '')} (유사도: {similarity:.0%})")
        output.append(f"소스: {meta.get('source', '')} | 날짜: {meta.get('date', '')}\n")
        output.append(best[:2000])

    output.append(f"\n{'─' * 70}")
    output.append("  [추가 참고 자료]")
    output.append("─" * 70)

    for i in range(1, min(len(results['documents'][0]), 5)):
        doc = results['documents'][0][i]
        meta = results['metadatas'][0][i]
        dist = results['distances'][0][i]
        similarity = max(0, 1 - dist)

        output.append(f"\n[{i+1}] {meta.get('title', '')} (유사도: {similarity:.0%})")
        # 답변 부분만 추출
        answer_start = doc.find('답변:')
        if answer_start >= 0:
            output.append(doc[answer_start:answer_start+500])
        else:
            output.append(doc[:500])

    output.append(f"\n{'─' * 70}")
    return '\n'.join(output)


def main():
    if len(sys.argv) < 2:
        print("사용법: python rag/ask.py \"질문\"")
        print("")
        print("예시:")
        print("  python rag/ask.py \"gridView에서 셀 합치는 방법\"")
        print("  python rag/ask.py \"엑셀 다운로드하면 느낌표 나와요\"")
        print("  python rag/ask.py \"웹스퀨 화면 로딩이 느려요\"")
        print("  python rag/ask.py \"하이브리드 앱에서 카메라 쓰는 법\"")
        print("")
        print("ANTHROPIC_API_KEY 환경변수가 설정되면 AI 답변 생성,")
        print("없으면 검색 결과 기반 템플릿 답변을 제공합니다.")
        sys.exit(0)

    query = sys.argv[1]
    n_results = int(sys.argv[2]) if len(sys.argv) > 2 else 8

    print(f"질문: \"{query}\"\n")
    print("검색 중...\n")

    results = search(query, n_results)

    if not results['documents'][0]:
        print("관련 자료를 찾지 못했습니다.")
        return

    # API 키가 있으면 AI 답변 생성
    context = build_context(results)

    if os.environ.get('ANTHROPIC_API_KEY'):
        print("AI 답변 생성 중...\n")
        answer = generate_answer_with_api(query, context)
        if answer:
            print("=" * 70)
            print("  AI 생성 답변")
            print("=" * 70)
            print(f"\n{answer}\n")
            print("=" * 70)
            print("\n[참고한 자료]")
            for i, meta in enumerate(results['metadatas'][0][:5]):
                dist = results['distances'][0][i]
                sim = max(0, 1 - dist)
                print(f"  {i+1}. {meta.get('title', '')} ({sim:.0%}) - {meta.get('source', '')}")
            return

    # API 없으면 템플릿 답변
    print(generate_answer_template(query, results))


if __name__ == '__main__':
    main()
