"""Streamlit interface for the group RAG chatbot."""

import sys
from pathlib import Path

import streamlit as st

PROJECT_DIR = Path(__file__).resolve().parents[1]
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from src.task10_generation import generate_with_citation


st.set_page_config(
    page_title="Điểm tựa pháp lý",
    page_icon=None,
    layout="wide",
    initial_sidebar_state="auto",
)

st.markdown(
    """
    <style>
    :root {
        --ink: #17201c;
        --muted: #66736d;
        --line: #dce4df;
        --paper: #f4f7f5;
        --surface: #ffffff;
        --accent: #197149;
        --accent-dark: #115638;
        --soft: #e8f2ed;
        --radius: 14px;
    }

    html, body, [class*="css"] {
        font-family: "Segoe UI Variable", "Aptos", "Segoe UI", sans-serif;
        color: var(--ink);
    }

    .stApp {
        background:
            linear-gradient(90deg, rgba(25,113,73,.035) 1px, transparent 1px),
            linear-gradient(rgba(25,113,73,.035) 1px, transparent 1px),
            var(--paper);
        background-size: 32px 32px;
    }

    [data-testid="stSidebar"] {
        background: rgba(248, 250, 249, .96);
        border-right: 1px solid var(--line);
    }

    [data-testid="stToolbar"] { visibility: hidden; }

    [data-testid="stSidebar"] > div:first-child {
        padding: 2.2rem 1.4rem 1.4rem;
    }

    .block-container {
        max-width: 1120px;
        padding: 2.2rem 2.5rem 5rem;
    }

    h1, h2, h3 {
        color: var(--ink);
        letter-spacing: -.035em;
    }

    .brand-kicker {
        color: var(--accent);
        font-size: .78rem;
        font-weight: 700;
        letter-spacing: .12em;
        text-transform: uppercase;
        margin-bottom: .65rem;
    }

    .brand-title {
        font-size: 1.55rem;
        line-height: 1.05;
        font-weight: 720;
        letter-spacing: -.04em;
        margin-bottom: .8rem;
    }

    .brand-copy {
        color: var(--muted);
        font-size: .9rem;
        line-height: 1.55;
        margin-bottom: 1.4rem;
    }

    .system-line {
        display: flex;
        align-items: center;
        gap: .65rem;
        padding: .8rem 0;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: .82rem;
    }

    .status-mark {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: var(--accent);
        box-shadow: 0 0 0 4px rgba(25,113,73,.10);
        flex: 0 0 auto;
    }

    .hero-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(220px, .45fr);
        gap: 2.5rem;
        align-items: end;
        padding: 1.25rem 0 2rem;
        border-bottom: 1px solid var(--line);
        margin-bottom: 1.5rem;
    }

    .hero-title {
        font-size: clamp(2.25rem, 5vw, 4.7rem);
        line-height: .96;
        max-width: 780px;
        font-weight: 740;
        letter-spacing: -.065em;
        margin: 0;
    }

    .hero-title span { color: var(--accent); }

    .hero-note {
        color: var(--muted);
        line-height: 1.55;
        font-size: .94rem;
        max-width: 28ch;
        padding-bottom: .25rem;
    }

    [data-testid="stChatMessage"] {
        background: rgba(255,255,255,.72);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: .35rem .7rem;
        margin-bottom: .8rem;
        box-shadow: 0 12px 34px rgba(28, 62, 45, .045);
    }

    [data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) {
        background: var(--soft);
        border-color: #cfe0d7;
    }

    [data-testid="stChatInput"] {
        border-radius: var(--radius);
        border-color: #bfcac4;
        box-shadow: 0 14px 38px rgba(28,62,45,.08);
    }

    [data-testid="stChatInput"] textarea:focus {
        box-shadow: 0 0 0 2px rgba(25,113,73,.20);
    }

    .source-meta {
        display: flex;
        flex-wrap: wrap;
        gap: .5rem 1rem;
        color: var(--muted);
        font-size: .78rem;
        margin-bottom: .65rem;
    }

    .source-body {
        color: #39453f;
        line-height: 1.55;
        font-size: .88rem;
    }

    .empty-state {
        padding: 2.4rem 0 1.8rem;
        max-width: 650px;
    }

    .empty-rule {
        width: 54px;
        height: 3px;
        background: var(--accent);
        border-radius: 999px;
        margin-bottom: 1.1rem;
    }

    .empty-state h3 {
        font-size: 1.35rem;
        margin: 0 0 .55rem;
    }

    .empty-state p {
        color: var(--muted);
        line-height: 1.6;
        margin: 0;
    }

    .notice {
        border-left: 3px solid var(--accent);
        padding: .8rem 1rem;
        background: rgba(232,242,237,.78);
        color: #425049;
        font-size: .82rem;
        line-height: 1.5;
        margin-top: 1.1rem;
        border-radius: 0 var(--radius) var(--radius) 0;
    }

    .stButton > button {
        width: 100%;
        border-radius: 10px;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--ink);
        text-align: left;
        min-height: 2.65rem;
        transition: transform .16s ease, border-color .16s ease, background .16s ease;
    }

    .stButton > button:hover {
        border-color: #9fb8aa;
        background: var(--soft);
        color: var(--accent-dark);
    }

    .stButton > button:active { transform: translateY(1px); }

    [data-testid="stExpander"] {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(255,255,255,.62);
    }

    @media (max-width: 760px) {
        .block-container { padding: 1.25rem 1rem 4.5rem; }
        .hero-shell { grid-template-columns: 1fr; gap: 1rem; }
        .hero-title { font-size: 2.65rem; }
        .hero-note { max-width: 55ch; }
    }

    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
        }
    }
    </style>
    """,
    unsafe_allow_html=True,
)


SUGGESTED_QUESTIONS = [
    "Luật Phòng, chống ma túy quy định thế nào về cai nghiện tự nguyện?",
    "Người sử dụng trái phép chất ma túy có trách nhiệm gì?",
    "Những nghệ sĩ nào trong dữ liệu từng liên quan đến ma túy?",
    "Cơ sở cai nghiện ma túy có những loại nào?",
]


def init_state() -> None:
    st.session_state.setdefault("messages", [])
    st.session_state.setdefault("pending_question", None)


def contextualize(question: str) -> str:
    """Add the latest exchange to support follow-up questions."""
    history = st.session_state.messages[-4:]
    if not history:
        return question
    compact_history = "\n".join(
        f"{item['role']}: {item['content'][:700]}"
        for item in history
    )
    return (
        "Lịch sử hội thoại gần nhất:\n"
        f"{compact_history}\n\n"
        f"Câu hỏi hiện tại: {question}"
    )


def render_sources(sources: list[dict]) -> None:
    if not sources:
        st.caption("Không có nguồn phù hợp trong kho dữ liệu.")
        return

    with st.expander(f"Nguồn được sử dụng ({len(sources)})"):
        for index, source in enumerate(sources, start=1):
            metadata = source.get("metadata", {})
            filename = metadata.get("source", f"Nguồn {index}")
            doc_type = metadata.get("type", "unknown")
            score = float(source.get("score", 0.0))
            st.markdown(
                (
                    '<div class="source-meta">'
                    f"<strong>{index}. {filename}</strong>"
                    f"<span>Loại: {doc_type}</span>"
                    f"<span>Điểm: {score:.3f}</span>"
                    "</div>"
                    '<div class="source-body">'
                    f"{source.get('content', '')[:520]}"
                    "</div>"
                ),
                unsafe_allow_html=True,
            )
            if index != len(sources):
                st.divider()


init_state()

with st.sidebar:
    st.markdown('<div class="brand-kicker">RAG pháp luật</div>', unsafe_allow_html=True)
    st.markdown('<div class="brand-title">Điểm tựa<br>pháp lý</div>', unsafe_allow_html=True)
    st.markdown(
        (
            '<div class="brand-copy">'
            "Tra cứu văn bản và tin tức đã được chuẩn hóa, với nguồn dẫn "
            "hiển thị ngay bên dưới câu trả lời."
            "</div>"
        ),
        unsafe_allow_html=True,
    )
    st.markdown(
        (
            '<div class="system-line"><span class="status-mark"></span>'
            "Hybrid retrieval đang sẵn sàng</div>"
        ),
        unsafe_allow_html=True,
    )

    st.markdown("#### Câu hỏi gợi ý")
    for index, suggestion in enumerate(SUGGESTED_QUESTIONS):
        if st.button(suggestion, key=f"suggestion_{index}"):
            st.session_state.pending_question = suggestion
            st.rerun()

    st.divider()
    if st.button("Xóa cuộc hội thoại", key="clear_chat"):
        st.session_state.messages = []
        st.session_state.pending_question = None
        st.rerun()

    st.markdown(
        (
            '<div class="notice">'
            "Thông tin phục vụ học tập và tham khảo, không thay thế tư vấn "
            "của luật sư hoặc cơ quan có thẩm quyền."
            "</div>"
        ),
        unsafe_allow_html=True,
    )

st.markdown(
    """
    <section class="hero-shell">
      <h1 class="hero-title">Hỏi đúng nguồn.<br><span>Đọc rõ căn cứ.</span></h1>
      <p class="hero-note">
        Câu trả lời được truy xuất từ kho văn bản pháp luật và bài báo trong dự án.
        Mỗi kết luận đều đi kèm nguồn để đối chiếu.
      </p>
    </section>
    """,
    unsafe_allow_html=True,
)

if not st.session_state.messages:
    st.markdown(
        """
        <div class="empty-state">
          <div class="empty-rule"></div>
          <h3>Bắt đầu từ một điều bạn cần làm rõ</h3>
          <p>
            Hỏi về cai nghiện, trách nhiệm của người sử dụng, quy định quản lý
            hoặc các sự kiện báo chí đã có trong kho dữ liệu.
          </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if message["role"] == "assistant":
            st.caption(
                f"Truy xuất: {message.get('retrieval_source', 'unknown')} "
                f"| Mô hình: {message.get('model', 'unknown')}"
            )
            render_sources(message.get("sources", []))

typed_question = st.chat_input("Nhập câu hỏi cần tra cứu...")
question = st.session_state.pending_question or typed_question
if question:
    st.session_state.pending_question = None
    retrieval_question = contextualize(question)
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.markdown(question)

    with st.chat_message("assistant"):
        with st.status("Đang đối chiếu nguồn và tạo câu trả lời...", expanded=False):
            try:
                result = generate_with_citation(retrieval_question)
            except Exception as error:
                st.error(
                    "Không thể hoàn tất truy vấn lúc này. "
                    "Hãy kiểm tra cấu hình API hoặc thử lại."
                )
                st.caption(f"Chi tiết kỹ thuật: {type(error).__name__}")
                result = None

        if result:
            st.markdown(result["answer"])
            st.caption(
                f"Truy xuất: {result['retrieval_source']} "
                f"| Mô hình: {result['model']}"
            )
            render_sources(result["sources"])
            st.session_state.messages.append(
                {
                    "role": "assistant",
                    "content": result["answer"],
                    "sources": result["sources"],
                    "retrieval_source": result["retrieval_source"],
                    "model": result["model"],
                }
            )
