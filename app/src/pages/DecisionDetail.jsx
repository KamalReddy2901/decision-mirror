import { lazy, Suspense } from 'react';
import { getDecision } from '../engine/storage';
const AnalysisView = lazy(() => import('./AnalysisView'));

export default function DecisionDetail({ decisionId, onNavigate }) {
    const decision = decisionId ? getDecision(decisionId) : null;

    if (!decision) {
        return (
            <div className="empty-state">
                <h3>Decision Not Found</h3>
                <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {decision.title}
                </h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Analyzed on {new Date(decision.createdAt).toLocaleDateString()}
                </div>
                <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {decision.description}
                </p>
            </div>

            <Suspense fallback={<div className="loading" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading analysis…</div>}>
                <AnalysisView
                    analysis={decision.analysis}
                    title={decision.title}
                    description={decision.description}
                    onNavigate={onNavigate}
                />
            </Suspense>
        </div>
    );
}
