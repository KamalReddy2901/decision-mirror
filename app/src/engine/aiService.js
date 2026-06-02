/**
 * AI Service — The Brain of MirrorWise
 * 
 * Context-aware decision intelligence powered by Groq + Llama 3.
 * All analysis flows through here.
 */

import { sanitizeCommunityInsights } from './communitySafety';

let Groq = null;
let groq = null;
const MODEL = "llama-3.1-70b-versatile"; // Updated to current Groq model
const FALLBACK_MODEL = "llama-3.1-8b-instant"; // Fast fallback model
const STORAGE_KEY = 'dm_groq_api_key';
const RATE_LIMIT_UNTIL_KEY = 'dm_groq_rate_limit_until';
const EMBEDDED_API_KEY = String(import.meta.env?.VITE_GROQ_API_KEY || '').trim();
const AI_ACCESS_MODE = String(import.meta.env?.VITE_AI_MODE || 'client').trim().toLowerCase();
const SERVER_PROXY_PATH = String(import.meta.env?.VITE_AI_PROXY_PATH || '/api/groq').trim();

function isServerManagedMode() {
    return AI_ACCESS_MODE === 'server';
}

function hasUserKeyOverride() {
    return Boolean(String(localStorage.getItem(STORAGE_KEY) || '').trim());
}

function shouldUseServerProxy() {
    return isServerManagedMode() && !hasUserKeyOverride();
}

function getBootstrapAPIKey() {
    const stored = String(localStorage.getItem(STORAGE_KEY) || '').trim();
    return stored || EMBEDDED_API_KEY;
}

export function hasEmbeddedAPIKey() {
    return Boolean(EMBEDDED_API_KEY);
}

export function getAIAccessMode() {
    return shouldUseServerProxy() ? 'server' : 'client';
}

// ============================================
// INITIALIZATION
// ============================================

export async function initializeAI(apiKey) {
    if (isServerManagedMode() && !(apiKey && apiKey.trim())) {
        groq = null;
        return true;
    }

    const keyToUse = apiKey && apiKey.trim() ? apiKey.trim() : null;
    if (!keyToUse) {
        groq = null;
        return false;
    }

    try {
        if (!Groq) {
            const mod = await import("groq-sdk");
            Groq = mod.default;
        }
        groq = new Groq({
            apiKey: keyToUse,
            dangerouslyAllowBrowser: true
        });
        return true;
    } catch (e) {
        console.error("Failed to initialize Groq SDK:", e);
        groq = null;
        return false;
    }
}

export function isAIAvailable() {
    if (shouldUseServerProxy()) return true;
    if (groq !== null) return true;
    // Self-heal: stored key or embedded env key exists but groq instance was lost
    const key = getBootstrapAPIKey();
    if (key && Groq) {
        groq = new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
        return true;
    }
    return false;
}

export async function loadSavedAPIKey() {
    if (isServerManagedMode() && !hasUserKeyOverride()) {
        groq = null;
        return '';
    }

    const key = getBootstrapAPIKey();
    if (key) {
        await initializeAI(key);
    }
    return key;
}

export async function saveAPIKey(key) {
    const normalized = String(key || '').trim();
    if (normalized) {
        localStorage.setItem(STORAGE_KEY, normalized);
        return initializeAI(normalized);
    }
    localStorage.removeItem(STORAGE_KEY);
    if (isServerManagedMode()) {
        groq = null;
        return true;
    }
    if (EMBEDDED_API_KEY) {
        return initializeAI(EMBEDDED_API_KEY);
    }
    groq = null;
    return false;
}

export function clearAPIKey() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('dm_gemini_api_key');
    localStorage.removeItem('anthropic_api_key');
    if (isServerManagedMode()) {
        groq = null;
        return;
    }
    if (EMBEDDED_API_KEY) {
        groq = null;
        void initializeAI(EMBEDDED_API_KEY);
        return;
    }
    groq = null;
}

export function getSavedAPIKey() {
    return localStorage.getItem(STORAGE_KEY) || '';
}

function getRateLimitUntil() {
    const raw = Number(localStorage.getItem(RATE_LIMIT_UNTIL_KEY) || 0);
    return Number.isFinite(raw) ? raw : 0;
}

function getRateLimitRemainingMs() {
    const remaining = getRateLimitUntil() - Date.now();
    if (remaining <= 0) {
        localStorage.removeItem(RATE_LIMIT_UNTIL_KEY);
        return 0;
    }
    return remaining;
}

function readRetryAfterHeader(error) {
    const headers = error?.headers || error?.response?.headers;
    if (!headers) return null;

    if (typeof headers.get === 'function') {
        return headers.get('retry-after') || headers.get('Retry-After');
    }

    return headers['retry-after'] || headers['Retry-After'] || null;
}

function getRetryAfterMs(error, fallbackMs = 30000) {
    const raw = readRetryAfterHeader(error) ?? error?.retry_after ?? null;
    if (!raw) return fallbackMs;

    const retrySeconds = Number(raw);
    if (Number.isFinite(retrySeconds) && retrySeconds > 0) {
        return Math.min(120000, Math.max(5000, retrySeconds * 1000));
    }

    const retryDateMs = Date.parse(String(raw));
    if (Number.isFinite(retryDateMs)) {
        return Math.min(120000, Math.max(5000, retryDateMs - Date.now()));
    }

    return fallbackMs;
}

function setRateLimitCooldown(waitMs) {
    const until = Date.now() + Math.max(1000, waitMs);
    localStorage.setItem(RATE_LIMIT_UNTIL_KEY, String(until));
    return until;
}

function createRateLimitError(remainingMs) {
    const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
    return new Error(`Groq rate limit cooldown active. Try again in ${seconds} seconds.`);
}

function guardRateLimitCooldown() {
    const remaining = getRateLimitRemainingMs();
    if (remaining > 0) {
        throw createRateLimitError(remaining);
    }
}

export function getRateLimitCooldownRemainingMs() {
    return getRateLimitRemainingMs();
}

async function createChatCompletion(params) {
    if (shouldUseServerProxy()) {
        const response = await fetch(SERVER_PROXY_PATH, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            let detail = '';
            try {
                const payload = await response.json();
                detail = payload?.error || payload?.message || '';
            } catch {
                detail = '';
            }

            const error = new Error(detail || `AI proxy request failed (${response.status}).`);
            error.status = response.status;
            error.headers = response.headers;
            throw error;
        }

        return response.json();
    }

    if (!groq) {
        throw new Error("AI not configured. Please add your Groq API key in Settings.");
    }

    return groq.chat.completions.create(params);
}

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `You are a decision intelligence system grounded in behavioral psychology and decision science research.

YOUR FRAMEWORKS (apply the most relevant):
- Prospect Theory (Kahneman & Tversky, 1979): People feel losses ~2x more than gains. Detect loss framing.
- Pre-Mortem Analysis (Gary Klein, 1998): Imagine the decision failed — why?
- Affect Heuristic (Slovic, 2002): Emotions act as mental shortcuts that bypass rational analysis.
- Temporal Discounting: People overvalue immediate rewards vs future benefits.
- Mere Exposure Effect: Familiarity ≠ quality. Comfortable ≠ correct.
- Somatic Marker Hypothesis (Damasio, 1994): Gut feelings carry real information — but can also mislead.

YOUR PRINCIPLES:
1. NEVER give generic advice. Every insight must be specific to THIS person's situation.
2. Identify the hidden emotional driver beneath the stated rational concern.
3. Name the specific cognitive bias if you detect one — cite the research.
4. Be warm but DIRECT. Have the courage to give a clear recommendation with reasoning.
5. Surface what the person is NOT saying — the unspoken fear or desire.
6. Always distinguish between reversible and irreversible decisions.

YOUR VOICE:
- Speak like a wise mentor who has read all the research but talks like a human.
- Use concrete language, not platitudes. "You're afraid of being alone" not "there are emotional considerations."
- Short, punchy sentences mixed with deeper explanations.`;

const FOLLOW_UP_WRONGDOING_RE = /\b(steal|theft|rob|burglary|fraud|scam|assault|harm|hurt|kill|illegal|crime|criminal|violent|violence|weapon)\b/i;
const FOLLOW_UP_ENCOURAGEMENT_RE = /\b(worth considering|you should|do it|go for it|best option|smart move|works for you|only choice|just do)\b/i;
const FOLLOW_UP_TACTICAL_RE = /\b(step[-\s]?by[-\s]?step|how\s+to|plan\s+for|method|tactic|tips\s+to|avoid\s+getting\s+caught|not\s+get\s+caught)\b/i;

function enforceFollowUpSafety(text) {
    const content = String(text || '').trim();
    if (!content) return "I couldn't generate a response. Please try again.";

    const hasWrongdoing = FOLLOW_UP_WRONGDOING_RE.test(content);
    const hasEncouragement = FOLLOW_UP_ENCOURAGEMENT_RE.test(content);
    const hasTactical = FOLLOW_UP_TACTICAL_RE.test(content);

    if (hasWrongdoing && (hasEncouragement || hasTactical)) {
        return "I can't help with advice that encourages or plans wrongdoing. If you're under pressure, focus on legal options that protect your future: local assistance programs, financial counseling, trusted support, and practical short-term income alternatives.";
    }

    return content;
}

// ============================================
// HELPER: Robust JSON Extraction
// ============================================

function extractJSON(text) {
    try {
        // Try direct parse first
        return JSON.parse(text);
    } catch {
        // Find JSON block
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            const jsonStr = text.substring(start, end + 1);
            try {
                return JSON.parse(jsonStr);
            } catch {
                console.error("Failed to parse extracted JSON:", jsonStr);
                throw new Error("Invalid JSON response from AI");
            }
        }
        throw new Error("No JSON found in AI response");
    }
}

// ============================================
// CONVERSATION
// ============================================

const MAX_QUESTIONS = 5;
const MIN_QUESTIONS = 3;

export async function generateNextQuestion(description, history = [], emotionalScore = null) {
    if (!groq) return null;
    guardRateLimitCooldown();

    // Hard limit on questions
    if (history.length >= MAX_QUESTIONS) return null;

    const questionNumber = history.length + 1;
    const canFinish = history.length >= MIN_QUESTIONS;
    const emotionalContext = emotionalScore !== null
        ? `\nUSER'S EMOTIONAL STATE: ${emotionalScore}/100 (${emotionalScore > 70 ? 'highly emotional — validate their feelings first, then gently probe' : emotionalScore > 40 ? 'moderately engaged — balanced approach' : 'calm/analytical — can challenge directly'})`
        : '';

    const conversationSoFar = history.length > 0
        ? `\n\nCONVERSATION SO FAR:\n${history.map((h, i) => `Q${i+1}: ${h.question}\nTheir answer: ${h.answer}`).join('\n\n')}`
        : '\n\nNo questions asked yet — this is the opening question.';

    try {
        const chatCompletion = await createChatCompletion({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `USER'S SITUATION: "${description}"${emotionalContext}${conversationSoFar}

This is question ${questionNumber} of up to ${MAX_QUESTIONS}.
${!canFinish ? `You MUST ask a question. You need at least ${MIN_QUESTIONS} questions before you can finish. Do NOT return done:true yet.` : `You may return {"done": true} ONLY if you genuinely have enough detail about their specific situation, emotions, fears, timeline, and stakeholders to produce a deeply personalized analysis. If ANY of these areas are unclear, ask another question.`}

QUESTION STRATEGY — each question MUST be unique and tailored to THIS person's specific words:
- Q1: Dig into what's REALLY at stake emotionally. What are they afraid of? What do they secretly want? Reference specific words they used.
- Q2: Challenge a specific assumption they made. Quote or paraphrase something they said and ask them to reconsider it.
- Q3: Explore the path they seem to be resisting or avoiding. What's pulling them toward the "other" option?
- Q4: Probe practical realities — timeline, who else is affected, financial impact, what they've already tried.
- Q5: Ask about their values and long-term vision. What kind of person do they want to be in 5 years?

CRITICAL RULES:
- Ask ONE focused question — never bundle multiple questions
- NEVER ask generic questions like "What matters most to you?" or "What are your options?" — always reference SPECIFIC details from their description and previous answers
- Each question must surface something NEW they haven't mentioned yet
- Be warm but probing — like a skilled therapist who has been listening carefully
- Your question should make them think "wow, I hadn't considered that"

Return JSON: {"done": false, "question": "your single focused question"}`
                }
            ],
            model: MODEL,
            temperature: 0.7,
            max_tokens: 300
        });

        const text = chatCompletion.choices[0]?.message?.content || "";
        const parsed = extractJSON(text);

        // Force questions if below minimum
        if (parsed.done && !canFinish) {
            return parsed.question || "What would you tell your best friend if they were in this exact situation?";
        }

        if (parsed.done) return null;
        return parsed.question || null;
    } catch (error) {
        console.error("Question generation failed:", error);
        // Return fallback questions instead of null
        if (history.length === 0) return "What's the one thing about this decision that keeps you up at night?";
        if (history.length === 1) return "If you could fast-forward 6 months — what outcome are you most hoping for, and what are you most afraid of?";
        if (history.length === 2) return "Who else is affected by this decision, and what would they tell you to do?";
        return null;
    }
}

// ============================================
// FULL ANALYSIS
// ============================================

export async function generateAnalysis(description, history = [], emotionalScore = null) {
    if (!groq) throw new Error("AI not configured. Please add your Groq API key in Settings.");
    guardRateLimitCooldown();

    const emotionalContext = emotionalScore !== null
        ? `\nEMOTIONAL INTENSITY (self-reported): ${emotionalScore}/100`
        : '';

    const conversationContext = history.length > 0
        ? `\n\nDEEP-DIVE CONVERSATION (${history.length} exchanges):\n${history.map((h, i) => `Q${i+1}: ${h.question}\nUser said: "${h.answer}"`).join('\n\n')}`
        : '\n\nNo conversation — analyze based on initial description only.';

    const analysisPrompt = `USER'S SITUATION: "${description}"${emotionalContext}${conversationContext}

TASK: You have deeply explored this person's situation. Now produce a comprehensive, PERSONALIZED decision analysis.

Every single field must reference SPECIFIC details from their situation and conversation. NO generic advice. NO filler. If they mentioned their partner, name the dynamic. If they mentioned money, cite the specific tradeoff. If they expressed fear, name it.

Return JSON with these EXACT fields:

{
  "verdict": {
    "title": "A clear, specific title (e.g., 'Take the Berlin Job' or 'Stay and Renegotiate')",
    "recommendation": "Your clear recommendation with reasoning (3-4 sentences). Reference specific things they said. Be direct — they came here for clarity, not more confusion.",
    "confidence": "high|medium|low",
    "reversibility": "How easily can this be undone? Be specific to their situation."
  },
  "emotionalInsight": {
    "feeling": "Name the core emotion in their own words — quote them if possible",
    "explanation": "What this emotion reveals about their deeper needs (cite relevant psychology)",
    "hiddenDesire": "What they actually want but haven't said directly — the thing underneath the thing"
  },
  "coreConflict": {
    "sideA": "First side of their specific tension (2-4 words)",
    "sideB": "Other side of their specific tension (2-4 words)",
    "explanation": "Why this tension is genuinely difficult FOR THEM specifically"
  },
  "cognitiveDistortions": [
    {
      "bias": "Specific cognitive bias name",
      "evidence": "Direct quote or paraphrase from their words that reveals this bias",
      "impact": "How this specific bias is affecting THIS decision",
      "antidote": "A concrete exercise or reframe they can do right now",
      "research": "Citation (Author, Year)"
    }
  ],
  "tenTenTen": {
    "tenMinutes": "How will they feel about this decision in 10 minutes? Be specific to their emotional state.",
    "tenMonths": "What will their life look like in 10 months if they go with the recommended path?",
    "tenYears": "The 10-year compound effect — what matters and what won't?"
  },
  "preMortem": [
    {
      "failure": "A specific way this decision could go wrong (based on what they told you)",
      "probability": "low|medium|high",
      "earlyWarning": "What signal would they see first if this failure is happening?",
      "prevention": "One concrete action to prevent this"
    }
  ],
  "scenarios": {
    "best": "The realistic best-case outcome if everything goes well — be specific",
    "likely": "The most probable outcome based on what you know — be honest",
    "worst": "The realistic worst-case — not catastrophizing, but grounded"
  },
  "assumptions": [
    "A specific assumption they're making that might not be true (quote their words where possible)"
  ],
  "pathForward": [
    {"step": 1, "action": "Concrete action step specific to their situation", "why": "Psychology-grounded reason", "timeframe": "When to do this"}
  ],
  "blindSpots": [
    {"title": "Something they haven't considered", "insight": "Why it matters for THEIR specific situation"}
  ],
  "scores": {
    "emotionRisk": 0-100,
    "biasRisk": 0-100,
    "complexityScore": 0-100,
    "confidenceScore": 0-100,
    "clarityScore": 0-100,
    "urgencyScore": 0-100
  },
  "risks": [
    {"risk": "Specific risk from their situation", "likelihood": "low|medium|high", "probability": 10-90, "mitigation": "How to handle it"}
  ],
  "communityInsights": [
    {
      "insight": "A real perspective that people commonly share on Reddit/forums about this type of decision (be specific and realistic, as if quoting a real person)",
      "source": "The subreddit or forum where this kind of advice appears (e.g., r/careerguidance, r/personalfinance, r/relationships)",
      "sentiment": "supportive|cautionary|mixed",
      "upvotes": "Realistic upvote count (e.g., '2.4k', '847', '156')"
    }
  ],
  "crowdWisdom": {
    "sampleSize": "A realistic sample size relevant to THIS specific topic",
    "mainStat": "A compelling statistic DIRECTLY about the EXACT type of decision the user described — if they're asking about buying a tech gadget, cite tech purchase satisfaction stats; if about relationships, cite relationship research; if about career, cite career data. MUST match the user's actual topic, NOT a generic career-switching stat.",
    "secondaryStat": "A second stat that adds nuance, still about the SAME specific topic the user described",
    "insight": "What this data means for THIS user's specific situation — reference details they mentioned",
    "source": "A plausible research source relevant to the user's specific domain (e.g., tech purchases → Consumer Reports; relationships → Gottman Institute; finance → Federal Reserve survey)"
  },
  "optionComparison": {
    "optionA": "Name of the first option (the one they seem to lean toward)",
    "optionB": "Name of the second option (the alternative)",
    "dimensions": [
      {
        "label": "Dimension name (e.g., Financial Impact, Emotional Cost, Growth Potential, Relationship Impact, Risk Level, Values Alignment)",
        "optionA_score": "1-5 (1=poor, 5=excellent)",
        "optionB_score": "1-5",
        "optionA_detail": "One-sentence explanation specific to their situation",
        "optionB_detail": "One-sentence explanation specific to their situation"
      }
    ],
    "verdict": "One clear sentence summarizing which option wins overall and why, specific to their situation"
  },
  "reflectionQuestion": "ONE powerful question that cuts to the core of THEIR specific dilemma. Make them sit with it.",
  "devilsAdvocate": "The strongest 2-3 sentence argument AGAINST their likely preference. Be genuinely challenging."
}

CRITICAL RULES:
1. Every insight must reference something SPECIFIC from their description or conversation answers.
2. The 10-10-10, pre-mortem, and scenarios must be about THEIR actual situation, not generic templates.
3. Assumptions should quote or paraphrase things they actually said.
4. Be warm but have the courage to be direct. They need clarity, not comfort.
5. Cite psychology research where relevant (Kahneman, Tversky, Klein, Damasio, etc.)
6. For "scores": emotionRisk is based on their emotional intensity, biasRisk on how many biases detected, complexityScore on how many factors are at play, confidenceScore maps from your verdict confidence (high=80-95, medium=50-75, low=20-45), clarityScore on how well they understand their own needs, urgencyScore on time pressure.
7. For "communityInsights": Generate 3-4 realistic insights that sound like actual Reddit comments about this TYPE of decision. Reference specific subreddits relevant to their situation. Make them feel authentic — mix supportive and cautionary voices. Include realistic upvote counts.
8. For "risks": include a numeric probability (10-90) for each risk.
9. SAFETY: Never suggest, normalize, or provide tactical encouragement for illegal, violent, exploitative, or self-harm behavior.
10. SAFETY: For morally high-risk or illegal dilemmas, communityInsights must point to lawful support-oriented communities only (e.g., r/Advice, r/legaladvice, r/personalfinance, r/CareerGuidance, r/mentalhealth).
11. SAFETY: If the user mentions wrongdoing (e.g., theft), community insights should focus on safer alternatives, consequences, and support resources — never "how to" wrongdoing.`;

    const makeRequest = async (model) => {
        return createChatCompletion({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: analysisPrompt }
            ],
            model,
            temperature: 0.6,
            max_tokens: 3200
        });
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [3000, 6000, 12000]; // 3s, 6s, 12s

    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            let chatCompletion;
            try {
                chatCompletion = await makeRequest(MODEL);
            } catch (e) {
                if (e?.status === 429) throw e;
                console.warn(`70B failed (attempt ${attempt + 1}), trying 8B...`, e);
                chatCompletion = await makeRequest(FALLBACK_MODEL);
            }

            const text = chatCompletion.choices[0]?.message?.content || "";
            const analysis = extractJSON(text);
            const { items: safeCommunityInsights } = sanitizeCommunityInsights(analysis.communityInsights, {
                description,
                includeFallback: true
            });

            return {
                ...analysis,
                communityInsights: safeCommunityInsights,
                isAIGenerated: true,
                generatedAt: Date.now()
            };
        } catch (error) {
            lastError = error;
            console.warn(`Analysis attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error.status || error.message);

            // Don't retry on auth errors — those won't fix themselves
            if (error.status === 401) {
                throw new Error("Invalid API key. Please check your Groq API key in Settings.");
            }

            if (error.status === 429) {
                const waitMs = getRetryAfterMs(error, 30000);
                setRateLimitCooldown(waitMs);
                throw new Error(`Groq rate limit reached. Please wait ${Math.ceil(waitMs / 1000)} seconds and try again (free tier has usage limits).`);
            }

            // Retry on rate limits and transient errors
            if (attempt < MAX_RETRIES - 1) {
                console.log(`Waiting ${RETRY_DELAYS[attempt] / 1000}s before retry...`);
                await delay(RETRY_DELAYS[attempt]);
            }
        }
    }

    // All retries exhausted
    console.error("ANALYSIS ERROR (all retries failed):", lastError);
    if (lastError?.status === 429) {
        throw new Error("Groq rate limit reached. Please wait 30 seconds and try again (free tier has usage limits).");
    }
    throw new Error("Analysis failed after multiple attempts. Please try again in a moment.");
}

// ============================================
// FOLLOW-UP Q&A (Post-Analysis)
// ============================================

export async function askFollowUp({ description, analysis, topic, question, chatHistory = [] }) {
    if (!groq) throw new Error("AI not configured. Please add your Groq API key in Settings.");
    guardRateLimitCooldown();

    const verdict = analysis?.verdict;
    const emotionalInsight = analysis?.emotionalInsight;
    const coreConflict = analysis?.coreConflict;
    const cognitiveDistortions = analysis?.cognitiveDistortions || [];
    const scenarios = analysis?.scenarios;
    const tenTenTen = analysis?.tenTenTen;
    const blindSpots = analysis?.blindSpots || [];
    const pathForward = analysis?.pathForward || [];
    const risks = analysis?.risks || [];
    const preMortem = analysis?.preMortem || [];
    const devilsAdvocate = analysis?.devilsAdvocate;
    const reflectionQuestion = analysis?.reflectionQuestion;

    let analysisContext = `DECISION: "${description}"

ANALYSIS SUMMARY:`;

    if (verdict) analysisContext += `\nVerdict: ${verdict.title} — ${verdict.recommendation} (Confidence: ${verdict.confidence})`;
    if (emotionalInsight) analysisContext += `\nEmotional Insight: "${emotionalInsight.feeling}" — ${emotionalInsight.explanation}`;
    if (coreConflict) analysisContext += `\nCore Conflict: ${coreConflict.sideA} vs ${coreConflict.sideB} — ${coreConflict.explanation}`;
    if (cognitiveDistortions.length) analysisContext += `\nBiases Detected: ${cognitiveDistortions.map(b => `${b.bias} (${b.evidence})`).join('; ')}`;
    if (scenarios) analysisContext += `\nScenarios — Best: ${scenarios.best} | Likely: ${scenarios.likely} | Worst: ${scenarios.worst}`;
    if (tenTenTen) {
        const t = Array.isArray(tenTenTen) ? tenTenTen[0] : tenTenTen;
        if (t) analysisContext += `\n10-10-10: 10min: ${t.tenMinutes} | 10mo: ${t.tenMonths} | 10yr: ${t.tenYears}`;
    }
    if (blindSpots.length) analysisContext += `\nBlind Spots: ${blindSpots.map(b => b.title).join(', ')}`;
    if (pathForward.length) analysisContext += `\nPath Forward: ${pathForward.map(s => s.action).join(' → ')}`;
    if (risks.length) analysisContext += `\nRisks: ${risks.map(r => `${r.risk} (${r.likelihood})`).join('; ')}`;
    if (preMortem.length) analysisContext += `\nPre-Mortem: ${preMortem.map(p => p.failure).join('; ')}`;
    if (devilsAdvocate) analysisContext += `\nDevil's Advocate: ${devilsAdvocate}`;
    if (reflectionQuestion) analysisContext += `\nReflection Question: ${reflectionQuestion}`;

    const topicContext = topic && topic !== 'general'
        ? `\nThe user is specifically asking about the "${topic}" section of the analysis. Focus your answer on that area while still connecting to the bigger picture.`
        : '';

    const previousMessages = chatHistory.map(msg =>
        `User: ${msg.question}\nYou: ${msg.answer}`
    ).join('\n\n');

    const prompt = `${analysisContext}
${topicContext}
${previousMessages ? `\nPREVIOUS FOLLOW-UP CONVERSATION:\n${previousMessages}\n` : ''}
USER'S FOLLOW-UP QUESTION: "${question}"

INSTRUCTIONS:
- Answer their specific question using the analysis context above.
- Reference specific details from THEIR situation — never be generic.
- If they're challenging a point in the analysis, engage honestly — acknowledge if they have a valid point, or explain your reasoning further.
- Keep responses concise but substantive (2-4 paragraphs max).
- Maintain your role as a decision intelligence system grounded in psychology research.
- If relevant, cite specific frameworks or research.
- Be warm, direct, and genuinely helpful.
- SAFETY: Never provide tactical help, encouragement, or normalization for illegal, violent, exploitative, or self-harm behavior.
- SAFETY: If asked about wrongdoing, redirect to legal/safe alternatives, consequences, and immediate support resources.

Respond in plain text (no JSON). Speak naturally.`;

    try {
        const chatCompletion = await createChatCompletion({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ],
            model: MODEL,
            temperature: 0.7,
            max_tokens: 800
        });

        return enforceFollowUpSafety(chatCompletion.choices[0]?.message?.content);
    } catch (error) {
        if (error.status === 429) {
            const waitMs = getRetryAfterMs(error, 15000);
            setRateLimitCooldown(waitMs);
            throw new Error(`Rate limit reached. Please wait ${Math.ceil(waitMs / 1000)} seconds and try again.`);
        }
        if (error.status === 401) {
            throw new Error("Invalid API key. Please check your Groq API key in Settings.");
        }
        console.error("Follow-up failed, trying fallback model...", error);
        try {
            const fallback = await createChatCompletion({
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                model: FALLBACK_MODEL,
                temperature: 0.7,
                max_tokens: 800
            });
            return enforceFollowUpSafety(fallback.choices[0]?.message?.content);
        } catch {
            throw new Error("Failed to get a response. Please try again in a moment.");
        }
    }
}
