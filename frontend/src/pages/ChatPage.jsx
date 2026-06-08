import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { mockChat } from '../config/api';

const ChatPage = () => {
    const [messages, setMessages] = useState([{
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý ảo RAG pháp luật. Tôi có thể giúp gì cho bạn hôm nay?',
        sources: null
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useHyDE, setUseHyDE] = useState(false);
    const [topK, setTopK] = useState(5);
    const [threshold, setThreshold] = useState(0.5);
    const [searchMode, setSearchMode] = useState('Hybrid kết hợp');
    const messagesEndRef = useRef(null);

    const openSource = (sourceName) => {
        alert(`Mở tài liệu trích dẫn: ${sourceName}`);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await mockChat(userMsg, useHyDE);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: res.answer,
                sources: res.sources
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi khi gọi API.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatContent = (content) => {
        const parts = content.split(/(\[.*?\])/g);
        return parts.map((part, idx) => {
            if (part.startsWith('[') && part.endsWith(']')) {
                return (
                    <span 
                        key={idx} 
                        style={{ color: 'var(--accent-color)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => openSource(part.slice(1, -1))}
                        title="Click để mở tài liệu"
                    >
                        {part}
                    </span>
                );
            }
            return <span key={idx}>{part}</span>;
        });
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>RAG Chatbot</h1>
                    <p>Hệ thống hỏi đáp pháp luật với Conversation Memory và Citation.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--panel-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Top-K:</span>
                        <input type="number" value={topK} onChange={e => setTopK(e.target.value)} style={{ width: '50px', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }} min="1" max="20" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--panel-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ngưỡng điểm:</span>
                        <input type="number" step="0.1" value={threshold} onChange={e => setThreshold(e.target.value)} style={{ width: '50px', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }} min="0" max="1" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--panel-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chế độ:</span>
                        <select value={searchMode} onChange={e => setSearchMode(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <option value="Hybrid kết hợp">Hybrid kết hợp</option>
                            <option value="Lexical từ khóa">Lexical từ khóa</option>
                            <option value="Semantic ngữ nghĩa">Semantic ngữ nghĩa</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--panel-bg)', padding: '6px 12px', borderRadius: '24px', border: '1px solid var(--panel-border)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>HyDE</span>
                        <button onClick={() => setUseHyDE(!useHyDE)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: useHyDE ? 'var(--accent-color)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                            {useHyDE ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FFFFFF' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', gap: '16px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                            <div style={{ 
                                width: '40px', height: '40px', borderRadius: '50%', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: msg.role === 'user' ? 'var(--accent-color)' : '#E4E6EB',
                                color: msg.role === 'user' ? '#FFF' : 'var(--text-primary)'
                            }}>
                                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{ 
                                    padding: '12px 16px', borderRadius: '18px', 
                                    background: msg.role === 'user' ? 'var(--accent-color)' : '#F0F2F5',
                                    color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                                    lineHeight: '1.5',
                                    fontSize: '0.95rem'
                                }}>
                                    {formatContent(msg.content)}
                                </div>
                                {msg.sources && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Nguồn trích dẫn:</div>
                                        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                                            {msg.sources.map((src, idx) => (
                                                <div 
                                                    key={idx} 
                                                    style={{ padding: '12px', minWidth: '250px', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--panel-border)', borderRadius: '8px', background: '#FFFFFF' }}
                                                    onClick={() => openSource(src.metadata.source)}
                                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#F0F2F5'}
                                                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                                                    title="Click để mở tài liệu"
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14}/> Source {idx+1}</span>
                                                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Score: {src.score.toFixed(2)}</span>
                                                    </div>
                                                    <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {src.metadata.source}
                                                    </div>
                                                    <div style={{ color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        "{src.content}"
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E4E6EB', color: 'var(--text-primary)' }}>
                                <Bot size={20} />
                            </div>
                            <div style={{ padding: '12px 16px', borderRadius: '18px', background: '#F0F2F5', color: 'var(--text-secondary)' }}>
                                <span className="animate-fade-in">Đang suy nghĩ...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div style={{ padding: '16px', borderTop: '1px solid var(--panel-border)', background: '#FFFFFF' }}>
                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
                        <input 
                            type="text" 
                            className="text-input" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            disabled={isLoading}
                        />
                        <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }} disabled={isLoading || !input.trim()}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
