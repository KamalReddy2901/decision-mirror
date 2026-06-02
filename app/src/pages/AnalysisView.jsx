import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
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
import { askFollowUp, generateAnalysis, getRateLimitCooldownRemainingMs, isAIAvailable } from '../engine/aiService';
import { sanitizeCommunityInsights } from '../engine/communitySafety';
import AnimatedBackground from '../components/AnimatedBackground';

class ChartErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

ChartJS.register(CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, RadialLinearScale, Tooltip);

const IMPACT_DIMS = [
    { key: 'financial', label: 'Financial', icon: '💰' },
    { key: 'emotional', label: 'Emotional', icon: '🧠' },
    { key: 'relationships', label: 'Relationships', icon: '👥' },
    { key: 'growth', label: 'Growth', icon: '🌱' },
    { key: 'time', label: 'Time', icon: '⏰' },
    { key: 'values', label: 'Values', icon: '💎' }
];

const _EMPTY_SCORES = [];
const _EMPTY_ARRAY = [];
const _EMPTY_OBJ = {};

function truncateLabel(text, max = 36) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function classifyUiError(message = '') {
    const text = String(message || 'Something went wrong. Please try again.');
    if (/invalid api key|401/i.test(text)) {
        return {
            title: 'API key issue',
            detail: 'Your API key is missing or invalid. Update it in Settings to continue AI features.',
            icon: '🔑',
            action: 'settings'
        };
    }
    if (/(rate limit|cooldown|429)/i.test(text)) {
        return {
            title: 'AI is temporarily busy',
            detail: text,
            icon: '⏳',
            action: 'wait'
        };
    }
    if (/(network|failed to fetch|offline|timed out|timeout)/i.test(text)) {
        return {
            title: 'Connection issue',
            detail: 'Network instability interrupted the request. Check your connection and retry.',
            icon: '🌐',
            action: 'retry'
        };
    }
    return {
        title: 'Temporary error',
        detail: text,
        icon: '⚠️',
        action: 'retry'
    };
}

export default function AnalysisView({ analysis, title, description, onNavigate }) {
    const [expandedRisk, setExpandedRisk] = useState(null);
    const [expandedBias, setExpandedBias] = useState(null);
    const [checkedAssumptions, setCheckedAssumptions] = useState({});
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [upgradeError, setUpgradeError] = useState(null);
    const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
    const [revealStage, setRevealStage] = useState(1);
    const chartRef = useRef(null);

    const isNewFormat = Boolean(analysis?.verdict);
    const localEngine = analysis?.localEngine || null;
    const _category = localEngine?.category || analysis?.category;
    const _stakes = localEngine?.stakes || analysis?.stakes;
    const biases = localEngine?.biases || analysis?.biases || [];
    const impactScores = localEngine?.impactScores || analysis?.impactScores || _EMPTY_SCORES;
    const _valuesAlignment = localEngine?.valuesAlignment || analysis?.valuesAlignment || [];
    const assumptions = localEngine?.assumptions || analysis?.assumptions || [];
    const emotionalAnalysis = localEngine?.emotionalAnalysis || analysis?.emotionalAnalysis;
    const risks = analysis?.risks || [];
    const verdict = analysis?.verdict;
    const emotionalInsight = analysis?.emotionalInsight;
    const coreConflict = analysis?.coreConflict;
    const pathForward = analysis?.pathForward;
    const blindSpots = analysis?.blindSpots;
    const reflectionQuestion = analysis?.reflectionQuestion;
    const cognitiveDistortions = analysis?.cognitiveDistortions || _EMPTY_ARRAY;
    const devilsAdvocate = analysis?.devilsAdvocate;
    const tenTenTen = analysis?.tenTenTen || localEngine?.tenTenTen || null;
    const preMortem = analysis?.preMortem || localEngine?.preMortem || _EMPTY_ARRAY;
    const scenarios = analysis?.scenarios || localEngine?.scenarios || null;
    const emotionalScore = analysis?.emotionalScore || 50;
    const scores = analysis?.scores || _EMPTY_OBJ;
    const localOnlyReason = analysis?.localOnlyReason || '';
    const communityInsights = analysis?.communityInsights || _EMPTY_ARRAY;
    const communitySafety = useMemo(() => sanitizeCommunityInsights(communityInsights, { description }), [communityInsights, description]);
    const safeCommunityInsights = communitySafety.items;
    const hadCommunityInput = communitySafety.hadInput;
    const crowdWisdom = analysis?.crowdWisdom || null;
    const optionComparison = analysis?.optionComparison || null;
    const [whatIfAdjustments, setWhatIfAdjustments] = useState({ emotion: 0, time: 0, financial: 0, relationships: 0 });
    const [shareToast, setShareToast] = useState('');

    // Follow-up Q&A
    const [followUpOpen, setFollowUpOpen] = useState(false);
    const [followUpTopic, setFollowUpTopic] = useState('general');
    const [followUpQuestion, setFollowUpQuestion] = useState('');
    const [followUpHistory, setFollowUpHistory] = useState([]);
    const [followUpLoading, setFollowUpLoading] = useState(false);
    const [followUpError, setFollowUpError] = useState(null);
    const followUpEndRef = useRef(null);

    useEffect(() => {
        const syncCooldown = () => setCooldownRemainingMs(getRateLimitCooldownRemainingMs());
        syncCooldown();
        const interval = setInterval(syncCooldown, 1000);
        window.addEventListener('focus', syncCooldown);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', syncCooldown);
        };
    }, []);

    useEffect(() => {
        const resetTimer = setTimeout(() => setRevealStage(1), 0);
        const timers = [
            setTimeout(() => setRevealStage(2), 220),
            setTimeout(() => setRevealStage(3), 460),
            setTimeout(() => setRevealStage(4), 760)
        ];
        return () => {
            clearTimeout(resetTimer);
            timers.forEach(clearTimeout);
        };
    }, [analysis?.generatedAt, analysis?.timestamp, analysis?.mode]);

    const adjustedScores = useMemo(() => {
        const base = { ...scores };
        const e = whatIfAdjustments.emotion;
        const t = whatIfAdjustments.time;
        const f = whatIfAdjustments.financial;
        const r = whatIfAdjustments.relationships;
        return {
            emotionRisk: Math.max(0, Math.min(100, (base.emotionRisk ?? 50) + e * 8)),
            biasRisk: Math.max(0, Math.min(100, (base.biasRisk ?? 40) + Math.abs(e) * 3)),
            complexityScore: Math.max(0, Math.min(100, (base.complexityScore ?? 50) + Math.abs(f) * 4 + Math.abs(r) * 3)),
            confidenceScore: Math.max(0, Math.min(100, (base.confidenceScore ?? 60) - Math.abs(e) * 3 + t * 2)),
            clarityScore: Math.max(0, Math.min(100, (base.clarityScore ?? 50) + t * 4 - Math.abs(e) * 2)),
            urgencyScore: Math.max(0, Math.min(100, (base.urgencyScore ?? 40) - t * 6))
        };
    }, [scores, whatIfAdjustments]);

    const handleShare = useCallback(() => {
        try {
            const compact = {
                v: verdict, ei: emotionalInsight, cc: coreConflict, da: devilsAdvocate,
                sc: scores, rq: reflectionQuestion, s: scenarios, cw: crowdWisdom,
                d: description, t: title, es: emotionalScore
            };
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
            const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
            navigator.clipboard.writeText(url).then(() => {
                setShareToast('Link copied!');
                setTimeout(() => setShareToast(''), 2500);
            });
        } catch {
            setShareToast('Could not generate link');
            setTimeout(() => setShareToast(''), 2500);
        }
    }, [verdict, emotionalInsight, coreConflict, devilsAdvocate, scores, reflectionQuestion, scenarios, crowdWisdom, description, title, emotionalScore]);

    const handleMarkdownExport = useCallback(() => {
        let md = `# MirrorWise Analysis\n\n`;
        md += `**Decision:** ${description || ''}\n\n`;
        if (verdict) {
            md += `## Verdict: ${verdict.title}\n\n`;
            md += `${verdict.recommendation}\n\n`;
            md += `**Confidence:** ${verdict.confidence} | **Reversibility:** ${verdict.reversibility || 'N/A'}\n\n`;
        }
        if (Object.keys(scores).length) {
            md += `## Scores\n\n`;
            md += `| Metric | Score |\n|--------|-------|\n`;
            md += `| Emotion Risk | ${scores.emotionRisk ?? '-'}/100 |\n`;
            md += `| Bias Risk | ${scores.biasRisk ?? '-'}/100 |\n`;
            md += `| Complexity | ${scores.complexityScore ?? '-'}/100 |\n`;
            md += `| Confidence | ${scores.confidenceScore ?? '-'}/100 |\n`;
            md += `| Clarity | ${scores.clarityScore ?? '-'}/100 |\n`;
            md += `| Urgency | ${scores.urgencyScore ?? '-'}/100 |\n\n`;
        }
        if (emotionalInsight) {
            md += `## Emotional Insight\n\n`;
            md += `> "${emotionalInsight.feeling}"\n\n`;
            md += `${emotionalInsight.explanation}\n\n`;
            if (emotionalInsight.hiddenDesire) md += `**Hidden desire:** ${emotionalInsight.hiddenDesire}\n\n`;
        }
        if (coreConflict) md += `## Core Conflict\n\n**${coreConflict.sideA}** vs **${coreConflict.sideB}**\n\n${coreConflict.explanation}\n\n`;
        if (cognitiveDistortions.length) {
            md += `## Cognitive Biases Detected\n\n`;
            cognitiveDistortions.forEach(b => { md += `- **${b.bias}**: ${b.evidence || ''} — ${b.antidote || ''}\n`; });
            md += `\n`;
        }
        if (devilsAdvocate) md += `## Devil's Advocate\n\n*${devilsAdvocate}*\n\n`;
        if (tenTenTen) {
            md += `## 10-10-10 Analysis\n\n`;
            const t = Array.isArray(tenTenTen) ? tenTenTen[0] : tenTenTen;
            if (t) { md += `- **10 Minutes:** ${t.tenMinutes}\n- **10 Months:** ${t.tenMonths}\n- **10 Years:** ${t.tenYears}\n\n`; }
        }
        if (scenarios) {
            md += `## Scenarios\n\n`;
            const s = scenarios.best ? scenarios : (Array.isArray(scenarios) ? null : scenarios);
            if (s) { md += `- **Best:** ${s.best}\n- **Likely:** ${s.likely}\n- **Worst:** ${s.worst}\n\n`; }
        }
        if (preMortem?.length) {
            md += `## Pre-Mortem\n\n`;
            preMortem.forEach(p => { if (p.failure) md += `- **${p.failure}** (${p.probability}) — ${p.prevention || ''}\n`; });
            md += `\n`;
        }
        if (pathForward?.length) {
            md += `## Path Forward\n\n`;
            pathForward.forEach(s => { md += `${s.step}. **${s.action}** (${s.timeframe || ''}) — ${s.why || ''}\n`; });
            md += `\n`;
        }
        if (optionComparison && optionComparison.dimensions?.length) {
            md += `## Side-by-Side Comparison\n\n`;
            md += `| Dimension | ${optionComparison.optionA} | ${optionComparison.optionB} |\n|-----------|${'-'.repeat(optionComparison.optionA?.length + 2 || 10)}|${'-'.repeat(optionComparison.optionB?.length + 2 || 10)}|\n`;
            optionComparison.dimensions.forEach(d => {
                md += `| ${d.label} | ${'●'.repeat(parseInt(d.optionA_score)||3)}${'○'.repeat(5-(parseInt(d.optionA_score)||3))} ${d.optionA_detail || ''} | ${'●'.repeat(parseInt(d.optionB_score)||3)}${'○'.repeat(5-(parseInt(d.optionB_score)||3))} ${d.optionB_detail || ''} |\n`;
            });
            if (optionComparison.verdict) md += `\n**Bottom Line:** ${optionComparison.verdict}\n\n`;
        }
        if (crowdWisdom) md += `## What the Data Says\n\n${crowdWisdom.mainStat}\n\n${crowdWisdom.secondaryStat || ''}\n\n*Source: ${crowdWisdom.source || 'Research data'}*\n\n`;
        if (safeCommunityInsights?.length) {
            md += `## What People Say\n\n`;
            safeCommunityInsights.forEach(c => { md += `> "${c.insight}" — *${c.source || 'community'}* (${c.upvotes || ''} upvotes)\n\n`; });
        } else if (hadCommunityInput) {
            md += `## What People Say\n\n`;
            md += `Community examples were withheld for safety. For practical next steps, try support-oriented communities like r/Advice, r/personalfinance, or r/legaladvice.\n\n`;
        }
        if (reflectionQuestion) md += `## The Mirror\n\n> *"${reflectionQuestion}"*\n\n`;
        md += `---\n*Generated by MirrorWise*\n`;

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mirrorwise-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }, [verdict, scores, emotionalInsight, coreConflict, cognitiveDistortions, devilsAdvocate, tenTenTen, scenarios, preMortem, pathForward, optionComparison, crowdWisdom, safeCommunityInsights, hadCommunityInput, reflectionQuestion, description]);

    const handleDownload = () => {
        if (!analysis) return;
        generateDecisionPDF({
            title: title || verdict?.title || 'Decision Analysis',
            description: description || '',
            options: analysis.options || [],
            emotionalScore,
            analysis,
            timestamp: Date.now(),
            chartElement: chartRef.current
        });
    };

    const openSettings = () => {
        document.querySelector('.nav-link[title="Settings"]')?.click();
    };

    const cooldownSeconds = Math.max(0, Math.ceil(cooldownRemainingMs / 1000));

    const handleUpgradeWithAI = async () => {
        if (upgradeLoading || !analysis?.localOnlyReason) return;
        setUpgradeError(null);

        const remaining = getRateLimitCooldownRemainingMs();
        if (remaining > 0) {
            setUpgradeError(classifyUiError(`Rate limit cooldown active. Try again in ${Math.ceil(remaining / 1000)} seconds.`));
            return;
        }

        setUpgradeLoading(true);
        try {
            const refreshed = await generateAnalysis(
                description || '',
                analysis?.conversationHistory || [],
                emotionalScore
            );

            const upgradedAnalysis = {
                ...analysis,
                ...refreshed,
                localOnlyReason: '',
                mode: 'hybrid-analysis',
                generatedAt: Date.now(),
                tenTenTen: refreshed.tenTenTen || analysis?.localEngine?.tenTenTen || analysis?.tenTenTen,
                preMortem: refreshed.preMortem || analysis?.localEngine?.preMortem || analysis?.preMortem,
                scenarios: refreshed.scenarios || analysis?.localEngine?.scenarios || analysis?.scenarios,
                assumptions: refreshed.assumptions || analysis?.localEngine?.assumptions || analysis?.assumptions,
                conversationHistory: analysis?.conversationHistory || []
            };

            onNavigate('analysis', {
                analysis: upgradedAnalysis,
                title: title || upgradedAnalysis?.verdict?.title || 'Decision Analysis',
                description
            });
        } catch (err) {
            setUpgradeError(classifyUiError(err?.message));
        }
        setUpgradeLoading(false);
    };

    const handleFollowUpSubmit = async () => {
        if (!followUpQuestion.trim() || followUpLoading) return;
        setFollowUpLoading(true);
        setFollowUpError(null);
        const q = followUpQuestion.trim();
        setFollowUpQuestion('');

        try {
            const answer = await askFollowUp({
                description: description || '',
                analysis,
                topic: followUpTopic,
                question: q,
                chatHistory: followUpHistory
            });
            setFollowUpHistory(prev => [...prev, { question: q, topic: followUpTopic, answer }]);
            setTimeout(() => followUpEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            setFollowUpError(classifyUiError(err?.message));
        }
        setFollowUpLoading(false);
    };

    const FOLLOW_UP_TOPICS = [
        { key: 'general', label: 'General', icon: '💬' },
        { key: 'verdict', label: 'Verdict', icon: '🎯' },
        { key: 'emotional-insight', label: 'Emotions', icon: '💜' },
        { key: 'biases', label: 'Biases', icon: '⚠️' },
        { key: 'scenarios', label: 'Scenarios', icon: '🔮' },
        { key: '10-10-10', label: '10-10-10', icon: '⏰' },
        { key: 'risks', label: 'Risks', icon: '🛡️' },
        { key: 'blind-spots', label: 'Blind Spots', icon: '👁️' },
        { key: 'path-forward', label: 'Path Forward', icon: '🗺️' },
    ];

    const confidenceColor = { high: '#34d399', medium: '#fbbf24', low: '#f43f5e' };
    const likelihoodEmoji = { low: '🟢', medium: '🟡', high: '🔴' };

    const radarData = useMemo(() => {
        if (!impactScores.length) return null;
        const palette = [['rgba(99,102,241,0.18)', '#6366f1'], ['rgba(168,85,247,0.18)', '#a855f7'], ['rgba(45,212,191,0.16)', '#2dd4bf']];
        return {
            labels: IMPACT_DIMS.map(d => d.label),
            datasets: impactScores.slice(0, 3).map((item, i) => ({
                label: truncateLabel(item.option, 24),
                data: IMPACT_DIMS.map(d => item.scores?.[d.key] ?? 0),
                backgroundColor: palette[i % 3][0],
                borderColor: palette[i % 3][1],
                borderWidth: 2,
                pointBackgroundColor: palette[i % 3][1],
                pointBorderColor: '#fff',
                pointRadius: 3
            }))
        };
    }, [impactScores]);

    const radarOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#e8e8f0' } } },
        scales: { r: { min: 0, max: 10, ticks: { stepSize: 2, color: 'rgba(232,232,240,0.6)', backdropColor: 'transparent' }, angleLines: { color: 'rgba(232,232,240,0.2)' }, grid: { color: 'rgba(232,232,240,0.12)' }, pointLabels: { color: 'rgba(232,232,240,0.75)' } } }
    };

    const toggleAssumption = (idx) => {
        setCheckedAssumptions(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    if (!analysis) return <div className="loading">Loading analysis...</div>;

    if (!isNewFormat) {
        return (
            <>
                <AnimatedBackground emotionalScore={50} />
                <div className="analysis-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h2>Legacy Analysis</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>This decision was analyzed with an older version.</p>
                        <button className="btn btn-primary" onClick={() => onNavigate('new-decision')}>Start a New Analysis</button>
                    </div>
                </div>
            </>
        );
    }

    // Combine AI cognitive distortions with local bias detection for maximum coverage
    const allBiasCards = [
        ...cognitiveDistortions.map(d => ({ ...d, source: 'ai' })),
        ...biases.filter(b => !cognitiveDistortions.some(d => d.bias?.toLowerCase().includes(b.name?.toLowerCase().split(' ')[0]))).map(b => ({
            bias: b.name, evidence: b.triggers?.slice(0, 3).join(', ') || '', impact: b.description,
            antidote: b.reframe, research: b.research || '', source: 'engine', icon: b.icon, severity: b.severity
        }))
    ];

    return (
        <>
            <AnimatedBackground emotionalScore={emotionalScore} />
            <div className="analysis-report">

                {localOnlyReason && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.7s var(--ease-out)' }}>
                        <div className="glass-card" style={{
                            border: '1px solid rgba(251, 191, 36, 0.35)',
                            background: 'rgba(251, 191, 36, 0.08)',
                            padding: '1rem 1.25rem',
                            color: '#fef3c7'
                        }}>
                            <strong style={{ color: '#fbbf24' }}>Limited AI mode:</strong> {localOnlyReason}
                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleUpgradeWithAI}
                                    disabled={upgradeLoading || cooldownSeconds > 0}
                                >
                                    {upgradeLoading ? 'Upgrading...' : cooldownSeconds > 0 ? `Upgrade in ${cooldownSeconds}s` : 'Upgrade this analysis with AI'}
                                </button>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    Uses your saved context to regenerate the full AI analysis.
                                </span>
                            </div>
                            {upgradeError && (
                                <div style={{
                                    marginTop: '0.7rem',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid rgba(244, 63, 94, 0.25)',
                                    background: 'rgba(244, 63, 94, 0.08)',
                                    color: '#fecaca',
                                    fontSize: '0.82rem'
                                }}>
                                    <strong>{upgradeError.icon} {upgradeError.title}:</strong> {upgradeError.detail}
                                    {upgradeError.action === 'settings' && (
                                        <button className="btn btn-ghost btn-sm" style={{ marginLeft: '0.5rem' }} onClick={openSettings}>Open Settings</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ============ VERDICT HERO ============ */}
                <section className="report-section verdict-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out)' }}>
                    <div className="verdict-card">
                        <div className="verdict-icon">🎯</div>
                        <h1 className="verdict-title">{verdict.title}</h1>
                        <p className="verdict-recommendation">{verdict.recommendation}</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <div className="verdict-confidence">
                                <span className="confidence-dot" style={{ background: confidenceColor[verdict.confidence] || confidenceColor.medium }} />
                                {verdict.confidence === 'high' ? 'High confidence' : verdict.confidence === 'medium' ? 'Moderate confidence' : 'Consider carefully'}
                            </div>
                            {verdict.reversibility && (
                                <div className="verdict-confidence" style={{ background: 'rgba(45, 212, 191, 0.08)' }}>
                                    <span style={{ fontSize: '0.9rem' }}>↩️</span>
                                    {verdict.reversibility}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ============ SCORE CARDS ============ */}
                {(() => {
                    const confMap = { high: 85, medium: 60, low: 30 };
                    const scoreCards = [
                        {
                            label: 'Emotion Risk',
                            value: scores.emotionRisk ?? emotionalScore,
                            color: (scores.emotionRisk ?? emotionalScore) > 65 ? '#f43f5e' : (scores.emotionRisk ?? emotionalScore) > 35 ? '#fbbf24' : '#34d399',
                            levelLabel: (scores.emotionRisk ?? emotionalScore) > 65 ? 'High' : (scores.emotionRisk ?? emotionalScore) > 35 ? 'Moderate' : 'Low'
                        },
                        {
                            label: 'Bias Risk',
                            value: scores.biasRisk ?? Math.min(95, allBiasCards.length * 25 + 10),
                            color: (scores.biasRisk ?? allBiasCards.length * 25) > 60 ? '#f43f5e' : (scores.biasRisk ?? allBiasCards.length * 25) > 30 ? '#fbbf24' : '#34d399',
                            levelLabel: (scores.biasRisk ?? allBiasCards.length * 25) > 60 ? 'High' : (scores.biasRisk ?? allBiasCards.length * 25) > 30 ? 'Moderate' : 'Low'
                        },
                        {
                            label: 'Complexity',
                            value: scores.complexityScore ?? 55,
                            color: (scores.complexityScore ?? 55) > 65 ? '#f43f5e' : (scores.complexityScore ?? 55) > 35 ? '#fbbf24' : '#34d399',
                            levelLabel: (scores.complexityScore ?? 55) > 65 ? 'High' : (scores.complexityScore ?? 55) > 35 ? 'Moderate' : 'Low'
                        },
                        {
                            label: 'Confidence',
                            value: scores.confidenceScore ?? confMap[verdict?.confidence] ?? 50,
                            color: (scores.confidenceScore ?? confMap[verdict?.confidence] ?? 50) > 65 ? '#34d399' : (scores.confidenceScore ?? confMap[verdict?.confidence] ?? 50) > 35 ? '#fbbf24' : '#f43f5e',
                            levelLabel: (scores.confidenceScore ?? confMap[verdict?.confidence] ?? 50) > 65 ? 'High' : (scores.confidenceScore ?? confMap[verdict?.confidence] ?? 50) > 35 ? 'Moderate' : 'Low'
                        },
                        {
                            label: 'Clarity',
                            value: scores.clarityScore ?? 50,
                            color: (scores.clarityScore ?? 50) > 65 ? '#34d399' : (scores.clarityScore ?? 50) > 35 ? '#fbbf24' : '#f43f5e',
                            levelLabel: (scores.clarityScore ?? 50) > 65 ? 'High' : (scores.clarityScore ?? 50) > 35 ? 'Moderate' : 'Low'
                        },
                        {
                            label: 'Urgency',
                            value: scores.urgencyScore ?? 40,
                            color: (scores.urgencyScore ?? 40) > 65 ? '#f43f5e' : (scores.urgencyScore ?? 40) > 35 ? '#fbbf24' : '#34d399',
                            levelLabel: (scores.urgencyScore ?? 40) > 65 ? 'High' : (scores.urgencyScore ?? 40) > 35 ? 'Moderate' : 'Low'
                        }
                    ];

                    return (
                        <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.05s backwards' }}>
                            <div className="score-cards-grid">
                                {scoreCards.map((card, i) => (
                                    <div key={i} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{card.label}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                                            {card.levelLabel} ({card.value}/100)
                                        </div>
                                        <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${card.value}%`,
                                                height: '100%',
                                                borderRadius: '3px',
                                                background: card.color,
                                                transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })()}

                {revealStage < 2 && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.6s var(--ease-out)' }}>
                        <div className="glass-card" style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Synthesizing deeper sections…</strong>
                            <div style={{ marginTop: '0.45rem', fontSize: '0.84rem' }}>
                                Building comparisons, cognitive patterns, and tactical next steps.
                            </div>
                        </div>
                    </section>
                )}

                {revealStage >= 2 && (
                    <>

                {/* ============ CROWD WISDOM ============ */}
                {crowdWisdom && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.07s backwards' }}>
                        <div className="section-label-tag">📊 What the Data Says</div>
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                                    background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0
                                }}>📈</div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.15rem' }}>
                                        Based on {crowdWisdom.sampleSize || 'research data'}
                                    </div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                        {crowdWisdom.mainStat}
                                    </div>
                                </div>
                            </div>
                            {crowdWisdom.secondaryStat && (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem', paddingLeft: '0.75rem', borderLeft: '2px solid rgba(251, 191, 36, 0.3)' }}>
                                    {crowdWisdom.secondaryStat}
                                </p>
                            )}
                            {crowdWisdom.insight && (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>
                                    💡 {crowdWisdom.insight}
                                </p>
                            )}
                            {crowdWisdom.source && (
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                                    Source: {crowdWisdom.source}
                                </p>
                            )}
                        </div>
                    </section>
                )}

                {/* ============ SIDE-BY-SIDE COMPARISON ============ */}
                {optionComparison && optionComparison.dimensions?.length > 0 && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.09s backwards' }}>
                        <div className="section-label-tag">⚖️ Side-by-Side Comparison</div>
                        <div className="comparison-container glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
                            {/* Header with option names */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: '0.75rem',
                                marginBottom: '1.25rem', paddingBottom: '1rem',
                                borderBottom: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', alignSelf: 'end' }}>Dimension</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)',
                                        padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                                        background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)'
                                    }}>
                                        {optionComparison.optionA}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-secondary)',
                                        padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                                        background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.15)'
                                    }}>
                                        {optionComparison.optionB}
                                    </div>
                                </div>
                            </div>

                            {/* Dimension rows */}
                            {optionComparison.dimensions.map((dim, i) => {
                                const scoreA = parseInt(dim.optionA_score) || 3;
                                const scoreB = parseInt(dim.optionB_score) || 3;
                                const aWins = scoreA > scoreB;
                                const bWins = scoreB > scoreA;
                                const tie = scoreA === scoreB;
                                return (
                                    <div key={i} style={{
                                        display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: '0.75rem',
                                        padding: '0.85rem 0',
                                        borderBottom: i < optionComparison.dimensions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                                            {dim.label}
                                        </div>
                                        {/* Option A */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '0.35rem' }}>
                                                {[1,2,3,4,5].map(n => (
                                                    <div key={n} style={{
                                                        width: '22px', height: '6px', borderRadius: '3px',
                                                        background: n <= scoreA
                                                            ? (aWins ? 'var(--accent-primary)' : tie ? 'var(--text-tertiary)' : 'rgba(99, 102, 241, 0.3)')
                                                            : 'rgba(255,255,255,0.06)',
                                                        transition: 'background 0.3s'
                                                    }} />
                                                ))}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: aWins ? 'var(--accent-primary)' : 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                {dim.optionA_detail}
                                            </div>
                                        </div>
                                        {/* Option B */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '0.35rem' }}>
                                                {[1,2,3,4,5].map(n => (
                                                    <div key={n} style={{
                                                        width: '22px', height: '6px', borderRadius: '3px',
                                                        background: n <= scoreB
                                                            ? (bWins ? 'var(--accent-secondary)' : tie ? 'var(--text-tertiary)' : 'rgba(168, 85, 247, 0.3)')
                                                            : 'rgba(255,255,255,0.06)',
                                                        transition: 'background 0.3s'
                                                    }} />
                                                ))}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: bWins ? 'var(--accent-secondary)' : 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                {dim.optionB_detail}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Verdict */}
                            {optionComparison.verdict && (
                                <div style={{
                                    marginTop: '1.25rem', paddingTop: '1rem',
                                    borderTop: '1px solid var(--glass-border)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>Bottom Line</div>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                        {optionComparison.verdict}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ============ EMOTIONAL INSIGHT ============ */}
                {emotionalInsight && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.1s backwards' }}>
                        <div className="section-label-tag">💜 What's Really Going On</div>
                        <div className="glass-card insight-card emotional-card">
                            <blockquote className="insight-quote">"{emotionalInsight.feeling}"</blockquote>
                            <p className="insight-explanation">{emotionalInsight.explanation}</p>
                            {emotionalInsight.hiddenDesire && (
                                <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>What you might actually want</div>
                                    <p style={{ color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.6 }}>{emotionalInsight.hiddenDesire}</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ============ CORE CONFLICT ============ */}
                {coreConflict && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.15s backwards' }}>
                        <div className="section-label-tag">⚡ The Real Tension</div>
                        <div className="conflict-card glass-card">
                            <div className="conflict-sides">
                                <div className="conflict-side side-a"><span className="conflict-label">{coreConflict.sideA}</span></div>
                                <div className="conflict-vs">VS</div>
                                <div className="conflict-side side-b"><span className="conflict-label">{coreConflict.sideB}</span></div>
                            </div>
                            <p className="conflict-explanation">{coreConflict.explanation}</p>
                        </div>
                    </section>
                )}

                {/* ============ COGNITIVE BIAS ALERT ============ */}
                {allBiasCards.length > 0 && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.2s backwards' }}>
                        <div className="section-label-tag">🧠 Cognitive Bias Alert</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            {allBiasCards.length} bias{allBiasCards.length > 1 ? 'es' : ''} detected influencing your thinking. Tap each to learn more.
                        </p>
                        <div className="bias-radar">
                            {allBiasCards.map((bias, i) => {
                                const severity = bias.severity || (i === 0 ? 85 : i === 1 ? 65 : 45);
                                const sevColor = severity > 70 ? '#f43f5e' : severity > 40 ? '#fbbf24' : '#34d399';
                                const sevLabel = severity > 70 ? 'High Impact' : severity > 40 ? 'Moderate' : 'Low Impact';
                                return (
                                    <div key={i}
                                        className={`glass-card bias-alert ${bias.source === 'engine' ? (bias.bias?.toLowerCase().replace(/\s/g, '_').split('_')[0] || '') : ''}`}
                                        style={{ cursor: 'pointer', borderLeft: `3px solid ${sevColor}` }}
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={expandedBias === i}
                                        onClick={() => setExpandedBias(expandedBias === i ? null : i)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedBias(expandedBias === i ? null : i); } }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div className="bias-name">{bias.icon || '🧠'} {bias.bias}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', color: sevColor, fontWeight: 600, background: `${sevColor}15`, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                                                    {sevLabel}
                                                </span>
                                                <span style={{ color: 'var(--text-tertiary)', fontSize: '1.2rem' }}>{expandedBias === i ? '−' : '+'}</span>
                                            </div>
                                        </div>
                                        {bias.evidence && <p className="bias-description" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>Evidence: "{bias.evidence}"</p>}
                                        {expandedBias === i && (
                                            <div style={{ animation: 'fadeInUp 0.3s var(--ease-out)' }}>
                                                {bias.impact && <p className="bias-description">{bias.impact}</p>}
                                                {bias.antidote && <div className="bias-reframe">{bias.antidote}</div>}
                                                {bias.research && <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>📚 {bias.research}</p>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ============ DEVIL'S ADVOCATE (NEW!) ============ */}
                {devilsAdvocate && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.25s backwards' }}>
                        <div className="section-label-tag">😈 Devil's Advocate</div>
                        <div className="glass-card" style={{ padding: 'var(--space-6)', background: 'rgba(244, 63, 94, 0.04)', borderColor: 'rgba(244, 63, 94, 0.15)' }}>
                            <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1.7, fontStyle: 'italic' }}>
                                "{devilsAdvocate}"
                            </p>
                            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                This is the strongest argument against your likely preference. If you can address this, your decision is stronger.
                            </p>
                        </div>
                    </section>
                )}

                {/* ============ PATH FORWARD ============ */}
                {pathForward && pathForward.length > 0 && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.3s backwards' }}>
                        <div className="section-label-tag">🗺️ Your Path Forward</div>
                        <div className="path-timeline">
                            {pathForward.map((step, i) => (
                                <div key={i} className="path-step glass-card">
                                    <div className="step-number">{step.step || i + 1}</div>
                                    <div className="step-content">
                                        <h4 className="step-action">{step.action}</h4>
                                        <p className="step-why">{step.why}</p>
                                        {step.timeframe && <span style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-primary)', background: 'rgba(99,102,241,0.1)', padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)' }}>{step.timeframe}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                    </>
                )}

                {revealStage >= 3 && (
                    <>

                {/* ============ 10-10-10 ANALYSIS ============ */}
                {tenTenTen && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.35s backwards' }}>
                        <div className="section-label-tag">⏰ 10-10-10 Analysis <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— Suzy Welch Framework</span></div>
                        {/* Handle both AI format (single object) and local engine format (array of objects) */}
                        {Array.isArray(tenTenTen) ? tenTenTen.map((item, idx) => (
                            <div key={idx} style={{ marginBottom: '1.5rem' }}>
                                {tenTenTen.length > 1 && <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{item.option}</h4>}
                                <div className="ten-ten-ten">
                                    <div className="ten-card"><div className="time-horizon">10</div><div className="time-unit">Minutes</div><p className="time-perspective">{item.tenMinutes}</p></div>
                                    <div className="ten-card"><div className="time-horizon">10</div><div className="time-unit">Months</div><p className="time-perspective">{item.tenMonths}</p></div>
                                    <div className="ten-card"><div className="time-horizon">10</div><div className="time-unit">Years</div><p className="time-perspective">{item.tenYears}</p></div>
                                </div>
                            </div>
                        )) : (
                            <div className="ten-ten-ten">
                                <div className="ten-card"><div className="time-horizon">10</div><div className="time-unit">Minutes</div><p className="time-perspective">{tenTenTen.tenMinutes}</p></div>
                                <div className="ten-card"><div className="time-horizon">10</div><div className="time-unit">Months</div><p className="time-perspective">{tenTenTen.tenMonths}</p></div>
                                <div className="ten-card"><div className="time-horizon">10</div><div className="time-unit">Years</div><p className="time-perspective">{tenTenTen.tenYears}</p></div>
                            </div>
                        )}
                    </section>
                )}

                {/* ============ PRE-MORTEM ============ */}
                {preMortem && preMortem.length > 0 && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.4s backwards' }}>
                        <div className="section-label-tag">💀 Pre-Mortem Analysis <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— Gary Klein (1998)</span></div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            Imagine it's one year from now and this decision has failed. What went wrong?
                        </p>
                        <div className="premortem-grid">
                            {preMortem.map((item, idx) => {
                                // Handle AI format: {failure, probability, earlyWarning, prevention}
                                if (item.failure) {
                                    const probPct = item.probability === 'high' ? 75 : item.probability === 'medium' ? 45 : 20;
                                    const probColor = item.probability === 'high' ? '#f43f5e' : item.probability === 'medium' ? '#fbbf24' : '#34d399';
                                    return (
                                        <div key={idx} className="premortem-item">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <h4 style={{ margin: 0 }}>{item.probability === 'high' ? '🔴' : item.probability === 'medium' ? '🟡' : '🟢'} {item.failure}</h4>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: probColor, background: `${probColor}18`, padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>
                                                    ~{probPct}%
                                                </span>
                                            </div>
                                            <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.6rem' }}>
                                                <div style={{ width: `${probPct}%`, height: '100%', borderRadius: '2px', background: probColor }} />
                                            </div>
                                            {item.earlyWarning && <p style={{ fontSize: '0.85rem', color: 'var(--accent-warning)', marginBottom: '0.5rem' }}>⚡ Early warning: {item.earlyWarning}</p>}
                                            {item.prevention && <p>{item.prevention}</p>}
                                        </div>
                                    );
                                }
                                // Handle local engine format: {option, failures: [{scenario, mitigation}]}
                                return (
                                    <React.Fragment key={idx}>
                                        {item.option && <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-danger)', marginBottom: '0.75rem', gridColumn: '1 / -1' }}>If "{truncateLabel(item.option, 40)}" fails:</h4>}
                                        {item.failures?.map((f, fi) => (
                                            <div key={fi} className="premortem-item">
                                                <h4>⚠️ {f.scenario}</h4>
                                                <p>{f.mitigation}</p>
                                            </div>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ============ SCENARIO PLANNING ============ */}
                {scenarios && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.45s backwards' }}>
                        <div className="section-label-tag">🎭 Scenario Planning</div>
                        {/* Handle AI format (object: {best, likely, worst} strings) */}
                        {!Array.isArray(scenarios) ? (
                            <div className="scenario-grid">
                                <div className="scenario-card best">
                                    <div className="scenario-label">🌟 Best Case</div>
                                    <p className="scenario-text">{scenarios.best}</p>
                                </div>
                                <div className="scenario-card likely">
                                    <div className="scenario-label">📊 Most Likely</div>
                                    <p className="scenario-text">{scenarios.likely}</p>
                                </div>
                                <div className="scenario-card worst">
                                    <div className="scenario-label">⚠️ Worst Case</div>
                                    <p className="scenario-text">{scenarios.worst}</p>
                                </div>
                            </div>
                        ) : (
                            /* Handle local engine format (array of objects with nested best/likely/worst) */
                            scenarios.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: '1.5rem' }}>
                                    {scenarios.length > 1 && <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{item.option}</h4>}
                                    <div className="scenario-grid">
                                        <div className="scenario-card best">
                                            <div className="scenario-label">Best Case ({item.best?.probability}%)</div>
                                            <p className="scenario-text">{item.best?.scenario}</p>
                                        </div>
                                        <div className="scenario-card likely">
                                            <div className="scenario-label">Most Likely ({item.likely?.probability}%)</div>
                                            <p className="scenario-text">{item.likely?.scenario}</p>
                                        </div>
                                        <div className="scenario-card worst">
                                            <div className="scenario-label">Worst Case ({item.worst?.probability}%)</div>
                                            <p className="scenario-text">{item.worst?.scenario}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </section>
                )}

                {/* ============ BLIND SPOTS ============ */}
                {blindSpots && blindSpots.length > 0 && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.5s backwards' }}>
                        <div className="section-label-tag">👁️ Blind Spots</div>
                        <div className="blindspots-grid">
                            {blindSpots.map((spot, i) => (
                                <div key={i} className="glass-card blindspot-card">
                                    <h4 className="blindspot-title"><span className="blindspot-icon">⚠️</span>{spot.title}</h4>
                                    <p className="blindspot-insight">{spot.insight}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}


                {/* ============ IMPACT RADAR + DATA ============ */}
                {impactScores.length > 0 && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.6s backwards' }}>
                        <div className="section-label-tag">📊 Decision Science Data</div>
                        <ChartErrorBoundary>
                            {radarData && (
                                <div className="glass-card science-chart-card" style={{ marginBottom: '1rem' }} ref={chartRef}>
                                    <h4>Impact Profile Radar</h4>
                                    <div className="science-chart-wrap"><Radar data={radarData} options={radarOptions} /></div>
                                </div>
                            )}
                        </ChartErrorBoundary>
                        <div className="glass-card science-table-card">
                            <h4>Multi-Dimensional Scoring</h4>
                            <div className="science-table-wrap">
                                <table className="science-table">
                                    <thead><tr><th>Option</th>{IMPACT_DIMS.map(d => <th key={d.key}>{d.icon} {d.label}</th>)}<th>Total</th></tr></thead>
                                    <tbody>
                                        {impactScores.map((row, i) => (
                                            <tr key={i}><td>{row.option}</td>{IMPACT_DIMS.map(d => <td key={d.key}>{row.scores?.[d.key] ?? '-'}</td>)}<td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{row.totalScore}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ============ RISK RADAR ============ */}
                {risks.length > 0 && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.65s backwards' }}>
                        <div className="section-label-tag">🛡️ Risk Radar</div>
                        <div className="risks-list">
                            {risks.map((risk, i) => {
                                const prob = risk.probability || (risk.likelihood === 'high' ? 75 : risk.likelihood === 'medium' ? 45 : 20);
                                const probColor = prob > 60 ? '#f43f5e' : prob > 35 ? '#fbbf24' : '#34d399';
                                return (
                                    <div key={i} className={`glass-card risk-card ${expandedRisk === i ? 'expanded' : ''}`} role="button" tabIndex={0} aria-expanded={expandedRisk === i} onClick={() => setExpandedRisk(expandedRisk === i ? null : i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedRisk(expandedRisk === i ? null : i); } }}>
                                        <div className="risk-header">
                                            <span className="risk-likelihood">{likelihoodEmoji[risk.likelihood] || '🟡'} {prob}%</span>
                                            <span className="risk-title">{risk.risk}</span>
                                            <span className="risk-expand">{expandedRisk === i ? '−' : '+'}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', marginTop: '0.5rem' }}>
                                            <div style={{ width: `${prob}%`, height: '100%', borderRadius: '2px', background: probColor, transition: 'width 0.8s ease' }} />
                                        </div>
                                        {expandedRisk === i && (
                                            <div className="risk-mitigation" style={{ animation: 'fadeInUp 0.3s var(--ease-out)' }}>
                                                <strong>How to handle it:</strong> {risk.mitigation}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ============ ASSUMPTIONS AUDIT (INTERACTIVE!) ============ */}
                {assumptions.length > 0 && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.7s backwards' }}>
                        <div className="section-label-tag">🔍 Assumptions Audit</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            Check off each assumption you've verified. Unchecked items are blind spots in your reasoning.
                        </p>
                        <div className="assumption-list">
                            {assumptions.map((a, i) => {
                                const text = typeof a === 'string' ? a : a.text;
                                const category = typeof a === 'string' ? null : a.category;
                                return (
                                    <div key={i} className="assumption-item" role="checkbox" aria-checked={!!checkedAssumptions[i]} tabIndex={0} onClick={() => toggleAssumption(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAssumption(i); } }} style={{ cursor: 'pointer' }}>
                                        <div className={`assumption-check ${checkedAssumptions[i] ? 'verified' : ''}`}>
                                            {checkedAssumptions[i] ? '✓' : ''}
                                        </div>
                                        <div>
                                            <span className="assumption-text" style={{ textDecoration: checkedAssumptions[i] ? 'line-through' : 'none', opacity: checkedAssumptions[i] ? 0.6 : 1 }}>
                                                {text}
                                            </span>
                                            {category && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>{category}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                            {Object.values(checkedAssumptions).filter(Boolean).length} of {assumptions.length} verified
                        </div>
                    </section>
                )}

                {/* ============ WHAT PEOPLE SAY ============ */}
                {(hadCommunityInput || safeCommunityInsights.length > 0) && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.72s backwards' }}>
                        <div className="section-label-tag">💬 What People Say</div>
                        {safeCommunityInsights.length > 0 ? (
                            <>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                                    Real perspectives from people who've faced similar decisions — sourced from online communities.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {safeCommunityInsights.map((item, i) => {
                                const sentimentColors = {
                                    supportive: { bg: 'rgba(52, 211, 153, 0.06)', border: 'rgba(52, 211, 153, 0.2)', icon: '👍', label: 'Supportive' },
                                    cautionary: { bg: 'rgba(251, 191, 36, 0.06)', border: 'rgba(251, 191, 36, 0.2)', icon: '⚠️', label: 'Cautionary' },
                                    mixed: { bg: 'rgba(139, 92, 246, 0.06)', border: 'rgba(139, 92, 246, 0.2)', icon: '🤔', label: 'Mixed' }
                                };
                                const s = sentimentColors[item.sentiment] || sentimentColors.mixed;
                                const subreddit = item.source?.startsWith('r/') ? item.source : `r/${item.source || 'advice'}`;
                                const searchQuery = encodeURIComponent(description?.slice(0, 80) || title || '');
                                const redditLink = `https://www.reddit.com/${subreddit}/search?q=${searchQuery}&restrict_sr=1&sort=relevance`;

                                return (
                                    <div key={i} className="glass-card" style={{
                                        padding: '1rem 1.25rem',
                                        background: s.bg,
                                        borderColor: s.border
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', background: 'rgba(255, 69, 0, 0.1)', color: '#ff4500', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                                                    {subreddit}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                    {s.icon} {s.label}
                                                </span>
                                            </div>
                                            {item.upvotes && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    ⬆ {item.upvotes}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.65, fontStyle: 'italic' }}>
                                            "{item.insight}"
                                        </p>
                                        <a
                                            href={redditLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-block', marginTop: '0.6rem', fontSize: '0.75rem',
                                                color: 'var(--accent-primary)', textDecoration: 'none',
                                                opacity: 0.8
                                            }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            Search {subreddit} for more →
                                        </a>
                                    </div>
                                );
                                    })}
                                </div>
                                <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', fontStyle: 'italic' }}>
                                    Insights are AI-generated based on common community discussions about similar decisions. Links lead to relevant Reddit searches.
                                </p>
                            </>
                        ) : (
                            <div className="glass-card" style={{ padding: '1rem 1.25rem', background: 'rgba(45, 212, 191, 0.05)', borderColor: 'rgba(45, 212, 191, 0.18)' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    Community examples were withheld for safety. For practical next steps, try support-oriented communities like r/Advice, r/personalfinance, or r/legaladvice.
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* ============ EMOTIONAL TEMPERATURE ============ */}
                {emotionalAnalysis && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.75s backwards' }}>
                        <div className="section-label-tag">🌡️ Emotional Temperature</div>
                        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{emotionalAnalysis.label?.split(' ')[0]}</div>
                                <div style={{ fontWeight: 600, color: emotionalAnalysis.color || 'var(--text-primary)' }}>{emotionalAnalysis.label?.replace(/^[^\s]+\s/, '')}</div>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, textAlign: 'center' }}>{emotionalAnalysis.advice}</p>
                            {emotionalAnalysis.shouldDelay && (
                                <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                    <strong style={{ color: '#f43f5e' }}>⏸️ Consider a 24-72 hour cooling period</strong>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Revisit this analysis when emotions have settled.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ============ WHAT-IF SLIDERS ============ */}
                {Object.keys(scores).length > 0 && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.78s backwards' }}>
                        <div className="section-label-tag">🎛️ What-If Simulator</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            Adjust variables to see how they'd change your decision scores in real-time.
                        </p>
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            {[
                                { key: 'emotion', label: 'Emotional Intensity', icon: '💓', left: 'Calmer', right: 'More stressed' },
                                { key: 'time', label: 'Time Available', icon: '⏰', left: 'Less time', right: 'More time' },
                                { key: 'financial', label: 'Financial Impact', icon: '💰', left: 'Lower stakes', right: 'Higher stakes' },
                                { key: 'relationships', label: 'Relationship Impact', icon: '👥', left: 'Less affected', right: 'More affected' }
                            ].map(slider => (
                                <div key={slider.key} style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{slider.icon} {slider.label}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {whatIfAdjustments[slider.key] > 0 ? '+' : ''}{whatIfAdjustments[slider.key]}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', minWidth: '60px', textAlign: 'right' }}>{slider.left}</span>
                                        <input
                                            type="range" min="-5" max="5" step="1"
                                            value={whatIfAdjustments[slider.key]}
                                            onChange={e => setWhatIfAdjustments(prev => ({ ...prev, [slider.key]: Number(e.target.value) }))}
                                            style={{ flex: 1, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', minWidth: '60px' }}>{slider.right}</span>
                                    </div>
                                </div>
                            ))}
                            {(whatIfAdjustments.emotion !== 0 || whatIfAdjustments.time !== 0 || whatIfAdjustments.financial !== 0 || whatIfAdjustments.relationships !== 0) && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Adjusted Scores</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                        {[
                                            { label: 'Emotion Risk', key: 'emotionRisk', orig: scores.emotionRisk ?? 50 },
                                            { label: 'Bias Risk', key: 'biasRisk', orig: scores.biasRisk ?? 40 },
                                            { label: 'Complexity', key: 'complexityScore', orig: scores.complexityScore ?? 50 },
                                            { label: 'Confidence', key: 'confidenceScore', orig: scores.confidenceScore ?? 60 },
                                            { label: 'Clarity', key: 'clarityScore', orig: scores.clarityScore ?? 50 },
                                            { label: 'Urgency', key: 'urgencyScore', orig: scores.urgencyScore ?? 40 }
                                        ].map(item => {
                                            const adj = adjustedScores[item.key];
                                            const diff = adj - item.orig;
                                            const diffColor = diff > 0
                                                ? (item.key === 'confidenceScore' || item.key === 'clarityScore' ? '#34d399' : '#f43f5e')
                                                : (item.key === 'confidenceScore' || item.key === 'clarityScore' ? '#f43f5e' : '#34d399');
                                            return (
                                                <div key={item.key} style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>{item.label}</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(adj)}</div>
                                                    {diff !== 0 && (
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: diffColor }}>
                                                            {diff > 0 ? '▲' : '▼'} {Math.abs(Math.round(diff))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem' }}
                                        onClick={() => setWhatIfAdjustments({ emotion: 0, time: 0, financial: 0, relationships: 0 })}
                                    >
                                        Reset Sliders
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                    </>
                )}

                {/* ============ THE MIRROR ============ */}
                {reflectionQuestion && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.8s backwards' }}>
                        <div className="mirror-card glass-card">
                            <div className="mirror-icon">🪞</div>
                            <h3 className="mirror-label">The Mirror</h3>
                            <p className="mirror-question">"{reflectionQuestion}"</p>
                            <p className="mirror-hint">Sit with this one. The best decisions come from clarity, not urgency.</p>
                        </div>
                    </section>
                )}

                {/* ============ FOLLOW-UP Q&A ============ */}
                {!analysis?.isShared && isAIAvailable() && (
                    <section className="report-section" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.82s backwards' }}>
                        {!followUpOpen ? (
                            <button
                                className="followup-trigger glass-card"
                                onClick={() => setFollowUpOpen(true)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 'var(--space-3)', padding: 'var(--space-5)', cursor: 'pointer',
                                    border: '1px dashed rgba(99, 102, 241, 0.3)', background: 'rgba(99, 102, 241, 0.04)',
                                    transition: 'all var(--duration-normal) var(--ease-out)'
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>💬</span>
                                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Have a question about this analysis?
                                </span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ask AI →</span>
                            </button>
                        ) : (
                            <div className="followup-section glass-card" style={{ padding: 'var(--space-6)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <span style={{ fontSize: '1.25rem' }}>💬</span>
                                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                                            Ask About Your Analysis
                                        </h3>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setFollowUpOpen(false)}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        Minimize
                                    </button>
                                </div>

                                {/* Topic selector */}
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
                                        What's this about?
                                    </div>
                                    <div className="followup-topics" style={{
                                        display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)'
                                    }}>
                                        {FOLLOW_UP_TOPICS.map(t => (
                                            <button
                                                key={t.key}
                                                className={`followup-topic-chip ${followUpTopic === t.key ? 'active' : ''}`}
                                                onClick={() => setFollowUpTopic(t.key)}
                                            >
                                                <span>{t.icon}</span> {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Conversation history */}
                                {followUpHistory.length > 0 && (
                                    <div className="followup-history" style={{ marginBottom: 'var(--space-4)' }}>
                                        {followUpHistory.map((item, i) => (
                                            <div key={i} className="followup-exchange" style={{ marginBottom: 'var(--space-4)' }}>
                                                <div className="followup-user-msg" style={{
                                                    display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)'
                                                }}>
                                                    <div style={{
                                                        maxWidth: '85%', padding: 'var(--space-3) var(--space-4)',
                                                        borderRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-sm)',
                                                        background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)',
                                                        fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)'
                                                    }}>
                                                        {item.topic !== 'general' && (
                                                            <span style={{
                                                                display: 'inline-block', fontSize: '0.65rem', fontWeight: 700,
                                                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                                                color: 'var(--accent-primary)', marginBottom: '0.25rem',
                                                                background: 'rgba(99, 102, 241, 0.1)', padding: '0.15rem 0.5rem',
                                                                borderRadius: 'var(--radius-full)'
                                                            }}>
                                                                Re: {FOLLOW_UP_TOPICS.find(t => t.key === item.topic)?.label || item.topic}
                                                            </span>
                                                        )}
                                                        <div>{item.question}</div>
                                                    </div>
                                                </div>
                                                <div className="followup-ai-msg" style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        background: 'var(--gradient-primary)', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.9rem', flexShrink: 0
                                                    }}>🪞</div>
                                                    <div style={{
                                                        flex: 1, padding: 'var(--space-3) var(--space-4)',
                                                        borderRadius: 'var(--radius-lg)', borderBottomLeftRadius: 'var(--radius-sm)',
                                                        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                                                        fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-primary)',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {item.answer}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={followUpEndRef} />
                                    </div>
                                )}

                                {/* Input area */}
                                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
                                    <textarea
                                        className="text-area"
                                        placeholder={followUpTopic === 'general'
                                            ? "Ask anything about your analysis..."
                                            : `Ask about the ${FOLLOW_UP_TOPICS.find(t => t.key === followUpTopic)?.label.toLowerCase() || 'analysis'}...`
                                        }
                                        value={followUpQuestion}
                                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleFollowUpSubmit();
                                            }
                                        }}
                                        style={{ minHeight: '60px', flex: 1, resize: 'none' }}
                                        disabled={followUpLoading}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleFollowUpSubmit}
                                        disabled={!followUpQuestion.trim() || followUpLoading}
                                        style={{ flexShrink: 0, height: '60px', paddingLeft: 'var(--space-5)', paddingRight: 'var(--space-5)' }}
                                    >
                                        {followUpLoading ? (
                                            <span className="btn-loading"><span className="spinner" /> Thinking...</span>
                                        ) : 'Ask'}
                                    </button>
                                </div>

                                {followUpError && (
                                    <div style={{
                                        marginTop: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
                                        borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.08)',
                                        border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e',
                                        fontSize: '0.85rem'
                                    }}>
                                        <strong>{followUpError.icon} {followUpError.title}:</strong> {followUpError.detail}
                                        {followUpError.action === 'settings' && (
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                style={{ marginLeft: '0.5rem' }}
                                                onClick={openSettings}
                                            >
                                                Open Settings
                                            </button>
                                        )}
                                        {followUpError.action === 'wait' && cooldownSeconds > 0 && (
                                            <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                                                Retry in {cooldownSeconds}s.
                                            </span>
                                        )}
                                    </div>
                                )}

                                <p style={{
                                    marginTop: 'var(--space-3)', fontSize: '0.75rem',
                                    color: 'var(--text-tertiary)', textAlign: 'center'
                                }}>
                                    Press Enter to send · Shift+Enter for new line
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* ============ ACTIONS ============ */}
                <section className="report-section report-actions" style={{ animation: 'fadeInUp 0.8s var(--ease-out) 0.85s backwards' }}>
                    <button className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: '480px' }} onClick={() => onNavigate('new-decision')}>
                        Analyze Another Decision
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', width: '100%', maxWidth: '480px' }}>
                        <button className="btn btn-ghost" onClick={handleDownload}>
                            📥 PDF
                        </button>
                        <button className="btn btn-ghost" onClick={handleMarkdownExport}>
                            📝 Markdown
                        </button>
                        <button className="btn btn-ghost" onClick={handleShare}>
                            🔗 Share Link
                        </button>
                        <button className="btn btn-ghost" onClick={() => onNavigate('dashboard')}>
                            📚 History
                        </button>
                    </div>
                    {shareToast && (
                        <div style={{
                            position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                            background: 'var(--accent-primary)', color: '#fff', padding: '0.6rem 1.5rem',
                            borderRadius: 'var(--radius-full)', fontSize: '0.9rem', fontWeight: 600,
                            boxShadow: 'var(--shadow-lg)', zIndex: 1000,
                            animation: 'fadeInUp 0.3s var(--ease-out)'
                        }}>
                            {shareToast}
                        </div>
                    )}
                </section>

            </div>
        </>
    );
}
