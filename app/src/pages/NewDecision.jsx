
import { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import {
    isAIAvailable,
    generateNextQuestion,
    generateAnalysis,
    generateAnalysisStream,
    getAIAccessMode,
    getRateLimitCooldownRemainingMs
} from '../engine/aiService';
import { saveDecision, getUserValues, getRelevantHistory } from '../engine/storage';
import { runFullAnalysis } from '../engine/decisionEngine';
import LoadingState from '../components/LoadingState';
import TemplateSelector from '../components/TemplateSelector';
import { getTemplateContextPrompt } from '../engine/templates';

const MAX_QUESTIONS = 5;

const EMOTION_LABELS = [
    { min: 0, max: 15, label: 'Detached', desc: 'Very analytical, almost disconnected' },
    { min: 16, max: 35, label: 'Calm', desc: 'Clear-headed, good headspace for decisions' },
    { min: 36, max: 55, label: 'Engaged', desc: 'Balanced — emotions informing, not controlling' },
    { min: 56, max: 75, label: 'Stirred', desc: 'Emotions are active — proceed thoughtfully' },
    { min: 76, max: 100, label: 'Heated', desc: 'Strong emotions in play — consider waiting' },
];

function getEmotionLabel(score) {
    return EMOTION_LABELS.find(l => score >= l.min && score <= l.max) || EMOTION_LABELS[2];
}

function isRateLimitError(message = '') {
    return /(rate limit|cooldown|429)/i.test(String(message));
}

function mapConfidence(confidence = 'moderate') {
    if (confidence === 'strong') return 'high';
    if (confidence === 'weak') return 'low';
    return 'medium';
}

function buildLocalFallbackAIAnalysis({ description, options, localEngine, emotionalScore }) {
    const topCondition = localEngine?.recommendation?.conditions?.[0] || null;
    const topScenario = localEngine?.scenarios?.[0] || null;
    const topTen = localEngine?.tenTenTen?.[0] || null;
    const topTradeOff = localEngine?.recommendation?.tradeOffs?.[0] || 'Both paths have trade-offs — use your priorities to decide.';

    return {
        verdict: {
            title: topCondition?.recommendation || 'Use a deliberate pause before deciding',
            recommendation: `AI is temporarily rate-limited, so this report uses Decision Mirror's local decision engine. Current best-fit direction: ${topCondition?.recommendation || options[0]}.`,
            confidence: mapConfidence(topCondition?.confidence),
            reversibility: 'Revisit after a short pause when new information arrives'
        },
        emotionalInsight: {
            feeling: localEngine?.emotionalAnalysis?.label || 'Emotionally engaged',
            explanation: localEngine?.emotionalAnalysis?.advice || 'Your emotional state meaningfully affects this decision.',
            hiddenDesire: 'You likely want both safety now and a path that still preserves long-term growth.'
        },
        coreConflict: {
            sideA: options[0] || 'Act now',
            sideB: options[1] || 'Wait and gather data',
            explanation: `Your dilemma balances immediate pressure against longer-term stability in: "${description.slice(0, 140)}${description.length > 140 ? '...' : ''}"`
        },
        cognitiveDistortions: (localEngine?.biases || []).slice(0, 4).map((bias) => ({
            bias: bias.name || 'Cognitive bias',
            evidence: bias.description || 'Detected from decision language patterns.',
            impact: 'This can skew your weighting of risk and reward.',
            antidote: bias.reframe || 'List evidence for and against your current assumption.',
            research: bias.research || 'Behavioral decision science'
        })),
        tenTenTen: topTen
            ? {
                tenMinutes: topTen.tenMinutes,
                tenMonths: topTen.tenMonths,
                tenYears: topTen.tenYears
            }
            : null,
        preMortem: (localEngine?.preMortem || []).slice(0, 3).map((item) => ({
            failure: item.failure,
            probability: 'medium',
            earlyWarning: item.redFlag,
            prevention: item.prevention
        })),
        scenarios: topScenario
            ? {
                best: topScenario.best?.scenario,
                likely: topScenario.mostLikely?.scenario,
                worst: topScenario.worst?.scenario
            }
            : null,
        assumptions: (localEngine?.assumptions || []).slice(0, 5).map(a => a.text),
        pathForward: [
            {
                step: 1,
                action: `Prioritize this path unless new evidence appears: ${topCondition?.recommendation || options[0]}`,
                why: 'It aligns best with your current impact and values pattern.',
                timeframe: 'Today'
            },
            {
                step: 2,
                action: 'Test your top assumptions with one concrete verification step.',
                why: 'Assumption checks reduce avoidable regret.',
                timeframe: 'Next 24-48 hours'
            }
        ],
        blindSpots: [
            {
                title: 'Trade-off visibility',
                insight: topTradeOff
            }
        ],
        scores: {
            emotionRisk: emotionalScore,
            biasRisk: Math.min(95, (localEngine?.biases?.length || 0) * 18 + 18),
            complexityScore: localEngine?.stakes?.level === 'high' ? 75 : localEngine?.stakes?.level === 'medium' ? 55 : 35,
            confidenceScore: topCondition?.confidence === 'strong' ? 80 : topCondition?.confidence === 'weak' ? 40 : 60,
            clarityScore: 58,
            urgencyScore: localEngine?.stakes?.level === 'high' ? 72 : 50
        },
        risks: (localEngine?.preMortem || []).slice(0, 3).map((item) => ({
            risk: item.failure,
            likelihood: 'medium',
            probability: 55,
            mitigation: item.prevention
        })),
        communityInsights: [],
        reflectionQuestion: 'Which option would still feel correct in 6 months if nobody else approved of it?',
        devilsAdvocate: topTradeOff,
        localOnlyReason: 'AI temporarily rate-limited — generated using local decision engine.'
    };
}

function normalizeOption(option) {
    return String(option || '')
        .replace(/^[\s\-:•*]+/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function inferDecisionOptions(description, aiAnalysis) {
    const candidateOptions = [
        ...(Array.isArray(aiAnalysis?.options) ? aiAnalysis.options : []),
        aiAnalysis?.coreConflict?.sideA,
        aiAnalysis?.coreConflict?.sideB,
    ]
        .map(normalizeOption)
        .filter(Boolean);

    const uniqueOptions = [];
    const seen = new Set();

    candidateOptions.forEach(option => {
        const key = option.toLowerCase();
        if (option.length >= 4 && !seen.has(key)) {
            seen.add(key);
            uniqueOptions.push(option);
        }
    });

    if (uniqueOptions.length >= 2) {
        return uniqueOptions.slice(0, 4);
    }

    return [
        `Move forward with: ${aiAnalysis?.verdict?.title || 'the recommended direction'}`,
        'Pause and collect more evidence before committing'
    ];
}

export default function NewDecision({ onNavigate, onOpenSettings }) {
    // describe → checkin → discuss → analyzing
    const [phase, setPhase] = useState('describe');
    const [description, setDescription] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showTemplates, setShowTemplates] = useState(true);
    const [relevantHistory, setRelevantHistory] = useState([]);

    // Emotional Check-In
    const [emotionalScore, setEmotionalScore] = useState(50);

    // Conversation
    const [chatHistory, setChatHistory] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // Analysis progress
    // eslint-disable-next-line no-unused-vars
    const [analyzeProgress, setAnalyzeProgress] = useState(0);
    const [analyzeStage, setAnalyzeStage] = useState('');
    const [streamingText, setStreamingText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);

    // Reactive API key check — polls so it updates when user saves key in Settings
    const [apiReady, setApiReady] = useState(() => isAIAvailable());
    const aiMode = getAIAccessMode();

    const textareaRef = useRef(null);
    const answerRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const check = () => setApiReady(isAIAvailable());
        const interval = setInterval(check, 1000);
        window.addEventListener('focus', check);
        return () => { clearInterval(interval); window.removeEventListener('focus', check); };
    }, []);

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
        if (phase === 'describe' && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [phase]);

    useEffect(() => {
        if (description.trim().length > 20) {
            setRelevantHistory(getRelevantHistory(description, 2));
            return;
        }
        setRelevantHistory([]);
    }, [description]);

    useEffect(() => {
        if (answerRef.current) answerRef.current.focus();
    }, [currentQuestion]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, currentQuestion]);

    // ============================================
    // PHASE 1: Describe → go to Emotional Check-In
    // ============================================
    const handleDescribeNext = () => {
        if (!description.trim()) return;
        setPhase('checkin');
    };

    // ============================================
    // PHASE 2: Emotional Check-In → start AI conversation
    // ============================================
    const handleCheckinComplete = async () => {
        if (!isAIAvailable()) return;

        setIsThinking(true);
        setError(null);

        try {
            const templateContext = selectedTemplate ? getTemplateContextPrompt(selectedTemplate.id) : '';
            const firstQuestion = await generateNextQuestion(description, [], emotionalScore, templateContext);
            if (firstQuestion) {
                setCurrentQuestion(firstQuestion);
                setPhase('discuss');
            } else {
                // AI didn't ask a question — use a smart fallback
                const fallback = emotionalScore > 60
                    ? "What's the worst-case scenario you're imagining — and how likely is it really?"
                    : "If you had to decide right now with no more information, which way would you lean — and what does that gut reaction tell you?";
                setCurrentQuestion(fallback);
                setPhase('discuss');
            }
        } catch (e) {
            setError(e.message);
            // Still move to discuss with a fallback question
            setCurrentQuestion("What matters most to you about this decision — and what are you most afraid of losing?");
            setPhase('discuss');
        }
        setIsThinking(false);
    };

    // ============================================
    // PHASE 3: Submit answer and get next question
    // ============================================
    const handleSubmitAnswer = async () => {
        if (!currentAnswer.trim() || isThinking) return;

        const newHistory = [...chatHistory, { question: currentQuestion, answer: currentAnswer }];
        setChatHistory(newHistory);
        setCurrentAnswer('');
        setIsThinking(true);
        setError(null);

        try {
            const templateContext = selectedTemplate ? getTemplateContextPrompt(selectedTemplate.id) : '';
            const nextQuestion = await generateNextQuestion(description, newHistory, emotionalScore, templateContext);

            if (nextQuestion) {
                setCurrentQuestion(nextQuestion);
                setIsThinking(false);
            } else {
                setIsThinking(false);
                await performAnalysis(newHistory);
            }
        } catch (e) {
            setError(e.message);
            setIsThinking(false);
        }
    };

    // ============================================
    // PHASE 4: Generate full analysis
    // ============================================
    const performAnalysis = async (history) => {
        setPhase('analyzing');
        setAnalyzeProgress(0);
        setStreamingText('');
        setIsStreaming(true);
        setError(null);

        const stages = [
            { text: 'Reading your emotional landscape...', progress: 8 },
            { text: 'Scanning for cognitive biases...', progress: 18 },
            { text: 'Running decision science frameworks...', progress: 28 },
            { text: 'Building future scenarios...', progress: 38 },
            { text: 'Comparing your options side-by-side...', progress: 48 },
            { text: 'Stress-testing assumptions...', progress: 55 },
            { text: 'Generating your personal analysis...', progress: 62 },
            { text: 'Cross-referencing research data...', progress: 68 },
            { text: 'Polishing insights...', progress: 74 },
            { text: 'Almost there — finalizing report...', progress: 80 },
            { text: 'Still working — complex analysis takes a moment...', progress: 84 },
            { text: 'Wrapping up the last details...', progress: 88 },
        ];

        let stageIndex = 0;
        const stageInterval = setInterval(() => {
            if (stageIndex < stages.length) {
                setAnalyzeStage(stages[stageIndex].text);
                setAnalyzeProgress(stages[stageIndex].progress);
                stageIndex++;
            }
        }, 1500);

        try {
            const userValues = getUserValues();
            const templateContext = selectedTemplate ? getTemplateContextPrompt(selectedTemplate.id) : '';
            let aiAnalysis;

            try {
                aiAnalysis = await generateAnalysisStream(
                    description,
                    history,
                    emotionalScore,
                    userValues,
                    templateContext,
                    (_chunk, fullText) => setStreamingText(fullText)
                );
            } catch (streamError) {
                console.warn('Streaming failed, falling back:', streamError);
                setIsStreaming(false);
                aiAnalysis = await generateAnalysis(description, history, emotionalScore, userValues, templateContext);
            }

            const answers = history.map(item => item.answer);
            const options = inferDecisionOptions(description, aiAnalysis);

            const localEngine = runFullAnalysis(
                description,
                options,
                answers,
                userValues,
                emotionalScore
            );

            // Merge: AI-generated content takes priority, local engine is fallback
            const analysis = {
                ...aiAnalysis,
                options,
                emotionalScore,
                conversationHistory: history,
                localEngine,
                // Local engine provides structure/classification
                category: localEngine.category,
                stakes: localEngine.stakes,
                impactScores: localEngine.impactScores,
                opportunityCosts: localEngine.opportunityCosts,
                valuesAlignment: localEngine.valuesAlignment,
                emotionalAnalysis: localEngine.emotionalAnalysis,
                // AI-generated content preferred, local engine as fallback
                tenTenTen: aiAnalysis.tenTenTen || localEngine.tenTenTen,
                preMortem: aiAnalysis.preMortem || localEngine.preMortem,
                scenarios: aiAnalysis.scenarios || localEngine.scenarios,
                assumptions: aiAnalysis.assumptions || localEngine.assumptions,
                biases: aiAnalysis.cognitiveDistortions?.length > 0
                    ? localEngine.biases  // keep both — AnalysisView merges them
                    : localEngine.biases,
                recommendation: localEngine.recommendation,
                generatedAt: Date.now(),
                mode: 'hybrid-analysis'
            };
            setIsStreaming(false);

            clearInterval(stageInterval);
            setAnalyzeProgress(100);
            setAnalyzeStage('Your analysis is ready.');

            const verdictTitle = analysis?.verdict?.title || 'Decision Analysis';
            saveDecision({
                title: verdictTitle,
                description: description,
                options,
                answers: history,
                emotionalScore,
                analysis: analysis,
                templateId: selectedTemplate?.id || null,
            });

            setTimeout(() => {
                onNavigate('analysis', {
                    analysis: analysis,
                    title: verdictTitle,
                    description: description
                });
            }, 800);

        } catch (err) {
            if (isRateLimitError(err?.message)) {
                const answers = history.map(item => item.answer);
                const options = inferDecisionOptions(description, null);
                const localEngine = runFullAnalysis(
                    description,
                    options,
                    answers,
                    getUserValues(),
                    emotionalScore
                );
                setIsStreaming(false);

                const aiFallback = buildLocalFallbackAIAnalysis({
                    description,
                    options,
                    localEngine,
                    emotionalScore
                });

                const analysis = {
                    ...aiFallback,
                    options,
                    emotionalScore,
                    conversationHistory: history,
                    localEngine,
                    category: localEngine.category,
                    stakes: localEngine.stakes,
                    impactScores: localEngine.impactScores,
                    opportunityCosts: localEngine.opportunityCosts,
                    valuesAlignment: localEngine.valuesAlignment,
                    emotionalAnalysis: localEngine.emotionalAnalysis,
                    tenTenTen: aiFallback.tenTenTen || localEngine.tenTenTen,
                    preMortem: aiFallback.preMortem || localEngine.preMortem,
                    scenarios: aiFallback.scenarios || localEngine.scenarios,
                    assumptions: aiFallback.assumptions || localEngine.assumptions,
                    biases: localEngine.biases,
                    recommendation: localEngine.recommendation,
                    generatedAt: Date.now(),
                    mode: 'local-fallback'
                };

                clearInterval(stageInterval);
                setAnalyzeProgress(100);
                setAnalyzeStage('AI is busy right now — your local analysis is ready.');

                const verdictTitle = analysis?.verdict?.title || 'Decision Analysis';
                saveDecision({
                    title: verdictTitle,
                    description: description,
                    options,
                    answers: history,
                    emotionalScore,
                    analysis: analysis,
                    templateId: selectedTemplate?.id || null,
                });

                setTimeout(() => {
                    onNavigate('analysis', {
                        analysis: analysis,
                        title: verdictTitle,
                        description: description
                    });
                }, 500);
                return;
            }

            clearInterval(stageInterval);
            console.error('Analysis failed:', err);
            setIsStreaming(false);
            setError(err.message || 'Analysis failed. Please try again.');
            setAnalyzeProgress(0);
            setAnalyzeStage('');
        }
    };

    const handleSkipToAnalysis = () => {
        performAnalysis(chatHistory);
    };

    const currentEmotionLabel = getEmotionLabel(emotionalScore);
    const retryCooldownSeconds = Math.max(0, Math.ceil(cooldownRemainingMs / 1000));
    const isRetryCooldownActive = retryCooldownSeconds > 0;
    const openSettings = () => {
        if (onOpenSettings) onOpenSettings();
    };

    // ============================================
    // STEP INDICATOR
    // ============================================
    const steps = [
        { key: 'describe', label: 'Describe' },
        { key: 'checkin', label: 'Check In' },
        { key: 'discuss', label: 'Explore' },
        { key: 'analyzing', label: 'Analyze' },
    ];
    const currentStepIndex = steps.findIndex(s => s.key === phase);

    const renderStepIndicator = () => (
        <div className="flow-progress">
            {steps.map((step, i) => (
                <div key={step.key} className="flow-step">
                    <div className={`step-dot ${i === currentStepIndex ? 'active' : ''} ${i < currentStepIndex ? 'completed' : ''}`}>
                        {i < currentStepIndex ? '✓' : i + 1}
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`step-connector ${i < currentStepIndex ? 'completed' : ''}`} />
                    )}
                </div>
            ))}
        </div>
    );

    // ============================================
    // RENDER: Describe Phase
    // ============================================
    const renderDescribe = () => (
        <div className="decision-flow">
            {renderStepIndicator()}

            {showTemplates && (
                <div className="panel decision-input-container">
                    <TemplateSelector
                        onSelect={(template) => {
                            setSelectedTemplate(template);
                            setShowTemplates(false);
                        }}
                        onSkip={() => {
                            setSelectedTemplate(null);
                            setShowTemplates(false);
                        }}
                    />
                </div>
            )}

            {!showTemplates && (
            <div className="glass-card decision-input-container">
                <div className="describe-header">
                    <h2>What's weighing on your mind?</h2>
                    <p className="subtitle">
                        Describe your situation naturally. The more honest and detailed you are,
                        the more useful your analysis will be.
                    </p>
                </div>

                <div className="input-group">
                    <textarea
                        ref={textareaRef}
                        className="text-area text-area-large"
                        placeholder={selectedTemplate?.placeholder || "e.g., I've been offered a job in another city but my partner doesn't want to move. The pay is significantly better and it's in the field I've always wanted to work in, but I'm scared of what it might do to our relationship..."}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={3000}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.metaKey) handleDescribeNext();
                        }}
                        aria-label="Describe your decision"
                    />
                    <div className="char-counter" style={{ marginTop: '0.5rem' }}>
                        {description.length > 0 && `${description.length} / 3,000`}
                    </div>
                </div>

                {!apiReady && aiMode === 'client' && (
                    <div className="setup-prompt" style={{
                        marginTop: '1.5rem',
                        background: 'var(--bg-hover-wash)',
                        border: '1px solid var(--border-hairline)',
                        padding: '1.25rem'
                    }}>
                        <p style={{ color: 'var(--accent-vermilion)', fontSize: '0.95rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                            Add your free Groq API key to get started
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                            Decision Mirror uses Groq + Llama 3 for lightning-fast, psychology-grounded analysis.
                            Get a free key in 10 seconds.
                        </p>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={openSettings}
                        >
                            Open Settings
                        </button>
                    </div>
                )}

                {!getUserValues() && (
                    <div className="values-nudge">
                        <p>
                            Tip: <button className="link-btn" onClick={() => onNavigate('values')} type="button">Define your values</button> for personalized recommendations.
                        </p>
                    </div>
                )}

                {relevantHistory.length > 0 && (
                    <div className="history-context">
                        <p>You've made similar decisions before. The AI will reference your history.</p>
                    </div>
                )}

                <div className="question-actions">
                    {apiReady ? (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleDescribeNext}
                            disabled={!description.trim() || description.trim().length < 20}
                        >
                            Continue →
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary btn-lg"
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            disabled
                        >
                            Add API Key Above to Continue
                        </button>
                    )}
                </div>
                {description.trim().length > 0 && description.trim().length < 20 && apiReady && (
                    <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        Add a bit more detail for a meaningful analysis
                    </p>
                )}
            </div>
            )}
        </div>
    );

    // ============================================
    // RENDER: Emotional Check-In Phase (NEW!)
    // ============================================
    const renderCheckin = () => (
        <div className="decision-flow">
            {renderStepIndicator()}
            <div className="glass-card decision-input-container">
                <div className="describe-header">
                    <h2>Before we analyze — how are you feeling?</h2>
                    <p className="subtitle">
                        Research shows that simply naming your emotional state reduces its influence
                        on your decision by up to 50%.
                        <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            — Lieberman et al. (2007), "Putting Feelings into Words"
                        </span>
                    </p>
                </div>

                <div className="emotional-gauge">
                    <div className="gauge-track">
                        <div
                            className="gauge-thumb"
                            style={{ left: `${emotionalScore}%` }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={emotionalScore}
                            onChange={(e) => setEmotionalScore(parseInt(e.target.value, 10))}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: 'pointer',
                                zIndex: 2
                            }}
                            aria-label="Emotional intensity scale"
                        />
                    </div>
                    <div className="gauge-labels">
                        <span>Calm & Clear</span>
                        <span>Emotionally Charged</span>
                    </div>
                </div>

                <div className="glass-card" style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    margin: '1.5rem 0',
                    background: 'var(--bg-newsprint)',
                    border: emotionalScore > 70 ? '2px solid var(--accent-vermilion)' : '1px solid var(--border-hairline)',
                }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem', color: emotionalScore > 70 ? 'var(--accent-vermilion)' : 'var(--text-ink)' }}>
                        {currentEmotionLabel.label}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                        {currentEmotionLabel.desc}
                    </div>
                </div>

                {emotionalScore > 75 && (
                    <div className="glass-card" style={{
                        padding: '1rem 1.25rem',
                        background: 'var(--bg-hover-wash)',
                        border: '2px solid var(--accent-vermilion)',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6
                    }}>
                        <strong style={{ color: 'var(--accent-vermilion)' }}>Gentle warning:</strong> Research by Loewenstein (2005) shows
                        decisions made in "hot" emotional states are significantly more likely to be regretted.
                        We'll factor this into your analysis — but consider revisiting your decision after 24 hours.
                    </div>
                )}

                {isThinking && (
                    <LoadingState stages={['Preparing your first exploration question...']} />
                )}

                <div className="question-actions" style={{ marginTop: '2rem' }}>
                    <button className="btn btn-ghost" onClick={() => setPhase('describe')} disabled={isThinking}>
                        ← Back
                    </button>
                    {apiReady ? (
                        <button className="btn btn-primary btn-lg" onClick={handleCheckinComplete} disabled={isThinking}>
                            {isThinking ? 'Preparing...' : 'Begin Exploration →'}
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-lg" onClick={openSettings}>
                            Add API Key to Continue
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // ============================================
    // RENDER: Discuss Phase (Improved — not chatbot-like)
    // ============================================
    const renderDiscuss = () => {
        const questionNum = chatHistory.length + (currentQuestion ? 1 : 0);
        return (
            <div className="decision-flow discuss-flow">
                {renderStepIndicator()}

                {/* Context + emotional state reminder */}
                <div className="context-reminder glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-hairline)' }}>
                        <div className="eyebrow">Your situation</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                            {currentEmotionLabel.label}
                        </div>
                    </div>
                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                        {description.length > 200 ? description.slice(0, 200) + '...' : description}
                    </p>
                </div>

                {/* Question progress */}
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--space-3) 0',
                    fontSize: '0.8125rem',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.05em'
                }}>
                    EXPLORATION {questionNum}
                </div>

                {error && (
                    <div className="glass-card" style={{
                        padding: 'var(--space-5)', 
                        border: '2px solid var(--accent-vermilion)', 
                        marginBottom: 'var(--space-5)',
                        fontSize: '0.9rem'
                    }}>
                        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--accent-vermilion)', fontWeight: 600 }}>{error}</p>
                        {isRetryCooldownActive && (
                            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                Cooling down to avoid repeated rate-limit failures. Retry unlocks in {retryCooldownSeconds}s.
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => { setError(null); handleSkipToAnalysis(); }}
                                disabled={isRetryCooldownActive}
                            >
                                {isRetryCooldownActive ? `Retry in ${retryCooldownSeconds}s` : 'Retry Analysis'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setError(null)}>
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Conversation history */}
                <div className="conversation-thread">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className="exchange-pair" style={{ animationDelay: '0s', marginBottom: 'var(--space-6)' }}>
                            <div className="msg msg-ai" style={{ marginBottom: 'var(--space-3)' }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.0625rem', lineHeight: 1.6, color: 'var(--text-ink)' }}>
                                    {msg.question}
                                </div>
                            </div>
                            <div className="msg msg-user" style={{ paddingLeft: 'var(--space-5)', borderLeft: '2px solid var(--border-hairline)' }}>
                                <div style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                                    {msg.answer}
                                </div>
                            </div>
                        </div>
                    ))}

                    {currentQuestion && !isThinking && (
                        <div className="exchange-pair current-exchange" style={{ marginBottom: 'var(--space-5)' }}>
                            <div className="msg msg-ai">
                                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.0625rem', lineHeight: 1.6, color: 'var(--text-ink)' }}>
                                    {currentQuestion}
                                </div>
                            </div>
                        </div>
                    )}

                    {isThinking && (
                        <LoadingState stages={['Considering your response...']} />
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Answer input */}
                {currentQuestion && !isThinking && (
                    <div className="answer-area glass-card">
                        <textarea
                            ref={answerRef}
                            className="text-area"
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder="Be honest — the more real you are, the better the analysis..."
                            rows={3}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitAnswer();
                                }
                            }}
                            aria-label="Your answer"
                        />
                        <div className="answer-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={handleSkipToAnalysis}
                            >
                                Skip to analysis →
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmitAnswer}
                                disabled={!currentAnswer.trim() || isThinking}
                            >
                                Reply
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ============================================
    // RENDER: Analyzing Phase
    // ============================================
    const renderAnalyzing = () => (
        <div className="analyzing-state">
            {renderStepIndicator()}
            {error ? (
                <div style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
                    <div style={{ marginBottom: 'var(--space-5)' }}>
                        <AlertCircle size={48} color="var(--accent-vermilion)" />
                    </div>
                    <div className="glass-card" style={{
                        padding: '1.5rem', 
                        border: '2px solid var(--accent-vermilion)',
                    }}>
                        <p style={{ color: 'var(--accent-vermilion)', fontSize: '0.95rem', marginBottom: '1rem', fontWeight: 600 }}>{error}</p>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => { setError(null); performAnalysis(chatHistory); }}
                                disabled={isRetryCooldownActive}
                            >
                                {isRetryCooldownActive ? `Retry in ${retryCooldownSeconds}s` : 'Retry Analysis'}
                            </button>
                            <button className="btn btn-ghost" onClick={() => { setError(null); setPhase('discuss'); }}>
                                ← Back to Exploration
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <LoadingState currentStage={analyzeStage} />
                    {isStreaming && streamingText && (
                        <div className="streaming-preview panel">
                            <pre className="streaming-text">{streamingText}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <>
            {phase === 'describe' && renderDescribe()}
            {phase === 'checkin' && renderCheckin()}
            {phase === 'discuss' && renderDiscuss()}
            {phase === 'analyzing' && renderAnalyzing()}
        </>
    );
}
