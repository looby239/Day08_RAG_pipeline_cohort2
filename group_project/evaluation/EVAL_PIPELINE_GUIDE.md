# Giải thích `eval_pipeline.py`

## 1. Mục đích của file

`eval_pipeline.py` dùng để đánh giá chất lượng hệ thống RAG trong bài tập nhóm.
File thực hiện bốn công việc chính:

1. Đọc bộ câu hỏi chuẩn từ `golden_dataset.json`.
2. Chạy từng câu hỏi qua hai cấu hình retrieval khác nhau.
3. Chấm kết quả bằng DeepEval hoặc bộ metric proxy offline.
4. Xuất kết quả chi tiết ra JSON và báo cáo tổng hợp ra Markdown.

Hai cấu hình được so sánh:

| Cấu hình | Pipeline |
|---|---|
| Config A: `hybrid_rerank` | Semantic search + BM25 + RRF + Jina reranking |
| Config B: `dense_only` | Chỉ semantic/vector search |

Mục tiêu của phép so sánh A/B là kiểm tra việc bổ sung BM25, RRF và Jina có cải
thiện chất lượng context được truy xuất hay không.

---

## 2. Các file tham gia

```text
group_project/evaluation/
├── eval_pipeline.py
├── golden_dataset.json
├── evaluation_results.json
├── results.md
└── EVAL_PIPELINE_GUIDE.md
```

Ngoài ra, pipeline gọi code từ:

```text
src/task5_semantic_search.py
src/task6_lexical_search.py
src/task7_reranking.py
src/task9_retrieval_pipeline.py
```

Vai trò của từng file:

- `golden_dataset.json`: chứa câu hỏi, đáp án chuẩn và context mong đợi.
- `task5_semantic_search.py`: tìm kiếm bằng embedding/vector.
- `task6_lexical_search.py`: tìm kiếm từ khóa bằng BM25.
- `task7_reranking.py`: gộp kết quả bằng RRF và rerank bằng Jina.
- `task9_retrieval_pipeline.py`: điều phối toàn bộ hybrid retrieval.
- `evaluation_results.json`: lưu kết quả chi tiết của từng test case.
- `results.md`: báo cáo tổng hợp, so sánh A/B và phân tích lỗi.

---

## 3. Luồng chạy tổng quát

Khi chạy:

```powershell
python group_project\evaluation\eval_pipeline.py --mode deepeval
```

chương trình đi theo luồng:

```text
main()
  |
  +-- Đọc tham số --mode
  |
  +-- load_golden_dataset()
  |     Đọc và kiểm tra 15 test case
  |
  +-- compare_configs()
  |     |
  |     +-- Chạy Config A: hybrid_rerank
  |     |
  |     +-- Chạy Config B: dense_only
  |
  +-- export_results()
        |
        +-- evaluation_results.json
        +-- results.md
```

Với mỗi cấu hình, từng câu hỏi được xử lý như sau:

```text
Câu hỏi
  |
  +-- run_config()
  |     Truy xuất top 5 chunks
  |
  +-- _answer_from_chunks()
  |     Tạo câu trả lời kiểm thử từ các chunks
  |
  +-- LLMTestCase
  |     Đóng gói question, answer, expected answer và contexts
  |
  +-- 4 DeepEval metrics
        Faithfulness
        Answer Relevancy
        Contextual Recall
        Contextual Precision
```

---

## 4. Phần khởi tạo

### Import thư viện

File sử dụng:

- `argparse`: đọc tham số dòng lệnh như `--mode deepeval`.
- `json`: đọc golden dataset và ghi kết quả JSON.
- `os`: đọc API key từ biến môi trường.
- `re`: tách câu và token bằng biểu thức chính quy.
- `sys`: thêm thư mục gốc dự án vào Python import path.
- `Path`: xử lý đường dẫn độc lập với hệ điều hành.
- `mean`: tính điểm trung bình.
- `dotenv`: đọc biến môi trường từ `.env`.

### Xác định thư mục dự án

```python
PROJECT_DIR = Path(__file__).resolve().parents[2]
```

Từ file `group_project/evaluation/eval_pipeline.py`, `parents[2]` trỏ tới thư
mục gốc của repository. Thư mục này được thêm vào `sys.path` để Python import
được các module trong `src`.

### Nạp biến môi trường

```python
load_dotenv(PROJECT_DIR / ".env")
```

Các biến quan trọng gồm:

- `OPENAI_API_KEY`: dùng cho DeepEval LLM judge.
- `JINA_API_KEY`: dùng cho Jina Reranker ở Config A.
- Các biến kết nối vector database của repository.

### Khai báo đường dẫn đầu vào và đầu ra

```python
GOLDEN_DATASET_PATH
RESULTS_PATH
RAW_RESULTS_PATH
```

Ba biến này lần lượt trỏ đến:

- `golden_dataset.json`
- `results.md`
- `evaluation_results.json`

---

## 5. `load_golden_dataset()`

Hàm này đọc danh sách test case từ JSON:

```python
dataset = json.loads(
    GOLDEN_DATASET_PATH.read_text(encoding="utf-8")
)
```

Sau khi đọc, hàm thực hiện hai bước kiểm tra.

### Kiểm tra số lượng

Dataset phải có ít nhất 15 test case. Nếu ít hơn, chương trình dừng bằng
`ValueError`.

### Kiểm tra cấu trúc

Mỗi test case bắt buộc có:

```text
question
expected_answer
expected_context
```

Một test case điển hình còn có:

```json
{
  "id": "legal-01",
  "category": "legal",
  "difficulty": "direct",
  "question": "...",
  "expected_answer": "...",
  "expected_context": "...",
  "expected_sources": ["..."]
}
```

Ý nghĩa:

- `question`: câu hỏi gửi vào RAG.
- `expected_answer`: đáp án chuẩn để đối chiếu.
- `expected_context`: nội dung bằng chứng mong muốn retrieval tìm thấy.
- `expected_sources`: tên tài liệu được kỳ vọng.

---

## 6. Các hàm tiện ích

### `_usable_key()`

Kiểm tra API key có vẻ hợp lệ hay không. Key bị coi là không dùng được khi:

- Chuỗi rỗng.
- Có chữ `xxx`.
- Kết thúc bằng `...`.

Đây chỉ là kiểm tra hình thức, không xác nhận key thực sự được nhà cung cấp chấp
nhận.

### `_tokens()`

Hàm:

1. Chuyển văn bản thành chữ thường.
2. Tách các token bằng regex.
3. Bỏ token một ký tự.
4. Bỏ các stopword tiếng Việt phổ biến.

Hàm này chỉ được dùng bởi chế độ offline, không tham gia chấm DeepEval.

### `_overlap()`

Tính tỷ lệ token của văn bản bên trái xuất hiện trong văn bản bên phải:

```text
overlap = số token chung / số token của văn bản bên trái
```

Ví dụ:

```text
left  = "thời hạn quản lý là một năm"
right = "thời hạn quản lý người sử dụng là 01 năm"
```

Nếu phần lớn token của `left` xuất hiện trong `right`, điểm overlap sẽ cao.

Đây là phép đo đơn giản theo từ khóa, không hiểu đầy đủ ngữ nghĩa.

### `_source_label()`

Lấy tên nguồn từ:

```python
chunk["metadata"]["source"]
```

Tên nguồn được chuyển thành chữ thường để dễ so sánh.

### `_answer_from_chunks()`

Hàm nhận danh sách chunks retrieval và tạo câu trả lời dùng cho evaluation.

Quy trình:

1. Lấy tối đa ba chunks đầu tiên.
2. Chuẩn hóa khoảng trắng.
3. Tách chunk thành các câu.
4. Chọn một câu có độ dài từ 45 đến 420 ký tự.
5. Gắn tên nguồn ở cuối câu.
6. Ghép các câu thành một answer.

Điểm cần lưu ý: hàm này không gọi model sinh câu trả lời. Answer trong evaluation
hiện tại là phần nội dung được trích từ chunks. Vì vậy, evaluation đang tập trung
nhiều vào chất lượng retrieval hơn chất lượng generation thực tế của chatbot.

---

## 7. `run_config()`

Hàm này chạy một test case bằng cấu hình được yêu cầu.

### Config A: `hybrid_rerank`

Hàm gọi:

```python
retrieve(
    question,
    top_k=5,
    score_threshold=0.0,
    use_reranking=True,
)
```

Trong `task9_retrieval_pipeline.py`, quá trình gồm:

1. Semantic search lấy candidate theo độ tương đồng vector.
2. BM25 lấy candidate theo từ khóa.
3. RRF hợp nhất hai bảng xếp hạng.
4. Jina Reranker sắp xếp lại candidate.
5. Trả về top 5 chunks.

Nếu Jina API key không hợp lệ hoặc API lỗi, `task7_reranking.py` dùng local
fallback thay vì dừng toàn bộ pipeline.

### Config B: `dense_only`

Hàm gọi trực tiếp:

```python
semantic_search(question, top_k=5)
```

Config này không dùng:

- BM25
- RRF
- Jina Reranker

Đây là baseline để đánh giá mức cải thiện của Config A.

### Kết quả trả về

```python
{
    "answer": ...,
    "sources": ...,
    "retrieval_source": ...
}
```

- `answer`: câu trả lời được tạo từ chunks.
- `sources`: top chunks đã truy xuất.
- `retrieval_source`: nhãn nguồn retrieval của chunk đầu tiên.

---

## 8. Chế độ offline

### `score_offline()`

Hàm tính bốn proxy metrics mà không gọi LLM judge.

#### Faithfulness proxy

```text
overlap(answer, retrieved context)
```

Đo xem token trong answer có xuất hiện trong context hay không.

#### Answer relevance proxy

```text
0.55 × overlap(question, answer)
+ 0.45 × overlap(expected answer, answer)
```

Metric ưu tiên mức liên quan với question, đồng thời so sánh với đáp án chuẩn.

#### Context recall proxy

```text
overlap(expected answer, retrieved context)
```

Đo xem các thông tin trong đáp án chuẩn có được retrieval tìm thấy hay không.

#### Context precision proxy

Mỗi chunk được xem là hữu ích nếu:

- Tên nguồn khớp với `expected_sources`, hoặc
- Content overlap với expected answer từ `0.18` trở lên.

Công thức:

```text
số chunks hữu ích / tổng số chunks
```

Các metric offline là heuristic minh bạch, chạy nhanh và không tốn API. Chúng
không tương đương với DeepEval LLM judge.

### `evaluate_config_offline()`

Hàm lặp qua toàn bộ dataset:

1. Gọi `run_config()`.
2. Gọi `score_offline()`.
3. Lưu answer, sources và score của từng case.
4. Tính trung bình bốn metric cho từng case.
5. Tính trung bình toàn bộ dataset.

---

## 9. Chế độ DeepEval

### `evaluate_with_deepeval()`

Đây là nhánh đánh giá chính thức bằng DeepEval.

Trước tiên, hàm kiểm tra `OPENAI_API_KEY`. Nếu không có key hợp lệ, chương trình
dừng bằng `RuntimeError`.

### Tạo `LLMTestCase`

Với mỗi câu hỏi, code tạo:

```python
LLMTestCase(
    input=item["question"],
    actual_output=result["answer"],
    expected_output=item["expected_answer"],
    retrieval_context=[
        source["content"]
        for source in result["sources"]
    ],
)
```

Ý nghĩa:

- `input`: câu hỏi người dùng.
- `actual_output`: câu trả lời do pipeline tạo.
- `expected_output`: đáp án chuẩn trong golden dataset.
- `retrieval_context`: các chunks được retrieval lấy về.

### Bốn DeepEval metrics

#### `FaithfulnessMetric`

Kiểm tra câu trả lời có được hỗ trợ bởi retrieval context hay không. Metric này
giúp phát hiện thông tin không có trong tài liệu hoặc hallucination.

#### `AnswerRelevancyMetric`

Kiểm tra câu trả lời có trực tiếp giải quyết câu hỏi hay không. Một answer có thể
đúng theo context nhưng vẫn bị điểm thấp nếu lan man hoặc không trả lời trọng tâm.

#### `ContextualRecallMetric`

So sánh retrieval context với expected answer để kiểm tra retrieval có lấy đủ
thông tin cần thiết hay không.

#### `ContextualPrecisionMetric`

Kiểm tra các chunks liên quan có được xếp ở vị trí tốt và top-k có chứa quá nhiều
chunks nhiễu hay không.

### Cách metric được chạy

Mỗi metric được khởi tạo với:

```python
threshold=0.7
async_mode=False
```

- `threshold=0.7`: ngưỡng tham khảo để xác định pass/fail.
- `async_mode=False`: các metric chạy tuần tự.

Code gọi:

```python
metric.measure(test_case)
```

Sau đó lưu:

- `metric.score`: điểm số.
- `metric.reason`: giải thích do LLM judge tạo.

### Số lượt đánh giá

Dataset hiện có 15 câu:

```text
15 câu × 2 configs × 4 metrics = 120 lần metric.measure()
```

Vì `async_mode=False`, các lượt chạy nối tiếp nhau. Mỗi `measure()` thường phát
sinh ít nhất một request LLM, nhưng số request thực tế có thể lớn hơn tùy cách
DeepEval triển khai metric.

Config A còn gọi Jina Reranker một lần cho mỗi câu hỏi:

```text
15 câu ≈ 15 request Jina
```

---

## 10. `compare_configs()`

Hàm quyết định framework dựa vào `mode`.

### `--mode deepeval`

Luôn dùng DeepEval. Nếu `OPENAI_API_KEY` không hợp lệ, chương trình báo lỗi.

### `--mode offline`

Luôn dùng proxy metrics offline, không gọi OpenAI.

### `--mode auto`

- Có OpenAI key hợp lệ: dùng DeepEval.
- Không có key hợp lệ: dùng offline proxy.

Sau khi chọn evaluator, hàm chạy tuần tự:

1. `hybrid_rerank`
2. `dense_only`

Kết quả được đóng gói thành:

```python
{
    "framework": ...,
    "config_a": ...,
    "config_b": ...
}
```

---

## 11. Phân tích test case yếu

### `_failure_stage()`

Hàm dùng score để suy đoán lỗi nằm ở retrieval hay generation.

Các quy tắc:

| Điều kiện | Kết luận |
|---|---|
| Context recall `< 0.35` | Retrieval thiếu bằng chứng |
| Context precision `< 0.4` | Retrieval lấy nhiều chunks nhiễu |
| Faithfulness `< 0.6` | Answer chưa bám sát context |
| Các trường hợp còn lại | Answer thiếu trọng tâm hoặc diễn đạt chưa tốt |

Đây là phân loại theo rule, không phải kết luận trực tiếp từ DeepEval.

---

## 12. `export_results()`

Hàm nhận kết quả của hai config và thực hiện:

1. Lấy aggregate score của Config A và Config B.
2. Tính chênh lệch từng metric.
3. Xếp test case Config A theo điểm trung bình tăng dần.
4. Chọn ba test case yếu nhất.
5. Tạo bảng Markdown và phần khuyến nghị.
6. Ghi kết quả ra hai file.

### `evaluation_results.json`

Chứa dữ liệu đầy đủ để máy xử lý:

- Framework đã dùng.
- Aggregate score.
- Kết quả từng câu hỏi.
- Answer được đánh giá.
- Danh sách nguồn retrieval.
- Điểm từng metric.
- Lý do của DeepEval nếu chạy chế độ DeepEval.

### `results.md`

Chứa báo cáo dễ đọc:

- Framework.
- Bảng điểm A/B.
- Delta giữa hai config.
- Config chiến thắng.
- Ba test case yếu nhất.
- Phân tích nguyên nhân.
- Khuyến nghị cải tiến.

---

## 13. `main()`

`main()` là điểm bắt đầu của chương trình.

### Bước 1: đọc tham số

```text
--mode auto
--mode deepeval
--mode offline
```

Mặc định là `auto`.

### Bước 2: load dataset

```python
dataset = load_golden_dataset()
```

### Bước 3: chạy A/B evaluation

```python
comparison = compare_configs(dataset, mode=args.mode)
```

### Bước 4: xuất báo cáo

```python
export_results(comparison)
```

### Bước 5: in thông báo hoàn tất

Terminal hiển thị số test case, framework đã dùng và đường dẫn `results.md`.

---

## 14. Cách chạy

### DeepEval chính thức

```powershell
python group_project\evaluation\eval_pipeline.py --mode deepeval
```

Yêu cầu:

- `OPENAI_API_KEY` hợp lệ.
- Vector database và dữ liệu của repository đã sẵn sàng.
- `JINA_API_KEY` hợp lệ để Config A dùng Jina thật.

### Offline proxy

```powershell
python group_project\evaluation\eval_pipeline.py --mode offline
```

Chế độ này phù hợp để:

- Kiểm tra pipeline có chạy hay không.
- Kiểm tra retrieval A/B nhanh.
- Chạy khi không muốn tốn chi phí OpenAI.

### Tự động lựa chọn

```powershell
python group_project\evaluation\eval_pipeline.py --mode auto
```

---

## 15. Cách đọc kết quả

Không nên chỉ nhìn điểm `average`. Cần xem từng metric:

- Faithfulness thấp: answer không được context hỗ trợ tốt.
- Answer relevance thấp: answer chưa trả lời đúng trọng tâm.
- Context recall thấp: retrieval bỏ sót bằng chứng.
- Context precision thấp: retrieval lấy nhiều chunks nhiễu.

Ví dụ:

```text
Faithfulness cao + Context recall thấp
```

Điều này có thể nghĩa là answer bám đúng những gì đã lấy được, nhưng retrieval
chưa lấy đủ thông tin để tạo đáp án hoàn chỉnh.

```text
Context recall cao + Context precision thấp
```

Điều này có thể nghĩa là bằng chứng cần thiết đã xuất hiện, nhưng top-k còn chứa
nhiều chunks không liên quan.

---

## 16. Những giới hạn cần hiểu rõ

### Answer chưa phải output generation thật

`_answer_from_chunks()` trích nội dung từ chunks thay vì gọi
`generate_with_citation()`. Do đó kết quả phản ánh retrieval nhiều hơn khả năng
sinh câu trả lời của chatbot.

Muốn đánh giá RAG end-to-end hoàn chỉnh, `actual_output` nên là answer thật từ
module generation.

### DeepEval phụ thuộc LLM judge

Điểm có thể thay đổi nhẹ giữa các lần chạy vì model judge không hoàn toàn tất
định. Model, prompt, temperature và phiên bản thư viện cũng có thể ảnh hưởng kết
quả.

### Chi phí và thời gian

DeepEval chạy nhiều request tuần tự nên chậm hơn offline đáng kể và phát sinh chi
phí API.

### Proxy offline không phải điểm DeepEval

Điểm offline được tính bằng token overlap và rule thủ công. Chỉ nên dùng để kiểm
tra nhanh hoặc so sánh tương đối, không nên gọi là kết quả LLM judge chính thức.

---

## 17. Tóm tắt ngắn

`eval_pipeline.py` thực hiện một phép thử A/B cho retrieval:

```text
Golden dataset
  |
  +-- Config A: hybrid + RRF + Jina
  |
  +-- Config B: dense-only
          |
          +-- DeepEval hoặc offline proxy
                  |
                  +-- JSON chi tiết
                  +-- Báo cáo Markdown
```

DeepEval trả lời câu hỏi: chất lượng context và answer của hai cấu hình khác nhau
như thế nào. Offline proxy giúp chạy nhanh khi không có LLM judge. Kết quả có ý
nghĩa nhất khi đọc riêng từng metric và xem các test case yếu, thay vì chỉ nhìn
điểm trung bình cuối cùng.
