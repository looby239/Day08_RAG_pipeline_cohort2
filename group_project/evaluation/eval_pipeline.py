import os
import sys
import json
import logging

# Thêm root directory vào sys.path để có thể import module 'src'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from dotenv import load_dotenv
load_dotenv()

from src.task10_generation import generate_with_citation

from trulens.apps.custom import TruCustomApp, instrument
from trulens.core import Feedback
from trulens.providers.openai import OpenAI as TruOpenAI
from trulens.dashboard import run_dashboard

logging.basicConfig(level=logging.INFO)

class RAGPipeline:
    @instrument
    def generate(self, query: str) -> str:
        """
        Gọi hàm generate_with_citation từ Task 10.
        Hàm này được đánh dấu @instrument để TruLens có thể tracking (ghi AI log) tự động.
        """
        result = generate_with_citation(query)
        # Chúng ta chỉ trả về answer để TruLens dễ track output
        return result["answer"]

def main():
    rag = RAGPipeline()
    provider = TruOpenAI(model_engine="gpt-4o-mini") # Dùng gpt-4o-mini cho tiết kiệm

    # Định nghĩa các metrics (feedback functions)
    f_faithfulness = Feedback(provider.groundedness_measure_with_cot_reasons, name="Faithfulness").on_output()
    f_relevance = Feedback(provider.relevance, name="Answer Relevance").on_input_output()
    f_context_relevance = Feedback(provider.context_relevance, name="Context Relevance").on_input()

    # Wrap RAG pipeline với TruLens
    tru_rag = TruCustomApp(
        rag,
        app_name="DrugLaw_RAG",
        feedbacks=[f_faithfulness, f_relevance, f_context_relevance],
    )

    # Tải dataset
    dataset_path = os.path.join(os.path.dirname(__file__), "golden_dataset.json")
    try:
        with open(dataset_path, "r", encoding="utf-8") as f:
            golden_dataset = json.load(f)
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy {dataset_path}")
        return

    print("Bắt đầu chạy pipeline và ghi nhận AI log qua TruLens...")
    
    # Context manager 'recording' sẽ capture toàn bộ trace
    with tru_rag as recording:
        for item in golden_dataset:
            query = item["question"]
            print(f"\n[?] Query: {query}")
            try:
                # Việc gọi rag.generate sẽ tự động được ghi log
                answer = rag.generate(query)
                print(f"[*] Answer (snippet): {answer[:100]}...")
            except Exception as e:
                print(f"[!] Lỗi khi chạy query: {e}")

    print("\n✅ Hoàn tất việc ghi log! Đang khởi chạy TruLens Dashboard để xem kết quả...")
    run_dashboard()

if __name__ == "__main__":
    main()
