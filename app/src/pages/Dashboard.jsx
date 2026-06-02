/**
 * Dashboard.jsx — Editorial transformation
 * 
 * Ruled ledger stats, editorial index of decisions, no emoji icons
 */

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getDecisions, getStats, deleteDecision, clearAllDecisions, getDecisionsNeedingReflection } from '../engine/storage';
import EmptyState from '../components/EmptyState';
import { CascadeItem, CascadeList, CascadeListItem } from '../components/Motion';

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
    const [showConfirmDelete, setShowConfirmDelete] = useState(null);
    const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setShowConfirmDelete(id);
    };

    const confirmDelete = (e, id) => {
        e.stopPropagation();
        deleteDecision(id);
        setDecisions(getDecisions());
        setStats(getStats());
        setNeedsReflection(getDecisionsNeedingReflection());
        setShowConfirmDelete(null);
    };

    const handleClearAll = () => {
        setShowConfirmClearAll(true);
    };

    const confirmClearAll = () => {
        clearAllDecisions();
        setDecisions([]);
        setStats(getStats());
        setNeedsReflection([]);
        setShowConfirmClearAll(false);
    };

    if (!stats) return <div className="loading">Loading dashboard...</div>;

    return (
        <div className="dashboard reveal visible">
            <div className="dashboard-header">
                <div>
                    <h2>Your Decision Journal</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>Track your thinking patterns and growth over time.</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    {decisions.length > 0 && (
                        <button className="btn btn-danger" onClick={handleClearAll} aria-label="Clear all decisions">
                            Clear All
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => onNavigate('new-decision')} aria-label="Start new decision analysis">
                        New Decision
                    </button>
                </div>
            </div>

            {/* Confirm Clear All Dialog */}
            {showConfirmClearAll && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(26, 23, 20, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }} onClick={() => setShowConfirmClearAll(false)}>
                    <div className="glass-card" style={{ maxWidth: '400px', padding: 'var(--space-7)', border: '2px solid var(--accent-vermilion)' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 'var(--space-4)' }}>Clear All Decisions?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
                            This will permanently delete all your decision history. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setShowConfirmClearAll(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={confirmClearAll}>
                                Yes, Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats — Ruled ledger (single row with hairlines between) */}
            <CascadeItem delay={0.1}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    borderTop: '1px solid var(--border-hairline)', 
                    borderBottom: '1px solid var(--border-hairline)', 
                    marginBottom: 'var(--space-7)' 
                }}>
                    {[
                        { label: 'Decisions', value: stats.totalDecisions },
                        { label: 'Biases Caught', value: stats.totalBiasesDetected },
                        { label: 'Reflections', value: stats.reflectionsCompleted },
                        { label: 'Avg Biases', value: stats.averageBiasesPerDecision }
                    ].map((stat, i, arr) => (
                        <div 
                            key={stat.label} 
                            style={{ 
                                padding: 'var(--space-5)', 
                                textAlign: 'center',
                                borderRight: i < arr.length - 1 ? '1px solid var(--border-hairline)' : 'none'
                            }}
                        >
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, color: 'var(--accent-vermilion)', marginBottom: 'var(--space-2)' }}>
                                {stat.value}
                            </div>
                            <div className="eyebrow" style={{ fontSize: '0.6875rem' }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </CascadeItem>

            {/* Reflection Nudge Banner */}
            {needsReflection.length > 0 && (
                <CascadeItem delay={0.2}>
                    <div className="glass-card" style={{
                        marginBottom: 'var(--space-7)',
                        padding: 'var(--space-5)',
                        border: '2px solid var(--accent-vermilion)',
                        borderLeft: '6px solid var(--accent-vermilion)',
                    }}>
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 500, marginBottom: 'var(--space-2)' }}>Time to Reflect</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                                {needsReflection.length} decision{needsReflection.length > 1 ? 's' : ''} from a few days ago — how did {needsReflection.length > 1 ? 'they' : 'it'} turn out?
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                            {needsReflection.slice(0, 3).map(d => (
                                <button
                                    key={d.id}
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                        const isNewFormat = !!d.analysis?.verdict;
                                        if (isNewFormat) {
                                            onNavigate('analysis', { analysis: d.analysis, title: d.title, description: d.description });
                                        } else {
                                            onNavigate('decision-detail', d.id);
                                        }
                                    }}
                                >
                                    {d.title?.slice(0, 30)}{d.title?.length > 30 ? '...' : ''}
                                </button>
                            ))}
                        </div>
                    </div>
                </CascadeItem>
            )}

            <CascadeItem delay={0.3}>
                <h3 style={{ marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-hairline)' }}>Recent Decisions</h3>
            </CascadeItem>

            {decisions.length === 0 ? (
                <EmptyState 
                    message="Nothing to reflect on yet."
                    actionLabel="Start Analysis"
                    onAction={() => onNavigate('new-decision')}
                />
            ) : (
                <CascadeList>
                    {decisions.map(decision => {
                        const isNewFormat = !!decision.analysis?.verdict;
                        const subtitle = isNewFormat
                            ? decision.analysis.verdict.title
                            : (decision.analysis?.category?.label || '');
                        const hasCommitment = !!decision.commitment;
                        const hasReflection = !!decision.reflection;
                        const emotionalScore = decision.emotionalScore || decision.analysis?.emotionalScore;

                        return (
                            <CascadeListItem key={decision.id}>
                                <div
                                    className="decision-card"
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4>{decision.title}</h4>
                                            {subtitle && (
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)', fontStyle: 'italic' }}>
                                                    {subtitle}
                                                </p>
                                            )}
                                        </div>
                                        <span className="decision-date">
                                            {timeAgo(decision.createdAt)}
                                        </span>
                                    </div>

                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                                        {decision.description?.length > 150
                                            ? decision.description.slice(0, 150) + '...'
                                            : decision.description}
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-hairline)' }}>
                                        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                            {emotionalScore != null && (
                                                <span style={{ 
                                                    color: emotionalScore > 70 ? 'var(--accent-vermilion)' : 'var(--text-secondary)' 
                                                }}>
                                                    Emotion: {emotionalScore}%
                                                </span>
                                            )}
                                            {hasCommitment && !hasReflection && (
                                                <span>Committed</span>
                                            )}
                                            {hasReflection && (
                                                <span style={{ color: 'var(--text-ink)' }}>Reflected</span>
                                            )}
                                        </div>

                                        {showConfirmDelete === decision.id ? (
                                            <div style={{ display: 'flex', gap: 'var(--space-2)' }} onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(null); }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={(e) => confirmDelete(e, decision.id)}
                                                >
                                                    Confirm Delete
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn btn-icon"
                                                onClick={(e) => handleDelete(e, decision.id)}
                                                aria-label="Delete decision"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </CascadeListItem>
                        );
                    })}
                </CascadeList>
            )}
        </div>
    );
}
