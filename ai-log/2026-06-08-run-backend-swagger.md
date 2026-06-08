# Log phiên làm việc — 2026-06-08 (Chạy backend + Swagger UI)

**Agent:** Claude Code (Opus 4.8) · **Branch:** `2A202600708`
**Phạm vi:** Khởi chạy backend FastAPI và Swagger UI.

---

## 1. Yêu cầu
- Chạy folder backend và Swagger UI.

## 2. Bối cảnh
- Folder `api/` đã được **đổi tên thành `backend/`** (do người dùng/refactor).
- `backend/main.py` được viết lại **self-contained** (13 route objects, 9 path); thêm `backend/API_SPEC.md`.
- Các file `models.py` / `service.py` / `samples/` của bản `api/` cũ không còn trong `backend/`.

## 3. Lệnh chạy
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
(Trước đó là `uvicorn api.main:app` — đã đổi theo tên package mới.)

## 4. Kiểm tra (server thật, cổng 8000)
- `/docs` → **200** (Swagger UI) · `/openapi.json` → **200** · `/health` → `{"status":"ok"}`.
- 9 path: `/`, `/health`, `/api/ask`, `/api/chat`, `/api/search`, `/api/retrieval`,
  `/api/generate`, `/api/upload`, `/api/evaluation`.

## 5. Truy cập
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc:      http://127.0.0.1:8000/redoc
- OpenAPI:    http://127.0.0.1:8000/openapi.json

## 6. Ghi chú
- Server chạy nền; dừng bằng `taskkill /F /PID <pid cổng 8000>` hoặc báo agent "tắt shell".
- Yêu cầu tiên quyết: đã build index (Task 4) để các endpoint retrieval/chat hoạt động đầy đủ.
