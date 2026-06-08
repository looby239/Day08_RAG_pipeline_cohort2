# Log phiên làm việc — 2026-06-08 (Backend từ branch phuc)

**Agent:** Claude Code (Sonnet 4.6) · **Branch:** `2A202600708` / `khai`
**Phạm vi:** Kéo folder `backend/` từ branch `phuc`, chạy thử, ghi log AI

---

## 1. Nguồn gốc

Folder `backend/` được kéo từ `origin/phuc` (looby239/Day08_RAG_pipeline_cohort2):

```bash
git fetch origin phuc
git checkout origin/phuc -- backend/
```

Files kéo về:
- `backend/main.py` — FastAPI app (411 dòng)
- `backend/__init__.py`
- `backend/README.md`
- `backend/API_SPEC.md`

---

## 2. Kiến trúc backend (phuc)

```
Client ─HTTP─► FastAPI (backend/main.py) :8002
   ├─ GET  /health              → {"status": "ok"}
   ├─ POST /api/chat            → ChatResponse (answer + sources)
   ├─ POST /api/retrieval       → RetrievalResponse (results)
   ├─ POST /api/search          → SearchResponse (query, top_k, results)
   ├─ POST /api/generate        → GenerateResponse (answer + citation)
   ├─ POST /api/ask             → alias /api/generate
   ├─ POST /api/upload          → UploadResponse (file ingestion)
   └─ GET  /api/evaluation      → EvaluationResponse (metrics dashboard)
```

### So sánh với `api/` (backend cũ của Khải)

| Tiêu chí | `api/` (Khải) | `backend/` (Phúc) |
|----------|--------------|-------------------|
| Port mặc định | 8000 | 8002 |
| Chat endpoint | `POST /chat` với `{question}` | `POST /api/chat` với `{query, topK, searchMode, useHyDE, threshold}` |
| Conversation memory | Có (`session_id`) | Không |
| Upload endpoint | Không | Có (`/api/upload`) |
| Evaluation endpoint | Không | Có (`/api/evaluation`) |
| Schema frontend-ready | Không | Có (match API_SPEC.md) |

---

## 3. Chạy thử

```bash
python -m uvicorn backend.main:app --port 8002
```

### Kết quả `GET /health`
```json
{"status": "ok"}
```

### Kết quả TestClient `POST /api/chat`
```
STATUS: 200
answer: "Tôi không thể xác minh thông tin này từ nguồn hiện có."
sources: 3 chunks (article_07.md, article_05.md, article_04.md)
```

### Log AI được ghi ra terminal
```
AI_CHAT_START  query='test' topK=3 threshold=0.3 mode='Hybrid' hyde=False
AI_CHAT_DONE   query='test' sources=3
```

---

## 4. Lỗi gặp phải khi chạy

| Lỗi | Nguyên nhân | Giải pháp |
|-----|------------|-----------|
| Port 8001 bị chiếm | Process cũ từ lần thử trước | Dùng port 8002 |
| `500 Internal Server Error` lần đầu | Model embedding chưa load xong khi request đến | Chờ warm-up hoặc preload model khi khởi động |

---

## 5. Điểm cải tiến (nếu phát triển tiếp)

- Thêm `try/except` vào `/api/chat` để trả `HTTP 500` với error detail thay vì plain text.
- Preload embedding model khi startup (`@app.on_event("startup")`) để request đầu không bị timeout.
- Nối frontend (`RetrievalPage`, `ChatPage`) sang `backend/` thay vì `api/` để dùng đúng schema.

---

## 6. Cách chạy

```bash
# Chạy backend (port 8002 để không xung đột api/ trên 8000)
python -m uvicorn backend.main:app --reload --port 8002

# Swagger UI
# → http://127.0.0.1:8002/docs
```
