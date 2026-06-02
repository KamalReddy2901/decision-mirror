# DECISION MIRROR — PRODUCT FEATURES IMPLEMENTATION PLAN
# Audience: An implementation agent. Execute step-by-step without deviation.
# Repo: KamalReddy2901/decision-mirror. App lives in `app/` (Vite + React 19).
# Never push to main. Work on the current head branch, open/update a PR.

---

## ⚠️ IMPORTANT: EDITORIAL REVIVAL COMPLETED

**The design system has been completely transformed.** Before implementing features, understand these changes:

### Completed Editorial Transformation (from PLAN (1).md)
✅ **3-Color Palette**: Only #F4F1EA (Newsprint), #1A1714 (Ink), #C8412B (Vermilion) + derived opacities  
✅ **2 Fonts**: Fraunces (display/headlines), Newsreader (body/UI) — loaded via Google Fonts  
✅ **Zero Rounded Corners**: All `--radius-*` tokens set to 0. Borders are 1px hairlines  
✅ **No Glassmorphism**: All backdrop-filter, blur, and glass effects removed  
✅ **No Gradients**: Removed from text, backgrounds, and buttons  
✅ **No Emoji UI Icons**: Replaced with lucide-react line icons  
✅ **Editorial Components**: Motion.jsx, EmptyState.jsx, LoadingState.jsx created  
✅ **Framer Motion**: All transitions use framer-motion with editorial easing  

### Key Implementation Notes
1. **CSS Variables**: All design tokens in `app/src/index.css` `:root` — use them
2. **Legacy Classes**: `.glass-card` still exists in code but styled editorially. New features should use semantic markup with editorial styling
3. **Typography**: Use Fraunces for headlines/verdicts, Newsreader for body/labels
4. **Buttons**: `.btn`, `.btn-primary` (Vermilion), `.btn-ghost` (outlined)
5. **Spacing**: Use `var(--space-*)` tokens (1-10 scale)
6. **Colors**: Use `var(--text-ink)`, `var(--accent-vermilion)`, `var(--bg-newsprint)`, etc.
7. **Motion**: Import from `components/Motion.jsx` for page transitions

When implementing new features, **match the editorial aesthetic**:
- Hairline borders (1px, `var(--border-hairline)`)
- No rounded corners
- Generous whitespace
- Typographic hierarchy over colored boxes
- Vermilion only for primary actions and key data

---

## TABLE OF CONTENTS
1. [FEATURE 1: Kill API Key Requirement (Server-Side Proxy)](#feature-1-kill-api-key-requirement)
2. [FEATURE 2: Quick Decision Mode](#feature-2-quick-decision-mode)
3. [FEATURE 3: Decision Templates/Presets](#feature-3-decision-templatespresets)
4. [FEATURE 4: Head-to-Head Compare Mode](#feature-4-head-to-head-compare-mode)
5. [FEATURE 5: Values-Aware Scoring Everywhere](#feature-5-values-aware-scoring-everywhere)
6. [FEATURE 6: Reflection Memory](#feature-6-reflection-memory)
7. [FEATURE 7: Confidence + Sources](#feature-7-confidence--sources)
8. [FEATURE 8: Streaming Responses](#feature-8-streaming-responses)

---

## GLOBAL RULES (apply to every step)
- This is a Vite + React 19 app. Do NOT use Next.js patterns.
- **DESIGN SYSTEM**: The app uses an editorial/literary print aesthetic. Colors: #F4F1EA (Newsprint), #1A1714 (Ink), #C8412B (Vermilion). Fonts: Fraunces (display), Newsreader (body). NO rounded corners (radius: 0), NO glassmorphism, NO gradients.
- The app uses plain CSS in `app/src/index.css`. NO Tailwind. CSS uses design tokens defined in `:root`.
- **CSS CLASSES**: Use editorial classes (`.panel`, `.btn`, `.btn-primary`, `.btn-ghost`, etc.). The legacy `.glass-card` class still exists but should be replaced with semantic editorial markup in new features.
- All AI logic lives in `app/src/engine/aiService.js`. Storage is in `app/src/engine/storage.js`.
- Two server proxy stubs already exist: `app/api/groq.js` (Vercel) and `app/functions/api/groq.js` (Cloudflare Pages). Both are functional.
- User values are stored via `getUserValues()` / `saveUserValues()` from `app/src/engine/storage.js`.
- Decisions are stored via `saveDecision()` / `getDecisions()` / `getDecision()` / `updateDecision()`.
- The app uses a simple `onNavigate(page, data)` pattern for routing passed from `App.jsx`.
- Brand name is "Decision Mirror" everywhere. Unified in editorial revival.
- **EXISTING COMPONENTS**: `Motion.jsx`, `EmptyState.jsx`, `LoadingState.jsx`, `SettingsModal.jsx` already exist. Use them.
- **ICONS**: Use lucide-react for all UI icons. NO emojis in UI (emojis OK in user content only).
- Do NOT add any new dependencies unless explicitly specified. framer-motion and lucide-react are already installed.
- After completing each feature, verify: no console errors, no lint errors, feature works end-to-end.

---

## FEATURE 1: Kill API Key Requirement

### GOAL
Remove the user-supplied API key wall. The app should work instantly on first visit by routing all AI calls through the server proxy with the key stored server-side via environment variable `GROQ_API_KEY`.

### CURRENT STATE
- `app/src/engine/aiService.js` has dual modes: `client` (user provides key) and `server` (proxy).
- Mode is controlled by `VITE_AI_MODE` env var (defaults to `'client'`).
- Proxy path is `VITE_AI_PROXY_PATH` (defaults to `'/api/groq'`).
- The Settings modal (`app/src/components/SettingsModal.jsx`) shows an API key input field.
- `NewDecision.jsx` checks `isAIAvailable()` and blocks if no key.

### IMPLEMENTATION STEPS

#### Step 1.1: Change the default AI mode to 'server'
File: `app/src/engine/aiService.js`

Find this line:
```javascript
const AI_ACCESS_MODE = String(import.meta.env?.VITE_AI_MODE || 'client').trim().toLowerCase();
```

Replace with:
```javascript
const AI_ACCESS_MODE = String(import.meta.env?.VITE_AI_MODE || 'server').trim().toLowerCase();
```

This single change flips the default from "user must provide key" to "use server proxy".

#### Step 1.2: Update SettingsModal to hide API key input when in server mode
File: `app/src/components/SettingsModal.jsx`

Read the file first. Then:

1. Import `getAIAccessMode` at the top:
```javascript
import { getAIAccessMode } from '../engine/aiService';
```

2. Inside the component, get the mode:
```javascript
const aiMode = getAIAccessMode();
```

3. Find the API key input section (the fieldset or div containing "Groq API Key" label and input). Wrap it in a conditional:
```javascript
{aiMode === 'client' && (
  // existing API key input JSX
)}
```

4. Add an info message when in server mode, inside the same area:
```javascript
{aiMode === 'server' && (
  <div className="settings-info">
    <p>AI is configured server-side. No API key needed.</p>
  </div>
)}
```

#### Step 1.3: Update the "no API key" messaging in NewDecision
File: `app/src/pages/NewDecision.jsx`

The `apiReady` state check is already implemented. When server mode is default, the UI won't show API key prompts for most users.

Find the JSX block that shows the API key setup prompt (around line 531):

```javascript
{!apiReady && (
    <div className="setup-prompt glass-card" style={{...
```

Update it to check the AI mode:

```javascript
import { getAIAccessMode } from '../engine/aiService';

// Inside component:
const aiMode = getAIAccessMode();

// In JSX:
{!apiReady && aiMode === 'client' && (
    <div className="setup-prompt" style={{
        marginTop: var(--space-5)',
        background: 'var(--bg-hover-wash)',
        border: '1px solid var(--border-hairline)',
        padding: 'var(--space-5)'
    }}>
        <p style={{ color: 'var(--accent-vermilion)', fontSize: '0.95rem', marginBottom: 'var(--space-3)', fontWeight: 600 }}>
            Add your free Groq API key to get started
        </p>
        {/* rest of the prompt... */}
    </div>
)}
```

Note: The class should use editorial styling, not `.glass-card`.

#### Step 1.4: Ensure the proxy works
The proxy files already exist and are functional:
- `app/api/groq.js` (Vercel serverless function)
- `app/functions/api/groq.js` (Cloudflare Pages function)

Both check for `GROQ_API_KEY` environment variable. Ensure the deployment platform has this env var set.

No code changes needed here. Just verify the files exist and the logic is correct (they already are).

#### Step 1.5: Update error messages
File: `app/src/engine/aiService.js`

Find this error message:
```javascript
throw new Error("AI not configured. Please add your Groq API key in Settings.");
```

Replace with:
```javascript
throw new Error("AI service temporarily unavailable. Please try again.");
```

This appears in multiple places (around lines 234 and 393). Replace all occurrences.

#### VERIFICATION FOR FEATURE 1
1. Start the app with no `VITE_AI_MODE` env var set.
2. Confirm `getAIAccessMode()` returns `'server'`.
3. Open Settings modal — API key input should NOT appear; instead see "AI is configured server-side."
4. Start a new decision flow — should work without any API key prompt.
5. If `GROQ_API_KEY` is not set server-side, the proxy returns a 500 error. The app should show a graceful error message, not crash.

---

## FEATURE 2: Quick Decision Mode

### GOAL
Add a "Quick Decision" entry point: one text box, one tap, 30-second verdict. No emotional check-in, no multi-question conversation. Users can access the full flow for big decisions, but have a low-friction option for everyday choices.

### IMPLEMENTATION STEPS

#### Step 2.1: Create QuickDecision page component
File: `app/src/pages/QuickDecision.jsx` (NEW FILE)

```javascript
import { useState, useRef, useEffect } from 'react';
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
                analysis: analysis,
            });

            onNavigate('analysis', {
                analysis: analysis,
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
                <p className="subtitle">
                    Describe your dilemma. Get a verdict in 30 seconds.
                </p>
            </div>

            <div className="glass-card quick-card">
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
                    <button
                        className="btn btn-ghost"
                        onClick={() => onNavigate('landing')}
                        disabled={isAnalyzing}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={!description.trim() || isAnalyzing}
                    >
                        {isAnalyzing ? 'Thinking...' : 'Get Verdict'}
                    </button>
                </div>

                <p className="quick-hint">
                    Need deeper analysis? <button className="link-btn" onClick={() => onNavigate('new')}>Use full decision flow</button>
                </p>
            </div>
        </div>
    );
}
```

#### Step 2.2: Add generateQuickVerdict function to aiService
File: `app/src/engine/aiService.js`

Add this new function after the existing `generateAnalysis` function (around line 600):

```javascript
// ============================================
// QUICK VERDICT (30-second mode)
// ============================================

const QUICK_VERDICT_PROMPT = `You are a decisive advisor. The user needs a quick, clear verdict on a simple decision. No lengthy analysis — just actionable clarity.

Respond with JSON only:
{
  "title": "Clear action statement (e.g., 'Buy the headphones' or 'Skip the meeting')",
  "recommendation": "2-3 sentences explaining why. Be direct and specific.",
  "confidence": "high|medium|low",
  "reversibility": "One sentence: how easily can this be undone?",
  "keyConsideration": "The ONE thing that matters most for this decision",
  "oneThingToCheck": "One quick thing they should verify before acting",
  "biasRisk": 20-80 (number, how likely cognitive biases are affecting this)
}`;

export async function generateQuickVerdict(description, userValues = null) {
    guardRateLimitCooldown();

    const valuesContext = userValues
        ? `\nUser's stated priorities: ${Object.entries(userValues).map(([k, v]) => `${k}: ${v}/10`).join(', ')}`
        : '';

    try {
        const chatCompletion = await createChatCompletion({
            messages: [
                { role: "system", content: QUICK_VERDICT_PROMPT },
                {
                    role: "user",
                    content: `DECISION: "${description}"${valuesContext}\n\nGive me your quick verdict. JSON only.`
                }
            ],
            model: FALLBACK_MODEL, // Use faster 8B model for quick verdicts
            temperature: 0.5,
            max_tokens: 400
        });

        const text = chatCompletion.choices[0]?.message?.content || "";
        const parsed = extractJSON(text);

        return {
            title: parsed.title || 'Make your choice',
            recommendation: parsed.recommendation || 'Consider the practical implications and your gut feeling.',
            confidence: parsed.confidence || 'medium',
            reversibility: parsed.reversibility || 'Depends on the specific situation.',
            keyConsideration: parsed.keyConsideration || 'What matters most to you right now?',
            oneThingToCheck: parsed.oneThingToCheck || 'Sleep on it if you can.',
            biasRisk: typeof parsed.biasRisk === 'number' ? parsed.biasRisk : 40
        };
    } catch (error) {
        console.error("Quick verdict failed:", error);
        // Return a sensible fallback
        return {
            title: 'Pause and reflect',
            recommendation: 'The AI service encountered an issue. Take a moment to list pros and cons manually, then trust your gut.',
            confidence: 'low',
            reversibility: 'Unknown — consider whether this decision is reversible.',
            keyConsideration: 'What would you regret more: doing this or not doing it?',
            oneThingToCheck: 'Can you undo this if it goes wrong?',
            biasRisk: 50
        };
    }
}
```

Also add `generateQuickVerdict` to the exports if not using named exports already.

#### Step 2.3: Register QuickDecision page in App.jsx
File: `app/src/App.jsx`

1. Import the new component at the top:
```javascript
import QuickDecision from './pages/QuickDecision';
```

2. In the routing logic (the switch/case or if/else that renders pages based on `currentPage`), add:
```javascript
case 'quick':
    return <QuickDecision onNavigate={handleNavigate} />;
```

Or if using if/else:
```javascript
if (currentPage === 'quick') {
    return <QuickDecision onNavigate={handleNavigate} />;
}
```

#### Step 2.4: Add Quick Decision entry point on Landing page
File: `app/src/pages/Landing.jsx`

Find the hero section where the main CTA buttons are. The current buttons are:
- "Analyze a Decision" → should become "Deep Analysis"  
- "See the Science" → keep as is

Add a "Quick Verdict" button:

```javascript
<div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
    <button className="btn btn-primary btn-lg" onClick={() => onNavigate('new-decision')}>
        Deep Analysis
    </button>
    <button className="btn btn-primary btn-lg" onClick={() => onNavigate('quick')}>
        Quick Verdict
    </button>
    <button className="btn btn-ghost btn-lg" onClick={() => document.getElementById('science').scrollIntoView({ behavior: 'smooth' })}>
        See the Science
    </button>
</div>
```

Note: The current routing uses 'new-decision' not 'new'.

#### Step 2.5: Add CSS for QuickDecision
File: `app/src/index.css`

Add at the end of the file (using editorial design tokens):

```css
/* ============================================
   QUICK DECISION MODE
   ============================================ */

.quick-decision {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--space-7) var(--space-6);
}

.quick-header {
    text-align: center;
    margin-bottom: var(--space-7);
}

.quick-header h1 {
    font-family: var(--font-display);
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 300;
    margin-bottom: var(--space-3);
}

.quick-card {
    padding: var(--space-6);
    border: 1px solid var(--border-hairline);
    background: var(--bg-newsprint);
}

.quick-card .decision-textarea {
    min-height: 120px;
    font-size: 1.0625rem;
    font-family: var(--font-body);
    border: none;
    border-bottom: 1px solid var(--border-hairline);
    background: var(--bg-newsprint);
    color: var(--text-ink);
    width: 100%;
    padding: var(--space-4);
}

.quick-card .decision-textarea:focus {
    outline: none;
    border-bottom-color: var(--accent-vermilion);
}

.quick-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-4);
    margin-top: var(--space-5);
}

.quick-hint {
    text-align: center;
    margin-top: var(--space-5);
    font-size: 0.875rem;
    color: var(--text-tertiary);
}

.link-btn {
    background: none;
    border: none;
    color: var(--accent-vermilion);
    text-decoration: underline;
    cursor: pointer;
    font-size: inherit;
    padding: 0;
    font-family: var(--font-body);
}

.link-btn:hover {
    opacity: 0.8;
}
```

#### Step 2.6: Update AnalysisView to handle quick mode
File: `app/src/pages/AnalysisView.jsx`

When `analysis.quickMode === true`, the view should render a simplified version:
- Show the verdict prominently
- Show `keyConsideration` and `oneThingToCheck`
- Hide the full tabs/sections (biases, pre-mortem, etc.)
- Add a CTA: "Need deeper analysis? Run full analysis on this decision"

Find the main render section and add a conditional near the top:

```javascript
if (analysis?.quickMode) {
    return (
        <div className="analysis-view quick-analysis reveal visible">
            <div className="verdict-card glass-card">
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
                    <button className="btn btn-primary" onClick={() => onNavigate('new', { prefill: description })}>
                        Get Deep Analysis
                    </button>
                </div>
            </div>
        </div>
    );
}
```

Add CSS for `.quick-analysis` and `.quick-details` to `index.css`:

```css
.quick-analysis {
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

.quick-analysis .verdict-card {
    padding: 2.5rem;
}

.quick-analysis .verdict-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: var(--accent);
    color: white;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: 2px;
    margin-bottom: 1rem;
}

.quick-analysis .verdict-title {
    font-size: clamp(1.5rem, 4vw, 2.25rem);
    margin-bottom: 1rem;
}

.quick-analysis .verdict-recommendation {
    font-size: 1.125rem;
    line-height: 1.6;
    margin-bottom: 2rem;
}

.quick-details {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
    background: var(--bg-secondary);
    border-radius: 4px;
    margin-bottom: 2rem;
}

.quick-detail strong {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
}

.quick-detail p {
    margin: 0;
    font-size: 1rem;
}

.quick-analysis-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}
```

#### VERIFICATION FOR FEATURE 2
1. Click "Quick Verdict" from Landing page.
2. Enter a simple decision like "Should I order pizza tonight?"
3. Click "Get Verdict" — should return a verdict in ~5-10 seconds.
4. Verify the quick analysis view shows: title, recommendation, key consideration, one thing to check.
5. Click "Get Deep Analysis" — should navigate to full NewDecision flow.
6. Verify the decision is saved and appears in Dashboard.

---

## FEATURE 3: Decision Templates/Presets

### GOAL
Provide pre-built templates for common decisions: "Should I buy X?", "Take the job?", "Have the hard conversation?", "Send this message?" Each template has tailored questions and context.

### IMPLEMENTATION STEPS

#### Step 3.1: Create templates data
File: `app/src/engine/templates.js` (NEW FILE)

```javascript
/**
 * Decision Templates
 * Pre-built frameworks for common decision types.
 */

export const DECISION_TEMPLATES = [
    {
        id: 'purchase',
        name: 'Should I Buy This?',
        icon: '🛒',
        description: 'Evaluate a purchase decision',
        placeholder: 'Describe what you want to buy and why you are considering it...',
        prefillQuestions: [
            'How long have you wanted this? Is it an impulse or a considered desire?',
            'What would you do with the money if you didn\'t buy this?',
            'How will you feel about this purchase in 30 days?'
        ],
        contextPrompt: 'This is a PURCHASE decision. Focus on: value vs. cost, opportunity cost, emotional vs. practical need, buyer\'s remorse risk, and whether this is an impulse or considered purchase.'
    },
    {
        id: 'career',
        name: 'Take the Job?',
        icon: '💼',
        description: 'Evaluate a job or career opportunity',
        placeholder: 'Describe the opportunity and your current situation...',
        prefillQuestions: [
            'What are you running FROM vs. running TO? Be honest about the proportion.',
            'Describe your ideal Tuesday at work in this new role. Is it realistic?',
            'Who will be most affected by this change besides you?'
        ],
        contextPrompt: 'This is a CAREER decision. Focus on: growth trajectory, financial implications, work-life balance, alignment with long-term goals, and what they\'re leaving behind.'
    },
    {
        id: 'conversation',
        name: 'Have the Hard Conversation?',
        icon: '💬',
        description: 'Decide whether to have a difficult talk',
        placeholder: 'Describe the conversation you are considering having and with whom...',
        prefillQuestions: [
            'What\'s the best realistic outcome if you have this conversation?',
            'What\'s the cost of NOT having it — what continues or worsens?',
            'Are you ready to hear something you don\'t want to hear?'
        ],
        contextPrompt: 'This is a COMMUNICATION decision about a difficult conversation. Focus on: timing, emotional readiness of both parties, potential outcomes (best/worst/likely), the cost of silence, and whether the goal is to be heard or to change something.'
    },
    {
        id: 'message',
        name: 'Send This Message?',
        icon: '✉️',
        description: 'Decide whether to send a text, email, or DM',
        placeholder: 'Describe the message and the context — who it\'s to and why you\'re hesitating...',
        prefillQuestions: [
            'If they screenshot this and showed it to others, would you stand by every word?',
            'What response are you hoping for — and what will you do if you get silence?',
            'Is this message for THEM or for YOU?'
        ],
        contextPrompt: 'This is a COMMUNICATION decision about sending a message. Focus on: tone, timing, the recipient\'s likely state of mind, reversibility (can\'t unsend), and whether the user is seeking closure, validation, or genuine dialogue.'
    },
    {
        id: 'relationship',
        name: 'Stay or Go?',
        icon: '💔',
        description: 'Evaluate a relationship decision',
        placeholder: 'Describe the relationship and what you are considering...',
        prefillQuestions: [
            'If nothing changed in 2 years, would you still stay?',
            'What pattern from past relationships might be repeating here?',
            'Are you making this decision for yourself or to meet someone else\'s expectations?'
        ],
        contextPrompt: 'This is a RELATIONSHIP decision. Focus on: patterns, long-term compatibility, the difference between temporary problems and fundamental misalignment, fear of being alone vs. genuine assessment, and what "staying" actually looks like day-to-day.'
    },
    {
        id: 'commitment',
        name: 'Make the Commitment?',
        icon: '🤝',
        description: 'Evaluate a big commitment (move, contract, promise)',
        placeholder: 'Describe the commitment and what\'s holding you back...',
        prefillQuestions: [
            'What would need to be true for you to feel confident about this?',
            'What are you giving up by committing — and can you get it back later?',
            'Are you ready, or are you hoping you\'ll become ready after committing?'
        ],
        contextPrompt: 'This is a COMMITMENT decision. Focus on: reversibility, opportunity cost, whether they\'re ready NOW vs. hoping commitment will create readiness, the specific fears underlying hesitation, and the difference between healthy caution and avoidance.'
    }
];

export function getTemplate(id) {
    return DECISION_TEMPLATES.find(t => t.id === id) || null;
}

export function getTemplateContextPrompt(id) {
    const template = getTemplate(id);
    return template?.contextPrompt || '';
}
```

#### Step 3.2: Create TemplateSelector component
File: `app/src/components/TemplateSelector.jsx` (NEW FILE)

```javascript
import { DECISION_TEMPLATES } from '../engine/templates';

export default function TemplateSelector({ onSelect, onSkip }) {
    return (
        <div className="template-selector">
            <h2>What kind of decision?</h2>
            <p className="subtitle">Choose a template for tailored questions, or describe your own.</p>

            <div className="template-grid">
                {DECISION_TEMPLATES.map(template => (
                    <button
                        key={template.id}
                        className="template-card"
                        onClick={() => onSelect(template)}
                    >
                        <span className="template-icon">{template.icon}</span>
                        <span className="template-name">{template.name}</span>
                        <span className="template-desc">{template.description}</span>
                    </button>
                ))}
            </div>

            <button className="btn btn-ghost template-skip" onClick={onSkip}>
                Skip — I'll describe my own
            </button>
        </div>
    );
}
```

#### Step 3.3: Integrate templates into NewDecision flow
File: `app/src/pages/NewDecision.jsx`

1. Add imports at the top:
```javascript
import TemplateSelector from '../components/TemplateSelector';
import { getTemplateContextPrompt } from '../engine/templates';
```

2. Add state for selected template:
```javascript
const [selectedTemplate, setSelectedTemplate] = useState(null);
const [showTemplates, setShowTemplates] = useState(true);
```

3. Modify the phase logic. Before showing 'describe' phase, show template selection:

In the render section, before the `phase === 'describe'` block, add:
```javascript
{phase === 'describe' && showTemplates && (
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
)}

{phase === 'describe' && !showTemplates && (
    // existing describe phase content, but use template placeholder if selected
)}
```

4. When rendering the textarea in describe phase, use template placeholder:
```javascript
placeholder={selectedTemplate?.placeholder || "Describe your decision in as much detail as you'd like..."}
```

5. Pass template context to AI calls. Modify `generateNextQuestion` and `generateAnalysis` calls to include template context.

In `handleCheckinComplete`:
```javascript
const templateContext = selectedTemplate ? getTemplateContextPrompt(selectedTemplate.id) : '';
const firstQuestion = await generateNextQuestion(description, [], emotionalScore, templateContext);
```

In `handleSubmitAnswer`:
```javascript
const templateContext = selectedTemplate ? getTemplateContextPrompt(selectedTemplate.id) : '';
const nextQuestion = await generateNextQuestion(description, newHistory, emotionalScore, templateContext);
```

6. Update `generateNextQuestion` signature in aiService.js to accept optional `templateContext` parameter:

File: `app/src/engine/aiService.js`

Change function signature:
```javascript
export async function generateNextQuestion(description, history = [], emotionalScore = null, templateContext = '') {
```

Modify the prompt to include template context:
```javascript
const templateGuidance = templateContext
    ? `\n\nTEMPLATE CONTEXT: ${templateContext}`
    : '';

// In the user message:
content: `USER'S SITUATION: "${description}"${emotionalContext}${templateGuidance}${conversationSoFar}
...
```

#### Step 3.4: Add CSS for template selector
File: `app/src/index.css`

```css
/* ============================================
   TEMPLATE SELECTOR
   ============================================ */

.template-selector {
    max-width: 700px;
    margin: 0 auto;
    text-align: center;
    padding: 2rem 1rem;
}

.template-selector h2 {
    margin-bottom: 0.5rem;
}

.template-selector .subtitle {
    color: var(--text-secondary);
    margin-bottom: 2rem;
}

.template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.template-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 1rem;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s, transform 0.2s;
}

.template-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
}

.template-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
}

.template-name {
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
}

.template-desc {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.template-skip {
    margin-top: 1rem;
}
```

#### Step 3.5: Store template ID with decision
In `performAnalysis` in NewDecision.jsx, when saving the decision:
```javascript
saveDecision({
    title: verdictTitle,
    description: description,
    options,
    answers: history,
    emotionalScore,
    analysis: analysis,
    templateId: selectedTemplate?.id || null,
});
```

#### VERIFICATION FOR FEATURE 3
1. Navigate to "Deep Analysis" from Landing.
2. Template selector should appear first with 6 template options.
3. Select "Should I Buy This?" template.
4. Verify placeholder text changes to purchase-related prompt.
5. Complete the flow — verify AI questions are tailored to purchase context.
6. Verify "Skip" takes you to generic describe phase.

---

## FEATURE 4: Head-to-Head Compare Mode

### GOAL
Let users pit two concrete options side-by-side with weighted criteria. Show a clear comparison using the radar chart data that already exists, but make it the centerpiece.

### IMPLEMENTATION STEPS

#### Step 4.1: Create CompareMode page
File: `app/src/pages/CompareMode.jsx` (NEW FILE)

```javascript
import { useState, useEffect } from 'react';
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
            
            const comparison = await generateComparisonAnalysis(optionA, optionB, context, userValues);
            
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
                dimensions: IMPACT_DIMENSIONS.map((dim, i) => ({
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
                title: `${optionA} vs ${optionB}`,
                description: context || `Comparing: ${optionA} vs ${optionB}`,
                options: options,
                answers: [],
                emotionalScore: 50,
                analysis: analysis,
            });

            onNavigate('analysis', {
                analysis: analysis,
                title: `${optionA} vs ${optionB}`,
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

            <div className="glass-card compare-card">
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

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <div className="compare-actions">
                    <button
                        className="btn btn-ghost"
                        onClick={() => onNavigate('landing')}
                        disabled={isAnalyzing}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleCompare}
                        disabled={!optionA.trim() || !optionB.trim() || isAnalyzing}
                    >
                        {isAnalyzing ? 'Comparing...' : 'Compare'}
                    </button>
                </div>
            </div>
        </div>
    );
}
```

#### Step 4.2: Add generateComparisonAnalysis to aiService
File: `app/src/engine/aiService.js`

Add after `generateQuickVerdict`:

```javascript
// ============================================
// HEAD-TO-HEAD COMPARISON
// ============================================

const COMPARISON_PROMPT = `You are a decision analyst comparing two options head-to-head. Be specific and decisive.

Respond with JSON only:
{
  "winner": "The option name you recommend (exact text from input)",
  "reasoning": "2-3 sentences explaining why this option wins",
  "confidence": "high|medium|low",
  "reversibility": "Brief note on how reversible each choice is",
  "optionAScore": 1-100,
  "optionBScore": 1-100,
  "optionAPros": ["pro 1", "pro 2", "pro 3"],
  "optionACons": ["con 1", "con 2"],
  "optionBPros": ["pro 1", "pro 2", "pro 3"],
  "optionBCons": ["con 1", "con 2"],
  "tiebreaker": "If scores are close, what single factor should decide?",
  "valuesAlignment": "Which option better aligns with stated values and why (or null if no values provided)"
}`;

export async function generateComparisonAnalysis(optionA, optionB, context = '', userValues = null) {
    guardRateLimitCooldown();

    const valuesContext = userValues
        ? `\nUser's priorities: ${Object.entries(userValues).map(([k, v]) => `${k}: ${v}/10`).join(', ')}`
        : '';

    const contextStr = context ? `\nContext: ${context}` : '';

    try {
        const chatCompletion = await createChatCompletion({
            messages: [
                { role: "system", content: COMPARISON_PROMPT },
                {
                    role: "user",
                    content: `Compare these two options:\n\nOPTION A: "${optionA}"\nOPTION B: "${optionB}"${contextStr}${valuesContext}\n\nWhich should they choose? JSON only.`
                }
            ],
            model: MODEL,
            temperature: 0.6,
            max_tokens: 600
        });

        const text = chatCompletion.choices[0]?.message?.content || "";
        return extractJSON(text);
    } catch (error) {
        console.error("Comparison analysis failed:", error);
        throw error;
    }
}
```

Export it: add `generateComparisonAnalysis` to exports.

#### Step 4.3: Register CompareMode in App.jsx
File: `app/src/App.jsx`

1. Import:
```javascript
import CompareMode from './pages/CompareMode';
```

2. Add to routing:
```javascript
case 'compare':
    return <CompareMode onNavigate={handleNavigate} />;
```

#### Step 4.4: Add Compare Mode entry on Landing
File: `app/src/pages/Landing.jsx`

Update hero actions to include Compare:
```javascript
<div className="hero-actions">
    <button className="btn btn-primary" onClick={() => onNavigate('new')}>
        Deep Analysis
    </button>
    <button className="btn btn-secondary" onClick={() => onNavigate('quick')}>
        Quick Verdict
    </button>
    <button className="btn btn-ghost" onClick={() => onNavigate('compare')}>
        Compare Two Options
    </button>
</div>
```

#### Step 4.5: Update AnalysisView for compare mode
File: `app/src/pages/AnalysisView.jsx`

Add a conditional render for `analysis.compareMode`:

```javascript
if (analysis?.compareMode) {
    return (
        <div className="analysis-view compare-analysis reveal visible">
            <div className="compare-verdict glass-card">
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
                            {analysis.optionA?.pros?.map((pro, i) => (
                                <li key={i}>{pro}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="compare-cons">
                        <h3>Cons</h3>
                        <ul>
                            {analysis.optionA?.cons?.map((con, i) => (
                                <li key={i}>{con}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="compare-column option-b">
                    <h2>{analysis.optionB?.name}</h2>
                    <div className="compare-score">Score: {analysis.optionB?.score}/100</div>
                    <div className="compare-pros">
                        <h3>Pros</h3>
                        <ul>
                            {analysis.optionB?.pros?.map((pro, i) => (
                                <li key={i}>{pro}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="compare-cons">
                        <h3>Cons</h3>
                        <ul>
                            {analysis.optionB?.cons?.map((con, i) => (
                                <li key={i}>{con}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="compare-dimensions glass-card">
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
                <div className="tiebreaker glass-card">
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
```

#### Step 4.6: Add CSS for compare mode
File: `app/src/index.css`

```css
/* ============================================
   COMPARE MODE
   ============================================ */

.compare-mode {
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

.compare-header {
    text-align: center;
    margin-bottom: 2rem;
}

.compare-card {
    padding: 2rem;
}

.compare-inputs {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.compare-option {
    flex: 1;
}

.compare-option label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.compare-option input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-input);
    color: var(--text-primary);
}

.compare-vs {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--text-secondary);
    padding-top: 1.25rem;
}

.compare-context label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.compare-context textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-input);
    color: var(--text-primary);
    resize: vertical;
}

.compare-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

/* Compare Analysis View */
.compare-analysis {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

.compare-verdict {
    text-align: center;
    padding: 2rem;
    margin-bottom: 2rem;
}

.compare-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.compare-column {
    padding: 1.5rem;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 4px;
}

.compare-column h2 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
}

.compare-score {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 1rem;
}

.compare-pros h3,
.compare-cons h3 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.compare-pros ul,
.compare-cons ul {
    margin: 0 0 1rem 0;
    padding-left: 1.25rem;
}

.compare-pros li {
    color: var(--success);
}

.compare-cons li {
    color: var(--warning);
}

.compare-dimensions {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.compare-dimensions h3 {
    margin-bottom: 1rem;
}

.dimension-rows {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.dimension-row {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.dim-label {
    width: 120px;
    font-size: 0.875rem;
    flex-shrink: 0;
}

.dim-bars {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.dim-bar {
    height: 8px;
    border-radius: 4px;
}

.bar-a {
    background: var(--accent);
}

.bar-b {
    background: var(--text-secondary);
}

.dim-scores {
    width: 80px;
    text-align: right;
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.tiebreaker {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.tiebreaker h3 {
    margin-bottom: 0.5rem;
}

@media (max-width: 600px) {
    .compare-inputs {
        flex-direction: column;
    }
    .compare-vs {
        padding-top: 0;
    }
    .compare-grid {
        grid-template-columns: 1fr;
    }
}
```

#### VERIFICATION FOR FEATURE 4
1. Click "Compare Two Options" from Landing.
2. Enter "Stay at current job" vs "Accept new offer"
3. Add context about salary, commute, etc.
4. Click Compare — should generate comparison analysis.
5. Verify side-by-side display with scores, pros/cons, dimension bars.
6. Verify decision saved to Dashboard.

---

## FEATURE 5: Values-Aware Scoring Everywhere

### GOAL
The Values sliders already exist (`ValuesSetup.jsx`, stored via `getUserValues()`/`saveUserValues()`). But they barely influence output. Weight every verdict against user's stated priorities and show the math.

### CURRENT STATE
- `app/src/engine/decisionEngine.js` has `DEFAULT_VALUES` and `calculateValuesAlignment()` function.
- `app/src/engine/storage.js` has `getUserValues()` / `saveUserValues()`.
- Values are passed to `runFullAnalysis()` but the alignment calculation is basic.
- AI prompts don't meaningfully incorporate values.

### IMPLEMENTATION STEPS

#### Step 5.1: Enhance the values alignment calculation
File: `app/src/engine/decisionEngine.js`

Find `calculateValuesAlignment` function and enhance it:

```javascript
/**
 * Calculate detailed values alignment with explanation
 */
export function calculateValuesAlignment(options, impactScores, userValues) {
    if (!userValues || !impactScores || impactScores.length === 0) {
        return null;
    }

    const valueToImpactMapping = {
        'Growth': 'growth',
        'Security': 'financial',
        'Relationships': 'relationships',
        'Freedom': 'time',
        'Achievement': 'growth',
        'Health': 'emotional',
        'Adventure': 'growth',
        'Family': 'relationships',
        'Creativity': 'growth',
        'Stability': 'financial'
    };

    return impactScores.map((optionScore, index) => {
        const scores = optionScore.scores || {};
        let weightedSum = 0;
        let totalWeight = 0;
        const breakdown = [];

        Object.entries(userValues).forEach(([valueName, valueWeight]) => {
            const impactKey = valueToImpactMapping[valueName];
            const impactScore = scores[impactKey] || 5;
            const normalizedWeight = valueWeight / 10;
            
            weightedSum += impactScore * normalizedWeight;
            totalWeight += normalizedWeight;

            breakdown.push({
                value: valueName,
                weight: valueWeight,
                impact: impactScore,
                contribution: (impactScore * normalizedWeight).toFixed(1)
            });
        });

        const alignmentScore = totalWeight > 0 
            ? Math.round((weightedSum / totalWeight) * 10) 
            : 50;

        return {
            option: options[index] || `Option ${index + 1}`,
            alignmentScore,
            breakdown: breakdown.sort((a, b) => b.contribution - a.contribution),
            summary: alignmentScore >= 70 
                ? 'Strong alignment with your values'
                : alignmentScore >= 50 
                    ? 'Moderate alignment with your values'
                    : 'May conflict with some of your values'
        };
    });
}
```

#### Step 5.2: Pass values to all AI prompts
File: `app/src/engine/aiService.js`

Update `generateAnalysis` to include values in the prompt. Find the system prompt construction and add:

```javascript
export async function generateAnalysis(description, history = [], emotionalScore = null, userValues = null) {
    // ... existing code ...
    
    const valuesContext = userValues
        ? `\n\nUSER'S CORE VALUES (1-10 priority scale):\n${Object.entries(userValues).map(([k, v]) => `- ${k}: ${v}/10`).join('\n')}\n\nIMPORTANT: Your analysis and recommendations MUST account for these values. If a recommendation conflicts with a high-priority value (7+), explicitly acknowledge the trade-off.`
        : '';

    // Include valuesContext in the prompt
    const analysisPrompt = `USER'S SITUATION: "${description}"${emotionalContext}${valuesContext}${conversationContext}
    ...
    `;
```

Update the `generateAnalysis` function signature to accept userValues:
```javascript
export async function generateAnalysis(description, history = [], emotionalScore = null, userValues = null) {
```

#### Step 5.3: Update callers to pass userValues
File: `app/src/pages/NewDecision.jsx`

In `performAnalysis`, pass userValues to `generateAnalysis`:

Find:
```javascript
const aiAnalysis = await generateAnalysis(description, history, emotionalScore);
```

Replace with:
```javascript
const userValues = getUserValues();
const aiAnalysis = await generateAnalysis(description, history, emotionalScore, userValues);
```

(Note: `getUserValues` is already imported)

#### Step 5.4: Display values alignment in AnalysisView
File: `app/src/pages/AnalysisView.jsx`

Add a "Values Alignment" section. Find an appropriate place (after verdict, before biases) and add:

```javascript
{analysis.valuesAlignment && analysis.valuesAlignment.length > 0 && (
    <section className="analysis-section values-alignment">
        <h2>Values Alignment</h2>
        <p className="section-intro">How each option aligns with your stated priorities</p>
        
        <div className="values-cards">
            {analysis.valuesAlignment.map((item, i) => (
                <div key={i} className="values-card glass-card">
                    <h3>{item.option}</h3>
                    <div className="alignment-score">
                        <span className="score-value">{item.alignmentScore}%</span>
                        <span className="score-label">{item.summary}</span>
                    </div>
                    
                    <div className="values-breakdown">
                        {item.breakdown.slice(0, 5).map((b, j) => (
                            <div key={j} className="breakdown-row">
                                <span className="breakdown-value">{b.value}</span>
                                <div className="breakdown-bar">
                                    <div 
                                        className="breakdown-fill" 
                                        style={{ width: `${b.impact * 10}%` }}
                                    />
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
                <button className="link-btn" onClick={() => onNavigate('values')}>
                    Set your values
                </button> to get personalized alignment scores.
            </p>
        )}
    </section>
)}
```

Import `getUserValues` if not already:
```javascript
import { getUserValues } from '../engine/storage';
```

#### Step 5.5: Add values alignment CSS
File: `app/src/index.css`

```css
/* ============================================
   VALUES ALIGNMENT
   ============================================ */

.values-alignment {
    margin-bottom: 2rem;
}

.values-alignment .section-intro {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
}

.values-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
}

.values-card {
    padding: 1.5rem;
}

.values-card h3 {
    margin-bottom: 1rem;
    font-size: 1.1rem;
}

.alignment-score {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.alignment-score .score-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--accent);
}

.alignment-score .score-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.values-breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.breakdown-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.breakdown-value {
    width: 100px;
    font-size: 0.875rem;
    flex-shrink: 0;
}

.breakdown-bar {
    flex: 1;
    height: 6px;
    background: var(--bg-secondary);
    border-radius: 3px;
    overflow: hidden;
}

.breakdown-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
}

.breakdown-weight {
    width: 90px;
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-align: right;
}

.values-cta {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 4px;
    text-align: center;
}
```

#### Step 5.6: Prompt user to set values if not set
File: `app/src/pages/NewDecision.jsx`

After the describe phase, before checkin, add a gentle nudge:

```javascript
{phase === 'describe' && !showTemplates && !getUserValues() && (
    <div className="values-nudge">
        <p>
            Tip: <button className="link-btn" onClick={() => onNavigate('values')}>Define your values</button> for personalized recommendations.
        </p>
    </div>
)}
```

Add CSS:
```css
.values-nudge {
    text-align: center;
    padding: 0.75rem;
    background: var(--bg-secondary);
    border-radius: 4px;
    margin-top: 1rem;
    font-size: 0.875rem;
}
```

#### VERIFICATION FOR FEATURE 5
1. Go to Values page and set different priority levels.
2. Start a new decision with the full flow.
3. Complete analysis — verify "Values Alignment" section appears.
4. Verify breakdown shows your values and their impact scores.
5. Verify AI recommendation text mentions value trade-offs.
6. Clear values and verify the "set your values" CTA appears.

---

## FEATURE 6: Reflection Memory

### GOAL
Feed prior decisions and outcomes into the AI prompt so advice references the user's real history. The AI should know: "Last time you faced a similar career decision, you chose X and felt Y about it."

### IMPLEMENTATION STEPS

#### Step 6.1: Create function to get relevant history
File: `app/src/engine/storage.js`

Add a new function:

```javascript
/**
 * Get relevant past decisions for context
 * Returns decisions that might inform the current one
 */
export function getRelevantHistory(currentDescription, limit = 3) {
    const decisions = getDecisions();
    if (decisions.length === 0) return [];

    const currentLower = currentDescription.toLowerCase();
    const currentWords = new Set(currentLower.split(/\W+/).filter(w => w.length > 3));

    // Score each past decision by relevance
    const scored = decisions
        .filter(d => d.analysis && d.description) // Must have analysis
        .map(d => {
            const descLower = d.description.toLowerCase();
            const descWords = new Set(descLower.split(/\W+/).filter(w => w.length > 3));
            
            // Calculate word overlap
            let overlap = 0;
            currentWords.forEach(word => {
                if (descWords.has(word)) overlap++;
            });

            // Boost for same category
            const categoryMatch = d.analysis?.category?.type && 
                currentLower.includes(d.analysis.category.type);

            // Boost for having reflection (means we know the outcome)
            const hasOutcome = d.reflection?.outcome ? 1 : 0;

            return {
                decision: d,
                score: overlap + (categoryMatch ? 3 : 0) + (hasOutcome * 2)
            };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return scored.map(item => item.decision);
}

/**
 * Format past decisions for AI prompt context
 */
export function formatHistoryForPrompt(relevantDecisions) {
    if (!relevantDecisions || relevantDecisions.length === 0) return '';

    const formatted = relevantDecisions.map((d, i) => {
        const date = new Date(d.createdAt).toLocaleDateString();
        const verdict = d.analysis?.verdict?.title || 'Decision made';
        const outcome = d.reflection?.outcome || 'No outcome recorded';
        const satisfaction = d.reflection?.satisfaction 
            ? `Satisfaction: ${d.reflection.satisfaction}/10` 
            : '';
        const lesson = d.reflection?.lesson || '';

        return `Decision ${i + 1} (${date}):
- Situation: "${d.description.slice(0, 150)}${d.description.length > 150 ? '...' : ''}"
- Choice made: ${verdict}
- Outcome: ${outcome}
${satisfaction ? `- ${satisfaction}` : ''}
${lesson ? `- Lesson learned: ${lesson}` : ''}`;
    }).join('\n\n');

    return `\n\nUSER'S RELEVANT DECISION HISTORY:\n${formatted}\n\nUse this history to personalize your advice. Reference specific past decisions if relevant. If they made a similar choice before, acknowledge what happened.`;
}
```

#### Step 6.2: Integrate history into AI prompts
File: `app/src/engine/aiService.js`

Update `generateAnalysis` to use history:

Add import at top:
```javascript
import { getRelevantHistory, formatHistoryForPrompt } from './storage';
```

In `generateAnalysis`, add after getting userValues:
```javascript
const relevantHistory = getRelevantHistory(description);
const historyContext = formatHistoryForPrompt(relevantHistory);
```

Include in the prompt:
```javascript
const analysisPrompt = `USER'S SITUATION: "${description}"${emotionalContext}${valuesContext}${historyContext}${conversationContext}
...
`;
```

#### Step 6.3: Update generateNextQuestion to use history
File: `app/src/engine/aiService.js`

In `generateNextQuestion`, add similar history context:

```javascript
export async function generateNextQuestion(description, history = [], emotionalScore = null, templateContext = '') {
    // ... existing code ...
    
    const relevantHistory = getRelevantHistory(description, 2); // Fewer for questions
    const historyContext = relevantHistory.length > 0
        ? `\n\nUSER HAS MADE SIMILAR DECISIONS BEFORE:\n${relevantHistory.map(d => `- "${d.description.slice(0, 100)}..." → ${d.analysis?.verdict?.title || 'decided'}`).join('\n')}`
        : '';

    // Include in prompt
```

#### Step 6.4: Show history context in UI
File: `app/src/pages/NewDecision.jsx`

After the describe phase, if there's relevant history, show a subtle indicator:

Add state:
```javascript
const [relevantHistory, setRelevantHistory] = useState([]);
```

Add effect after description is entered:
```javascript
useEffect(() => {
    if (description.trim().length > 20) {
        const history = getRelevantHistory(description, 2);
        setRelevantHistory(history);
    } else {
        setRelevantHistory([]);
    }
}, [description]);
```

Import:
```javascript
import { getRelevantHistory } from '../engine/storage';
```

In the describe phase JSX, add:
```javascript
{relevantHistory.length > 0 && (
    <div className="history-context">
        <p>You've made similar decisions before. The AI will reference your history.</p>
    </div>
)}
```

Add CSS:
```css
.history-context {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: var(--bg-secondary);
    border-left: 3px solid var(--accent);
    border-radius: 0 4px 4px 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
}
```

#### VERIFICATION FOR FEATURE 6
1. Complete a decision and add a reflection with outcome.
2. Start a new decision with similar keywords.
3. Verify "You've made similar decisions before" appears.
4. Complete analysis — verify AI references past decision in its recommendation.
5. Check prompts in console (or add logging) to confirm history is included.

---

## FEATURE 7: Confidence + Sources

### GOAL
Make "what the data says" verifiable. Show why the AI believes what it believes with confidence indicators and research citations throughout.

### CURRENT STATE
- AI already generates `confidence` field and `research` citations in bias detection.
- `crowdWisdom` has a `source` field.
- Citations are scattered and not prominently displayed.

### IMPLEMENTATION STEPS

#### Step 7.1: Enhance AI prompt for better sourcing
File: `app/src/engine/aiService.js`

Update the main `SYSTEM_PROMPT` to emphasize sources:

```javascript
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
3. Name the specific cognitive bias if you detect one — ALWAYS cite the research (Author, Year).
4. Be warm but DIRECT. Have the courage to give a clear recommendation with reasoning.
5. Surface what the person is NOT saying — the unspoken fear or desire.
6. Always distinguish between reversible and irreversible decisions.
7. CITE YOUR SOURCES: When making claims about psychology, behavior, or statistics, reference the research.

YOUR VOICE:
- Speak like a wise mentor who has read all the research but talks like a human.
- Use concrete language, not platitudes. "You're afraid of being alone" not "there are emotional considerations."
- Short, punchy sentences mixed with deeper explanations.

CONFIDENCE LEVELS:
- "high" = Multiple frameworks point the same direction, clear evidence, low ambiguity
- "medium" = Mixed signals, some uncertainty, reasonable people could disagree  
- "low" = High ambiguity, insufficient information, significant unknowns

Always explain WHY you have the confidence level you do.`;
```

#### Step 7.2: Add confidence explanation to AI response schema
File: `app/src/engine/aiService.js`

In the analysis prompt, add to the verdict schema:
```javascript
"verdict": {
    "title": "...",
    "recommendation": "...",
    "confidence": "high|medium|low",
    "confidenceExplanation": "1-2 sentences explaining why this confidence level",
    "reversibility": "..."
},
```

#### Step 7.3: Create Sources component
File: `app/src/components/Sources.jsx` (NEW FILE)

```javascript
/**
 * Sources component — displays research citations used in analysis
 */
export default function Sources({ analysis }) {
    const sources = [];

    // Collect sources from cognitive distortions
    if (analysis?.cognitiveDistortions) {
        analysis.cognitiveDistortions.forEach(d => {
            if (d.research) {
                sources.push({
                    citation: d.research,
                    context: `Bias detection: ${d.bias}`
                });
            }
        });
    }

    // Collect from biases (local engine)
    if (analysis?.biases) {
        analysis.biases.forEach(b => {
            if (b.research) {
                sources.push({
                    citation: b.research,
                    context: `Bias framework: ${b.name}`
                });
            }
        });
    }

    // Collect from crowd wisdom
    if (analysis?.crowdWisdom?.source) {
        sources.push({
            citation: analysis.crowdWisdom.source,
            context: 'Statistical data'
        });
    }

    // Deduplicate by citation text
    const uniqueSources = [];
    const seen = new Set();
    sources.forEach(s => {
        if (!seen.has(s.citation)) {
            seen.add(s.citation);
            uniqueSources.push(s);
        }
    });

    if (uniqueSources.length === 0) return null;

    return (
        <section className="sources-section">
            <h3>Research Sources</h3>
            <ul className="sources-list">
                {uniqueSources.map((source, i) => (
                    <li key={i} className="source-item">
                        <span className="source-citation">{source.citation}</span>
                        <span className="source-context">{source.context}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
```

#### Step 7.4: Add Sources to AnalysisView
File: `app/src/pages/AnalysisView.jsx`

Import:
```javascript
import Sources from '../components/Sources';
```

Add at the bottom of the analysis, before actions:
```javascript
<Sources analysis={analysis} />
```

#### Step 7.5: Display confidence explanation
File: `app/src/pages/AnalysisView.jsx`

In the verdict section, add:
```javascript
{analysis.verdict?.confidenceExplanation && (
    <p className="confidence-explanation">
        <strong>Confidence: {analysis.verdict?.confidence}</strong> — {analysis.verdict.confidenceExplanation}
    </p>
)}
```

#### Step 7.6: Add CSS for sources
File: `app/src/index.css`

```css
/* ============================================
   SOURCES & CONFIDENCE
   ============================================ */

.confidence-explanation {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: var(--bg-secondary);
    border-radius: 4px;
    font-size: 0.9rem;
}

.confidence-explanation strong {
    text-transform: capitalize;
}

.sources-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
}

.sources-section h3 {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    margin-bottom: 1rem;
}

.sources-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.source-item {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color);
}

.source-item:last-child {
    border-bottom: none;
}

.source-citation {
    font-size: 0.875rem;
    font-style: italic;
}

.source-context {
    font-size: 0.75rem;
    color: var(--text-secondary);
}
```

#### VERIFICATION FOR FEATURE 7
1. Complete a full decision analysis.
2. Verify verdict shows confidence level with explanation.
3. Scroll to bottom — verify "Research Sources" section appears.
4. Verify sources show citation + context.
5. Check that biases section shows research citations inline.

---

## FEATURE 8: Streaming Responses

### GOAL
Stream the analysis as it arrives instead of waiting 15+ seconds with a fake progress bar. Render each section as it lands with editorial typography.

### IMPLEMENTATION STEPS

#### Step 8.1: Update server proxy to support streaming
File: `app/api/groq.js`

The existing proxy returns the full response. We need to support streaming. Add a new endpoint or modify:

```javascript
// Add at the top
const STREAM_ENABLED = true;

// In the handler, check for stream parameter
const wantsStream = payload.stream === true;

if (wantsStream && STREAM_ENABLED) {
    // Return streaming response
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serverKey}`
        },
        body: JSON.stringify({ ...payload, stream: true })
    });

    if (!upstream.ok) {
        const errorText = await upstream.text();
        return json(res, upstream.status, { error: errorText });
    }

    // Pipe the stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            res.write(chunk);
        }
        res.end();
    } catch (err) {
        console.error('Stream error:', err);
        res.end();
    }
    return;
}

// ... rest of existing non-streaming logic
```

#### Step 8.2: Add streaming client function to aiService
File: `app/src/engine/aiService.js`

Add a new streaming function:

```javascript
// ============================================
// STREAMING ANALYSIS
// ============================================

export async function generateAnalysisStream(description, history, emotionalScore, userValues, onChunk) {
    guardRateLimitCooldown();

    const emotionalContext = emotionalScore !== null
        ? `\nEMOTIONAL INTENSITY (self-reported): ${emotionalScore}/100`
        : '';

    const conversationContext = history.length > 0
        ? `\n\nDEEP-DIVE CONVERSATION (${history.length} exchanges):\n${history.map((h, i) => `Q${i+1}: ${h.question}\nUser said: "${h.answer}"`).join('\n\n')}`
        : '';

    const valuesContext = userValues
        ? `\n\nUSER'S CORE VALUES:\n${Object.entries(userValues).map(([k, v]) => `- ${k}: ${v}/10`).join('\n')}`
        : '';

    const relevantHistory = getRelevantHistory ? getRelevantHistory(description) : [];
    const historyContext = formatHistoryForPrompt ? formatHistoryForPrompt(relevantHistory) : '';

    // Use the existing analysis prompt
    const analysisPrompt = `USER'S SITUATION: "${description}"${emotionalContext}${valuesContext}${historyContext}${conversationContext}

TASK: Produce a comprehensive decision analysis. Return valid JSON with all required fields.`;

    const response = await fetch(SERVER_PROXY_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: analysisPrompt }
            ],
            model: MODEL,
            temperature: 0.7,
            max_tokens: 4000,
            stream: true
        })
    });

    if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                        fullText += content;
                        onChunk(content, fullText);
                    }
                } catch {
                    // Ignore parse errors in stream
                }
            }
        }
    }

    // Parse final JSON
    return extractJSON(fullText);
}
```

#### Step 8.3: Update NewDecision to use streaming
File: `app/src/pages/NewDecision.jsx`

Add state for streaming:
```javascript
const [streamingText, setStreamingText] = useState('');
const [isStreaming, setIsStreaming] = useState(false);
```

Modify `performAnalysis` to use streaming:

```javascript
const performAnalysis = async (history) => {
    setPhase('analyzing');
    setStreamingText('');
    setIsStreaming(true);
    setError(null);

    try {
        const userValues = getUserValues();
        
        const aiAnalysis = await generateAnalysisStream(
            description,
            history,
            emotionalScore,
            userValues,
            (chunk, fullText) => {
                setStreamingText(fullText);
            }
        );

        setIsStreaming(false);
        // ... rest of existing logic to save and navigate
```

Import the new function:
```javascript
import { generateAnalysisStream } from '../engine/aiService';
```

#### Step 8.4: Show streaming text in analyzing phase
File: `app/src/pages/NewDecision.jsx`

Update the analyzing phase render:

```javascript
{phase === 'analyzing' && (
    <div className="analyzing-phase">
        <h2>Analyzing your decision...</h2>
        
        {isStreaming && streamingText && (
            <div className="streaming-preview glass-card">
                <pre className="streaming-text">{streamingText}</pre>
            </div>
        )}
        
        {!isStreaming && !streamingText && (
            <div className="analyzing-status">
                <p>{analyzeStage || 'Starting analysis...'}</p>
            </div>
        )}
    </div>
)}
```

#### Step 8.5: Add CSS for streaming
File: `app/src/index.css`

```css
/* ============================================
   STREAMING ANALYSIS
   ============================================ */

.streaming-preview {
    max-height: 400px;
    overflow-y: auto;
    padding: 1.5rem;
    margin-top: 1.5rem;
}

.streaming-text {
    font-family: var(--font-mono, monospace);
    font-size: 0.8rem;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    color: var(--text-secondary);
}

.analyzing-status {
    text-align: center;
    padding: 2rem;
}

.analyzing-status p {
    font-style: italic;
    color: var(--text-secondary);
}
```

#### Step 8.6: Graceful fallback
If streaming fails, fall back to non-streaming. Wrap the streaming call in try-catch:

```javascript
try {
    const aiAnalysis = await generateAnalysisStream(...);
} catch (streamError) {
    console.warn('Streaming failed, falling back:', streamError);
    setIsStreaming(false);
    // Fall back to regular generateAnalysis
    const aiAnalysis = await generateAnalysis(description, history, emotionalScore, userValues);
    // ... continue with existing logic
}
```

#### VERIFICATION FOR FEATURE 8
1. Start a new decision and complete the conversation.
2. When analysis begins, verify text starts appearing progressively.
3. Verify the streaming preview shows raw JSON being built.
4. Verify analysis completes and navigates to AnalysisView.
5. If streaming fails, verify it falls back to non-streaming gracefully.

---

## FINAL QUALITY CHECK

After implementing all 8 features:

1. Run `npm run lint` and `npm run build` from `app/` — zero errors.
2. Test complete user journey:
   - Landing → Quick Decision → Quick Verdict view
   - Landing → Compare Mode → Comparison view
   - Landing → Deep Analysis → Template selection → Full flow → Analysis
3. Verify values affect recommendations visibly.
4. Verify past decisions are referenced in new analyses.
5. Verify sources appear at bottom of analysis.
6. Verify streaming works (or gracefully falls back).
7. Verify Settings modal hides API key input in server mode.
8. Console should be clean — no errors or warnings.

Commit message format:
```
feat: Add product features (quick mode, templates, compare, values, memory, streaming)

- Kill API key requirement (server proxy default)
- Add quick decision mode for 30-second verdicts
- Add 6 decision templates with tailored questions
- Add head-to-head compare mode
- Integrate values into all scoring and AI prompts
- Add reflection memory (past decisions inform current)
- Add confidence explanations and research sources
- Add streaming responses for analysis

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>
```

Push to feature branch and open/update PR. Do not push to main.

---

## END OF IMPLEMENTATION PLAN
