import { useState, useEffect } from 'react';
import { BarChart2, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { mockEvaluation } from '../config/api';

const EvaluationPage = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await mockEvaluation();
                setData(res);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="animate-fade-in" style={{ fontSize: '1.2rem', color: 'var(--accent-color)' }}>Đang tải dữ liệu đánh giá...</div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <div className="page-header">
                <h1>Evaluation Dashboard</h1>
                <p>Báo cáo chất lượng pipeline bằng DeepEval / RAGAS.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <MetricCard title="Faithfulness" score={data.metrics.faithfulness} color="var(--success)" />
                <MetricCard title="Answer Relevance" score={data.metrics.answerRelevance} color="var(--success)" />
                <MetricCard title="Context Precision" score={data.metrics.contextPrecision} color="var(--warning)" />
                <MetricCard title="Context Recall" score={data.metrics.contextRecall} color="var(--success)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={20} color="var(--accent-color)" /> So sánh A/B Testing
                    </h3>
                    {data.abTest.map((ab, i) => (
                        <div key={i} style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>{ab.name}</span>
                                <span style={{ fontWeight: 'bold' }}>{ab.score}</span>
                            </div>
                            <div style={{ height: '8px', background: '#E4E6EB', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${ab.score * 100}%`, background: 'var(--accent-color)', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    ))}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '16px' }}>
                        * Config B (Lexical + Semantic + HyDE) cho kết quả tốt hơn nhờ khả năng mở rộng query và bắt chính xác keyword pháp lý.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileSpreadsheet size={20} color="var(--accent-color)" /> Golden Dataset
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '100%', paddingBottom: '24px' }}>
                        <div style={{ padding: '24px', background: '#E7F3EB', border: '1px solid var(--success)', borderRadius: '50%', color: 'var(--success)' }}>
                            <Award size={48} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{data.goldenDatasetCount}</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Cặp câu hỏi Q&A đạt chuẩn (≥ 15 theo yêu cầu)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}>
                    <ShieldAlert size={20} /> Phân tích Worst Performers
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {data.worstPerformers.map((wp, i) => (
                        <div key={i} style={{ padding: '16px', background: '#FDECEE', borderLeft: '4px solid var(--error)', borderRadius: '8px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>Query: {wp.query}</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Lỗi ghi nhận: <span style={{ color: 'var(--error)' }}>{wp.issue}</span></p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>* Hướng khắc phục: Cần điều chỉnh lại tham số Chunking (tăng overlap) và thêm metadata về phân loại điều luật.</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, score, color }) => (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{title}</h4>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: color }}>
            {(score * 100).toFixed(1)}%
        </div>
    </div>
);

export default EvaluationPage;
