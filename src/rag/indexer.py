"""
RAG 벡터 인덱싱 모듈
ChromaDB + multilingual-e5-base (768차원)
100건 단위 배치 처리, 개별 재시도 로직, 텍스트 전처리 적용
"""

import json
import os
import sys
from pathlib import Path

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

try:
    from .preprocessor import make_clean_document, extract_metadata
except ImportError:
    from preprocessor import make_clean_document, extract_metadata

# 설정
EMBEDDING_MODEL = "intfloat/multilingual-e5-base"
COLLECTION_NAME = "techassistant_qa"
BATCH_SIZE = 100
CHROMA_DIR = str(Path(__file__).parent.parent.parent / "data" / "chroma")
PROCESSED_DIR = str(Path(__file__).parent.parent.parent / "data" / "processed")


class RAGIndexer:
    def __init__(self, chroma_dir=None):
        self.chroma_dir = chroma_dir or CHROMA_DIR
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        self.client = chromadb.PersistentClient(path=self.chroma_dir)
        self.collection = None
        print(f"[RAG Indexer] 임베딩 모델: {EMBEDDING_MODEL} (768차원)")
        print(f"[RAG Indexer] ChromaDB 경로: {self.chroma_dir}")

    def init_collection(self, reset=False):
        """컬렉션 초기화"""
        if reset:
            try:
                self.client.delete_collection(COLLECTION_NAME)
                print("[RAG Indexer] 기존 컬렉션 삭제")
            except Exception:
                pass

        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        print(f"[RAG Indexer] 컬렉션 '{COLLECTION_NAME}' 준비 완료 (기존 {self.collection.count()}건)")

    def load_data(self, data_path=None):
        """분류 완료된 Q&A 데이터 로드"""
        data_path = data_path or os.path.join(PROCESSED_DIR, "classified_qa.json")
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"[RAG Indexer] 데이터 로드: {len(data)}건")
        return data

    def index(self, data, reset=False):
        """전체 데이터 인덱싱 (100건 배치)"""
        self.init_collection(reset=reset)

        total = len(data)
        indexed = 0
        failed = 0

        for i in range(0, total, BATCH_SIZE):
            batch = data[i : i + BATCH_SIZE]
            batch_success = self._index_batch(batch, start_idx=i)
            indexed += batch_success
            failed += len(batch) - batch_success
            print(f"[RAG Indexer] 진행: {min(i + BATCH_SIZE, total)}/{total} (성공: {indexed}, 실패: {failed})")

        print(f"\n[RAG Indexer] 인덱싱 완료: {indexed}건 성공, {failed}건 실패")
        print(f"[RAG Indexer] 컬렉션 총 문서 수: {self.collection.count()}")

    def _index_batch(self, batch, start_idx=0):
        """배치 인덱싱 (개별 재시도 로직)"""
        documents = []
        metadatas = []
        ids = []

        for j, item in enumerate(batch):
            doc_text = make_clean_document(item)
            if not doc_text.strip():
                continue

            doc_id = f"doc_{start_idx + j}"
            metadata = extract_metadata(item)

            documents.append(doc_text)
            metadatas.append(metadata)
            ids.append(doc_id)

        if not documents:
            return 0

        # 배치 임베딩 (e5 모델은 "passage: " prefix 필요)
        try:
            prefixed_docs = [f"passage: {doc}" for doc in documents]
            embeddings = self.model.encode(prefixed_docs, show_progress_bar=False).tolist()
            self.collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
            )
            return len(documents)
        except Exception as e:
            print(f"[RAG Indexer] 배치 실패, 개별 재시도: {e}")
            return self._index_individually(documents, metadatas, ids)

    def _index_individually(self, documents, metadatas, ids):
        """개별 재시도"""
        success = 0
        for doc, meta, doc_id in zip(documents, metadatas, ids):
            try:
                embedding = self.model.encode([f"passage: {doc}"], show_progress_bar=False).tolist()
                self.collection.upsert(
                    ids=[doc_id],
                    embeddings=embedding,
                    documents=[doc],
                    metadatas=[meta],
                )
                success += 1
            except Exception as e:
                print(f"[RAG Indexer] 개별 인덱싱 실패 ({doc_id}): {e}")
        return success

def main():
    """CLI 실행"""
    import argparse

    parser = argparse.ArgumentParser(description="RAG 벡터 인덱싱")
    parser.add_argument("--data", default=None, help="입력 데이터 경로")
    parser.add_argument("--reset", action="store_true", help="컬렉션 초기화 후 재인덱싱")
    args = parser.parse_args()

    indexer = RAGIndexer()
    data = indexer.load_data(args.data)
    indexer.index(data, reset=args.reset)


if __name__ == "__main__":
    main()
