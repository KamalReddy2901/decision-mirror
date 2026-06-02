/**
 * Decision Science Engine
 * 
 * Pure client-side decision analysis using established psychological frameworks.
 * Based on research from:
 * - Kahneman & Tversky (Prospect Theory, 1979)
 * - Gary Klein (Pre-Mortem Analysis, 1998)
 * - Suzy Welch (10-10-10 Framework)
 * - Schwartz (The Paradox of Choice, 2004)
 * - Dan Ariely (Predictably Irrational, 2008)
 * 
 * Zero API cost — all analysis runs locally.
 */

// ============================================
// DECISION TYPE CATEGORIZATION
// ============================================

const DECISION_TYPES = {
    career: {
        keywords: ['job', 'career', 'work', 'promotion', 'resign', 'quit', 'salary', 'hire',
            'company', 'position', 'role', 'manager', 'boss', 'industry', 'profession',
            'startup', 'freelance', 'business', 'entrepreneur', 'office', 'remote'],
        label: 'Career',
        icon: '💼',
        color: '#6366f1'
    },
    financial: {
        keywords: ['money', 'invest', 'buy', 'sell', 'loan', 'debt', 'savings', 'stock',
            'property', 'mortgage', 'rent', 'expense', 'budget', 'crypto', 'fund',
            'insurance', 'retirement', 'price', 'cost', 'afford', 'expensive'],
        label: 'Financial',
        icon: '💰',
        color: '#34d399'
    },
    relationship: {
        keywords: ['relationship', 'partner', 'marriage', 'dating', 'divorce', 'friend',
            'family', 'breakup', 'love', 'together', 'commitment', 'trust',
            'parents', 'children', 'sibling', 'spouse', 'boyfriend', 'girlfriend'],
        label: 'Relationship',
        icon: '💝',
        color: '#f43f5e'
    },
    health: {
        keywords: ['health', 'medical', 'doctor', 'surgery', 'treatment', 'therapy',
            'mental', 'exercise', 'diet', 'wellness', 'medication', 'hospital',
            'illness', 'condition', 'stress', 'anxiety', 'depression', 'fitness'],
        label: 'Health',
        icon: '🏥',
        color: '#2dd4bf'
    },
    education: {
        keywords: ['college', 'university', 'degree', 'school', 'study', 'course',
            'learn', 'student', 'masters', 'phd', 'certification', 'training',
            'exam', 'major', 'graduate', 'dropout', 'academic', 'scholarship'],
        label: 'Education',
        icon: '🎓',
        color: '#a855f7'
    },
    lifestyle: {
        keywords: ['move', 'relocate', 'city', 'country', 'travel', 'hobby',
            'house', 'apartment', 'lifestyle', 'habit', 'routine', 'balance',
            'pet', 'vehicle', 'car', 'vacation', 'adventure'],
        label: 'Lifestyle',
        icon: '🌟',
        color: '#fbbf24'
    },
    moral: {
        keywords: ['right', 'wrong', 'ethical', 'moral', 'conscience', 'principle',
            'honest', 'lie', 'cheat', 'fair', 'justice', 'responsibility',
            'confront', 'report', 'whistle', 'integrity'],
        label: 'Moral/Ethical',
        icon: '⚖️',
        color: '#818cf8'
    }
};

export function categorizeDecision(text) {
    const lower = text.toLowerCase();
    const scores = {};

    for (const [type, config] of Object.entries(DECISION_TYPES)) {
        scores[type] = config.keywords.reduce((score, keyword) => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = lower.match(regex);
            return score + (matches ? matches.length : 0);
        }, 0);
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topType = sorted[0][1] > 0 ? sorted[0][0] : 'lifestyle';

    return {
        type: topType,
        ...DECISION_TYPES[topType],
        confidence: sorted[0][1] > 0 ? Math.min(sorted[0][1] / 3, 1) : 0.3,
        secondaryType: sorted[1][1] > 0 ? sorted[1][0] : null
    };
}

// ============================================
// STAKES ASSESSMENT
// ============================================

const HIGH_STAKES_SIGNALS = [
    'never', 'forever', 'life', 'death', 'permanent', 'irreversible',
    'marriage', 'divorce', 'surgery', 'children', 'all my savings',
    'everything', 'rest of my life', 'no going back', 'huge', 'massive',
    'critical', 'once in a lifetime', 'make or break'
];

const LOW_STAKES_SIGNALS = [
    'small', 'minor', 'trivial', 'easy', 'simple', 'cheap',
    'temporary', 'can change', 'reversible', 'no big deal',
    'whichever', 'either way', 'doesn\'t matter much'
];

export function assessStakes(text) {
    const lower = text.toLowerCase();

    let highScore = HIGH_STAKES_SIGNALS.reduce((score, signal) =>
        score + (lower.includes(signal) ? 1 : 0), 0);

    let lowScore = LOW_STAKES_SIGNALS.reduce((score, signal) =>
        score + (lower.includes(signal) ? 1 : 0), 0);

    // Length heuristic: longer descriptions often indicate higher stakes
    if (text.length > 500) highScore += 1;
    if (text.length > 1000) highScore += 1;

    // Question marks indicate uncertainty (higher emotional stakes)
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks >= 3) highScore += 1;

    if (highScore > lowScore + 1) return { level: 'high', label: 'High Stakes', emoji: '🔴' };
    if (lowScore > highScore + 1) return { level: 'low', label: 'Low Stakes', emoji: '🟢' };
    return { level: 'medium', label: 'Medium Stakes', emoji: '🟡' };
}

// ============================================
// COGNITIVE BIAS DETECTION
// ============================================

const BIAS_PATTERNS = {
    sunk_cost: {
        name: 'Sunk Cost Fallacy',
        triggers: [
            'already spent', 'invested so much', 'too late to', 'come this far',
            'put so much into', 'years of', 'can\'t waste', 'all that time',
            'already committed', 'gone too far'
        ],
        description: 'You may be weighing past investment too heavily. The time, money, or effort already spent cannot be recovered — only future value matters.',
        reframe: 'Imagine you\'re starting fresh today with zero investment. Would you still choose this path? Judge options only by their future potential.',
        research: 'Arkes & Blumer (1985) — "The Psychology of Sunk Cost"',
        severity: 8,
        icon: '⚓'
    },
    status_quo: {
        name: 'Status Quo Bias',
        triggers: [
            'comfortable', 'used to', 'familiar', 'safe choice', 'stable',
            'what i know', 'current', 'keep things', 'stay with', 'not ready for change',
            'risky to change', 'why fix'
        ],
        description: 'There appears to be a strong preference for the current state. We tend to perceive change as loss, even when the change would be beneficial.',
        reframe: 'If you were NOT already in your current situation, would you actively choose it over the alternatives? Flip the default.',
        research: 'Samuelson & Zeckhauser (1988) — "Status Quo Bias in Decision Making"',
        severity: 6,
        icon: '🏠'
    },
    loss_aversion: {
        name: 'Loss Aversion',
        triggers: [
            'lose', 'risk', 'afraid', 'scared', 'what if it fails', 'worst case',
            'dangerous', 'could go wrong', 'fear', 'give up', 'sacrifice',
            'miss out', 'regret'
        ],
        description: 'Losses loom larger than gains in our minds. Research shows we feel losses about 2x more intensely than equivalent gains.',
        reframe: 'Instead of asking "What could go wrong?", ask "What am I missing by NOT taking this step?" Both frame the same uncertainty differently.',
        research: 'Kahneman & Tversky (1979) — "Prospect Theory"',
        severity: 7,
        icon: '🛡️'
    },
    confirmation: {
        name: 'Confirmation Bias',
        triggers: [
            'i think', 'i believe', 'obviously', 'clearly', 'everyone knows',
            'i feel like', 'my gut says', 'i\'m pretty sure', 'i already know',
            'it\'s clear that'
        ],
        description: 'You may have already formed a preference and are seeking information that confirms it. This is the most common and dangerous cognitive bias.',
        reframe: 'Steel-man the option you\'re LEAST inclined toward. What\'s the strongest possible argument for it? Give it a fair trial in your mind.',
        research: 'Nickerson (1998) — "Confirmation Bias: A Ubiquitous Phenomenon"',
        severity: 8,
        icon: '🔍'
    },
    anchoring: {
        name: 'Anchoring Effect',
        triggers: [
            'first', 'initial', 'original', 'started at', 'was told',
            'someone said', 'i heard', 'the number', 'compared to',
            'price was', 'they offered'
        ],
        description: 'You may be anchored to an initial piece of information (a number, an opinion, or first impression) that is disproportionately influencing your thinking.',
        reframe: 'What would your analysis look like if that first data point didn\'t exist? Try to evaluate from scratch without that anchor.',
        research: 'Tversky & Kahneman (1974) — "Judgment Under Uncertainty: Heuristics and Biases"',
        severity: 5,
        icon: '⚙️'
    },
    availability: {
        name: 'Availability Heuristic',
        triggers: [
            'i saw', 'i read', 'news', 'happened to someone', 'story about',
            'my friend', 'recently', 'just happened', 'trending', 'viral',
            'heard about'
        ],
        description: 'Recent or vivid examples may be overinfluencing your judgment. Just because something is memorable doesn\'t make it statistically likely.',
        reframe: 'What does the actual data say, beyond anecdotes? One story ≠ a pattern. Seek base rates, not narratives.',
        research: 'Tversky & Kahneman (1973) — "Availability: A Heuristic for Judging Frequency"',
        severity: 5,
        icon: '📰'
    },
    optimism: {
        name: 'Optimism Bias',
        triggers: [
            'it\'ll work out', 'best case', 'nothing can go wrong', 'easy',
            'simple', 'guaranteed', 'no way it fails', 'can\'t lose',
            'sure thing', 'definitely'
        ],
        description: 'We tend to overestimate positive outcomes and underestimate risks. Planning fallacy (things taking longer/costing more) is a common manifestation.',
        reframe: 'What would a skeptical but well-meaning friend say about this plan? What\'s the realistic timeline/outcome, not the ideal one?',
        research: 'Sharot (2011) — "The Optimism Bias"',
        severity: 6,
        icon: '🌈'
    }
};

export function detectBiases(text, answers = []) {
    const combined = [text, ...answers].join(' ').toLowerCase();
    const detected = [];

    for (const [key, bias] of Object.entries(BIAS_PATTERNS)) {
        const matchCount = bias.triggers.reduce((count, trigger) => {
            return count + (combined.includes(trigger) ? 1 : 0);
        }, 0);

        if (matchCount >= 2) {
            detected.push({
                type: key,
                ...bias,
                matchStrength: Math.min(matchCount / bias.triggers.length, 1),
                matchCount
            });
        }
    }

    // Sort by severity * matchStrength
    detected.sort((a, b) => (b.severity * b.matchStrength) - (a.severity * a.matchStrength));

    return detected;
}

// ============================================
// ADAPTIVE QUESTIONS GENERATION
// ============================================

const QUESTION_BANK = {
    career: [
        "If money weren't a factor at all, what would you choose? This reveals your intrinsic motivation.",
        "Describe your ideal Tuesday at work, three years from now. What does it look like?",
        "What are you running FROM versus running TO? Be honest about the proportion.",
        "Who will be most affected by this decision besides you? How do they factor in?",
        "What's the worst-case scenario, and could you recover from it within 2 years?"
    ],
    financial: [
        "If this investment/purchase lost 50% of its value tomorrow, how would that affect your life?",
        "What else could you do with this money that might bring equal or greater value?",
        "Are you making this decision based on fear or genuine opportunity?",
        "What would 70-year-old you think about this financial decision?",
        "Is there someone whose financial judgment you trust? What would they say?"
    ],
    relationship: [
        "If nothing about the other person changed in the next 5 years, would you still be content?",
        "Are you making this decision for yourself or to meet someone else's expectations?",
        "What pattern from past relationships might be repeating here?",
        "If your best friend described this exact situation about their life, what would you advise?",
        "What would need to be true for the other option to become the right choice?"
    ],
    health: [
        "What does your daily quality of life look like with each option?",
        "Have you sought a second professional opinion? What were the different perspectives?",
        "Are you prioritizing short-term comfort over long-term wellbeing, or vice versa?",
        "What does the best available evidence (not anecdote) say about outcomes?",
        "How does this decision align with how you want to feel in your body in 5 years?"
    ],
    education: [
        "What specific skills or knowledge will this give you that you can't get another way?",
        "What's the opportunity cost — what else could you do with this time and money?",
        "Are you pursuing this out of genuine curiosity, or external pressure/prestige?",
        "Will this still be relevant and valuable in 10 years?",
        "What would 'success' look like 1 year after completing this? Be specific."
    ],
    lifestyle: [
        "If you made this change and hated it, how easily could you reverse course?",
        "What daily habit or routine changes would this require? Can you sustain them?",
        "Are you romanticizing the alternative, or have you experienced a realistic version of it?",
        "Who in your life has actually made a similar change? What was their honest experience?",
        "What are you hoping this change will fix about your life? Is that realistic?"
    ],
    moral: [
        "If this decision were public — everyone could see it — would you still choose the same?",
        "What principle is at the core of this dilemma? Where did that principle come from?",
        "Is there a way to honor multiple values here, or is it truly a zero-sum choice?",
        "What would you tell your child or younger self to do in this situation?",
        "Are short-term consequences driving you away from your long-term values?"
    ],
    universal: [
        "On a scale of 1-10, how emotionally charged do you feel about this right now?",
        "What information are you missing that could change your analysis?",
        "What would you choose if you had to decide in 10 seconds?",
        "What assumptions are you making that you haven't verified?"
    ]
};

export function generateQuestions(decisionType) {
    const typeQuestions = QUESTION_BANK[decisionType] || QUESTION_BANK.lifestyle;
    const universalQuestions = QUESTION_BANK.universal;

    // Pick 3-4 type-specific + 1 universal
    const selected = [
        ...typeQuestions.slice(0, 3),
        universalQuestions[Math.floor(Math.random() * universalQuestions.length)]
    ];

    return selected;
}

// ============================================
// IMPACT ANALYSIS
// ============================================

const IMPACT_DIMENSIONS = [
    { key: 'financial', label: 'Financial Impact', icon: '💰' },
    { key: 'emotional', label: 'Emotional Wellbeing', icon: '🧠' },
    { key: 'relationships', label: 'Relationships', icon: '👥' },
    { key: 'growth', label: 'Personal Growth', icon: '🌱' },
    { key: 'time', label: 'Time & Energy', icon: '⏰' },
    { key: 'values', label: 'Values Alignment', icon: '💎' }
];

export { IMPACT_DIMENSIONS };

export function generateImpactScores(options, text, answers) {
    // Keep signature aligned with runFullAnalysis inputs for extensibility.
    void text;
    void answers;

    return options.map((option) => {
        const optLower = option.toLowerCase();
        const scores = {};

        IMPACT_DIMENSIONS.forEach(dim => {
            // Generate consistent but varied scores based on text characteristics
            let baseScore = 5;
            const seed = hashString(option + dim.key);

            // Financial dimension adjustments
            if (dim.key === 'financial') {
                if (optLower.includes('save') || optLower.includes('earn')) baseScore += 2;
                if (optLower.includes('spend') || optLower.includes('cost')) baseScore -= 1;
                if (optLower.includes('invest')) baseScore += 1;
            }

            // Emotional dimension
            if (dim.key === 'emotional') {
                if (optLower.includes('happy') || optLower.includes('love') || optLower.includes('passion')) baseScore += 2;
                if (optLower.includes('stress') || optLower.includes('anxiety')) baseScore -= 2;
                if (optLower.includes('comfortable') || optLower.includes('safe')) baseScore += 1;
            }

            // Growth dimension
            if (dim.key === 'growth') {
                if (optLower.includes('learn') || optLower.includes('grow') || optLower.includes('challenge')) baseScore += 2;
                if (optLower.includes('same') || optLower.includes('stay')) baseScore -= 1;
                if (optLower.includes('new') || optLower.includes('opportunity')) baseScore += 1;
            }

            // Time dimension
            if (dim.key === 'time') {
                if (optLower.includes('quick') || optLower.includes('efficient')) baseScore += 1;
                if (optLower.includes('long') || optLower.includes('years')) baseScore -= 1;
            }

            // Add pseudo-random variation based on hash
            const variation = ((seed % 5) - 2);
            scores[dim.key] = Math.max(1, Math.min(10, baseScore + variation));
        });

        return {
            option: option,
            scores,
            totalScore: Object.values(scores).reduce((a, b) => a + b, 0)
        };
    });
}

// Simple string hash for deterministic "randomness"
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

// ============================================
// SCENARIO PLANNING
// ============================================

export function generateScenarios(options, decisionType, _text) {
    void _text;
    const templates = {
        best: [
            "Everything aligns in your favor. The decision pays off beyond expectations.",
            "This becomes one of the best decisions you've ever made.",
            "Not only does it work out, but it opens doors you didn't even see."
        ],
        likely: [
            "Things go reasonably well with normal ups and downs.",
            "You face expected challenges but navigate them with effort.",
            "The outcome is satisfactory — not perfect, but solid."
        ],
        worst: [
            "Multiple things go wrong simultaneously. Recovery takes significant effort.",
            "The feared downside materializes. You need to pivot and adapt.",
            "This path leads to regret, but the lessons learned become valuable."
        ]
    };

    return options.map(option => {
        const seed = hashString(option);
        return {
            option,
            best: {
                scenario: templates.best[seed % templates.best.length],
                probability: 15 + (seed % 20),
                requires: `Strong execution, favorable conditions, and ${decisionType === 'career' ? 'market timing' : 'consistent effort'}`
            },
            likely: {
                scenario: templates.likely[seed % templates.likely.length],
                probability: 50 + (seed % 20),
                requires: 'Persistence, flexibility, and realistic expectations'
            },
            worst: {
                scenario: templates.worst[seed % templates.worst.length],
                probability: 5 + (seed % 15),
                requires: 'Multiple simultaneous failures and/or black swan events'
            }
        };
    });
}

// ============================================
// 10-10-10 ANALYSIS (Suzy Welch Framework)
// ============================================

export function generate101010(options, decisionType) {
    return options.map(option => {
        const type = decisionType;

        return {
            option,
            tenMinutes: generateTimeframeAnalysis(option, type, 'minutes'),
            tenMonths: generateTimeframeAnalysis(option, type, 'months'),
            tenYears: generateTimeframeAnalysis(option, type, 'years')
        };
    });
}

function generateTimeframeAnalysis(option, type, timeframe) {
    void option;

    const analyses = {
        minutes: {
            career: "The initial anxiety or excitement fades. Your emotional response right now is temporary — it's your brain's fight-or-flight, not wisdom.",
            financial: "The sticker shock or excitement will dissolve. Initial emotional reactions to money decisions are almost never proportional to actual impact.",
            relationship: "The rush of emotion you feel now will settle. What matters is the pattern, not this moment's intensity.",
            default: "Your heart rate returns to normal. The emotional surge you're feeling is a response to novelty — it says nothing about long-term quality."
        },
        months: {
            career: "You've adapted to the new normal. The adjustment period is over. Are you energized on Sunday evenings, or dreading Monday?",
            financial: "The financial impact is now clear. Has it created breathing room or pressure? Your daily experience tells the real story.",
            relationship: "The honeymoon or grief period has passed. You're living with the actual day-to-day reality of this choice.",
            default: "Initial disruption has settled. You can now see clearly whether this choice fits your life's rhythm."
        },
        years: {
            career: "This decision has compounded. Career paths diverge dramatically over a decade. One version of you is grateful; which one?",
            financial: "Compound effects are fully visible. Small financial decisions, compounded over a decade, create vastly different outcomes.",
            relationship: "The relationship landscape has fundamentally shifted. What seemed important now is barely a memory; what seemed small became everything.",
            default: "A decade of compound effects. The person making this choice today is writing the story their future self will live."
        }
    };

    const typeAnalysis = analyses[timeframe]?.[type] || analyses[timeframe]?.default;
    return typeAnalysis;
}

// ============================================
// PRE-MORTEM ANALYSIS (Gary Klein)
// ============================================

export function generatePreMortem(options, decisionType) {
    const failurePatterns = {
        career: [
            "The company culture turned out to be toxic, something no interview process revealed",
            "The industry shifted in an direction nobody predicted, making these skills less relevant",
            "Work-life balance became unsustainable, affecting health and relationships",
            "The growth opportunities that were promised never materialized"
        ],
        financial: [
            "Market conditions changed in ways that historical data didn't predict",
            "Hidden costs and fees eroded the expected returns significantly",
            "An emergency expense created a liquidity crisis at the worst possible time",
            "The emotional stress of financial risk impacted other life areas"
        ],
        relationship: [
            "Unspoken expectations created growing resentment over time",
            "External pressures (family, work, health) strained what seemed solid",
            "The version of the person you committed to changed in ways you couldn't adapt to",
            "You confused comfort with compatibility, or excitement with compatibility"
        ],
        default: [
            "The assumptions you made about how things would unfold were wrong",
            "External circumstances changed in a way you didn't account for",
            "You underestimated the toll on your energy and emotional reserves",
            "An unforeseen dependency or bottleneck blocked the expected outcome"
        ]
    };

    return options.map(option => ({
        option,
        failures: (failurePatterns[decisionType] || failurePatterns.default).map(failure => ({
            scenario: failure,
            mitigation: `Before committing: verify this assumption and create a contingency plan`
        }))
    }));
}

// ============================================
// OPPORTUNITY COST ANALYSIS
// ============================================

export function generateOpportunityCosts(options, _text) {
    void _text;
    return options.map((option, idx) => {
        const otherOptions = options.filter((_, i) => i !== idx);

        return {
            option,
            directCosts: `By choosing "${option}", you're allocating your primary resources (time, energy, money) here instead of other possibilities.`,
            forgone: otherOptions.map(other => ({
                option: other,
                cost: `The potential benefits of "${other}" become unavailable or delayed.`
            })),
            hiddenCosts: "Consider also: the mental energy of second-guessing, the learning opportunities in other paths, and the relationships that would develop differently."
        };
    });
}

// ============================================
// VALUES ALIGNMENT SCORING
// ============================================

const DEFAULT_VALUES = {
    'Security': 7,
    'Freedom': 7,
    'Family': 8,
    'Growth': 7,
    'Health': 8,
    'Creativity': 6,
    'Achievement': 7,
    'Connection': 7,
    'Purpose': 7,
    'Adventure': 5
};

export { DEFAULT_VALUES };

export function calculateValuesAlignment(options, userValues) {
    const values = userValues || DEFAULT_VALUES;

    return options.map(option => {
        const optLower = option.toLowerCase();
        const alignment = {};

        Object.entries(values).forEach(([value, importance]) => {
            const valueLower = value.toLowerCase();
            let score = 5; // baseline

            // Simple heuristic: if option text relates to value, boost score
            if (valueLower === 'security' && (optLower.includes('stable') || optLower.includes('safe') || optLower.includes('secure'))) score += 3;
            if (valueLower === 'freedom' && (optLower.includes('free') || optLower.includes('independent') || optLower.includes('flexible'))) score += 3;
            if (valueLower === 'growth' && (optLower.includes('learn') || optLower.includes('grow') || optLower.includes('develop'))) score += 3;
            if (valueLower === 'creativity' && (optLower.includes('creat') || optLower.includes('design') || optLower.includes('build'))) score += 3;
            if (valueLower === 'adventure' && (optLower.includes('new') || optLower.includes('change') || optLower.includes('explore'))) score += 3;

            // Add deterministic variation
            const seed = hashString(option + value);
            score += (seed % 3) - 1;

            alignment[value] = {
                score: Math.max(1, Math.min(10, score)),
                weighted: Math.max(1, Math.min(10, score)) * (importance / 10)
            };
        });

        const totalWeighted = Object.values(alignment).reduce((sum, v) => sum + v.weighted, 0);
        const maxPossible = Object.values(values).reduce((sum, v) => sum + v, 0);

        return {
            option,
            alignment,
            totalScore: totalWeighted,
            percentage: Math.round((totalWeighted / maxPossible) * 100)
        };
    });
}

// ============================================
// ASSUMPTIONS AUDIT
// ============================================

export function generateAssumptions(text, answers, decisionType) {
    const assumptions = [];
    const combined = [text, ...answers].join(' ').toLowerCase();

    // Universal assumptions
    assumptions.push({
        text: "You're assuming your current understanding of the situation is complete and accurate",
        category: 'information',
        verified: false
    });

    if (combined.includes('will') || combined.includes('going to') || combined.includes('plan to')) {
        assumptions.push({
            text: "You're assuming future events will unfold as you currently expect",
            category: 'prediction',
            verified: false
        });
    }

    if (combined.includes('they') || combined.includes('he') || combined.includes('she')) {
        assumptions.push({
            text: "You're assuming you correctly understand another person's motivations and reactions",
            category: 'social',
            verified: false
        });
    }

    if (combined.includes('better') || combined.includes('worse') || combined.includes('more') || combined.includes('less')) {
        assumptions.push({
            text: "You're making comparative judgments that may not account for all variables",
            category: 'comparison',
            verified: false
        });
    }

    // Type-specific
    if (decisionType === 'career') {
        assumptions.push({
            text: "You're assuming the job market and industry conditions will remain similar",
            category: 'market',
            verified: false
        });
    }

    if (decisionType === 'financial') {
        assumptions.push({
            text: "You're assuming a certain rate of return or financial trajectory",
            category: 'financial',
            verified: false
        });
    }

    if (decisionType === 'relationship') {
        assumptions.push({
            text: "You're assuming the other person's feelings and intentions align with what they've expressed",
            category: 'social',
            verified: false
        });
    }

    assumptions.push({
        text: "You're assuming your current emotional state isn't significantly distorting your judgment",
        category: 'emotional',
        verified: false
    });

    return assumptions;
}

// ============================================
// CONDITIONAL RECOMMENDATION
// ============================================

export function generateRecommendation(options, impactScores, valuesAlignment, biases) {
    if (options.length < 2) {
        return {
            conditions: [{
                priority: 'your long-term wellbeing',
                recommendation: options[0] || 'Proceed with caution',
                confidence: 'moderate'
            }],
            tradeOffs: ['Consider seeking additional options before committing'],
            warning: biases.length > 0 ? 'Note: cognitive biases were detected that may be influencing your thinking.' : null
        };
    }

    const conditions = options.map((option, idx) => {
        const impact = impactScores[idx];
        const values = valuesAlignment[idx];

        // Find this option's strongest dimension
        const sortedDims = Object.entries(impact.scores)
            .sort((a, b) => b[1] - a[1]);

        const strongestDim = sortedDims[0];
        const dimLabels = {
            financial: 'financial security',
            emotional: 'emotional wellbeing',
            relationships: 'your relationships',
            growth: 'personal growth',
            time: 'efficiency and time',
            values: 'staying true to your values'
        };

        return {
            priority: dimLabels[strongestDim[0]] || 'overall balance',
            recommendation: option,
            confidence: strongestDim[1] >= 7 ? 'strong' : strongestDim[1] >= 5 ? 'moderate' : 'weak',
            valuesScore: values.percentage
        };
    });

    const tradeOffs = [];

    if (options.length === 2) {
        const [a, b] = impactScores;
        IMPACT_DIMENSIONS.forEach(dim => {
            const diff = Math.abs(a.scores[dim.key] - b.scores[dim.key]);
            if (diff >= 3) {
                const better = a.scores[dim.key] > b.scores[dim.key] ? options[0] : options[1];
                const worse = a.scores[dim.key] > b.scores[dim.key] ? options[1] : options[0];
                tradeOffs.push(`"${better}" scores higher on ${dim.label.toLowerCase()}, but "${worse}" may excel in other areas`);
            }
        });
    }

    if (tradeOffs.length === 0) {
        tradeOffs.push('Both options are relatively balanced — this suggests neither is clearly inferior, making your personal priorities the deciding factor');
    }

    return {
        conditions,
        tradeOffs,
        warning: biases.length > 0
            ? `${biases.length} cognitive bias(es) detected. Review the Bias Radar section before finalizing your decision.`
            : null,
        coolingPeriod: "Research strongly suggests sleeping on important decisions. Your brain continues processing while you rest (Wagner et al., 2004)."
    };
}

// ============================================
// EMOTIONAL TEMPERATURE ANALYSIS
// ============================================

export function analyzeEmotionalTemperature(emotionalScore) {
    // Score 0-100: 0 = ice cold rational, 100 = extremely emotional
    if (emotionalScore >= 80) {
        return {
            level: 'critical',
            label: '🔥 Emotionally Heated',
            advice: 'Your emotional intensity is very high. Research by Loewenstein (2005) shows that decisions made in "hot" emotional states are significantly more likely to be regretted. Consider implementing a 24-72 hour cooling period before committing.',
            color: '#f43f5e',
            shouldDelay: true
        };
    }
    if (emotionalScore >= 60) {
        return {
            level: 'elevated',
            label: '🌡️ Emotionally Elevated',
            advice: 'You\'re somewhat emotionally activated. This isn\'t necessarily bad — emotions carry information. But double-check that your reasoning holds up independently of how you feel right now.',
            color: '#f59e0b',
            shouldDelay: false
        };
    }
    if (emotionalScore >= 40) {
        return {
            level: 'balanced',
            label: '⚖️ Balanced State',
            advice: 'You appear to be in a balanced emotional state — neither too detached (which can lead to analysis paralysis) nor too heated (which can lead to impulsive choices). This is a good headspace for decision-making.',
            color: '#34d399',
            shouldDelay: false
        };
    }
    if (emotionalScore >= 20) {
        return {
            level: 'cool',
            label: '❄️ Cool & Analytical',
            advice: 'You\'re in a very analytical state. While clarity is valuable, ensure you\'re not suppressing important emotional signals. Damasio\'s Somatic Marker Hypothesis (1994) shows that emotions play a crucial role in good decision-making.',
            color: '#2dd4bf',
            shouldDelay: false
        };
    }
    return {
        level: 'detached',
        label: '🧊 Emotionally Detached',
        advice: 'You seem very detached. While objectivity is valuable, complete emotional disconnection can lead to decisions that look good on paper but feel wrong in practice. Try to reconnect with what you genuinely want.',
        color: '#60a5fa',
        shouldDelay: false
    };
}

// ============================================
// FULL ANALYSIS PIPELINE
// ============================================

export function runFullAnalysis(decisionText, options, answers, userValues, emotionalScore, aiInsights = null) {
    const category = categorizeDecision(decisionText);
    const stakes = assessStakes(decisionText);
    const biases = aiInsights?.biasesDetected
        ? aiInsights.biasesDetected.map(b => ({ name: b.split('-')[0], description: b.split('-')[1] || b, icon: '⚠️' }))
        : detectBiases(decisionText, answers);

    const impactScores = generateImpactScores(options, decisionText, answers);

    // Prefer AI generated content, fallback to local
    const scenarios = aiInsights?.scenarios || generateScenarios(options, category.type, decisionText);
    const tenTenTen = aiInsights?.tenTenTen || generate101010(options, category.type);
    const preMortem = aiInsights?.preMortem || generatePreMortem(options, category.type);

    const opportunityCosts = generateOpportunityCosts(options, decisionText);
    const valuesAlignment = calculateValuesAlignment(options, userValues);
    const assumptions = generateAssumptions(decisionText, answers, category.type);
    const recommendation = generateRecommendation(options, impactScores, valuesAlignment, biases);
    const emotionalAnalysis = analyzeEmotionalTemperature(emotionalScore || 50);

    return {
        category,
        stakes,
        biases,
        impactScores,
        scenarios,
        tenTenTen,
        preMortem,
        opportunityCosts,
        valuesAlignment,
        assumptions,
        recommendation,
        emotionalAnalysis,
        aiInsights,
        timestamp: Date.now()
    };
}
