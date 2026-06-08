import asyncio
import json
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="PLVN RAG API Server")

class ChatRequest(BaseModel):
    query: str
    useHyDE: bool = False
    topK: int = 5
    threshold: float = 0.5
    searchMode: str = "Hybrid kết hợp"

@app.post("/api/chat")
async def chat_sync(request: ChatRequest, x_openai_key: Optional[str] = Header(None)):
    """
    API Sinh câu trả lời đồng bộ (Synchronous).
    Chỉ trả về kết quả khi toàn bộ quá trình đã hoàn tất.
    """
    # TODO: Tích hợp logic RAG ở đây:
    # results = retrieve(request.query, request.topK, request.threshold)
    # answer = generate_with_citation(request.query, results, x_openai_key)
    
    return {
        "answer": "Đây là câu trả lời được sinh ra từ backend (Mock đồng bộ).",
        "sources": []
    }

@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest, x_openai_key: Optional[str] = Header(None)):
    """
    API Sinh câu trả lời realtime qua Server-Sent Events (SSE).
    Đẩy trạng thái (status), nguồn tài liệu (sources) và nội dung (chunk) về cho frontend.
    """
    async def event_generator():
        # TODO: Cập nhật logic RAG pipeline thật vào luồng này
        
        # 1. Phát tín hiệu trạng thái Phân tích
        yield f"data: {json.dumps({'type': 'status', 'message': 'Đang phân tích truy vấn...'})}\n\n"
        await asyncio.sleep(1) # Fake delay
        
        # 2. Phát tín hiệu trạng thái Tìm kiếm (TODO: Chạy lexical/semantic search)
        yield f"data: {json.dumps({'type': 'status', 'message': 'Đang tìm kiếm tài liệu luật và báo chí...'})}\n\n"
        await asyncio.sleep(1) # Fake delay
        
        # 3. Phát tín hiệu trạng thái Reranking (TODO: Chạy mô hình Cross-encoder)
        yield f"data: {json.dumps({'type': 'status', 'message': 'Đang đánh giá mức độ liên quan (Reranking)...'})}\n\n"
        await asyncio.sleep(1) # Fake delay
        
        # 4. Phát tín hiệu trạng thái Sinh câu trả lời
        yield f"data: {json.dumps({'type': 'status', 'message': 'Đang tổng hợp câu trả lời chi tiết...'})}\n\n"
        
        # 5. Bắt đầu trả về sources (sau khi retrieve xong)
        sources_data = [
            {"id": 1, "content": "Khoản 1 Điều 2 Luật ABC...", "score": 0.9, "metadata": {"source": "Luat_ABC.pdf"}}
        ]
        yield f"data: {json.dumps({'type': 'sources', 'data': sources_data})}\n\n"
        
        # 6. Stream câu trả lời từng chữ (chunks) (TODO: Stream response từ LLM)
        answer = f"Đây là câu trả lời stream thử nghiệm cho câu hỏi '{request.query}'. Theo quy định của pháp luật hiện hành..."
        for word in answer.split():
            yield f"data: {json.dumps({'type': 'chunk', 'text': f'{word} '})}\n\n"
            await asyncio.sleep(0.1)
            
        yield "data: {\"type\": \"done\"}\n\n"
        
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    # Cần cài đặt uvicorn và fastapi: pip install fastapi uvicorn pydantic
    uvicorn.run(app, host="0.0.0.0", port=8000)
