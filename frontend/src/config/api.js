export const API_BASE = "http://localhost:8000";

// Normalize SourceChunk từ backend → format frontend dùng
const normalizeSource = (chunk, idx) => ({
    id: idx + 1,
    content: chunk.content,
    score: chunk.score,
    metadata: {
        source: chunk.metadata?.source || chunk.source || "unknown",
        type: chunk.metadata?.type || chunk.source || "hybrid",
        ...chunk.metadata,
    },
});

export const realChat = async (query, sessionId = null, topK = 5) => {
    const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, session_id: sessionId, top_k: Number(topK) }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
        answer: data.answer,
        session_id: data.session_id,
        sources: data.sources.map(normalizeSource),
    };
};

export const realSearch = async (query, topK = 5) => {
    const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, top_k: Number(topK) }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return { results: data.results.map(normalizeSource) };
};

export const checkHealth = async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

// Giữ lại mock cho các trang chưa nối thật (Ingestion, Evaluation)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockIngestion = async (taskName) => {
    await delay(2000);
    return {
        status: 'success',
        message: `Task [${taskName}] completed successfully.`,
        logs: [`Starting ${taskName}...`, `Processing data...`, `Completed 100%`, `Saved to database.`]
    };
};

export const mockEvaluation = async () => {
    await delay(1000);
    return {
        metrics: { faithfulness: 0.85, answerRelevance: 0.92, contextPrecision: 0.78, contextRecall: 0.88 },
        abTest: [
            { name: "Config A (BM25 + Semantic)", score: 0.82 },
            { name: "Config B (Lexical + Semantic + HyDE)", score: 0.89 }
        ],
        worstPerformers: [
            { query: "Điều kiện cấp phép xây dựng nhà ở xã hội?", expected: "...", actual: "...", issue: "Low Context Recall" },
        ],
        goldenDatasetCount: 18
    };
};

export const mockUpload = async (file) => {
    await delay(1500);
    return {
        status: 'success',
        message: `File [${file.name}] uploaded and indexed successfully.`,
        fileName: file.name,
        size: file.size,
        logs: [
            `Uploading ${file.name} (${(file.size / 1024).toFixed(2)} KB)...`,
            `Extracting text...`, `Chunking...`, `Embedding...`, `Saved to Vector DB.`
        ]
    };
};
