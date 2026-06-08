import { useState } from 'react';
import { Search, Info, LayoutGrid, List } from 'lucide-react';
import { realSearch } from '../config/api';

const RetrievalPage = () => {
    const [query, setQuery] = useState('');
    const [method, setMethod] = useState('Hybrid');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        
        setIsLoading(true);
        try {
            const res = await realSearch(query, 5);
            setResults(res.results);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Retrieval Playground</h1>
                    <p>Thử nghiệm các thuật toán tìm kiếm: Semantic, Lexical, Hybrid và PageIndex.</p>
                </div>
                <button className="btn btn-secondary" onClick={() => setShowInfo(!showInfo)}>
                    <Info size={18} /> Giải thích Lexical Search
                </button>
            </div>

            {showInfo && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--accent-color)' }}>
                    <h3 style={{ color: 'var(--accent-color)', marginBottom: '12px' }}>💡 Cơ chế Lexical Search khác với BM25 mặc định thế nào?</h3>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        Trong pipeline này, chúng tôi đã tinh chỉnh thuật toán Lexical Search không chỉ dùng tần suất từ (Term Frequency) đơn thuần như thuật toán BM25 chuẩn. 
                        Thay vào đó, thuật toán Lexical tùy chỉnh kết hợp <strong>N-gram matching</strong> và xử lý <strong>tiếng Việt có dấu/không dấu</strong> (Vietnamese text normalization) trước khi tính điểm TF-IDF hoặc BM25.
                        <br/><br/>
                        Đặc biệt: Các keyword quan trọng (như "Bộ luật", "Điều", "Khoản") được đẩy trọng số cao hơn so với stop-words thông thường, giúp vượt qua nhược điểm của BM25 khi query chứa nhiều từ nối của ngữ pháp tiếng Việt.
                    </p>
                </div>
            )}

            <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                        <label>Câu truy vấn (Query)</label>
                        <input 
                            type="text" 
                            className="text-input" 
                            value={query} 
                            onChange={(e) => setQuery(e.target.value)} 
                            placeholder="Nhập từ khóa tìm kiếm..." 
                        />
                    </div>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Phương pháp (Method)</label>
                        <select 
                            className="text-input" 
                            value={method} 
                            onChange={(e) => setMethod(e.target.value)}
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="Hybrid">Hybrid Search</option>
                            <option value="Semantic">Semantic Search</option>
                            <option value="Lexical">Lexical Search</option>
                            <option value="PageIndex">PageIndex (Vectorless)</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '44px' }} disabled={isLoading || !query.trim()}>
                        <Search size={20} /> {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
                    </button>
                </form>
            </div>

            {results.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <List size={20} color="var(--accent-color)"/> Kết quả truy xuất
                    </h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {results.map((r, i) => (
                            <div key={i} className="glass-panel" style={{ padding: '20px', transition: 'transform 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform='translateX(8px)'} onMouseOut={e => e.currentTarget.style.transform='translateX(0)'}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span style={{ background: 'var(--accent-color)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {r.metadata.type}
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nguồn: {r.metadata.source}</span>
                                    </div>
                                    <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                        Score: {r.score.toFixed(3)}
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>{r.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetrievalPage;
