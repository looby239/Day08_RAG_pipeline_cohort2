import json
import os

transcript_path = r"C:\Users\looby\.gemini\antigravity-ide\brain\4c4a3c29-1a04-4582-b5bb-2a696e9f1fc9\.system_generated\logs\transcript.jsonl"
output_path = r"C:\Users\looby\Day08_RAG_pipeline_cohort2\ai_coding_log.md"

def generate_log():
    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Cannot find transcript file at {transcript_path}")
        return

    log_entries = []
    
    for line in lines:
        if not line.strip():
            continue
            
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
            
        source = entry.get("source")
        step_type = entry.get("type")
        content = entry.get("content", "")
        
        # User input
        if step_type == "USER_INPUT" and "<USER_REQUEST>" in content:
            req_start = content.find("<USER_REQUEST>") + len("<USER_REQUEST>")
            req_end = content.find("</USER_REQUEST>")
            if req_start != -1 and req_end != -1:
                user_req = content[req_start:req_end].strip()
                log_entries.append(f"## 🧑 Lệnh của User\n\n> {user_req}\n")
        
        # Model actions
        elif source == "MODEL":
            tool_calls = entry.get("tool_calls", [])
            if tool_calls:
                for tc in tool_calls:
                    name = tc.get("name")
                    args = tc.get("args", {})
                    summary = args.get("toolSummary", name)
                    
                    if name == "ask_question":
                        log_entries.append(f"### 🤖 AI hỏi User một câu hỏi trắc nghiệm để xác nhận.\n")
                    elif name == "write_to_file":
                        target_file = args.get("TargetFile", "")
                        desc = args.get("Description", "Viết file mới")
                        log_entries.append(f"### 🛠️ AI thực hiện:\n- **Tạo/Ghi file**: `{target_file}`\n- **Mô tả**: {desc}\n")
                    elif name == "replace_file_content":
                        target_file = args.get("TargetFile", "")
                        desc = args.get("Description", "Cập nhật file")
                        log_entries.append(f"### 🛠️ AI thực hiện:\n- **Chỉnh sửa file**: `{target_file}`\n- **Mô tả**: {desc}\n")
                    elif name == "run_command":
                        cmd = args.get("CommandLine", "")
                        log_entries.append(f"### 💻 AI chạy lệnh terminal:\n```bash\n{cmd}\n```\n")
                    elif name == "view_file":
                        target = args.get("AbsolutePath", "")
                        log_entries.append(f"### 🔍 AI đọc file:\n- `{target}`\n")
                    elif name == "list_dir":
                        target = args.get("DirectoryPath", "")
                        log_entries.append(f"### 🔍 AI kiểm tra thư mục:\n- `{target}`\n")
            
            # Model response content (text)
            if content:
                # remove thought blocks to make it cleaner
                # Usually thought blocks are not in 'content' if it's the final answer, or if they are, we can just print it
                log_entries.append(f"### 🤖 AI trả lời:\n{content}\n")
                
        # Ask question response (USER)
        elif source == "USER_EXPLICIT" and step_type == "ASK_QUESTION_RESPONSE":
            ans = entry.get("content", "")
            log_entries.append(f"## 🧑 Lựa chọn của User\n\n> {ans}\n")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# 📝 AI Coding Log (Lịch sử các bước AI đã tạo)\n\n")
        f.write("Dưới đây là tóm tắt các yêu cầu của bạn, các câu lệnh AI đã chạy và các file AI đã sinh ra trong quá trình code.\n\n")
        f.write("---\n\n")
        f.write("\n".join(log_entries))
        
    print(f"Đã tạo file log tại {output_path}")

if __name__ == "__main__":
    generate_log()
