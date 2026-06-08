import { useState, useRef } from 'react';
import { Terminal, UploadCloud, FileText, CheckCircle } from 'lucide-react';
import { mockUpload } from '../config/api';

const IngestionPage = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleChange = async (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = async (files) => {
        setIsLoading(true);
        for (const file of files) {
            setLogs(prev => [...prev, `> Khởi tạo tiến trình tải lên cho: ${file.name}...`]);
            try {
                const res = await mockUpload(file);
                setLogs(prev => [...prev, ...res.logs.map(l => `> ${l}`), `> SUCCESS: ${res.message}`]);
                setUploadedFiles(prev => [...prev, file]);
            } catch (error) {
                setLogs(prev => [...prev, `> ERROR: Thất bại khi tải lên ${file.name}.`]);
            }
        }
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <div className="page-header">
                <h1>Data Ingestion Pipeline</h1>
                <p>Tải tài liệu lên (PDF, DOCX, TXT) để hệ thống tự động trích xuất, chia nhỏ (chunking) và lập chỉ mục (indexing) vào Vector Database.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Drag and Drop Area */}
                    <div 
                        className="glass-panel" 
                        style={{ 
                            padding: '40px 20px', 
                            textAlign: 'center', 
                            border: dragActive ? '2px dashed var(--accent-color)' : '2px dashed var(--panel-border)',
                            background: dragActive ? '#EAF3FF' : 'var(--panel-bg)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px'
                        }}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                    >
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            multiple
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleChange} 
                            style={{ display: 'none' }} 
                        />
                        <div style={{ background: '#EAF3FF', padding: '16px', borderRadius: '50%', color: 'var(--accent-color)' }}>
                            <UploadCloud size={48} />
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '8px' }}>Kéo thả tài liệu vào đây</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hoặc click để chọn file từ máy tính (Hỗ trợ PDF, DOCX, TXT)</p>
                        </div>
                        <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); triggerFileSelect(); }} disabled={isLoading}>
                            Chọn tài liệu
                        </button>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                        <div className="glass-panel" style={{ padding: '24px' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Tài liệu đã lập chỉ mục ({uploadedFiles.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {uploadedFiles.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F0F2F5', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                                        <FileText size={20} color="var(--accent-color)" />
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{f.name}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{(f.size / 1024).toFixed(2)} KB</div>
                                        </div>
                                        <CheckCircle size={18} color="var(--success)" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Console Log */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', background: '#F0F2F5', borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Terminal size={18} color="var(--text-secondary)" />
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>Console Output</span>
                    </div>
                    <div style={{ flex: 1, padding: '16px', background: '#1C1E21', fontFamily: 'monospace', color: '#42B72A', fontSize: '0.85rem', overflowY: 'auto', minHeight: '400px', maxHeight: '600px', lineHeight: '1.6' }}>
                        {logs.length === 0 ? (
                            <span style={{ color: 'var(--text-secondary)' }}>Đang chờ tài liệu...</span>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="animate-fade-in" style={{ marginBottom: '4px', wordBreak: 'break-all' }}>{log}</div>
                            ))
                        )}
                        {isLoading && (
                            <div className="animate-fade-in" style={{ color: 'var(--warning)', marginTop: '8px' }}>
                                <i>&gt; Đang xử lý...</i>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IngestionPage;
