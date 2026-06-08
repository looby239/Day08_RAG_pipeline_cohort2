"""
Task 4 — Chunking & Indexing vào Vector Store.

Pipeline: load markdown -> chunk -> embed -> index (ChromaDB).
Ngoài ra lưu chunks.json để Task 6 (BM25) tái sử dụng cùng tập chunk.

Cài đặt:
    pip install langchain-text-splitters sentence-transformers chromadb
"""

import json
import sys
from functools import lru_cache
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).parent.parent
STANDARDIZED_DIR = ROOT / "data" / "standardized"
INDEX_DIR = ROOT / "data" / "index"
CHROMA_DIR = INDEX_DIR / "chroma"
CHUNKS_JSON = INDEX_DIR / "chunks.json"
COLLECTION_NAME = "DrugLawDocs"


# =============================================================================
# CONFIGURATION — Giải thích lựa chọn
# =============================================================================

# Chunking: RecursiveCharacterTextSplitter.
# - chunk_size=1000: văn bản pháp luật có "Điều/Khoản" dài; 1000 ký tự (~1 điều ngắn
#   hoặc vài khoản) đủ ngữ cảnh cho retrieval mà không loãng. Bài báo cũng vừa 1-2 đoạn.
# - chunk_overlap=150 (15%): giữ liên tục ngữ cảnh giữa các chunk, tránh cắt ngang câu/điều.
# - recursive tách theo "\n\n" -> "\n" -> ". " -> " ": ưu tiên ranh giới tự nhiên.
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
CHUNKING_METHOD = "recursive"  # "recursive" | "markdown_header" | "semantic"

# Embedding: paraphrase-multilingual-MiniLM-L12-v2.
# - Multilingual (hỗ trợ tiếng Việt tốt), 384 chiều, nhẹ (~470MB), nhanh trên CPU.
# - Cân bằng chất lượng/tốc độ; thay cho bge-m3 (2.2GB, chậm trên CPU) trong môi trường local.
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384

# Vector store: ChromaDB — local persistent, không cần Docker, hỗ trợ cosine.
VECTOR_STORE = "chromadb"


# =============================================================================
# SHARED HELPERS (dùng lại ở Task 5, 6, 9)
# =============================================================================

@lru_cache(maxsize=1)
def get_embedding_model():
    """Load sentence-transformers model 1 lần (singleton)."""
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(EMBEDDING_MODEL)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed danh sách text -> list vector (normalize để dùng cosine)."""
    model = get_embedding_model()
    embs = model.encode(
        texts, normalize_embeddings=True, show_progress_bar=len(texts) > 50
    )
    return [e.tolist() for e in embs]


def get_chroma_client():
    import chromadb

    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(CHROMA_DIR))


def get_chroma_collection(create: bool = False):
    """Lấy (hoặc tạo) collection Chroma với cosine space."""
    client = get_chroma_client()
    if create:
        try:
            client.delete_collection(COLLECTION_NAME)
        except Exception:  # noqa: BLE001
            pass
        return client.create_collection(
            name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
        )
    return client.get_collection(COLLECTION_NAME)


# =============================================================================
# PIPELINE
# =============================================================================

def load_documents() -> list[dict]:
    """Đọc toàn bộ markdown files từ data/standardized/."""
    documents = []
    for md_file in sorted(STANDARDIZED_DIR.rglob("*.md")):
        content = md_file.read_text(encoding="utf-8")
        doc_type = "legal" if "legal" in md_file.parts else "news"
        documents.append(
            {"content": content, "metadata": {"source": md_file.name, "type": doc_type}}
        )
    return documents


def chunk_documents(documents: list[dict]) -> list[dict]:
    """Chunk documents bằng RecursiveCharacterTextSplitter."""
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []
    for doc in documents:
        for i, piece in enumerate(splitter.split_text(doc["content"])):
            piece = piece.strip()
            if len(piece) < 20:  # bỏ mảnh quá ngắn (heading lẻ, khoảng trắng)
                continue
            chunks.append(
                {"content": piece, "metadata": {**doc["metadata"], "chunk_index": i}}
            )
    return chunks


def embed_chunks(chunks: list[dict]) -> list[dict]:
    """Embed toàn bộ chunks; thêm key 'embedding'."""
    vectors = embed_texts([c["content"] for c in chunks])
    for chunk, vec in zip(chunks, vectors):
        chunk["embedding"] = vec
    return chunks


def index_to_vectorstore(chunks: list[dict]):
    """Lưu chunks (kèm embedding) vào ChromaDB + dump chunks.json cho BM25."""
    collection = get_chroma_collection(create=True)

    ids, docs, metas, embs = [], [], [], []
    for i, c in enumerate(chunks):
        ids.append(f"chunk_{i}")
        docs.append(c["content"])
        metas.append(c["metadata"])
        embs.append(c["embedding"])

    # Chroma batch giới hạn kích thước -> chèn theo lô.
    BATCH = 1000
    for s in range(0, len(ids), BATCH):
        e = s + BATCH
        collection.add(
            ids=ids[s:e], documents=docs[s:e], metadatas=metas[s:e], embeddings=embs[s:e]
        )

    # Lưu chunks (không kèm embedding) cho Task 6 BM25.
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    slim = [{"content": c["content"], "metadata": c["metadata"]} for c in chunks]
    CHUNKS_JSON.write_text(json.dumps(slim, ensure_ascii=False), encoding="utf-8")


def run_pipeline():
    print("=" * 50)
    print("Task 4: Chunking & Indexing")
    print(f"  Chunking: {CHUNKING_METHOD} (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
    print(f"  Embedding: {EMBEDDING_MODEL} (dim={EMBEDDING_DIM})")
    print(f"  Vector Store: {VECTOR_STORE}")
    print("=" * 50)

    docs = load_documents()
    print(f"\n✓ Loaded {len(docs)} documents")

    chunks = chunk_documents(docs)
    print(f"✓ Created {len(chunks)} chunks")

    chunks = embed_chunks(chunks)
    print(f"✓ Embedded {len(chunks)} chunks (dim={len(chunks[0]['embedding'])})")

    index_to_vectorstore(chunks)
    print(f"✓ Indexed {len(chunks)} chunks → ChromaDB ({CHROMA_DIR})")
    print(f"✓ Saved chunks → {CHUNKS_JSON}")


if __name__ == "__main__":
    run_pipeline()
