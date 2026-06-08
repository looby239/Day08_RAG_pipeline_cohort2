import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Database, Search, Activity, Box, Settings } from 'lucide-react';
import { getSystemStats } from '../config/api';

const Sidebar = () => {
    const [stats, setStats] = useState({
        vectorStatus: "Đang tải...",
        legalDocs: "...",
        newsArticles: "...",
        totalChunks: "...",
        reranker: "..."
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await getSystemStats();
                setStats({
                    vectorStatus: res.vectorStatus,
                    legalDocs: res.legalDocs.toLocaleString('vi-VN'),
                    newsArticles: res.newsArticles.toLocaleString('vi-VN'),
                    totalChunks: res.totalChunks.toLocaleString('vi-VN'),
                    reranker: res.reranker
                });
            } catch (error) {
                setStats({
                    vectorStatus: "Lỗi kết nối",
                    legalDocs: "-",
                    newsArticles: "-",
                    totalChunks: "-",
                    reranker: "-"
                });
            }
        };
        loadStats();
        
        window.addEventListener('stats_updated', loadStats);
        return () => window.removeEventListener('stats_updated', loadStats);
    }, []);

    return (
        <div className="sidebar">
            <div style={{ padding: '16px 8px', marginBottom: '24px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-color)' }}>
                    <Box /> RAG System
                </h2>
            </div>
            
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <NavLink to="/chat" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                    <MessageSquare size={20} />
                    <span>Chatbot (RAG)</span>
                </NavLink>
                
                <NavLink to="/retrieval" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                    <Search size={20} />
                    <span>Retrieval Playground</span>
                </NavLink>

                <NavLink to="/ingestion" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                    <Database size={20} />
                    <span>Data Ingestion</span>
                </NavLink>
                
                <NavLink to="/evaluation" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                    <Activity size={20} />
                    <span>Evaluation Metrics</span>
                </NavLink>

                <NavLink to="/settings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                    <Settings size={20} />
                    <span>Cài đặt API Keys</span>
                </NavLink>
            </nav>
            
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#F0F2F5', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>System status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Vector index</span>
                            <span style={{ color: stats.vectorStatus === "Hoạt động" ? 'var(--success)' : 'var(--error)', fontWeight: 'bold' }}>{stats.vectorStatus}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Văn bản luật</span>
                            <span>{stats.legalDocs}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Bài báo tin tức</span>
                            <span>{stats.newsArticles}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Tổng chunk</span>
                            <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{stats.totalChunks}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Reranker</span>
                            <span>{stats.reranker}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
