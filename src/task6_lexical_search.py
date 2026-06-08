"""
Task 6 — Lexical Search Module (BM25).

BM25 (Okapi): score = Σ IDF(qi) * tf*(k1+1) / (tf + k1*(1-b+b*|d|/avgdl)).
- k1=1.5 (bão hoà term), b=0.75 (chuẩn hoá độ dài). TF cao + từ hiếm (IDF) -> điểm cao.

Tokenize tiếng Việt: lowercase + tách theo ký tự chữ/số (giữ dấu tiếng Việt) bằng regex.
Corpus lấy từ data/index/chunks.json (do Task 4 tạo) để cùng tập chunk với dense search.
"""

import json
import re
from functools import lru_cache

try:
    from .task4_chunking_indexing import CHUNKS_JSON
except ImportError:
    from task4_chunking_indexing import CHUNKS_JSON

_TOKEN_RE = re.compile(r"\w+", re.UNICODE)


def tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


@lru_cache(maxsize=1)
def _load_corpus() -> tuple:
    """Đọc chunks.json -> (corpus, bm25). Cache lại."""
    from rank_bm25 import BM25Okapi

    if not CHUNKS_JSON.exists():
        return [], None
    corpus = json.loads(CHUNKS_JSON.read_text(encoding="utf-8"))
    tokenized = [tokenize(doc["content"]) for doc in corpus]
    bm25 = BM25Okapi(tokenized)
    return corpus, bm25


def build_bm25_index(corpus: list[dict]):
    """Xây BM25 index từ corpus truyền vào (dùng khi muốn index thủ công)."""
    from rank_bm25 import BM25Okapi

    return BM25Okapi([tokenize(doc["content"]) for doc in corpus])


def lexical_search(query: str, top_k: int = 10) -> list[dict]:
    """
    Tìm kiếm từ khoá bằng BM25.

    Returns:
        List of {'content', 'score', 'metadata'} sorted by score descending.
    """
    corpus, bm25 = _load_corpus()
    if not corpus or bm25 is None:
        return []

    scores = bm25.get_scores(tokenize(query))
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)

    results = []
    for idx in ranked[:top_k]:
        if scores[idx] <= 0:
            continue
        results.append(
            {
                "content": corpus[idx]["content"],
                "score": float(scores[idx]),
                "metadata": corpus[idx].get("metadata", {}),
            }
        )
    return results


if __name__ == "__main__":
    for r in lexical_search("Điều 248 tàng trữ trái phép chất ma tuý", top_k=5):
        print(f"[{r['score']:.3f}] ({r['metadata'].get('source')}) {r['content'][:90]}...")
