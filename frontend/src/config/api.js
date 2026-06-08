// Mock API Configuration & Functions
export const API_BASE = "http://localhost:8000/api";

// Simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockChat = async (query, useHyDE) => {
    await delay(1500); // simulate processing
    
    // Simple mock response based on query length/content
    return {
        answer: `Đây là câu trả lời được sinh ra bởi RAG pipeline. Bạn đã hỏi về: "${query}". \n\nTheo quy định của pháp luật, điều này được quy định rõ tại [Luật_Phong_chong_ma_tuy_2021.pdf] và [Bo_luat_Hinh_su_2015_sua_doi_2017.pdf]. \n\nHyDE mode: ${useHyDE ? 'Bật' : 'Tắt'}.`,
        sources: [
            { id: 1, content: "Điều 2, khoản 1, Luật phòng chống ma tuý 2021 quy định...", score: 0.85, metadata: { source: "Luat_Phong_chong_ma_tuy_2021.pdf", page: 12 } },
            { id: 2, content: "Hành vi vi phạm sẽ bị xử lý theo Bộ luật hình sự sửa đổi 2017...", score: 0.65, metadata: { source: "Bo_luat_Hinh_su_2015_sua_doi_2017.pdf", page: 45 } }
        ]
    };
};

export const mockRetrieval = async (query, method) => {
    await delay(1000);
    
    const baseSources = [
        { id: 1, content: `Kết quả từ ${method} cho query: ${query}... Đây là nội dung mẫu số 1.`, score: 0.92, metadata: { source: "doc1.pdf", type: method } },
        { id: 2, content: `Nội dung mẫu số 2 cho phương pháp ${method}. Rất liên quan đến truy vấn.`, score: 0.75, metadata: { source: "doc2.pdf", type: method } },
        { id: 3, content: `Một đoạn văn bản khác được trích xuất từ hệ thống tìm kiếm ${method}.`, score: 0.60, metadata: { source: "doc3.pdf", type: method } }
    ];
    
    return { results: baseSources };
};

export const mockIngestion = async (taskName) => {
    await delay(2000);
    return {
        status: 'success',
        message: `Task [${taskName}] completed successfully.`,
        logs: [
            `Starting ${taskName}...`,
            `Processing data...`,
            `Completed 100%`,
            `Saved to database.`
        ]
    };
};

export const mockEvaluation = async () => {
    await delay(1000);
    return {
        metrics: {
            faithfulness: 0.85,
            answerRelevance: 0.92,
            contextPrecision: 0.78,
            contextRecall: 0.88
        },
        abTest: [
            { name: "Config A (BM25 + Semantic)", score: 0.82 },
            { name: "Config B (Lexical + Semantic + HyDE)", score: 0.89 }
        ],
        worstPerformers: [
            { query: "Điều kiện cấp phép xây dựng nhà ở xã hội?", expected: "...", actual: "...", issue: "Low Context Recall" },
            { query: "Quy trình xử lý kỷ luật đảng viên?", expected: "...", actual: "...", issue: "Hallucination in generation" }
        ],
        goldenDatasetCount: 18
    };
};

export const mockUpload = async (file) => {
    await delay(1500); // simulate upload & processing
    return {
        status: 'success',
        message: `File [${file.name}] uploaded and indexed successfully.`,
        fileName: file.name,
        size: file.size,
        logs: [
            `Uploading ${file.name} (${(file.size / 1024).toFixed(2)} KB)...`,
            `Extracting text from document...`,
            `Chunking text (Chunk size: 1000, Overlap: 200)...`,
            `Generating embeddings for chunks...`,
            `Saved to Vector Database successfully.`
        ]
    };
};
