
import sys, json
sys.path.insert(0, 'src')

# stderr로 모델 로딩 로그 리다이렉트
import io
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from rag.searcher import RAGSearcher
searcher = RAGSearcher()

names = json.loads('["getData","getFocusedRowIndex","getFocusedColumnID","setCellData","getCellData","oncustompaste","onafterpaste","pasteData","rowIdx","colIdx","checkEditOnPaste","dataList","cellValue"]')
results = []

for name in names:
    try:
        r = searcher.collection.query(
            query_texts=[name],
            n_results=1,
            where_document={'$contains': name},
            include=['metadatas', 'distances']
        )
        if r['metadatas'][0]:
            m = r['metadatas'][0][0]
            d = r['distances'][0][0]
            results.append({'name': name, 'found': True, 'source': m.get('source',''), 'score': round(1-d, 4)})
        else:
            results.append({'name': name, 'found': False})
    except Exception as e:
        results.append({'name': name, 'found': False, 'error': str(e)})

# 결과를 stdout 마지막에 JSON으로 출력
print('VERIFY_RESULT:' + json.dumps(results, ensure_ascii=False))
