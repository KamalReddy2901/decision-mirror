/**
 * AnalysisView.jsx — Editorial transformation
 * 
 * Long-form reading experience with section headers (Fraunces) + hairline dividers.
 * Verdict = masthead. Confidence = Vermilion key datum. No tabs, no colored chips.
 */

import React, { useState, useRef, useMemo } from 'react';
import { Share2, Download, FileText, AlertCircle } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    RadialLinearScale,
    Tooltip
} from 'chart.js';
import { generateDecisionPDF } from '../engine/pdfGenerator';
import { CascadeItem } from '../components/Motion';
import LoadingState from '../components/LoadingState';
import { getUserValues } from '../engine/storage';
import Sources from '../components/Sources';

ChartJS.register(CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, RadialLinearScale, Tooltip);

class ChartErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

const IMPACT_DIMS = [
    { key: 'financial', label: 'Financial' },
    { key: 'emotional', label: 'Emotional' },
    { key: 'relationships', label: 'Relationships' },
    { key: 'growth', label: 'Growth' },
    { key: 'time', label: 'Time' },
    { key: 'values', label: 'Values' }
];

export default function AnalysisView({ analysis, title, description, onNavigate }) {
    const [shareSuccess, setShareSuccess] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [checkedAssumptions, setCheckedAssumptions] = useState({});
    const chartRef = useRef(null);

    const localEngine = analysis?.localEngine || null;
    const biases = localEngine?.biases || analysis?.biases || [];
    const assumptions = localEngine?.assumptions || analysis?.assumptions || [];
    const emotionalScore = analysis?.emotionalScore || 50;

    // Chart data for radar
    const radarData = useMemo(() => {
        const scores = localEngine?.impactScores || analysis?.impactScores || [];
        if (!scores || scores.length === 0) return null;

        const labels = IMPACT_DIMS.map(d => d.label);
        const dataPoints = IMPACT_DIMS.map(dim => {
            const score = scores.find(s => s.dimension === dim.key);
            return score ? score.score : 0;
        });

        return {
            labels,
            datasets: [{
                label: 'Impact',
                data: dataPoints,
                backgroundColor: 'rgba(200, 65, 43, 0.1)',
                borderColor: 'var(--accent-vermilion)',
                borderWidth: 2,
                pointBackgroundColor: 'var(--accent-vermilion)',
                pointBorderColor: 'var(--bg-newsprint)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        };
    }, [localEngine, analysis]);

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.5,
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    stepSize: 25,
                    color: 'rgba(26, 23, 20, 0.38)',
                    font: { family: 'Newsreader', size: 11 },
                    backdropColor: 'transparent'
                },
                grid: { color: 'rgba(26, 23, 20, 0.12)' },
                pointLabels: {
                    color: 'var(--text-secondary)',
                    font: { family: 'Newsreader', size: 13, weight: '500' }
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'var(--bg-newsprint)',
                titleColor: 'var(--text-ink)',
                bodyColor: 'var(--text-secondary)',
                borderColor: 'var(--border-hairline)',
                borderWidth: 1,
                padding: 12,
                titleFont: { family: 'Fraunces', size: 14, weight: '500' },
                bodyFont: { family: 'Newsreader', size: 13 }
            }
        }
    };

    const handleShare = async () => {
        try {
            const compact = {
                v: analysis.verdict,
                ei: analysis.emotionalInsight,
                cc: analysis.coreConflict,
                da: analysis.devilsAdvocate,
                sc: analysis.scores,
                rq: analysis.reflectionQuestion,
                s: analysis.scenarios,
                cw: analysis.crowdWisdom,
                es: emotionalScore,
                t: title,
                d: description
            };
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
            const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encoded}`;

            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareUrl);
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 3000);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = shareUrl;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const handlePDF = async () => {
        setPdfLoading(true);
        try {
            await generateDecisionPDF({
                title: title || 'Decision Analysis',
                description,
                analysis,
                chartRef: chartRef.current
            });
        } catch (err) {
            console.error('PDF generation failed:', err);
        }
        setPdfLoading(false);
    };

    const handleMarkdown = () => {
        let md = `# ${title || 'Decision Analysis'}\n\n`;
        md += `## Your Situation\n${description}\n\n`;

        if (analysis.verdict) {
            md += `## Verdict\n**${analysis.verdict.title}**\n\n`;
            md += `${analysis.verdict.recommendation}\n\n`;
            md += `*Confidence: ${analysis.verdict.confidence || 'moderate'}*\n\n`;
        }

        if (analysis.emotionalInsight) {
            md += `## Emotional Insight\n${analysis.emotionalInsight.explanation}\n\n`;
        }

        if (biases && biases.length > 0) {
            md += `## Cognitive Biases Detected\n\n`;
            biases.forEach((bias, i) => {
                md += `${i + 1}. **${bias.name}**: ${bias.description}\n   - *Reframe*: ${bias.reframe}\n\n`;
            });
        }

        if (assumptions && assumptions.length > 0) {
            md += `## Assumptions to Verify\n\n`;
            assumptions.forEach((a) => {
                md += `- [ ] ${typeof a === 'string' ? a : a.text}\n`;
            });
            md += `\n`;
        }

        if (analysis.reflectionQuestion) {
            md += `## Reflection Question\n*${analysis.reflectionQuestion}*\n\n`;
        }

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(title || 'decision-analysis').toLowerCase().replace(/\s+/g, '-')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!analysis) {
        return <LoadingState stages={['Loading analysis...']} />;
    }

    if (analysis?.quickMode) {
        return (
            <div className="analysis-view quick-analysis reveal visible">
                <div className="panel verdict-card">
                    <div className="verdict-badge">Quick Verdict</div>
                    <h1 className="verdict-title">{analysis.verdict?.title}</h1>
                    <p className="verdict-recommendation">{analysis.verdict?.recommendation}</p>

                    <div className="quick-details">
                        <div className="quick-detail">
                            <strong>Key Consideration:</strong>
                            <p>{analysis.keyConsideration}</p>
                        </div>
                        <div className="quick-detail">
                            <strong>One Thing to Check:</strong>
                            <p>{analysis.oneThingToCheck}</p>
                        </div>
                        <div className="quick-detail">
                            <strong>Reversibility:</strong>
                            <p>{analysis.verdict?.reversibility}</p>
                        </div>
                    </div>

                    <div className="quick-analysis-actions">
                        <button className="btn btn-ghost" onClick={() => onNavigate('dashboard')}>
                            Done
                        </button>
                        <button className="btn btn-primary" onClick={() => onNavigate('new-decision')}>
                            Get Deep Analysis
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (analysis?.compareMode) {
        return (
            <div className="analysis-view compare-analysis reveal visible">
                <div className="panel compare-verdict">
                    <div className="verdict-badge">Head-to-Head Result</div>
                    <h1 className="verdict-title">{analysis.verdict?.title}</h1>
                    <p className="verdict-recommendation">{analysis.verdict?.recommendation}</p>
                </div>

                <div className="compare-grid">
                    <div className="compare-column option-a">
                        <h2>{analysis.optionA?.name}</h2>
                        <div className="compare-score">Score: {analysis.optionA?.score}/100</div>
                        <div className="compare-pros">
                            <h3>Pros</h3>
                            <ul>
                                {analysis.optionA?.pros?.map((pro, i) => <li key={`a-pro-${i}`}>{pro}</li>)}
                            </ul>
                        </div>
                        <div className="compare-cons">
                            <h3>Cons</h3>
                            <ul>
                                {analysis.optionA?.cons?.map((con, i) => <li key={`a-con-${i}`}>{con}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="compare-column option-b">
                        <h2>{analysis.optionB?.name}</h2>
                        <div className="compare-score">Score: {analysis.optionB?.score}/100</div>
                        <div className="compare-pros">
                            <h3>Pros</h3>
                            <ul>
                                {analysis.optionB?.pros?.map((pro, i) => <li key={`b-pro-${i}`}>{pro}</li>)}
                            </ul>
                        </div>
                        <div className="compare-cons">
                            <h3>Cons</h3>
                            <ul>
                                {analysis.optionB?.cons?.map((con, i) => <li key={`b-con-${i}`}>{con}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="panel compare-dimensions">
                    <h3>Dimension Breakdown</h3>
                    <div className="dimension-rows">
                        {analysis.dimensions?.map((dim) => (
                            <div key={dim.key} className="dimension-row">
                                <span className="dim-label">{dim.label}</span>
                                <div className="dim-bars">
                                    <div className="dim-bar bar-a" style={{ width: `${dim.optionAScore * 10}%` }} />
                                    <div className="dim-bar bar-b" style={{ width: `${dim.optionBScore * 10}%` }} />
                                </div>
                                <span className="dim-scores">{dim.optionAScore} vs {dim.optionBScore}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {analysis.tiebreaker && (
                    <div className="panel tiebreaker">
                        <h3>If It's Close</h3>
                        <p>{analysis.tiebreaker}</p>
                    </div>
                )}

                <div className="compare-actions">
                    <button className="btn btn-ghost" onClick={() => onNavigate('dashboard')}>
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <article className="analysis-container">
            {/* MASTHEAD — Verdict as editorial headline */}
            <CascadeItem delay={0}>
                <header className="analysis-header">
                    <p className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>Analysis Complete</p>
                    {analysis.verdict && (
                        <>
                            <h2 style={{ marginBottom: 'var(--space-4)' }}>
                                {analysis.verdict.title || 'Decision Analysis'}
                            </h2>
                            {analysis.verdict.recommendation && (
                                <p style={{ 
                                    fontSize: '1.125rem', 
                                    lineHeight: 1.7, 
                                    color: 'var(--text-secondary)', 
                                    maxWidth: '700px',
                                    margin: '0 auto var(--space-5)'
                                }}>
                                    {analysis.verdict.recommendation}
                                </p>
                            )}
                            {analysis.verdict.confidence && (
                                <div style={{ 
                                    display: 'inline-block',
                                    padding: 'var(--space-2) var(--space-4)',
                                    border: '1px solid var(--accent-vermilion)',
                                    color: 'var(--accent-vermilion)',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Confidence: {analysis.verdict.confidence}
                                </div>
                            )}
                            {analysis.verdict.confidenceExplanation && (
                                <p className="confidence-explanation">
                                    <strong>Confidence: {analysis.verdict.confidence}</strong> - {analysis.verdict.confidenceExplanation}
                                </p>
                            )}
                        </>
                    )}
                </header>
            </CascadeItem>

            {/* ACTION BUTTONS */}
            <CascadeItem delay={0.1}>
                <div style={{ 
                    display: 'flex', 
                    gap: 'var(--space-3)', 
                    justifyContent: 'center', 
                    flexWrap: 'wrap',
                    marginBottom: 'var(--space-8)',
                    paddingBottom: 'var(--space-7)',
                    borderBottom: '1px solid var(--border-hairline)'
                }}>
                    <button className="btn btn-ghost btn-sm" onClick={handleShare} aria-label="Share analysis">
                        <Share2 size={16} />
                        {shareSuccess ? 'Link Copied!' : 'Share'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={handlePDF} disabled={pdfLoading} aria-label="Download PDF">
                        <Download size={16} />
                        {pdfLoading ? 'Generating...' : 'PDF'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={handleMarkdown} aria-label="Download Markdown">
                        <FileText size={16} />
                        Markdown
                    </button>
                </div>
            </CascadeItem>

            {/* EMOTIONAL INSIGHT */}
            {analysis.emotionalInsight && (
                <CascadeItem delay={0.2}>
                    <section className="analysis-section">
                        <h3>Emotional Insight</h3>
                        <div style={{ 
                            padding: 'var(--space-5)', 
                            border: emotionalScore > 70 ? '2px solid var(--accent-vermilion)' : '1px solid var(--border-hairline)',
                            borderLeft: emotionalScore > 70 ? '6px solid var(--accent-vermilion)' : '4px solid var(--border-hairline)',
                            marginBottom: 'var(--space-5)'
                        }}>
                            {analysis.emotionalInsight.feeling && (
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 500, marginBottom: 'var(--space-3)', color: emotionalScore > 70 ? 'var(--accent-vermilion)' : 'var(--text-ink)' }}>
                                    {analysis.emotionalInsight.feeling}
                                </div>
                            )}
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                {analysis.emotionalInsight.explanation}
                            </p>
                            {analysis.emotionalInsight.hiddenDesire && (
                                <p style={{ marginTop: 'var(--space-4)', fontStyle: 'italic', color: 'var(--text-tertiary)', paddingLeft: 'var(--space-4)', borderLeft: '2px solid var(--border-hairline)' }}>
                                    {analysis.emotionalInsight.hiddenDesire}
                                </p>
                            )}
                        </div>
                    </section>
                </CascadeItem>
            )}

            {/* CORE CONFLICT */}
            {analysis.coreConflict && (
                <CascadeItem delay={0.3}>
                    <section className="analysis-section">
                        <h3>Core Conflict</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-5)', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-ink)' }}>
                                    {analysis.coreConflict.sideA}
                                </div>
                            </div>
                            <div style={{ fontSize: '1.5rem', color: 'var(--text-tertiary)' }}>⟷</div>
                            <div>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-ink)' }}>
                                    {analysis.coreConflict.sideB}
                                </div>
                            </div>
                        </div>
                        {analysis.coreConflict.explanation && (
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, textAlign: 'center' }}>
                                {analysis.coreConflict.explanation}
                            </p>
                        )}
                    </section>
                </CascadeItem>
            )}

            {analysis.valuesAlignment && analysis.valuesAlignment.length > 0 && (
                <CascadeItem delay={0.35}>
                    <section className="analysis-section values-alignment">
                        <h3>Values Alignment</h3>
                        <p className="section-intro">How each option aligns with your stated priorities</p>

                        <div className="values-cards">
                            {analysis.valuesAlignment.map((item, i) => (
                                <div key={`values-${i}`} className="values-card panel">
                                    <h3>{item.option}</h3>
                                    <div className="alignment-score">
                                        <span className="score-value">{item.alignmentScore || item.percentage}%</span>
                                        <span className="score-label">{item.summary || 'Alignment estimate'}</span>
                                    </div>

                                    <div className="values-breakdown">
                                        {(item.breakdown || []).slice(0, 5).map((b, j) => (
                                            <div key={`breakdown-${j}`} className="breakdown-row">
                                                <span className="breakdown-value">{b.value}</span>
                                                <div className="breakdown-bar">
                                                    <div className="breakdown-fill" style={{ width: `${(b.impact || 0) * 10}%` }} />
                                                </div>
                                                <span className="breakdown-weight">Priority: {b.weight}/10</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!getUserValues() && (
                            <p className="values-cta">
                                <button className="link-btn" onClick={() => onNavigate('values')} type="button">
                                    Set your values
                                </button>{' '}
                                to get personalized alignment scores.
                            </p>
                        )}
                    </section>
                </CascadeItem>
            )}

            {/* COGNITIVE BIASES — Ruled list */}
            {biases && biases.length > 0 && (
                <CascadeItem delay={0.4}>
                    <section className="analysis-section">
                        <h3>Cognitive Biases Detected</h3>
                        <div>
                            {biases.slice(0, 5).map((bias, index, arr) => (
                                <div 
                                    key={index} 
                                    style={{ 
                                        padding: 'var(--space-4) 0',
                                        borderBottom: index < arr.length - 1 ? '1px solid var(--border-hairline)' : 'none'
                                    }}
                                >
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                        {bias.name}
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>
                                        {bias.description}
                                    </p>
                                    {bias.reframe && (
                                        <p style={{ 
                                            fontSize: '0.875rem', 
                                            color: 'var(--text-tertiary)', 
                                            fontStyle: 'italic',
                                            paddingLeft: 'var(--space-4)',
                                            borderLeft: '2px solid var(--accent-vermilion)'
                                        }}>
                                            Reframe: {bias.reframe}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </CascadeItem>
            )}

            {/* IMPACT RADAR CHART */}
            {radarData && (
                <CascadeItem delay={0.5}>
                    <section className="analysis-section">
                        <h3>Impact Assessment</h3>
                        <div style={{ maxWidth: '500px', margin: '0 auto', padding: 'var(--space-5)' }}>
                            <ChartErrorBoundary>
                                <div ref={chartRef}>
                                    <Radar data={radarData} options={radarOptions} />
                                </div>
                            </ChartErrorBoundary>
                        </div>
                    </section>
                </CascadeItem>
            )}

            {/* SCORES — Ruled data table */}
            {analysis.scores && (
                <CascadeItem delay={0.6}>
                    <section className="analysis-section">
                        <h3>Decision Scores</h3>
                        <div>
                            {[
                                { label: 'Emotion Risk', value: analysis.scores.emotionRisk, key: 'emotionRisk' },
                                { label: 'Bias Risk', value: analysis.scores.biasRisk, key: 'biasRisk' },
                                { label: 'Complexity', value: analysis.scores.complexityScore, key: 'complexityScore' },
                                { label: 'Clarity', value: analysis.scores.clarityScore, key: 'clarityScore' },
                                { label: 'Confidence', value: analysis.scores.confidenceScore, key: 'confidenceScore' }
                            ].filter(s => s.value != null).map((score, idx, arr) => (
                                <div 
                                    key={score.key}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 80px',
                                        gap: 'var(--space-4)',
                                        padding: 'var(--space-4) 0',
                                        borderBottom: idx < arr.length - 1 ? '1px solid var(--border-hairline)' : 'none',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                                        {score.label}
                                    </div>
                                    <div style={{ 
                                        fontFamily: 'var(--font-display)', 
                                        fontSize: '1.5rem', 
                                        fontWeight: 300,
                                        color: (score.key === 'emotionRisk' && score.value > 70) || (score.key === 'biasRisk' && score.value > 70) ? 'var(--accent-vermilion)' : 'var(--text-ink)',
                                        textAlign: 'right'
                                    }}>
                                        {score.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </CascadeItem>
            )}

            {/* SCENARIOS */}
            {analysis.scenarios && (
                <CascadeItem delay={0.7}>
                    <section className="analysis-section">
                        <h3>Scenario Planning</h3>
                        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                            {analysis.scenarios.best && (
                                <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-hairline)' }}>
                                    <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Best Case</div>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.scenarios.best}</p>
                                </div>
                            )}
                            {analysis.scenarios.likely && (
                                <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-hairline)' }}>
                                    <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Most Likely</div>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.scenarios.likely}</p>
                                </div>
                            )}
                            {analysis.scenarios.worst && (
                                <div style={{ padding: 'var(--space-4)', border: '1px solid var(--border-hairline)', borderLeft: '4px solid var(--accent-vermilion)' }}>
                                    <div className="eyebrow" style={{ marginBottom: 'var(--space-2)', color: 'var(--accent-vermilion)' }}>Worst Case</div>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.scenarios.worst}</p>
                                </div>
                            )}
                        </div>
                    </section>
                </CascadeItem>
            )}

            {/* ASSUMPTIONS CHECKLIST */}
            {assumptions && assumptions.length > 0 && (
                <CascadeItem delay={0.8}>
                    <section className="analysis-section">
                        <h3>Assumptions to Verify</h3>
                        <div>
                            {assumptions.map((assumption, i) => {
                                const text = typeof assumption === 'string' ? assumption : assumption.text;
                                const id = `assumption-${i}`;
                                return (
                                    <div 
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            gap: 'var(--space-3)',
                                            padding: 'var(--space-3) 0',
                                            borderBottom: i < assumptions.length - 1 ? '1px solid var(--border-hairline)' : 'none'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            id={id}
                                            checked={checkedAssumptions[i] || false}
                                            onChange={(e) => setCheckedAssumptions(prev => ({ ...prev, [i]: e.target.checked }))}
                                            style={{ flexShrink: 0, marginTop: '4px', accentColor: 'var(--accent-vermilion)' }}
                                        />
                                        <label 
                                            htmlFor={id}
                                            style={{ 
                                                flex: 1, 
                                                color: checkedAssumptions[i] ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                                                textDecoration: checkedAssumptions[i] ? 'line-through' : 'none',
                                                cursor: 'pointer',
                                                lineHeight: 1.6
                                            }}
                                        >
                                            {text}
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </CascadeItem>
            )}

            {/* PULL-QUOTE — Reflection Question */}
            {analysis.reflectionQuestion && (
                <CascadeItem delay={0.9}>
                    <div style={{ 
                        maxWidth: '600px', 
                        margin: 'var(--space-9) auto', 
                        padding: 'var(--space-6) 0 var(--space-6) var(--space-7)', 
                        borderLeft: '3px solid var(--accent-vermilion)',
                        fontFamily: 'var(--font-display)',
                        fontStyle: 'italic',
                        fontSize: '1.25rem',
                        lineHeight: 1.5,
                        color: 'var(--text-secondary)'
                    }}>
                        {analysis.reflectionQuestion}
                    </div>
                </CascadeItem>
            )}

            {/* 10-10-10 */}
            {analysis.tenTenTen && (
                <CascadeItem delay={1.0}>
                    <section className="analysis-section">
                        <h3>10-10-10 Time Perspective</h3>
                        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                            {analysis.tenTenTen.tenMinutes && (
                                <div>
                                    <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>In 10 Minutes</div>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.tenTenTen.tenMinutes}</p>
                                </div>
                            )}
                            {analysis.tenTenTen.tenMonths && (
                                <div>
                                    <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>In 10 Months</div>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.tenTenTen.tenMonths}</p>
                                </div>
                            )}
                            {analysis.tenTenTen.tenYears && (
                                <div>
                                    <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>In 10 Years</div>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.tenTenTen.tenYears}</p>
                                </div>
                            )}
                        </div>
                    </section>
                </CascadeItem>
            )}

            {/* DEVIL'S ADVOCATE */}
            {analysis.devilsAdvocate && (
                <CascadeItem delay={1.1}>
                    <section className="analysis-section">
                        <h3>Devil's Advocate</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '1rem' }}>
                            {analysis.devilsAdvocate}
                        </p>
                    </section>
                </CascadeItem>
            )}

            <CascadeItem delay={1.15}>
                <Sources analysis={analysis} />
            </CascadeItem>

            {/* FOOTER ACTIONS */}
            <CascadeItem delay={1.2}>
                <div style={{ 
                    marginTop: 'var(--space-9)', 
                    paddingTop: 'var(--space-7)', 
                    borderTop: '1px solid var(--border-hairline)',
                    display: 'flex',
                    gap: 'var(--space-4)',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button className="btn btn-ghost" onClick={() => onNavigate('dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <button className="btn btn-primary" onClick={() => onNavigate('new-decision')}>
                        New Decision
                    </button>
                </div>
            </CascadeItem>
        </article>
    );
}
