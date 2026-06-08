import asyncio
import io
from contextlib import redirect_stdout
from deepeval.test_case import LLMTestCase
from deepeval.metrics import FaithfulnessMetric
from deepeval import evaluate

async def run_test():
    test_case = LLMTestCase(
        input="What if these shoes don't fit?",
        actual_output="We offer a 30-day full refund at no extra cost.",
        retrieval_context=["All customers are eligible for a 30 day full refund at no extra cost."]
    )
    metric = FaithfulnessMetric(threshold=0.5, model="gpt-4o-mini")

    f_out = io.StringIO()
    with redirect_stdout(f_out):
        results = evaluate([test_case], [metric])
    
    with open("eval_results_inspect.txt", "w") as f:
        f.write(str(dir(results[0])) + "\n")

import asyncio
asyncio.run(run_test())
