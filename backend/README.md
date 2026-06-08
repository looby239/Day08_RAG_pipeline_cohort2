# FastAPI Backend

Run from the project root:

```bash
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

Open Swagger UI:

```text
http://127.0.0.1:8000/docs
```

Frontend API spec:

```text
backend/API_SPEC.md
```

Useful endpoints:

- `GET /health`
- `POST /api/chat`
- `POST /api/retrieval`
- `POST /api/upload`
- `GET /api/evaluation`
- `POST /api/search`
- `POST /api/generate`
- `POST /api/ask`

Upload accepts document files only: `.pdf`, `.doc`, `.docx`, `.txt`, `.md`,
`.html`, `.htm`, `.json`.

Example request body:

```json
{
  "query": "Hữu Tín liên quan ma túy như thế nào?",
  "top_k": 5
}
```

## AI Log

Khi chạy backend bằng Uvicorn, các request gọi RAG/AI sẽ được log trực tiếp ra
terminal:

```bash
python -m uvicorn backend.main:app --reload
```

Các log chính:

- `AI_SEARCH_START`: bắt đầu retrieval với query, `top_k`, threshold và reranking.
- `AI_SEARCH_DONE`: retrieval xong, có số lượng kết quả trả về.
- `AI_SEARCH_ERROR`: lỗi khi chạy retrieval.
- `AI_GENERATE_START`: bắt đầu generate câu trả lời có citation.
- `AI_GENERATE_DONE`: generate xong, có nguồn retrieval, số source và độ dài answer.
- `AI_GENERATE_ERROR`: lỗi khi generate.

Ví dụ log:

```text
2026-06-08 14:15:00 | INFO | AI_SEARCH_START query='Hữu Tín ma túy' top_k=5 threshold=0.3 reranking=True
2026-06-08 14:15:00 | INFO | AI_SEARCH_DONE query='Hữu Tín ma túy' results=5
2026-06-08 14:15:10 | INFO | AI_GENERATE_START query='Hữu Tín liên quan ma túy như thế nào?' top_k=5
2026-06-08 14:15:10 | INFO | AI_GENERATE_DONE query='Hữu Tín liên quan ma túy như thế nào?' retrieval_source=hybrid sources=5 answer_chars=820
```

Log này dùng để demo backend đã nhận câu hỏi, đã chạy retrieval/generation và đã
trả về nguồn tham chiếu cho câu trả lời.
