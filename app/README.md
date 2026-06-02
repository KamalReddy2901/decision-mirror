# Decision Mirror — AI-Powered Decision Intelligence

## The Problem

People make life-changing decisions — career moves, relationships, financial commitments — while blind to the cognitive biases distorting their thinking. Research shows humans are systematically irrational (Kahneman & Tversky, 1979), yet no accessible tool exists that combines **real decision science** with **AI personalization** to help ordinary people think more clearly.

Existing tools are either:
- Generic AI chatbots that just echo your thoughts back
- Rigid pro/con lists that ignore the emotional reality of decisions
- Expensive therapy sessions most people can't access

## The Solution

Decision Mirror is a **hybrid decision intelligence system** that combines a deterministic decision science engine with AI-powered personalized analysis. It's not a chatbot — it's a structured psychological intervention.

### How It Works (4-Step Flow)

1. **Describe** — User describes their decision situation naturally
2. **Emotional Check-In** — Affect labeling intervention (Lieberman et al., 2007) reduces emotional bias by up to 50%
3. **Guided Exploration** — AI asks 2-5 targeted questions to uncover hidden assumptions, fears, and desires
4. **Deep Analysis** — Dual-engine analysis combining AI insights with 6+ decision science frameworks

### What Makes This Different From a Chatbot

| Feature | Generic AI Chat | Decision Mirror |
|---------|----------------|-----------------|
| Cognitive bias detection | No | Yes — with research citations |
| Structured frameworks | No | 10-10-10, Pre-Mortem, Scenario Planning |
| Emotional state tracking | No | Yes — calibrates analysis to emotional intensity |
| Interactive assumptions audit | No | Yes — checkbox verification system |
| Multi-dimensional impact scoring | No | Yes — 6-axis radar chart |
| Deterministic + AI hybrid | No | Yes — local engine + Groq/Llama 3 |
| Privacy-first | Varies | All data stays in browser localStorage |

### Decision Science Frameworks Used

1. **Prospect Theory** (Kahneman & Tversky, 1979) — Detects loss aversion and risk framing
2. **Pre-Mortem Analysis** (Gary Klein, 1998) — Imagines failure to surface hidden risks
3. **10-10-10 Rule** (Suzy Welch) — Temporal perspective shifting
4. **Affect Heuristic** (Slovic, 2002) — Emotions as decision shortcuts
5. **Somatic Marker Hypothesis** (Damasio, 1994) — Gut feelings carry real information
6. **Cognitive Bias Detection** — Sunk Cost, Confirmation, Anchoring, Status Quo, Loss Aversion

### Architecture

```
User Input → Emotional Check-In → AI Questioning (Groq/Llama 3.1)
                                        ↓
                              AI Analysis Engine ←→ Local Decision Engine
                                        ↓
              Personalized Report (verdict, biases, scenarios, risks, path forward)
```

The **local decision engine** (`decisionEngine.js`) runs deterministic analysis: bias detection via NLP keyword patterns, multi-dimensional impact scoring, values alignment, opportunity cost calculation. The **AI engine** (`aiService.js`) provides personalized insights, emotional analysis, and deep psychological interpretation. Results are merged — AI content takes priority, local engine provides structure and fallbacks.

## Tech Stack

- **Frontend**: React 18 + Vite
- **AI**: Groq SDK + Llama 3.1 70B (with 8B fallback)
- **Charts**: Chart.js (Radar charts for impact visualization)
- **PDF**: jsPDF + html2canvas (comprehensive downloadable reports)
- **Storage**: localStorage (zero backend, full privacy)
- **Styling**: Custom CSS design system

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

- In production-safe mode (`VITE_AI_MODE=server`), users do **not** need to enter API keys.
- In client mode (`VITE_AI_MODE=client`), users can enter their own key in **Settings**.

## Environment Setup

### Recommended (public deployment, no user key friction)

Use server-proxy mode so your Groq key is never exposed to browsers.

1. Frontend env (public):

```bash
VITE_AI_MODE=server
VITE_AI_PROXY_PATH=/api/groq
```

2. Server/runtime env (private secret):

```bash
GROQ_API_KEY=your_server_side_groq_key
```

This repo includes `api/groq.js` (serverless proxy endpoint) with basic abuse controls:
- per-IP rate limiting
- payload validation + size guards
- retry-after propagation

In this mode, users can still optionally add their own key in **Settings** as a personal override (useful for extended individual limits), then switch back to server-managed mode anytime.

### Optional (client mode)

Only use this for private/internal usage where key exposure is acceptable.

1. Copy `.env.example` to `.env` (local) or add the same variable in your hosting dashboard.
2. Set:

```bash
VITE_AI_MODE=client
VITE_GROQ_API_KEY=your_groq_key_here
```

> `VITE_` variables are exposed to the browser bundle.

## Pre-Deploy Verification

Run this before every deploy:

```bash
npm run lint && npm run test && npm run build
```

## Deployment

Decision Mirror can run as:
- **SPA + serverless API (recommended)** for zero user key friction
- **Pure SPA** where users enter their own keys

### Build

```bash
npm run build
```

### API Key Rotation (NEW)

For high-traffic deployments, you can configure multiple API keys that automatically rotate when one hits rate limits:

**Single Key (backward compatible)**:
```bash
GROQ_API_KEY=gsk_your_key_here
```

**Multiple Keys (recommended for production)**:
```bash
GROQ_API_KEYS=gsk_key1,gsk_key2,gsk_key3
```

**How It Works**:
- When one key returns a 429 (rate limit) error, the system automatically switches to the next available key
- Each exhausted key enters a 65-second cooldown period before being retried
- Provides seamless failover with zero downtime for users
- Supports mixing free and paid tier keys for cost optimization

**Benefits**:
- ✅ No service interruptions during rate limit periods
- ✅ Higher aggregate throughput across multiple keys
- ✅ Automatic recovery after cooldown periods
- ✅ Works with both streaming and non-streaming responses

### Hosting Notes

- Ensure SPA fallback/rewrite to `index.html` for client-side routing.
- In server mode, set private `GROQ_API_KEY` in your host's server/runtime env settings.
- In client mode, `VITE_GROQ_API_KEY` is public in the frontend bundle.
- If rate limits occur, the app now auto-falls back to local analysis and supports in-app AI upgrade when cooldown ends.

### Cloudflare Pages (your setup)

This repo already includes a Cloudflare Pages Function proxy:
- `functions/api/groq.js`

Configure your Cloudflare Pages project:

1. **Build settings**
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`

2. **Environment variables**
   - `GROQ_API_KEY` = your secret Groq key (**server-side secret**, never exposed to users)
   - OR `GROQ_API_KEYS` = comma-separated list of API keys for automatic rotation (recommended for high-traffic deployments)
   - `VITE_AI_MODE` = `server`
   - `VITE_AI_PROXY_PATH` = `/api/groq`

3. **Deploy**
   - Push to your connected branch or trigger a manual deploy.

4. **Verify after deploy**
   - Open the app and run a decision without entering any API key.
   - Confirm AI works and settings show **Server Managed** mode.
   - Refresh deep URLs (like history/analysis) and confirm SPA routing works.

### Vercel Quick Setup (recommended)

This repo already includes:
- `api/groq.js` (proxy)
- `vercel.json` (SPA routing + API path handling)

Set env vars in Vercel project:
- `GROQ_API_KEY` (server secret) OR `GROQ_API_KEYS` (comma-separated for key rotation)
- `VITE_AI_MODE=server`
- `VITE_AI_PROXY_PATH=/api/groq`

**Live:** [mirrorwise.pages.dev](https://mirrorwise.pages.dev)
