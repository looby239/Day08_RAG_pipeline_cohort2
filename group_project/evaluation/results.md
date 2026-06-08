# RAG Evaluation Results

## Framework sử dụng

**Offline deterministic proxy**

DeepEval là framework chính của dự án. Khi chưa có OpenAI judge key hợp lệ, báo
cáo dùng bộ metric proxy minh bạch, chạy hoàn toàn offline để kiểm tra A/B.

## Overall Scores

| Metric | Config A (hybrid + rerank) | Config B (dense-only) | Delta |
|--------|----------------------------|-----------------------|-------|
| Faithfulness | 0.925 | 0.911 | +0.014 |
| Answer Relevance | 0.820 | 0.578 | +0.242 |
| Context Recall | 0.981 | 0.727 | +0.253 |
| Context Precision | 0.947 | 0.787 | +0.160 |
| Average | 0.918 | 0.751 | +0.167 |

## A/B Comparison Analysis

**Config A:** Semantic + BM25 + RRF + Jina reranking.

**Config B:** Semantic search only, no fusion or reranking.

**Kết luận:** Config A tốt hơn trên bộ 15 câu hỏi. Config A đạt
0.918, Config B đạt 0.751. Kết quả
cho biết tác động tổng hợp của BM25, RRF và reranking đối với cả recall lẫn độ
chính xác của context.

## Worst Performers (Bottom 3 của Config A)

| # | Question | Faithfulness | Relevance | Recall | Failure Stage | Root Cause |
|---|----------|--------------|-----------|--------|---------------|------------|
| 1 | Hiệp Gà từng lĩnh án bao lâu và về tội gì? | 0.944 | 0.843 | 1.000 | Generation | Câu trả lời còn thiếu trọng tâm hoặc diễn đạt chưa đủ rõ |
| 2 | Người sử dụng trái phép chất ma túy có những trách nhiệm nào? | 0.868 | 0.493 | 0.963 | Generation | Câu trả lời còn thiếu trọng tâm hoặc diễn đạt chưa đủ rõ |
| 3 | Quy trình cai nghiện ma túy gồm những giai đoạn nào? | 0.911 | 0.638 | 0.947 | Generation | Câu trả lời còn thiếu trọng tâm hoặc diễn đạt chưa đủ rõ |

## Recommendations

### Cải tiến 1
**Action:** Bổ sung bản text hoặc OCR chất lượng cao cho các nghị định đang là PDF scan.

**Expected impact:** Tăng context recall cho câu hỏi về danh mục chất và hướng dẫn thi hành.

### Cải tiến 2
**Action:** Tách văn bản pháp luật theo Điều, khoản và lưu số điều trong metadata.

**Expected impact:** Giảm chunk nhiễu, tăng context precision và citation chính xác.

### Cải tiến 3
**Action:** Chạy Jina Reranker và DeepEval bằng API key thật trước buổi demo.

**Expected impact:** Có điểm cross-encoder và LLM judge chính thức thay cho fallback offline.
