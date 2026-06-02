/**
 * Settings Modal Component
 * Configures the Groq API key
 */

import { useEffect, useState } from 'react';
import { X, Settings } from 'lucide-react';
import { ModalTransition } from './Motion';
import { isAIAvailable, saveAPIKey, clearAPIKey, getSavedAPIKey, hasEmbeddedAPIKey, getAIAccessMode } from '../engine/aiService';
import './SettingsModal.css';

export default function SettingsModal({ isOpen, onClose }) {
    const [apiKey, setApiKey] = useState(() => getSavedAPIKey() || '');
    const [saved, setSaved] = useState(false);
    const [aiStatus, setAiStatus] = useState(() => isAIAvailable());
    const accessMode = getAIAccessMode();
    const serverManagedMode = accessMode === 'server';
    const embeddedKeyAvailable = hasEmbeddedAPIKey();
    const usingEmbeddedKey = embeddedKeyAvailable && !apiKey.trim();

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setAiStatus(isAIAvailable());
                setApiKey(getSavedAPIKey() || '');
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (apiKey.trim()) {
            const success = await saveAPIKey(apiKey.trim());
            setAiStatus(success);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const handleClear = () => {
        clearAPIKey();
        setApiKey('');
        setTimeout(() => setAiStatus(isAIAvailable()), 100);
    };

    if (!isOpen) return null;

    return (
        <div className="settings-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title" style={{ background: 'rgba(26, 23, 20, 0.6)' }}>
            <ModalTransition isOpen={isOpen}>
                <div className="settings-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--bg-newsprint)', border: '1px solid var(--border-hairline)' }}>
                    <div className="settings-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-6)', borderBottom: '1px solid var(--border-hairline)' }}>
                        <h2 id="settings-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <Settings size={24} />
                            Settings
                        </h2>
                        <button className="btn btn-icon" onClick={onClose} aria-label="Close settings">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="settings-modal-body" style={{ padding: 'var(--space-6)' }}>
                        <div className="setting-section">
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 500, marginBottom: 'var(--space-3)' }}>AI Configuration (Groq)</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                                Decision Mirror uses <strong>Groq + Llama 3.1 70B</strong> for lightning-fast, high-quality analysis.
                                {serverManagedMode
                                    ? ' AI requests are routed through your backend proxy so users do not need personal API keys.'
                                    : ' Your API key stays on your device. When you request analysis, your decision text is sent directly from your browser to Groq (no Decision Mirror backend).'}
                            </p>

                            <div style={{ 
                                padding: 'var(--space-4)', 
                                marginBottom: 'var(--space-5)', 
                                border: aiStatus ? '1px solid var(--accent-vermilion)' : '1px solid var(--border-hairline)',
                                borderLeft: aiStatus ? '4px solid var(--accent-vermilion)' : '4px solid var(--border-hairline)',
                            }}>
                                <span style={{ 
                                    fontFamily: 'var(--font-body)', 
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: aiStatus ? 'var(--accent-vermilion)' : 'var(--text-tertiary)'
                                }}>
                                    {aiStatus
                                        ? (serverManagedMode
                                            ? '✓ Groq Connected (Server Managed)'
                                            : usingEmbeddedKey
                                                ? '✓ Groq Connected (Deployment Key)'
                                                : '✓ Groq Connected')
                                        : '○ Not Connected'}
                                </span>
                            </div>

                            {serverManagedMode && (
                                <div style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)', border: '1px solid var(--border-hairline)', background: 'var(--bg-hover-wash)' }}>
                                    <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Server-managed AI is active</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                        Users can use AI features without entering their own API keys. Requests are routed through your secured backend proxy.
                                    </p>
                                </div>
                            )}

                            {!serverManagedMode && usingEmbeddedKey && (
                                <div style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)', border: '1px solid var(--border-hairline)', background: 'var(--bg-hover-wash)' }}>
                                    <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Deployment key active</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                        This build already includes a configured Groq key via environment variable. You can still add your own key below to override it locally.
                                    </p>
                                </div>
                            )}

                            <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                                <label htmlFor="api-key" style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600, fontSize: '0.875rem' }}>
                                    {serverManagedMode ? 'Optional Personal Groq API Key (Override)' : 'Groq API Key (Free Tier)'}
                                </label>
                                <input
                                    id="api-key"
                                    type="password"
                                    className="text-input"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="gsk_..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave();
                                    }}
                                />
                                <small style={{ display: 'block', marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                                    Get your free key from{' '}
                                    <a
                                        href="https://console.groq.com/keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--accent-vermilion)', textDecoration: 'underline' }}
                                    >
                                        console.groq.com
                                    </a>
                                    {' '}— takes 10 seconds
                                    {serverManagedMode
                                        ? '. Optional: save your own key for extended personal limits. Clear it anytime to return to server-managed mode.'
                                        : usingEmbeddedKey
                                            ? '. Leave empty to keep using the deployment key.'
                                            : ''}
                                </small>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                                {saved ? (
                                    <button
                                        className="btn btn-primary"
                                        onClick={onClose}
                                        style={{ flex: 1 }}
                                    >
                                        Continue →
                                    </button>
                                ) : (
                                    <>
                                        {serverManagedMode ? (
                                            <>
                                                {apiKey.trim() ? (
                                                    <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>
                                                        Save Personal Key
                                                    </button>
                                                ) : (
                                                    <button className="btn btn-primary" onClick={onClose} style={{ flex: 1 }}>
                                                        Continue →
                                                    </button>
                                                )}
                                                {apiKey && (
                                                    <button
                                                        className="btn btn-ghost"
                                                        onClick={handleClear}
                                                    >
                                                        Use Server-Managed Key
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleSave}
                                                    disabled={!apiKey.trim()}
                                                    style={{ flex: 1 }}
                                                >
                                                    Save API Key
                                                </button>
                                                {apiKey && (
                                                    <button
                                                        className="btn btn-ghost"
                                                        onClick={handleClear}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-hairline)', background: 'var(--bg-hover-wash)' }}>
                                <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Why Groq?</h4>
                                <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                                    <li><strong>Lightning Fast</strong> — Results appear almost instantly</li>
                                    <li><strong>Llama 3.1 70B</strong> — State-of-the-art open source intelligence</li>
                                    <li><strong>{serverManagedMode ? 'Protected' : 'Direct'}</strong> — {serverManagedMode ? 'requests route through your backend proxy' : 'browser-to-Groq calls, no app server in between'}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </ModalTransition>
        </div>
    );
}
