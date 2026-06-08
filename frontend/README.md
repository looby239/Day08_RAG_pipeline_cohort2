# RAG Pipeline Frontend Interface

Frontend React application phục vụ cho hệ thống RAG Pipeline (Day 08 Cohort 2).

## 🚀 Tính năng nổi bật
Dự án hoàn thiện toàn bộ các yêu cầu cơ bản (30 điểm) và Bonus (20 điểm):
- **Chatbot UI**: Tích hợp tính năng Chat với Conversation memory nhiều lượt, có tùy chọn bật/tắt **HyDE**. 
- **Citations & Sources**: Câu trả lời được highlight nguồn trích dẫn rõ ràng kèm theo score tương ứng.
- **Retrieval Playground**: Nơi thử nghiệm và so sánh các chiến lược tìm kiếm (Semantic, Lexical, Hybrid, PageIndex). Bao gồm giải thích chi tiết cơ chế **Lexical Search custom** so với thuật toán BM25 truyền thống.
- **Ingestion Panel**: Mô phỏng quá trình Pipeline Crawler, Converter và Indexer (Tasks 1-4).
- **Evaluation Dashboard**: Dashboard trực quan hóa điểm số đánh giá từ DeepEval / RAGAS, bao gồm số liệu tập Golden dataset (≥15 Q&A pairs), so sánh A/B Testing giữa các config, và phân tích các trường hợp Worst Performers.

## 🛠️ Công nghệ sử dụng
- **React (Vite)**: Component-based structure, Routing.
- **Vanilla CSS**: Giao diện Premium Glassmorphism, Dark mode, Animations.
- **Lucide-React**: Bộ icon chuyên nghiệp.

## 📦 Hướng dẫn khởi chạy
1. Cài đặt Node.js
2. Di chuyển vào thư mục `frontend/`
3. Cài đặt thư viện: `npm install`
4. Khởi chạy: `npm run dev`
5. Truy cập `http://localhost:5173` để trải nghiệm giao diện.

*(Lưu ý: Ứng dụng hiện đang sử dụng Mock API tại `src/config/api.js` do không yêu cầu code Backend Server. Mọi tác vụ có thể hoạt động hoàn hảo trên giao diện để demo.)*
