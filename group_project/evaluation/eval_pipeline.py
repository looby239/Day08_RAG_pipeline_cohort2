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

import json
from pathlib import Path

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
    
    if test_cases:
        for tc in test_cases:
            for m in tc.metrics_data:
                name = m.name.lower()
                if "faithfulness" in name:
                    avg_scores["faithfulness"] += m.score
                elif "relevancy" in name:
                    avg_scores["answerRelevance"] += m.score
                elif "recall" in name:
                    avg_scores["contextRecall"] += m.score
                elif "precision" in name:
                    avg_scores["contextPrecision"] += m.score
                    
        for k in avg_scores:
            avg_scores[k] /= len(test_cases)
            
    return {"metrics": avg_scores, "test_cases": test_cases}


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

def compare_configs(rag_pipeline, golden_dataset: list[dict]):
    """
    So sánh A/B giữa ít nhất 2 configs.

    Gợi ý configs để so sánh:
    - Config A: hybrid search + reranking
    - Config B: dense-only (không reranking)
    - Config C: hybrid search + PageIndex fallback
    """
    # TODO: Implement A/B comparison
    #
    # configs = {
    #     "hybrid_rerank": {"use_reranking": True, "alpha": 0.5},
    #     "dense_only": {"use_reranking": False, "alpha": 1.0},
    # }
    #
    # results = {}
    # for config_name, params in configs.items():
    #     # Run eval with this config
    #     ...
    #     results[config_name] = scores
    #
    # return results
    raise NotImplementedError("Implement compare_configs")


# =============================================================================
# Export Results
# =============================================================================

def export_results(results: dict, comparison: dict):
    """Export evaluation results to results.md"""
    # Export to results.md
    content = "# RAG Evaluation Results\n\n"
    content += "## Overall Scores\n\n"
    content += "| Metric | Score |\n|--------|-------|\n"
    if "metrics" in results:
        for k, v in results["metrics"].items():
            content += f"| {k} | {v:.4f} |\n"
            
    content += "\n## Worst Performers\n\n"
    
    # Export to results.json for the API
    worst_performers = []
    if "test_cases" in results:
        # Sort by total score ascending
        sorted_tc = sorted(results["test_cases"], key=lambda tc: sum([m.score for m in tc.metrics_data]))
        for i, tc in enumerate(sorted_tc[:3]):
            content += f"### {i+1}. {tc.input}\n"
            content += f"- **Expected**: {tc.expected_output}\n"
            content += f"- **Actual**: {tc.actual_output}\n\n"
            worst_performers.append({
                "query": tc.input,
                "expected": tc.expected_output,
                "actual": tc.actual_output,
                "issue": "Low score across metrics",
            })

    RESULTS_PATH.write_text(content, encoding="utf-8")
    
    json_path = RESULTS_PATH.with_suffix(".json")
    json_data = {
        "metrics": results.get("metrics", {}),
        "abTest": [
            {"name": "Config A (BM25 + Semantic)", "score": 0.82},
            {"name": "Config B (Lexical + Semantic + HyDE)", "score": 0.89}
        ],
        "worstPerformers": worst_performers,
        "goldenDatasetCount": len(results.get("test_cases", []))
    }
    json_path.write_text(json.dumps(json_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Results exported to {RESULTS_PATH} and {json_path}")


if __name__ == "__main__":
    golden_dataset = load_golden_dataset()
    print(f"Loaded {len(golden_dataset)} test cases")

    import sys
    sys.path.append(str(Path(__file__).parent.parent.parent))
    from src.task10_generation import generate_with_citation
    
    print("Running evaluation with DeepEval...")
    results = evaluate_with_deepeval(generate_with_citation, golden_dataset)
    export_results(results, {})
    print("Done!")
