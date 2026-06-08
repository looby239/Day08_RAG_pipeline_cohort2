"""
Task 10 — Generation Có Citation.

1. Retrieve chunks (Task 9)
2. Reorder chống "lost in the middle"
3. Format context kèm source để LLM cite
4. Gọi LLM (OpenAI nếu có OPENAI_API_KEY), ngược lại fallback extractive có citation
"""

import os

from dotenv import load_dotenv

load_dotenv()

try:
    from .task9_retrieval_pipeline import retrieve
except ImportError:
    from task9_retrieval_pipeline import retrieve


# =============================================================================
# CONFIGURATION — Giải thích lựa chọn
# =============================================================================

# top_k=5: đủ evidence (3 văn bản luật + tin tức) mà context không quá dài → giảm nhiễu.
TOP_K = 5
# top_p=0.9: nucleus sampling đủ đa dạng diễn đạt nhưng vẫn bám context.
TOP_P = 0.9
# temperature=0.2: RAG cần factual, hạn chế bịa; thấp để câu trả lời ổn định, trung thành nguồn.
TEMPERATURE = 0.2
LLM_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


SYSTEM_PROMPT = """Answer the following question comprehensively in Vietnamese.
For every statement of fact or claim, immediately insert a citation in brackets
linking to the specific source (e.g., [luat-phong-chong-ma-tuy-2021, Điều 3]
or [article_05, news]).

If the information is not explicitly stated in the provided context or knowledge
base, state 'Tôi không thể xác minh thông tin này từ nguồn hiện có' rather than
guessing.

Rules:
- Only use information from the provided context
- Every factual claim MUST have a citation
- If context is insufficient, say so clearly
- Structure your answer with clear paragraphs"""


# =============================================================================
# DOCUMENT REORDERING (tránh lost in the middle)
# =============================================================================

def reorder_for_llm(chunks: list[dict]) -> list[dict]:
    """
    Sắp xếp chunks: quan trọng nhất ở ĐẦU và CUỐI, kém quan trọng ở GIỮA.

    Input (theo score): [0, 1, 2, 3, 4]
    Output:             [0, 2, 4, 3, 1]  (chunk tốt nhất luôn đứng đầu)
    """
    if len(chunks) <= 2:
        return list(chunks)
    evens = chunks[0::2]   # 0, 2, 4 — giữ chunk tốt nhất ở đầu
    odds = chunks[1::2]    # 1, 3
    return evens + odds[::-1]  # 0,2,4 + 3,1


# =============================================================================
# CONTEXT FORMATTING
# =============================================================================

def format_context(chunks: list[dict]) -> str:
    """Format chunks thành context có nhãn source để LLM cite."""
    parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk.get("metadata", {}) or {}
        source = meta.get("source", f"Source {i}")
        doc_type = meta.get("type", "unknown")
        parts.append(
            f"[Document {i} | Source: {source} | Type: {doc_type}]\n{chunk['content']}\n"
        )
    return "\n---\n".join(parts)


# =============================================================================
# GENERATION
# =============================================================================

def _extractive_answer(query: str, chunks: list[dict]) -> str:
    """Fallback khi không có OPENAI_API_KEY: tổng hợp trích dẫn từ evidence."""
    if not chunks:
        return "Tôi không thể xác minh thông tin này từ nguồn hiện có."

    lines = [
        f"(Chế độ trích dẫn không-LLM — chưa cấu hình OPENAI_API_KEY)",
        f"Câu hỏi: {query}",
        "",
        "Các đoạn liên quan nhất từ nguồn:",
    ]
    for c in chunks:
        meta = c.get("metadata", {}) or {}
        src = meta.get("source", "unknown")
        snippet = " ".join(c["content"].split())[:240]
        lines.append(f"- {snippet} … [{src}, {meta.get('type', 'unknown')}]")
    return "\n".join(lines)


def generate_with_citation(query: str, top_k: int = TOP_K) -> dict:
    """
    End-to-end RAG generation có citation.

    Returns:
        {'answer': str, 'sources': list[dict], 'retrieval_source': str}
    """
    chunks = retrieve(query, top_k=top_k)
    reordered = reorder_for_llm(chunks)
    context = format_context(reordered)
    retrieval_source = chunks[0].get("source", "hybrid") if chunks else "none"

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {
            "answer": _extractive_answer(query, chunks),
            "sources": chunks,
            "retrieval_source": retrieval_source,
        }

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        user_message = f"Context:\n{context}\n\n---\n\nQuestion: {query}"
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=TEMPERATURE,
            top_p=TOP_P,
        )
        answer = response.choices[0].message.content
    except Exception as exc:  # noqa: BLE001 — lỗi API -> vẫn trả evidence
        answer = _extractive_answer(query, chunks) + f"\n\n(LLM lỗi: {exc})"

    return {"answer": answer, "sources": chunks, "retrieval_source": retrieval_source}


if __name__ == "__main__":
    queries = [
        "Hình phạt cho tội tàng trữ trái phép chất ma tuý theo pháp luật Việt Nam?",
        "Những nghệ sĩ nào đã bị bắt vì liên quan tới ma tuý?",
        "Quy trình cai nghiện bắt buộc theo Luật Phòng chống ma tuý 2021?",
    ]
    for q in queries:
        print(f"\n{'='*70}\nQ: {q}\n{'='*70}")
        result = generate_with_citation(q)
        print(f"\nA: {result['answer']}")
        print(f"\n[Sources: {len(result['sources'])} chunks | via {result['retrieval_source']}]")
