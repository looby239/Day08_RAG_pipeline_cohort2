# API Specification Document

Tài liệu này mô tả các RESTful API endpoints để kết nối Frontend React với
Backend RAG Pipeline. Spec hỗ trợ các tham số UI như Top-K, Threshold, chế độ
tìm kiếm và cơ chế truyền API Keys qua request headers.

Base URL khi chạy local:

```text
http://127.0.0.1:8000
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

## Authentication Headers

Frontend có thể cho người dùng nhập API Key và lưu tại Local Storage. Khi gọi
API cần tương tác dịch vụ bên thứ ba, frontend gửi key qua header:

- `X-OpenAI-Key`: OpenAI API key, ví dụ `sk-...`
- `X-Qdrant-Key`: Vector DB key nếu dùng Qdrant
- `X-DeepEval-Key`: Evaluation framework key

Backend nên đọc các header này theo từng request thay vì hard-code `.env` nếu
muốn hỗ trợ nhiều người dùng. Backend hiện tại chưa gọi OpenAI/Qdrant/DeepEval
thật, nhưng endpoint `/api/chat` đã nhận `X-OpenAI-Key` và `X-Qdrant-Key` để
sẵn sàng mở rộng.

## 1. Chatbot API

Endpoint gửi câu hỏi của người dùng và nhận câu trả lời RAG kèm nguồn trích dẫn.

- **URL:** `/api/chat`
- **Method:** `POST`
- **Status:** Implemented
- **Headers:**
  - `Content-Type: application/json`
  - `X-OpenAI-Key: sk-...` optional
  - `X-Qdrant-Key: ...` optional

### Request Body

```json
{
  "query": "Hữu Tín liên quan ma túy như thế nào?",
  "useHyDE": true,
  "topK": 5,
  "threshold": 0.5,
  "searchMode": "Hybrid kết hợp"
}
```

### Fields

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `query` | string | yes | - | Câu hỏi của người dùng. |
| `useHyDE` | boolean | no | `false` | Bật/tắt Hypothetical Document Embeddings. Backend hiện tại nhận tham số nhưng chưa dùng HyDE thật. |
| `topK` | integer | no | `5` | Số lượng source chunks tối đa. |
| `threshold` | float | no | `0.3` | Ngưỡng điểm tin cậy từ `0.0` đến `1.0`. |
| `searchMode` | string | no | `Hybrid kết hợp` | `"Hybrid kết hợp"`, `"Lexical từ khóa"`, `"Semantic ngữ nghĩa"`. |

### Success Response

- **Code:** `200 OK`

```json
{
  "answer": "Bài báo cho biết Hữu Tín liên quan đến vụ việc sử dụng ma túy... [article_01.md]",
  "sources": [
    {
      "id": 1,
      "content": "Bài dùng cho Task 2 về tin tức nghệ sĩ liên quan đến ma túy...",
      "score": 0.85,
      "metadata": {
        "source": "article_01.md",
        "type": "news",
        "chunk_index": 0
      },
      "source": "hybrid"
    }
  ]
}
```

### Error Response

```json
{
  "detail": "Generation failed: <error message>"
}
```

## 2. Retrieval API

Endpoint kiểm tra và so sánh thuật toán tìm kiếm trong Retrieval Playground.

- **URL:** `/api/retrieval`
- **Method:** `POST`
- **Status:** Implemented
- **Headers:**
  - `Content-Type: application/json`

### Request Body

```json
{
  "query": "Tội phạm ma túy",
  "method": "Hybrid",
  "topK": 5,
  "threshold": 0.3
}
```

### Fields

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `query` | string | yes | - | Truy vấn retrieval. |
| `method` | string | no | `Hybrid` | `"Hybrid"`, `"Semantic"`, `"Lexical"`, `"PageIndex"`. |
| `topK` | integer | no | `5` | Số lượng kết quả trả về. |
| `threshold` | float | no | `0.3` | Ngưỡng fallback khi dùng Hybrid. |

### Success Response

- **Code:** `200 OK`

```json
{
  "results": [
    {
      "id": 1,
      "content": "Bộ luật Hình sự quy định nhóm tội phạm về ma túy...",
      "score": 0.92,
      "metadata": {
        "source": "bo-luat-hinh-su-chuong-ma-tuy.md",
        "type": "legal",
        "chunk_index": 0
      },
      "source": "hybrid"
    }
  ]
}
```

### Error Response

Unsupported method:

```json
{
  "detail": "Unsupported retrieval method: VectorOnly"
}
```

## 3. Ingestion API

Endpoint upload tài liệu pháp luật hoặc tin tức lên hệ thống. Backend sẽ lưu,
extract text, chunking và indexing.

- **URL:** `/api/upload`
- **Method:** `POST`
- **Status:** Implemented
- **Headers:**
  - `Content-Type: multipart/form-data`

### Request Body

Form Data:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | File | yes | Tệp tài liệu cần upload. Chỉ nhận `.pdf`, `.doc`, `.docx`, `.txt`, `.md`, `.html`, `.htm`, `.json`. |

Allowed content types:

- `application/pdf`
- `application/msword`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `text/plain`
- `text/markdown`
- `text/html`
- `application/json`

### Success Response

```json
{
  "status": "success",
  "message": "File [Luat_Kinh_doanh.pdf] uploaded and indexed successfully.",
  "fileName": "Luat_Kinh_doanh.pdf",
  "size": 1024000,
  "logs": [
    "Uploading Luat_Kinh_doanh.pdf (1000.00 KB)...",
    "Extracting text from document...",
    "Chunking text (Chunk size: 500, Overlap: 50)...",
    "Generating embeddings for chunks...",
    "Saved to local index successfully."
  ]
}
```

### Error Response

File không đúng định dạng:

```json
{
  "detail": "Unsupported file extension '.png'. Allowed: .doc, .docx, .htm, .html, .json, .md, .pdf, .txt"
}
```

### Implementation Note

Endpoint này đã implement trong `backend/main.py`. Backend dùng `UploadFile`,
lưu file gốc vào `data/landing/uploads/`, tạo bản markdown trong
`data/standardized/uploads/`, và tài liệu này sẽ được đọc bởi pipeline local ở
các request retrieval/generation tiếp theo.

## 4. Evaluation API

Endpoint lấy metric DeepEval/RAGAS để hiển thị dashboard.

- **URL:** `/api/evaluation`
- **Method:** `GET`
- **Status:** Implemented
- **Headers:**
  - `Accept: application/json`
  - `X-DeepEval-Key: ...` optional
  - `X-OpenAI-Key: sk-...` optional

### Success Response

```json
{
  "metrics": {
    "faithfulness": 0.85,
    "answerRelevance": 0.92,
    "contextPrecision": 0.78,
    "contextRecall": 0.88
  },
  "abTest": [
    {
      "name": "Config A (BM25 + Semantic)",
      "score": 0.82
    },
    {
      "name": "Config B (Lexical + Semantic + HyDE)",
      "score": 0.89
    }
  ],
  "worstPerformers": [
    {
      "query": "Điều kiện cấp phép xây dựng?",
      "expected": "Câu trả lời đúng ở đây...",
      "actual": "AI trả lời sai ở đây...",
      "issue": "Low Context Recall"
    }
  ],
  "goldenDatasetCount": 18
}
```

### Implementation Note

Endpoint này đã implement trong `backend/main.py` với response dashboard mẫu và
đọc số lượng golden dataset từ:

- `group_project/evaluation/golden_dataset.json`
- `group_project/evaluation/results.md` nếu muốn mở rộng parser
- Output JSON của `group_project/evaluation/eval_pipeline.py` nếu muốn thay số liệu mẫu bằng số liệu thật

## Endpoint Mapping

| # | Spec API | Backend route | UI tương ứng | Status |
| --- | --- | --- | --- | --- |
| 1 | Chatbot API | `POST /api/chat` | Chatbot hỏi đáp RAG | Implemented |
| 2 | Retrieval API | `POST /api/retrieval` | Retrieval Playground / so sánh search mode | Implemented |
| 3 | Ingestion API | `POST /api/upload` | Upload tài liệu PDF/DOCX/TXT | Implemented |
| 4 | Evaluation API | `GET /api/evaluation` | Evaluation Dashboard | Implemented |

## Backward-Compatible Existing Endpoints

Backend hiện tại vẫn giữ các endpoint cũ để test nhanh:

| Endpoint | Method | Description |
| --- | --- | --- |
| `/health` | `GET` | Health check. |
| `/api/search` | `POST` | Retrieval endpoint cũ, dùng snake_case body. |
| `/api/generate` | `POST` | Generate endpoint cũ, dùng snake_case body. |
| `/api/ask` | `POST` | Alias của `/api/generate`. |

### `/api/search` Body

```json
{
  "query": "Andrea Aybar sử dụng ma túy",
  "top_k": 3,
  "score_threshold": 0.3,
  "use_reranking": true
}
```

### `/api/ask` Body

```json
{
  "query": "Hữu Tín liên quan ma túy như thế nào?",
  "top_k": 5
}
```

## Test API

Run backend:

```bash
python -m uvicorn backend.main:app --reload
```

Test bằng Python:

```bash
python -c "import requests, json; r=requests.post('http://127.0.0.1:8000/api/chat', json={'query':'Hữu Tín liên quan ma túy như thế nào?','useHyDE':False,'topK':5,'threshold':0.3,'searchMode':'Hybrid kết hợp'}); print(r.status_code); print(json.dumps(r.json(), ensure_ascii=False, indent=2))"
```

Test retrieval:

```bash
python -c "import requests, json; r=requests.post('http://127.0.0.1:8000/api/retrieval', json={'query':'Tội phạm ma túy','method':'Hybrid','topK':3,'threshold':0.3}); print(r.status_code); print(json.dumps(r.json(), ensure_ascii=False, indent=2))"
```
