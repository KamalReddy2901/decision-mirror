# Decision Mirror — Product Strategy: From One-Off Utility to Daily Habit

Right now the app is a one-off "analyze a heavy decision" utility. To make people reach for it instead of a generic AI chat, it needs to become a **habit, a record, and a system that gets smarter about *them*.**

## Remove all friction to start

**Kill the user-supplied API key requirement.** There are already `app/api/groq.js` and `app/functions/api/groq.js` proxy stubs — route AI calls through a server proxy with the key server-side so it works instantly on first visit. The key wall is the single biggest reason a casual user bounces.

**Add a "quick decision" mode** (one box, one tap → 30-second verdict) alongside the deep 4-step flow. Daily use needs a low-effort entry point; the full ritual is for big calls.

**Make it an installable PWA with offline support** — daily tools live on the home screen.

---

## Turn it into a record that compounds (the real moat vs. a chatbot)

### Outcome tracking + calibration score
After a decision, prompt "what actually happened?" weeks later. Show the user how well-calibrated their gut was over time. A chatbot can't do this — it doesn't remember you.

### Decision journal analytics
Recurring biases, emotional patterns ("you decide worse when 'Heated'"), categories you struggle with, time-of-day trends. Surface this as a simple weekly email or in-app dashboard.

### Reflection reminders / nudges
The data already flags decisions "needing reflection" — surface it via scheduled notifications/email so people come back. Operationalize the app's own advice.

---

## Make everyday decisions feel native

### Templates / presets
"Should I buy X?", "Take the job?", "Have the hard conversation?", "Send this message?" — each with tailored questions. Lowers the blank-page cost.

### Head-to-head compare mode
Pit two concrete options side-by-side with weighted criteria (the radar/impact data already exists — make it the centerpiece, not a sub-section). Let users decide "should I go with Plan A or Plan B?"

### Values-aware scoring everywhere
The Values sliders exist but barely influence output — weight every verdict against the user's stated priorities and show the math. Users should feel their values reflected in the advice.

### "Cool-down" feature
For high-emotion scores, let users schedule the decision for later and get pinged — operationalize the hot-cold empathy gap the app preaches.

---

## Trust, privacy, portability

**Sync across devices (optional account)** so the journal isn't trapped in one browser's localStorage; keep a strict local-only mode for privacy-first users.

**Export/import the full journal** (JSON), not just per-decision PDF. Portability = trust.

**A weekly "decision digest" email** recapping what you decided and what's due for reflection. Bring people back without ads.

---

## Sharpen the AI so it beats a raw chat

### Reflection memory
Feed prior decisions/outcomes into the prompt so advice references the user's real history, not generic frameworks.

### Confidence + sources
Keep the research-citation framing but make "what the data says" verifiable. Show why the AI believes what it believes.

### Streaming responses
Make the analysis feel alive instead of a 15-second fake progress bar. Render as it arrives, with the editorial typography showing each section as it lands.

---

## The throughline

A chatbot gives you a paragraph and forgets you. **Decision Mirror should remember every choice, score your judgment over time, and nudge you back** — that's what earns a daily open.

The best products are the ones you use even when you don't need them because they make you smarter about yourself. This is that.
