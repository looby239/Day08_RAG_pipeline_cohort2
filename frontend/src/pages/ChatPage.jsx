import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { realChat } from '../config/api';

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [useHyDE, setUseHyDE] = useState(false);
    const [useRerank, setUseRerank] = useState(true);
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

    const handleSend = async (e, textOverride = null) => {
        if (e) e.preventDefault();
        const userMsg = textOverride || input;
        if (!userMsg.trim()) return;

        if (!textOverride) setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await realChat(userMsg, sessionId, topK, useHyDE, useRerank, threshold, searchMode);
            if (res.session_id) setSessionId(res.session_id);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: res.answer,
                sources: res.sources,
                time: (Math.random() * 2 + 0.5).toFixed(1) // mock time if not from API
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Lỗi: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (text) => {
        handleSend(null, text);
    };

    const formatContent = (content) => {
        const parts = content.split(/(\[.*?\])/g);
        return parts.map((part, idx) => {
            if (part.startsWith('[') && part.endsWith(']')) {
                const citeName = part.slice(1, -1);
                return (
                    <span 
                        key={idx} 
                        style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.8rem', fontWeight: '600', fontFamily: 'inherit',
                            background: '#EAF3FF', color: '#1877F2',
                            border: '1px solid #C9E0FF',
                            padding: '1px 6px', borderRadius: '6px', margin: '0 2px',
                            cursor: 'pointer', verticalAlign: 'baseline', lineHeight: '1.4',
                            whiteSpace: 'nowrap', transition: 'background 0.15s'
                        }}
                        onClick={() => openSource(citeName)}
                        title={`Mở tài liệu: ${citeName}`}
                        onMouseOver={e => e.currentTarget.style.background = '#D8E8FF'}
                        onMouseOut={e => e.currentTarget.style.background = '#EAF3FF'}
                    >
                        {citeName.substring(0, 20) + (citeName.length > 20 ? '...' : '')}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--panel-bg)', padding: '6px 12px', borderRadius: '24px', border: '1px solid var(--panel-border)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rerank</span>
                        <button onClick={() => setUseRerank(!useRerank)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: useRerank ? 'var(--accent-color)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                            {useRerank ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FFFFFF' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {messages.length === 0 ? (
                        <div style={{ margin: 'auto', textAlign: 'center', padding: '40px 20px', maxWidth: '760px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '18px' }}>
                                Tra cứu minh bạch · có trích dẫn nguồn
                            </div>
                            <h2 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: '600', marginBottom: '14px', color: 'var(--text-primary)', lineHeight: '1.12', letterSpacing: '-0.01em' }}>
                                Hỏi về luật & tin tức<br/>phòng, chống ma túy
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(15px, 2vw, 17.5px)', marginBottom: '38px', lineHeight: '1.6', maxWidth: '540px', margin: '0 auto 38px' }}>
                                Mỗi câu trả lời đều dẫn nguồn tới điều luật hoặc bài báo gốc, kèm điểm tin cậy từ bước rerank — để bạn kiểm chứng, không phải tin suông.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px', textAlign: 'left' }}>
                                {[
                                    { q: 'Tàng trữ trái phép chất ma túy bị xử lý hình sự thế nào?', d: 'Khung hình phạt theo Bộ luật Hình sự', tag: 'Luật' },
                                    { q: 'Người nghiện ma túy có bị xử lý hình sự không?', d: 'Cai nghiện bắt buộc vs. xử lý hình sự', tag: 'Luật' },
                                    { q: 'Tin tức gần đây về người nổi tiếng liên quan ma túy?', d: 'Tổng hợp từ báo chí chính thống', tag: 'Tin tức' },
                                    { q: 'Quy định mới nhất về chất ma túy tổng hợp?', d: 'Danh mục chất cấm cập nhật', tag: 'Luật' }
                                ].map((s, idx) => (
                                    <div key={idx} onClick={() => handleSuggestionClick(s.q)} style={{ padding: '16px 17px', border: '1px solid var(--panel-border)', borderRadius: '11px', cursor: 'pointer', background: 'var(--panel-bg)', transition: 'all 0.15s', display: 'flex', gap: '13px', alignItems: 'flex-start' }} onMouseOver={e => {e.currentTarget.style.borderColor='var(--accent-color)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'}} onMouseOut={e => {e.currentTarget.style.borderColor='var(--panel-border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'}}>
                                        <div style={{ flex: '0 0 32px', width: '32px', height: '32px', borderRadius: '8px', background: '#EAF3FF', color: 'var(--accent-color)', display: 'grid', placeItems: 'center' }}>
                                            {s.tag === 'Luật' ? <FileText size={17} /> : <FileText size={17} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '3px', fontSize: '0.9rem', lineHeight: '1.35' }}>{s.q}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{s.d}</div>
                                            <div style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: '600', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '5px', marginTop: '8px', background: s.tag === 'Luật' ? '#EAF3FF' : '#FDECEB', color: s.tag === 'Luật' ? '#1877F2' : '#E53935' }}>{s.tag}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} style={{ display: 'flex', gap: '14px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                                <div style={{ 
                                    width: '34px', height: '34px', borderRadius: '9px', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: msg.role === 'user' ? 'var(--text-primary)' : 'var(--accent-color)',
                                    color: '#FFF', marginTop: '2px'
                                }}>
                                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.02em', marginBottom: '-3px' }}>
                                        {msg.role === 'user' ? 'Bạn' : 'Trợ lý PLVN'}
                                    </div>
                                    <div style={{ 
                                        padding: '13px 16px', 
                                        borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                                        background: msg.role === 'user' ? '#F0F2F5' : '#FFFFFF',
                                        border: msg.role === 'user' ? 'none' : '1px solid var(--panel-border)',
                                        color: 'var(--text-primary)',
                                        lineHeight: '1.7',
                                        fontSize: '0.95rem'
                                    }}>
                                        {formatContent(msg.content)}
                                    </div>
                                    
                                    {msg.sources && msg.sources.length > 0 && (
                                        <SourcesExpander sources={msg.sources} time={msg.time} searchMode={searchMode} topK={topK} query={i > 0 ? messages[i-1].content : ''} />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div style={{ display: 'flex', gap: '14px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-color)', color: '#FFF', marginTop: '2px' }}>
                                <Bot size={18} />
                            </div>
                            <div style={{ padding: '13px 16px', borderRadius: '4px 18px 18px 18px', background: '#FFFFFF', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}>
                                <ThinkingProcess />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div style={{ padding: '14px 24px 10px', borderTop: '1px solid var(--panel-border)', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}>
                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'var(--panel-bg)', border: '1.5px solid var(--panel-border)', borderRadius: '16px', padding: '8px 8px 8px 16px', transition: 'border-color 0.15s, box-shadow 0.15s' }} className="composer-box">
                        <textarea 
                            style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)', maxHeight: '160px', padding: '8px 0' }}
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Nhập câu hỏi về luật hoặc tin tức phòng, chống ma túy…"
                            disabled={isLoading}
                        />
                        <button type="submit" style={{ flex: '0 0 auto', width: '40px', height: '40px', borderRadius: '11px', border: 'none', background: 'var(--accent-color)', color: '#fff', display: 'grid', placeItems: 'center', transition: 'filter 0.15s, opacity 0.15s', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (isLoading || !input.trim()) ? 0.4 : 1 }} disabled={isLoading || !input.trim()}>
                            <Send size={19} />
                        </button>
                    </form>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 4px 2px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '12px', height: '12px'}}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                            Thông tin tham khảo — không thay thế tư vấn pháp lý chính thức
                        </span>
                        <span>Enter để gửi · Shift+Enter xuống dòng</span>
                    </div>
                </div>
            </div>
            {/* Adding a style tag for hover effects */}
            <style dangerouslySetInnerHTML={{__html: `
                .composer-box:focus-within {
                    border-color: var(--accent-color) !important;
                    box-shadow: 0 0 0 4px #EAF3FF !important;
                }
            `}} />
        </div>
    );
};

// Component for collapsible sources
const SourcesExpander = ({ sources, time, searchMode, topK, query }) => {
    const [isOpen, setIsOpen] = useState(false);

    const highlightText = (text, userQuery) => {
        if (!userQuery || !text) return text;
        const words = userQuery.split(/\s+/).filter(w => w.length > 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (words.length === 0) return text;
        
        const regex = new RegExp(`(${words.join('|')})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, idx) => 
            regex.test(part) ? 
                <mark key={idx} style={{ background: '#FFE0B2', color: 'inherit', padding: '0 2px', borderRadius: '3px', fontWeight: 'bold', fontStyle: 'normal' }}>{part}</mark> 
                : <span key={idx}>{part}</span>
        );
    };

    return (
        <div style={{ width: '100%', marginTop: '14px' }}>
            <div style={{ display: 'flex', gap: '7px', marginBottom: '13px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', padding: '4px 9px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" style={{width:'12px', height:'12px'}}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                    {searchMode.split(' ')[0]}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', padding: '4px 9px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <b style={{color: 'var(--text-primary)'}}>{topK}</b> truy xuất
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', padding: '4px 9px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <b style={{color: 'var(--text-primary)'}}>{sources.length}</b> sau rerank
                </span>
                {time && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', padding: '4px 9px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" style={{width:'12px', height:'12px'}}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                        <b style={{color: 'var(--text-primary)'}}>{time}s</b>
                    </span>
                )}
            </div>

            <div style={{ border: '1px solid var(--panel-border)', borderRadius: '11px', background: 'var(--panel-bg)', overflow: 'hidden' }}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ width: '100%', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)', textAlign: 'left' }}
                >
                    <FileText size={17} style={{ color: 'var(--accent-color)' }} />
                    <span>Xem tài liệu tham khảo</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--accent-color)', background: '#EAF3FF', borderRadius: '99px', padding: '1px 8px' }}>
                        {sources.length} nguồn
                    </span>
                    <div style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', color: 'var(--text-secondary)' }}>
                        <ChevronDown size={16} />
                    </div>
                </button>
                
                {isOpen && (
                    <div style={{ padding: '14px', borderTop: '1px solid var(--panel-border)', background: '#FAFAFB', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {sources.map((src, idx) => {
                            const scoreClass = src.score >= 0.8 ? '#31A24C' : (src.score >= 0.5 ? '#F5A623' : '#FA3E3E');
                            const scoreBg = src.score >= 0.8 ? '#E6F4EA' : (src.score >= 0.5 ? '#FEF6E9' : '#FCE8E8');
                            const scoreLbl = src.score >= 0.8 ? 'CAO' : (src.score >= 0.5 ? 'TB' : 'THẤP');
                            
                            return (
                                <div key={idx} style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '13px 14px', transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '9px' }}>
                                        <div style={{ flex: '0 0 22px', width: '22px', height: '22px', background: 'var(--text-primary)', color: '#FFFFFF', borderRadius: '6px', display: 'grid', placeItems: 'center', fontSize: '0.7rem', fontWeight: '700', marginTop: '1px', fontFamily: 'monospace' }}>
                                            {idx + 1}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.85rem', lineHeight: '1.3', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FileText size={15} style={{ color: 'var(--accent-color)', flex: '0 0 auto' }} />
                                                <span>{src.metadata?.source || "Tài liệu không tên"}</span>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                                                Trang {src.metadata?.page || 1}
                                            </div>
                                        </div>
                                        <div style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontWeight: '700', padding: '4px 9px', borderRadius: '7px', background: scoreBg, color: scoreClass }}>
                                            <span style={{ fontWeight: '600', opacity: 0.85, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{scoreLbl}</span>
                                            {src.score?.toFixed(2)}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', lineHeight: '1.6', color: 'var(--text-primary)', background: '#F8F9FA', borderLeft: '3px solid var(--accent-color)', padding: '9px 12px', borderRadius: '0 6px 6px 0', fontStyle: 'italic' }}>
                                        {highlightText(src.content, query)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// Component to display progressive loading states
const ThinkingProcess = () => {
    const steps = [
        "Đang phân tích truy vấn...",
        "Đang tìm kiếm tài liệu luật và báo chí...",
        "Đang đánh giá mức độ liên quan (Reranking)...",
        "Đang tổng hợp câu trả lời chi tiết..."
    ];
    const [stepIdx, setStepIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStepIdx(prev => Math.min(prev + 1, steps.length - 1));
        }, 2000); 
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '20px' }}>
                <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                <style dangerouslySetInnerHTML={{__html: `
                    .typing-dot { width: 6px; height: 6px; background: var(--accent-color); border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out both; }
                    @keyframes typingBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
                    @keyframes spinner { to { transform: rotate(360deg); } }
                `}} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {steps.map((step, idx) => (
                    <div key={idx} style={{ 
                        fontSize: '0.85rem', 
                        display: idx <= stepIdx ? 'flex' : 'none', 
                        alignItems: 'center', gap: '8px',
                        color: idx === stepIdx ? 'var(--text-primary)' : 'var(--text-secondary)',
                        opacity: idx === stepIdx ? 1 : 0.6,
                        animation: idx === stepIdx ? 'fadeIn 0.3s forwards' : 'none'
                    }}>
                        <div style={{ 
                            width: '14px', height: '14px', borderRadius: '50%', 
                            border: idx === stepIdx ? '2px solid var(--accent-color)' : 'none',
                            borderRightColor: idx === stepIdx ? 'transparent' : 'none',
                            background: idx < stepIdx ? 'var(--success)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: idx === stepIdx ? 'spinner 1s linear infinite' : 'none',
                            flexShrink: 0
                        }}>
                            {idx < stepIdx && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" style={{width:'8px',height:'8px'}}><path d="M5 12l4 4L19 7"/></svg>}
                        </div>
                        {step}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatPage;
