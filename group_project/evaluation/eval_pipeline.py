"""
RAG Evaluation Pipeline.

Sử dụng DeepEval / RAGAS / TruLens để đánh giá chất lượng RAG pipeline.
Chọn 1 framework và implement đầy đủ.

Yêu cầu:
    1. Load golden_dataset.json (≥15 Q&A pairs)
    2. Chạy RAG pipeline trên từng question
    3. Evaluate với 4 metrics: faithfulness, relevance, context_recall, context_precision
    4. So sánh A/B ít nhất 2 configs
    5. Export results ra results.md
"""

import os
import json
from pathlib import Path

os.environ["DEEPEVAL_PER_ATTEMPT_TIMEOUT_SECONDS_OVERRIDE"] = "120"

GOLDEN_DATASET_PATH = Path(__file__).parent / "golden_dataset.json"
RESULTS_PATH = Path(__file__).parent / "results.md"


def load_golden_dataset() -> list[dict]:
    """Load golden dataset từ JSON file."""
    with open(GOLDEN_DATASET_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# =============================================================================
# Option 1: DeepEval
# =============================================================================

def evaluate_with_deepeval(rag_pipeline, golden_dataset: list[dict]) -> dict:
    """
    Evaluate RAG pipeline sử dụng DeepEval.

    pip install deepeval
    """
    from deepeval import evaluate
    from deepeval.metrics import (
        FaithfulnessMetric,
        AnswerRelevancyMetric,
        ContextualRecallMetric,
        ContextualPrecisionMetric,
    )
    from deepeval.test_case import LLMTestCase

    test_cases = []
    print("Generating answers for test cases...")
    for item in golden_dataset:
        result = rag_pipeline(item["question"])
        test_case = LLMTestCase(
            input=item["question"],
            actual_output=result["answer"],
            expected_output=item["expected_answer"],
            retrieval_context=[c["content"] for c in result["sources"]],
        )
        test_cases.append(test_case)

    print("Running evaluation metrics...")
    metrics = [
        FaithfulnessMetric(threshold=0.5, model="gpt-4o-mini"),
        AnswerRelevancyMetric(threshold=0.5, model="gpt-4o-mini"),
        ContextualRecallMetric(threshold=0.5, model="gpt-4o-mini"),
        ContextualPrecisionMetric(threshold=0.5, model="gpt-4o-mini"),
    ]

    results = evaluate(test_cases, metrics)
    
    # Calculate average scores
    avg_scores = {
        "faithfulness": 0.0,
        "answerRelevance": 0.0,
        "contextRecall": 0.0,
        "contextPrecision": 0.0,
    }
    
    if results:
        for tr in results:
            # handle both .metrics and .metrics_data depending on deepeval version
            metrics_list = getattr(tr, 'metrics_data', getattr(tr, 'metrics', []))
            for m in metrics_list:
                name = m.name.lower() if hasattr(m, 'name') else getattr(m, '__class__', '').__name__.lower()
                score = getattr(m, 'score', 0.0)
                if "faithfulness" in name:
                    avg_scores["faithfulness"] += score
                elif "relevancy" in name:
                    avg_scores["answerRelevance"] += score
                elif "recall" in name:
                    avg_scores["contextRecall"] += score
                elif "precision" in name:
                    avg_scores["contextPrecision"] += score
                    
        for k in avg_scores:
            avg_scores[k] /= len(results)
            
    return {"metrics": avg_scores, "results": results, "test_cases": test_cases}


# =============================================================================
# Option 2: RAGAS
# =============================================================================

def evaluate_with_ragas(rag_pipeline, golden_dataset: list[dict]) -> dict:
    """
    Evaluate RAG pipeline sử dụng RAGAS.

    pip install ragas
    """
    # TODO: Implement
    #
    # from ragas import evaluate
    # from ragas.metrics import (
    #     faithfulness,
    #     answer_relevancy,
    #     context_recall,
    #     context_precision,
    # )
    # from datasets import Dataset
    #
    # eval_data = {"question": [], "answer": [], "contexts": [], "ground_truth": []}
    #
    # for item in golden_dataset:
    #     result = rag_pipeline.generate_with_citation(item["question"])
    #     eval_data["question"].append(item["question"])
    #     eval_data["answer"].append(result["answer"])
    #     eval_data["contexts"].append([c["content"] for c in result["sources"]])
    #     eval_data["ground_truth"].append(item["expected_answer"])
    #
    # dataset = Dataset.from_dict(eval_data)
    # result = evaluate(
    #     dataset,
    #     metrics=[faithfulness, answer_relevancy, context_recall, context_precision],
    # )
    # return result.to_pandas()
    raise NotImplementedError("Implement evaluate_with_ragas")


# =============================================================================
# Option 3: TruLens
# =============================================================================

def evaluate_with_trulens(rag_pipeline, golden_dataset: list[dict]) -> dict:
    """
    Evaluate RAG pipeline sử dụng TruLens.

    pip install trulens
    """
    # TODO: Implement
    #
    # from trulens.apps.custom import TruCustomApp
    # from trulens.core import Feedback
    # from trulens.providers.openai import OpenAI as TruOpenAI
    #
    # provider = TruOpenAI()
    #
    # f_faithfulness = Feedback(provider.groundedness_measure_with_cot_reasons).on_output()
    # f_relevance = Feedback(provider.relevance).on_input_output()
    # f_context_relevance = Feedback(provider.context_relevance).on_input()
    #
    # tru_rag = TruCustomApp(
    #     rag_pipeline,
    #     app_name="DrugLaw_RAG",
    #     feedbacks=[f_faithfulness, f_relevance, f_context_relevance],
    # )
    #
    # with tru_rag as recording:
    #     for item in golden_dataset:
    #         rag_pipeline.generate_with_citation(item["question"])
    #
    # # Dashboard: from trulens.dashboard import run_dashboard; run_dashboard()
    raise NotImplementedError("Implement evaluate_with_trulens")


# =============================================================================
# A/B Comparison
# =============================================================================

def compare_configs(golden_dataset: list[dict]):
    """
    So sánh A/B giữa 2 configs thực tế.
    """
    import sys
    sys.path.append(str(Path(__file__).parent.parent.parent))
    from src.task9_retrieval_pipeline import retrieve
    from src.task10_generation import generate_with_citation

    def config_a(query: str):
        # BM25 + Semantic (không HyDE, không Reranking)
        chunks = retrieve(query, top_k=5, use_reranking=False, use_hyde=False)
        return generate_with_citation(query, chunks=chunks)

    def config_b(query: str):
        # Lexical + Semantic + HyDE + Reranking
        chunks = retrieve(query, top_k=5, use_reranking=True, use_hyde=True)
        return generate_with_citation(query, chunks=chunks)

    print("\n[A/B Testing] Evaluating Config A (BM25 + Semantic)...")
    res_a = evaluate_with_deepeval(config_a, golden_dataset)
    score_a = sum(res_a["metrics"].values()) / max(len(res_a["metrics"]), 1)

    print("\n[A/B Testing] Evaluating Config B (Lexical + Semantic + HyDE + Rerank)...")
    res_b = evaluate_with_deepeval(config_b, golden_dataset)
    score_b = sum(res_b["metrics"].values()) / max(len(res_b["metrics"]), 1)

    ab_test = [
        {"name": "Config A (BM25 + Semantic)", "score": score_a},
        {"name": "Config B (Lexical + Semantic + HyDE + Rerank)", "score": score_b},
    ]
    return ab_test, res_b


# =============================================================================
# Export Results
# =============================================================================

def export_results(results: dict, comparison: list[dict]):
    """Export evaluation results to results.md"""
    # Export to results.md
    content = "# RAG Evaluation Results\n\n"
    content += "## Overall Scores (Config B)\n\n"
    content += "| Metric | Score |\n|--------|-------|\n"
    if "metrics" in results:
        for k, v in results["metrics"].items():
            content += f"| {k} | {v:.4f} |\n"
            
    content += "\n## Worst Performers\n\n"
    
    # Export to results.json for the API
    worst_performers = []
    if "results" in results:
        # Sort by total score ascending
        def get_total_score(tr):
            metrics_list = getattr(tr, 'metrics_data', getattr(tr, 'metrics', []))
            return sum([getattr(m, 'score', 0) for m in metrics_list])
            
        sorted_tr = sorted(results["results"], key=get_total_score)
        for i, tr in enumerate(sorted_tr[:3]):
            tc_input = getattr(tr, 'input', getattr(tr, 'query', 'Unknown'))
            tc_expected = getattr(tr, 'expected_output', 'Unknown')
            tc_actual = getattr(tr, 'actual_output', 'Unknown')
            content += f"### {i+1}. {tc_input}\n"
            content += f"- **Expected**: {tc_expected}\n"
            content += f"- **Actual**: {tc_actual}\n\n"
            worst_performers.append({
                "query": tc_input,
                "expected": tc_expected,
                "actual": tc_actual,
                "issue": "Low score across metrics",
            })

    RESULTS_PATH.write_text(content, encoding="utf-8")
    
    json_path = RESULTS_PATH.with_suffix(".json")
    json_data = {
        "metrics": results.get("metrics", {}),
        "abTest": comparison,
        "worstPerformers": worst_performers,
        "goldenDatasetCount": len(results.get("test_cases", []))
    }
    json_path.write_text(json.dumps(json_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nResults exported to {RESULTS_PATH} and {json_path}")


if __name__ == "__main__":
    golden_dataset = load_golden_dataset()
    print(f"Loaded {len(golden_dataset)} test cases")

    import sys
    sys.path.append(str(Path(__file__).parent.parent.parent))
    from src.task10_generation import generate_with_citation
    
    # Run the full A/B comparison and DeepEval metrics
    ab_test_results, default_eval_results = compare_configs(golden_dataset)
    export_results(default_eval_results, ab_test_results)
    print("Done!")
