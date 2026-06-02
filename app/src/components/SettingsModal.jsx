/**
 * Settings Modal Component
 * Configures the Groq API key
 */

import { useEffect, useState } from 'react';
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
        <div className="settings-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <h2 id="settings-title">⚙️ Settings</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close settings">×</button>
                </div>

                <div className="settings-modal-body">
                    <div className="setting-section">
                        <h3>⚡ AI Configuration (Groq)</h3>
                        <p className="setting-description">
                            MirrorWise uses <strong>Groq + Llama 3.1 70B</strong> for lightning-fast, high-quality analysis.
                            {serverManagedMode
                                ? ' AI requests are routed through your backend proxy so users do not need personal API keys.'
                                : ' Your API key stays on your device. When you request analysis, your decision text is sent directly from your browser to Groq (no MirrorWise backend).'}
                        </p>

                        <div className="ai-status">
                            <span className={`status-indicator ${aiStatus ? 'active' : 'inactive'}`}>
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
                            <div className="info-box" style={{ marginBottom: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                                <h4>🔐 Server-managed AI is active</h4>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                    Users can use AI features without entering their own API keys. Requests are routed through your secured backend proxy.
                                </p>
                            </div>
                        )}

                        {!serverManagedMode && usingEmbeddedKey && (
                            <div className="info-box" style={{ marginBottom: '1rem', background: 'rgba(45, 212, 191, 0.08)', borderColor: 'rgba(45, 212, 191, 0.2)' }}>
                                <h4>✅ Deployment key active</h4>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                    This build already includes a configured Groq key via environment variable. You can still add your own key below to override it locally.
                                </p>
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="api-key">
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
                            <small className="input-hint">
                                Get your free key from{' '}
                                <a
                                    href="https://console.groq.com/keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
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

                        <div className="button-group">
                            {saved ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={onClose}
                                    style={{ width: '100%' }}
                                >
                                    Continue →
                                </button>
                            ) : (
                                <>
                                    {serverManagedMode ? (
                                        <>
                                            {apiKey.trim() ? (
                                                <button className="btn btn-primary" onClick={handleSave}>
                                                    Save Personal Key
                                                </button>
                                            ) : (
                                                <button className="btn btn-primary" onClick={onClose}>
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

                        <div className="info-box">
                            <h4>🚀 Why Groq?</h4>
                            <ul>
                                <li><strong>Lightning Fast</strong> — Results appear almost instantly</li>
                                <li><strong>Llama 3.1 70B</strong> — State-of-the-art open source intelligence</li>
                                <li><strong>{serverManagedMode ? 'Protected' : 'Direct'}</strong> — {serverManagedMode ? 'requests route through your backend proxy' : 'browser-to-Groq calls, no app server in between'}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
