"""
RAG 시맨틱 검색 모듈
코사인 유사도 기반 상위 8건 검색 + 쿼리 전처리
"""

import json
import sys
import io
from pathlib import Path

# Windows cp949 인코딩 에러 방지
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import chromadb
from sentence_transformers import SentenceTransformer

try:
    from .preprocessor import preprocess_query
except ImportError:
    from preprocessor import preprocess_query

EMBEDDING_MODEL = "intfloat/multilingual-e5-base"
COLLECTION_NAME = "techassistant_qa"
CHROMA_DIR = str(Path(__file__).parent.parent.parent / "data" / "chroma")
TOP_K = 8
MAX_CONTEXT_LENGTH = 2000


class RAGSearcher:
    def __init__(self, chroma_dir=None):
        self.chroma_dir = chroma_dir or CHROMA_DIR
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        self.client = chromadb.PersistentClient(path=self.chroma_dir)
        self.collection = self.client.get_collection(name=COLLECTION_NAME)
        print(f"[RAG Search] 컬렉션 로드: {self.collection.count()}건")

    def search(self, query, top_k=None, category_filter=None):
        """
        시맨틱 검색 실행

        Args:
            query: 검색 쿼리 (기술문의 내용)
            top_k: 반환 결과 수 (기본 8)
            category_filter: 카테고리 필터 (선택)

        Returns:
            list[dict]: 검색 결과 [{document, metadata, distance, score}, ...]
        """
        top_k = top_k or TOP_K

        # 쿼리 전처리 + e5 모델 "query: " prefix
        cleaned_query = preprocess_query(query)
        query_embedding = self.model.encode([f"query: {cleaned_query}"]).tolist()

        # 필터 조건
        where_filter = None
        if category_filter:
            where_filter = {"category": category_filter}

        # ChromaDB 검색
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

        # 결과 정리
        search_results = []
        if results and results["documents"]:
            for i, (doc, meta, dist) in enumerate(
                zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0],
                )
            ):
                search_results.append(
                    {
                        "rank": i + 1,
                        "document": doc[:MAX_CONTEXT_LENGTH],
                        "metadata": meta,
                        "distance": round(dist, 4),
                        "score": round(1 - dist, 4),  # 코사인 유사도
                    }
                )

        return search_results

    def build_context(self, results):
        """
        검색 결과를 Claude API 컨텍스트 형태로 구성

        Returns:
            str: RAG 컨텍스트 문자열
        """
        if not results:
            return "관련 사례를 찾지 못했습니다."

        context_parts = []
        for r in results:
            meta = r["metadata"]
            source_info = f"[출처: {meta.get('source', '알 수 없음')} | 분류: {meta.get('category', '')} > {meta.get('subcategory', '')} | 유사도: {r['score']:.2f}]"
            context_parts.append(f"--- 참고 사례 #{r['rank']} {source_info} ---\n{r['document']}")

        return "\n\n".join(context_parts)

    def search_with_context(self, query, top_k=None, category_filter=None):
        """
        검색 + 컨텍스트 빌드를 한번에 수행

        Returns:
            dict: {results, context, query}
        """
        results = self.search(query, top_k, category_filter)
        context = self.build_context(results)

        return {
            "query": query,
            "results": results,
            "context": context,
            "result_count": len(results),
        }


def main():
    """CLI 검색 테스트"""
    import argparse

    parser = argparse.ArgumentParser(description="RAG 시맨틱 검색")
    parser.add_argument("query", help="검색 쿼리")
    parser.add_argument("--top-k", type=int, default=TOP_K, help="검색 결과 수")
    parser.add_argument("--category", default=None, help="카테고리 필터")
    args = parser.parse_args()

    searcher = RAGSearcher()
    result = searcher.search_with_context(args.query, args.top_k, args.category)

    print(f"\n검색 쿼리: {result['query']}")
    print(f"검색 결과: {result['result_count']}건\n")

    for r in result["results"]:
        print(f"#{r['rank']} [유사도: {r['score']:.4f}] {r['metadata'].get('source', '')}")
        print(f"  질문: {r['metadata'].get('question', '')[:100]}")
        print()


if __name__ == "__main__":
    main()
