
import { useState } from 'react';
import { saveUserValues, getUserValues } from '../engine/storage';
import { DEFAULT_VALUES } from '../engine/decisionEngine';

export default function ValuesSetup({ onNavigate }) {
    const [values, setValues] = useState(() => getUserValues() || DEFAULT_VALUES);
    const [hasChanged, setHasChanged] = useState(false);
    const [showSaved, setShowSaved] = useState(false);

    const handleChange = (key, val) => {
        setValues(prev => ({ ...prev, [key]: parseInt(val, 10) }));
        setHasChanged(true);
    };

    const handleSave = () => {
        saveUserValues(values);
        setHasChanged(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
    };

    return (
        <main className="values-setup reveal visible" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: 'var(--space-3)' }}>Define Your Core Values</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-7)', lineHeight: 1.6 }}>
                Your decisions should align with what matters most to you.
                Adjust these sliders to reflect your current life priorities (1-10).
            </p>

            <section className="glass-card">
                <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
                    {Object.entries(values).map(([key, val]) => (
                        <div key={key} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px', gap: 'var(--space-4)', alignItems: 'center' }}>
                            <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 500, textTransform: 'capitalize' }} htmlFor={`value-${key}`}>
                                {key}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id={`value-${key}`}
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={val}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '8px',
                                        background: 'var(--border-hairline)',
                                        accentColor: 'var(--accent-vermilion)',
                                        appearance: 'none',
                                        outline: 'none',
                                        cursor: 'pointer',
                                    }}
                                    aria-label={`${key} importance (1-10)`}
                                />
                            </div>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, color: 'var(--accent-vermilion)', textAlign: 'right' }}>
                                {val}
                            </span>
                        </div>
                    ))}
                </div>

                {showSaved && (
                    <div
                        style={{
                            marginTop: 'var(--space-5)',
                            padding: 'var(--space-4)',
                            border: '1px solid var(--accent-vermilion)',
                            textAlign: 'center',
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic',
                            color: 'var(--accent-vermilion)'
                        }}
                    >
                        Values saved! Future decisions will be weighed against these priorities.
                    </div>
                )}

                <div className="question-actions" style={{ marginTop: 'var(--space-7)' }}>
                    <button className="btn btn-ghost" onClick={() => onNavigate('dashboard')}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={!hasChanged}
                    >
                        Save Priorities
                    </button>
                </div>
            </section>
        </main>
    );
}
