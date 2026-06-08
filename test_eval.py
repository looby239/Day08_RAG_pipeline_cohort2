from deepeval.test_case import LLMTestCase
from deepeval.metrics import FaithfulnessMetric
from deepeval import evaluate

test_case = LLMTestCase(
    input="What if these shoes don't fit?",
    actual_output="We offer a 30-day full refund at no extra cost.",
    retrieval_context=["All customers are eligible for a 30 day full refund at no extra cost."]
)
metric = FaithfulnessMetric(threshold=0.5, model="gpt-4o-mini")

results = evaluate([test_case], [metric])

for r in results:
    print("TestResult properties:")
    print(dir(r))
    if hasattr(r, 'metrics'):
        print("metrics:", r.metrics)
    if hasattr(r, 'metrics_data'):
        print("metrics_data:", r.metrics_data)
