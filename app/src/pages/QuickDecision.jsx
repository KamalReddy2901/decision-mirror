import { useEffect, useRef, useState } from 'react';
import { isAIAvailable, generateQuickVerdict } from '../engine/aiService';
import { saveDecision, getUserValues } from '../engine/storage';
import { categorizeDecision, assessStakes } from '../engine/decisionEngine';

export default function QuickDecision({ onNavigate }) {
    const [description, setDescription] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) textareaRef.current.focus();
    }, []);

    const handleSubmit = async () => {
        const trimmed = description.trim();
        if (!trimmed || isAnalyzing) return;

        if (!isAIAvailable()) {
            setError('AI service is not available right now. Please try again.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const userValues = getUserValues();
            const verdict = await generateQuickVerdict(trimmed, userValues);
            const category = categorizeDecision(trimmed);
            const stakes = assessStakes(trimmed);

            const analysis = {
                verdict: {
                    title: verdict.title,
                    recommendation: verdict.recommendation,
                    confidence: verdict.confidence,
                    reversibility: verdict.reversibility
                },
                quickMode: true,
                category,
                stakes,
                scores: {
                    emotionRisk: 50,
                    biasRisk: verdict.biasRisk || 40,
                    complexityScore: stakes.level === 'high' ? 70 : stakes.level === 'medium' ? 50 : 30,
                    confidenceScore: verdict.confidence === 'high' ? 80 : verdict.confidence === 'medium' ? 60 : 40,
                    clarityScore: 65,
                    urgencyScore: 50
                },
                keyConsideration: verdict.keyConsideration,
                oneThingToCheck: verdict.oneThingToCheck,
                generatedAt: Date.now(),
                mode: 'quick-verdict'
            };

            const savedDecision = saveDecision({
                title: verdict.title,
                description: trimmed,
                options: [verdict.title, 'Do the opposite'],
                answers: [],
                emotionalScore: 50,
                analysis
            });

            onNavigate('analysis', {
                analysis,
                title: verdict.title,
                description: trimmed,
                decisionId: savedDecision.id
            });
        } catch (err) {
            console.error('Quick verdict failed:', err);
            setError(err.message || 'Failed to generate verdict. Please try again.');
            setIsAnalyzing(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
        }
    };

    return (
        <div className="quick-decision reveal visible">
            <div className="quick-header">
                <h1>Quick Decision</h1>
                <p className="subtitle">Describe your dilemma. Get a verdict in 30 seconds.</p>
            </div>

            <div className="panel quick-card">
                <textarea
                    ref={textareaRef}
                    className="decision-textarea"
                    placeholder="Should I buy this? Take the meeting? Send the message? Tell me what you're deciding..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isAnalyzing}
                    rows={4}
                />

                {error && (
                    <div className="error-message" style={{ marginTop: '1rem' }}>
                        {error}
                    </div>
                )}

                <div className="quick-actions">
                    <button className="btn btn-ghost" onClick={() => onNavigate('landing')} disabled={isAnalyzing}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={!description.trim() || isAnalyzing}>
                        {isAnalyzing ? 'Thinking...' : 'Get Verdict'}
                    </button>
                </div>

                <p className="quick-hint">
                    Need deeper analysis?{' '}
                    <button className="link-btn" onClick={() => onNavigate('new-decision')} type="button">
                        Use full decision flow
                    </button>
                </p>
            </div>
        </div>
    );
}
