# API Specification Document

Tài liệu này mô tả chi tiết các RESTful API endpoints cần thiết để kết nối Frontend React với Backend RAG Pipeline của bạn. Phiên bản này đã được cập nhật để hỗ trợ các tham số nâng cao mới được bổ sung trên UI (Top-K, Threshold, Chế độ tìm kiếm) cũng như cách xử lý **API Keys** tùy chỉnh.

---

## 🔒 Quy tắc xác thực (Authentication Headers)
Bảo mật hệ thống cho phép người dùng tự cung cấp API Key qua Frontend (lưu tại Local Storage). Khi gọi bất kỳ API nào cần tương tác với bên thứ 3 (OpenAI, Qdrant, DeepEval), Frontend sẽ đính kèm các Key này vào Header của Request:

- `X-OpenAI-Key`: sk-...
- `X-Qdrant-Key`: (Khóa vector DB)
- `X-DeepEval-Key`: (Khóa Evaluation framework)

Backend cần đọc các giá trị này từ Header để thực thi, thay vì hard-code `.env` tĩnh nếu muốn hỗ trợ multi-user.

---

## 1. Chatbot API (Sinh câu trả lời với RAG)
Endpoint dùng để gửi câu hỏi của người dùng và nhận về câu trả lời kèm theo nguồn trích dẫn.

- **URL:** `/api/chat`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `X-OpenAI-Key: sk-...`

### Request Body
```json
{
  "query": "Điều kiện cấp phép xây dựng nhà ở xã hội là gì?",
  "useHyDE": true,
  "topK": 5,
  "threshold": 0.5,
  "searchMode": "Hybrid kết hợp"
}
```
- `query` (string): Câu hỏi của người dùng.
- `useHyDE` (boolean): Bật/tắt tính năng Hypothetical Document Embeddings.
- `topK` (integer): Số lượng tài liệu nguồn tối đa muốn truy xuất (Mặc định: 5).
- `threshold` (float): Ngưỡng điểm tin cậy để lọc tài liệu nguồn (từ 0.0 đến 1.0).
- `searchMode` (string): Thuật toán tìm kiếm sử dụng (`"Hybrid kết hợp"`, `"Lexical từ khóa"`, `"Semantic ngữ nghĩa"`).

### Success Response
- **Code:** `200 OK`
- **Body:**
```json
{
  "answer": "Theo quy định của pháp luật hiện hành, điều kiện cấp phép xây dựng nhà ở xã hội bao gồm... [Luat_Nha_o_2023.pdf]",
  "sources": [
    {
      "id": 1,
      "content": "Điều 15, Luật Nhà ở 2023 quy định điều kiện cấp phép xây dựng nhà ở xã hội...",
      "score": 0.85,
      "metadata": {
        "source": "Luat_Nha_o_2023.pdf",
        "page": 12
      }
    }
  ]
}
```

---

## 2. Retrieval API (Thử nghiệm truy xuất)
Endpoint dùng để kiểm tra và so sánh các thuật toán tìm kiếm (Semantic, Lexical, Hybrid, PageIndex) cho chức năng Retrieval Playground.

- **URL:** `/api/retrieval`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`

### Request Body
```json
{
  "query": "Tội phạm ma tuý",
  "method": "Hybrid" 
}
```
- `method` (string): Thuật toán sử dụng (`"Hybrid"`, `"Semantic"`, `"Lexical"`, `"PageIndex"`).

### Success Response
- **Code:** `200 OK`
- **Body:**
```json
{
  "results": [
    {
      "id": 1,
      "content": "Đây là nội dung văn bản tìm được phù hợp với truy vấn...",
      "score": 0.92,
      "metadata": {
        "source": "Bo_luat_Hinh_su_2015.pdf",
        "type": "Hybrid"
      }
    }
  ]
}
```

---

## 3. Ingestion API (Upload & Xử lý dữ liệu)
Endpoint dùng để upload tài liệu pháp luật (PDF, DOCX, TXT) lên hệ thống. Backend sẽ tự động lưu, extract, chunking và indexing tài liệu này.

- **URL:** `/api/upload`
- **Method:** `POST`
- **Headers:** `Content-Type: multipart/form-data`

### Request Body (Form Data)
- `file` (File): Tệp tài liệu cần upload.

### Success Response
- **Code:** `200 OK`
- **Body:**
```json
{
  "status": "success",
  "message": "File [Luat_Kinh_doanh.pdf] uploaded and indexed successfully.",
  "fileName": "Luat_Kinh_doanh.pdf",
  "size": 1024000,
  "logs": [
    "Uploading Luat_Kinh_doanh.pdf (1000.00 KB)...",
    "Extracting text from document...",
    "Chunking text (Chunk size: 1000, Overlap: 200)...",
    "Generating embeddings for chunks...",
    "Saved to Vector Database successfully."
  ]
}
```

---

## 4. Evaluation API (Lấy kết quả đánh giá mô hình)
Endpoint dùng để lấy các thông số thống kê DeepEval/RAGAS để đưa lên Dashboard.

- **URL:** `/api/evaluation`
- **Method:** `GET`
- **Headers:** 
  - `Accept: application/json`
  - `X-DeepEval-Key: ...`
  - `X-OpenAI-Key: sk-...`

### Success Response
- **Code:** `200 OK`
- **Body:**
```json
{
  "metrics": {
    "faithfulness": 0.85,
    "answerRelevance": 0.92,
    "contextPrecision": 0.78,
    "contextRecall": 0.88
  },
  "abTest": [
    { "name": "Config A (BM25 + Semantic)", "score": 0.82 },
    { "name": "Config B (Lexical + Semantic + HyDE)", "score": 0.89 }
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
