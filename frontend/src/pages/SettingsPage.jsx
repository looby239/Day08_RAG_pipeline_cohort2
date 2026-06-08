import { useState, useEffect } from 'react';
import { Key, Save, Eye, EyeOff } from 'lucide-react';

const SettingsPage = () => {
    const [apiKeys, setApiKeys] = useState({
        openai: '',
        qdrant: '',
        deepeval: ''
    });
    
    const [showKeys, setShowKeys] = useState({
        openai: false,
        qdrant: false,
        deepeval: false
    });

    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        // Load from local storage on mount
        const savedKeys = localStorage.getItem('rag_api_keys');
        if (savedKeys) {
            try {
                setApiKeys(JSON.parse(savedKeys));
            } catch (e) {
                console.error("Failed to parse API keys", e);
            }
        }
    }, []);

    const handleChange = (key, value) => {
        setApiKeys(prev => ({ ...prev, [key]: value }));
        setIsSaved(false);
    };

    const toggleShowKey = (key) => {
        setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        localStorage.setItem('rag_api_keys', JSON.stringify(apiKeys));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <div className="page-header">
                <h1>Cài đặt API Keys</h1>
                <p>Thiết lập khóa API cho các dịch vụ bên ngoài (OpenAI, Vector DB, Evaluation framework).</p>
            </div>

            <div className="glass-panel" style={{ maxWidth: '600px', padding: '32px' }}>
                <form onSubmit={handleSave}>
                    <div className="input-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Key size={16} color="var(--accent-color)" /> OpenAI API Key
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                                type={showKeys.openai ? "text" : "password"}
                                className="text-input" 
                                value={apiKeys.openai}
                                onChange={e => handleChange('openai', e.target.value)}
                                placeholder="sk-..."
                                style={{ paddingRight: '40px' }}
                            />
                            <button type="button" onClick={() => toggleShowKey('openai')} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                {showKeys.openai ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dùng cho chức năng sinh văn bản (LLM) và Ragas.</span>
                    </div>

                    <div className="input-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Key size={16} color="var(--accent-color)" /> Qdrant / Pinecone API Key
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                                type={showKeys.qdrant ? "text" : "password"}
                                className="text-input" 
                                value={apiKeys.qdrant}
                                onChange={e => handleChange('qdrant', e.target.value)}
                                placeholder="Nhập khóa API cơ sở dữ liệu vector..."
                                style={{ paddingRight: '40px' }}
                            />
                            <button type="button" onClick={() => toggleShowKey('qdrant')} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                {showKeys.qdrant ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Key size={16} color="var(--accent-color)" /> DeepEval API Key
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                                type={showKeys.deepeval ? "text" : "password"}
                                className="text-input" 
                                value={apiKeys.deepeval}
                                onChange={e => handleChange('deepeval', e.target.value)}
                                placeholder="Nhập khóa API DeepEval..."
                                style={{ paddingRight: '40px' }}
                            />
                            <button type="button" onClick={() => toggleShowKey('deepeval')} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                {showKeys.deepeval ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                            <Save size={18} /> Lưu cấu hình
                        </button>
                        {isSaved && <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }} className="animate-fade-in">Đã lưu thành công vào Local Storage!</span>}
                    </div>
                </form>
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: '#EAF3FF', borderRadius: '8px', maxWidth: '600px', borderLeft: '4px solid var(--accent-color)' }}>
                <p style={{ fontSize: '0.85rem', color: '#1C1E21', lineHeight: '1.5' }}>
                    <strong>Lưu ý bảo mật:</strong> Các API Key được lưu trữ an toàn ngay trên trình duyệt (Local Storage) và chỉ được gửi trực tiếp đến Backend khi có yêu cầu xử lý từ phía người dùng. Tuyệt đối không chia sẻ màn hình này cho người khác.
                </p>
            </div>
        </div>
    );
};

export default SettingsPage;
