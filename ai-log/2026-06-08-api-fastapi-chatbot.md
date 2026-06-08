# Log phiên làm việc — 2026-06-08 (API Backend)

**Agent:** Claude Code (Opus 4.8) · **Branch:** `2A202600708`
**Phạm vi:** Bài nhóm — API backend FastAPI (Swagger UI) cho RAG Chatbot

---

## 1. Yêu cầu
- Xây API/backend FastAPI có Swagger UI: chatbot trả lời câu hỏi pháp luật ma tuý + tin tức,
  dựa trên RAG pipeline cá nhân (Task 4–10).

## 2. Môi trường
- `fastapi 0.136`, `uvicorn 0.48`, `pydantic 2.13` đã có sẵn → không cần cài thêm.

## 3. Kiến trúc (`api/`)
```
Client ─HTTP─► FastAPI (api/main.py)
   ├─ /search ─► semantic (Task5) + BM25 (Task6) ─► RRF (Task7)
   └─ /chat   ─► retrieve (Task9) ─► reorder+generate citation (Task10)
                 └─ conversation memory theo session_id (api/service.py)
```
- `api/models.py` — Pydantic schema (Search/Chat/Health + SourceChunk).
- `api/service.py` — chat history-aware: ghép câu hỏi trước cho retrieval follow-up;
  generation OpenAI có conversation memory (6 message gần nhất); fallback extractive.
- `api/main.py` — FastAPI app, CORS `*`, redirect `/` → `/docs`.
- `api/run.py` — `python -m api.run`. `api/README.md` — hướng dẫn.

## 4. Endpoints
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/health` | index_ready, openai_configured, chunks_indexed, active_sessions |
| POST | `/search` | hybrid retrieval (không LLM) |
| POST | `/chat` | hỏi-đáp có citation + memory (session_id) |
| DELETE | `/chat/{session_id}` | xoá lịch sử phiên |

## 5. Kiểm thử (server thật `uvicorn`, port 8077)
- `GET /health` → `{status:ok, index_ready:true, openai_configured:true, chunks_indexed:1103}`.
- `POST /search` "hình phạt tàng trữ..." → 3 kết quả (vd Điều 258 BLHS), source=hybrid.
- `POST /chat` lượt 1 → answer có citation `[bo-luat-hinh-su-2015..., Điều 253]`, 4 sources.
- `POST /chat` lượt 2 (cùng `session_id`) → `history_turns` 2→4 ✔ **conversation memory OK**.
- `DELETE /chat/{id}` → `{deleted: ...}`.

## 6. Cách chạy
```bash
python -m src.task4_chunking_indexing   # build index (1 lần)
uvicorn api.main:app --reload           # → http://127.0.0.1:8000/docs
```

## 6b. Bộ mẫu request (`api/samples/`)
- `requests.http` (REST Client), `postman_collection.json`, `client.py` (Python, multi-turn),
  `samples.ps1` (PowerShell UTF-8), `search.json`/`chat.json`/`chat_followup.json`, `README.md`.
- Verify: `python api/samples/client.py` chạy thật full flow → health (1103 chunks) → search →
  chat citation (Điều 249 BLHS) → follow-up cùng session (turns 2→4) → delete. Tiếng Việt in chuẩn.

## 6c. Chạy Swagger UI
- `uvicorn api.main:app --host 127.0.0.1 --port 8000` (chạy nền).
- Xác nhận: `/docs` → 200, `/openapi.json` → 200, `/health` → index_ready=true, 1103 chunks.
- Swagger UI: http://127.0.0.1:8000/docs  ·  ReDoc: http://127.0.0.1:8000/redoc

## 7. Ghi chú / hướng phát triển
- Memory in-memory (mất khi restart) → production nên dùng Redis.
- Đáp ứng bonus nhóm: citation, follow-up (memory), hiển thị source. Còn thiếu (tuỳ chọn):
  giao diện chat (Streamlit) + evaluation pipeline (DeepEval/RAGAS) — xem `group_project/`.
- Gửi body tiếng Việt phải đúng UTF-8 (Swagger UI/Postman OK; curl inline trên Windows dễ lỗi).
