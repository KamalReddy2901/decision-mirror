
import { useState } from 'react';
import { getDecisions, getStats, deleteDecision, clearAllDecisions, getDecisionsNeedingReflection } from '../engine/storage';

function timeAgo(ts) {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

export default function Dashboard({ onNavigate }) {
    const [decisions, setDecisions] = useState(() => getDecisions());
    const [stats, setStats] = useState(() => getStats());
    const [needsReflection, setNeedsReflection] = useState(() => getDecisionsNeedingReflection());

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this decision analysis?')) {
            deleteDecision(id);
            setDecisions(getDecisions());
            setStats(getStats());
            setNeedsReflection(getDecisionsNeedingReflection());
        }
    };

    const handleClearAll = () => {
        if (confirm('This will wipe all your decision history. Are you sure?')) {
            clearAllDecisions();
            setDecisions([]);
            setStats(getStats());
            setNeedsReflection([]);
        }
    };

    if (!stats) return <div className="loading">Loading dashboard...</div>;

    return (
        <div className="dashboard reveal visible">
            <div className="dashboard-header">
                <div>
                    <h2>Your Decision Journal</h2>
                    <p className="subtitle">Track your thinking patterns and growth over time.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {decisions.length > 0 && (
                        <button className="btn btn-ghost btn-danger" onClick={handleClearAll} aria-label="Clear all decisions">
                            Clear All
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => onNavigate('new-decision')} aria-label="Start new decision analysis">
                        + New Decision
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                <div className="glass-card stat-card">
                    <div className="stat-number">{stats.totalDecisions}</div>
                    <div className="stat-label">Decisions</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-number">{stats.totalBiasesDetected}</div>
                    <div className="stat-label">Biases Caught</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-number">{stats.reflectionsCompleted}</div>
                    <div className="stat-label">Reflections</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-number">{stats.averageBiasesPerDecision}</div>
                    <div className="stat-label">Avg Biases/Decision</div>
                </div>
            </div>

            {/* Reflection Nudge Banner */}
            {needsReflection.length > 0 && (
                <div className="glass-card" style={{
                    marginBottom: 'var(--space-6)',
                    padding: 'var(--space-5)',
                    background: 'rgba(45, 212, 191, 0.06)',
                    border: '1px solid rgba(45, 212, 191, 0.2)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                        <span style={{ fontSize: '1.5rem' }}>🪞</span>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Time to Reflect</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                {needsReflection.length} decision{needsReflection.length > 1 ? 's' : ''} from a few days ago — how did {needsReflection.length > 1 ? 'they' : 'it'} turn out?
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        {needsReflection.slice(0, 3).map(d => (
                            <button
                                key={d.id}
                                className="btn btn-ghost btn-sm"
                                style={{ borderColor: 'rgba(45, 212, 191, 0.3)', color: 'var(--accent-clarity)' }}
                                onClick={() => {
                                    const isNewFormat = !!d.analysis?.verdict;
                                    if (isNewFormat) {
                                        onNavigate('analysis', { analysis: d.analysis, title: d.title, description: d.description });
                                    } else {
                                        onNavigate('decision-detail', d.id);
                                    }
                                }}
                            >
                                Reflect: {d.title?.slice(0, 30)}{d.title?.length > 30 ? '...' : ''}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Recent Decisions</h3>

            {decisions.length === 0 ? (
                <div className="glass-card empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No decisions recorded yet</h3>
                    <p>Start your first analysis to build your decision journal.</p>
                    <button className="btn btn-primary" onClick={() => onNavigate('new-decision')}>
                        Start Analysis
                    </button>
                </div>
            ) : (
                <div className="decision-grid">
                    {decisions.map(decision => {
                        const isNewFormat = !!decision.analysis?.verdict;
                        const subtitle = isNewFormat
                            ? decision.analysis.verdict.title
                            : (decision.analysis?.category?.label || '');
                        const hasCommitment = !!decision.commitment;
                        const hasReflection = !!decision.reflection;
                        const emotionalScore = decision.emotionalScore || decision.analysis?.emotionalScore;

                        return (
                            <div
                                key={decision.id}
                                className="glass-card decision-card glass-card-interactive"
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    if (isNewFormat) {
                                        onNavigate('analysis', {
                                            analysis: decision.analysis,
                                            title: decision.title,
                                            description: decision.description
                                        });
                                    } else {
                                        onNavigate('decision-detail', decision.id);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        if (isNewFormat) {
                                            onNavigate('analysis', {
                                                analysis: decision.analysis,
                                                title: decision.title,
                                                description: decision.description
                                            });
                                        } else {
                                            onNavigate('decision-detail', decision.id);
                                        }
                                    }
                                }}
                                aria-label={`View decision: ${decision.title}`}
                            >
                                <div className="decision-card-header">
                                    <h4>{decision.title}</h4>
                                    <span className="decision-date">
                                        {timeAgo(decision.createdAt)}
                                    </span>
                                </div>

                                <p className="decision-excerpt">
                                    {decision.description?.length > 150
                                        ? decision.description.slice(0, 150) + '...'
                                        : decision.description}
                                </p>

                                <div className="decision-meta">
                                    {subtitle && <span className="meta-badge type">{subtitle}</span>}
                                    {emotionalScore != null && (
                                        <span className="meta-badge" style={{
                                            background: emotionalScore > 70 ? 'rgba(244,63,94,0.1)' : emotionalScore > 40 ? 'rgba(99,102,241,0.1)' : 'rgba(52,211,153,0.1)',
                                            color: emotionalScore > 70 ? '#f43f5e' : emotionalScore > 40 ? '#6366f1' : '#34d399'
                                        }}>
                                            {emotionalScore > 70 ? '🔥' : emotionalScore > 40 ? '⚖️' : '🌊'} {emotionalScore}%
                                        </span>
                                    )}
                                    {hasCommitment && !hasReflection && (
                                        <span className="meta-badge" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                                            📋 Committed
                                        </span>
                                    )}
                                    {hasReflection && (
                                        <span className="meta-badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                                            ✅ Reflected
                                        </span>
                                    )}
                                </div>

                                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={(e) => handleDelete(e, decision.id)}
                                        style={{ color: 'var(--accent-danger)', borderColor: 'transparent' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
