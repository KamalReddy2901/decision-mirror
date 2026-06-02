import { useState } from 'react';
import { isAIAvailable, generateComparisonAnalysis } from '../engine/aiService';
import { saveDecision, getUserValues } from '../engine/storage';
import { generateImpactScores, IMPACT_DIMENSIONS } from '../engine/decisionEngine';

export default function CompareMode({ onNavigate }) {
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [context, setContext] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    const handleCompare = async () => {
        if (!optionA.trim() || !optionB.trim() || isAnalyzing) return;

        if (!isAIAvailable()) {
            setError('AI service is not available right now.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const userValues = getUserValues();
            const options = [optionA.trim(), optionB.trim()];
            const comparison = await generateComparisonAnalysis(optionA.trim(), optionB.trim(), context.trim(), userValues);
            const impactScores = generateImpactScores(options, context, []);

            const analysis = {
                verdict: {
                    title: comparison.winner,
                    recommendation: comparison.reasoning,
                    confidence: comparison.confidence,
                    reversibility: comparison.reversibility
                },
                compareMode: true,
                optionA: {
                    name: optionA,
                    score: comparison.optionAScore,
                    pros: comparison.optionAPros,
                    cons: comparison.optionACons
                },
                optionB: {
                    name: optionB,
                    score: comparison.optionBScore,
                    pros: comparison.optionBPros,
                    cons: comparison.optionBCons
                },
                dimensions: IMPACT_DIMENSIONS.map((dim) => ({
                    ...dim,
                    optionAScore: impactScores[0]?.scores?.[dim.key] || 5,
                    optionBScore: impactScores[1]?.scores?.[dim.key] || 5
                })),
                tiebreaker: comparison.tiebreaker,
                valuesAlignment: comparison.valuesAlignment,
                generatedAt: Date.now(),
                mode: 'comparison'
            };

            const savedDecision = saveDecision({
                title: `${optionA.trim()} vs ${optionB.trim()}`,
                description: context || `Comparing: ${optionA.trim()} vs ${optionB.trim()}`,
                options,
                answers: [],
                emotionalScore: 50,
                analysis
            });

            onNavigate('analysis', {
                analysis,
                title: `${optionA.trim()} vs ${optionB.trim()}`,
                description: context,
                decisionId: savedDecision.id
            });
        } catch (err) {
            console.error('Comparison failed:', err);
            setError(err.message || 'Failed to generate comparison.');
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="compare-mode reveal visible">
            <div className="compare-header">
                <h1>Head-to-Head</h1>
                <p className="subtitle">Compare two options side by side</p>
            </div>

            <div className="panel compare-card">
                <div className="compare-inputs">
                    <div className="compare-option">
                        <label htmlFor="optionA">Option A</label>
                        <input
                            id="optionA"
                            type="text"
                            placeholder="First option..."
                            value={optionA}
                            onChange={(e) => setOptionA(e.target.value)}
                            disabled={isAnalyzing}
                        />
                    </div>

                    <div className="compare-vs">VS</div>

                    <div className="compare-option">
                        <label htmlFor="optionB">Option B</label>
                        <input
                            id="optionB"
                            type="text"
                            placeholder="Second option..."
                            value={optionB}
                            onChange={(e) => setOptionB(e.target.value)}
                            disabled={isAnalyzing}
                        />
                    </div>
                </div>

                <div className="compare-context">
                    <label htmlFor="context">Context (optional)</label>
                    <textarea
                        id="context"
                        placeholder="Add any relevant context about your situation..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        disabled={isAnalyzing}
                        rows={3}
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="compare-actions">
                    <button className="btn btn-ghost" onClick={() => onNavigate('landing')} disabled={isAnalyzing}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleCompare} disabled={!optionA.trim() || !optionB.trim() || isAnalyzing}>
                        {isAnalyzing ? 'Comparing...' : 'Compare'}
                    </button>
                </div>
            </div>
        </div>
    );
}
