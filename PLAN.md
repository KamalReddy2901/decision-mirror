# DECISION MIRROR — FULL REVIVAL: EXECUTION PLAN
# Audience: an implementation agent. Do not deliberate. Do exactly this, in order.
# Repo: KamalReddy2901/decision-mirror. App lives in `app/` (Vite + React 19, plain CSS, no Tailwind).
# Never push to main. Work on the current head branch, open/update a PR.

## GLOBAL RULES (apply to every step)
- DESIGN DIRECTION IS LOCKED: "Editorial / literary print" (think a serious essay or a therapist's
  notebook — the app reflects the user's own thoughts back as edited prose). Do not invent a different one.
- EXACTLY 3 COLORS. Defined below. Any other hex found in the codebase must be replaced or deleted.
  Secondary/tertiary text and hairlines are the INK color at reduced opacity — these do NOT count as new colors.
- FONTS ARE LOCKED: Display = "Fraunces" (Google), Body/UI = "Newsreader" (Google). Remove all others.
- ZERO rounded corners. Set every radius token to 0. Borders are 1px hairlines, not pills.
- DELETE entirely: all glassmorphism (backdrop-filter/blur), all gradients (text + background + buttons),
  the animated particle background, all radial "glow" effects, all box-shadow "glow" tokens.
- NO emojis as icons anywhere in the UI. Replace with: (a) lucide-react line icons, OR (b) typographic
  marks (numerals, section letters, em-dashes, the accent rule). Emojis may remain ONLY inside user-entered text.
- Replace generic 3-col card grids with the editorial layout motif (see Step 3).
- Use Framer Motion for all transitions. No CSS keyframe reveals.
- Semantic HTML + aria-label on every interactive element. Zero console errors / hydration warnings.

## LOCKED DESIGN TOKENS
Background  "Newsprint"  #F4F1EA  — warm paper; the reading surface; calm, non-screen, anti-AI.
Primary text "Ink"       #1A1714  — warm near-black; high-contrast editorial ink for long-form reading.
Accent      "Vermilion"  #C8412B  — the proofreader's red pen. ONLY for: primary actions, the single
                                     key datum per view, and critical/warning states. NEVER decorative.
Derived (allowed, same hues): ink @ 62% = secondary text; ink @ 38% = tertiary/captions;
ink @ 12% = hairlines/rules; ink @ 6% = hover wash; newsprint is the only fill.

## STEP 0 — SETUP (do first)
1. From `app/`, install: `framer-motion` and `lucide-react` using the repo's package manager
   (lockfile is package-lock.json → use npm). Confirm install before importing.
2. Add fonts via index.html <link> (preconnect + Fraunces with full optical/ital axis, Newsreader 200–700 + ital).
   Do NOT use next/font — this is Vite. Do not self-host.
3. Create a single source of truth: rewrite `app/src/index.css` :root tokens per the LOCKED tokens above.
   - Replace --bg-*, --text-*, --accent-* with the 3-color system (+ derived opacities).
   - Set --font-sans/serif/mono → only --font-display:'Fraunces'; --font-body:'Newsreader'.
   - Set every --radius-* to 0. Delete --gradient-*, --shadow-glow*, --glass-*.
   - Keep spacing scale. Replace ease tokens with editorial-feeling ones (see Step 3 motion).

## STEP 1 — AUDIT (produce findings, change nothing yet; write to PLAN-AUDIT.md, then continue)
Document concisely:
- Purpose & user: a decision-intelligence "thinking mirror" for anyone facing an emotionally-charged
  personal/professional choice; wants structured reflection, not chatbot advice.
- Current design language: dark void (#06060f), indigo→violet gradient (#6366f1/#a855f7), glassmorphism,
  particle background, Inter/Playfair/JetBrains Mono, emoji icons, rounded 8–24px, 6+ accent colors.
- Worst UI/UX problems (list all found): emoji-as-icons throughout (RESEARCH/STEPS/IMPACT_DIMS/follow-up
  topics/emotion labels); pervasive inline `style={{...}}` div-soup; 1453-line AnalysisView; purple-gradient
  + glass = generic AI look; gradient text in hero; fake staged percentage loader in NewDecision; plain
  "Loading analysis…" divs; alert()/confirm() in Dashboard & ValuesSetup; brand name inconsistency
  ("Decision Mirror" vs "MirrorWise"); README says Gemini but code uses Groq.
- Broken/incomplete flows: Settings opened via `document.querySelector('.nav-link[title="Settings"]').click()`
  (fragile DOM coupling); DecisionDetail renders its own header AND nests AnalysisView (double header risk);
  ValuesSetup save uses alert(); requires user-supplied API key with confusing provider messaging.
- a11y/console: missing aria-labels on icon buttons; emoji buttons unlabeled; verify no hydration/key warnings.

## STEP 2 — DESIGN SYSTEM (already decided above; just record the justification in PLAN-AUDIT.md)
- Aesthetic: Editorial/literary print. Inevitable because the product's core metaphor is a "mirror" that
  reflects the user's words back as considered prose — a magazine essay, not a dashboard.
- Fraunces (display): characterful old-style serif with a soul and a gorgeous italic — used for headlines,
  verdicts, and reflective prompts. Newsreader (body): designed for on-screen long-form reading — used for
  all body copy, data, labels, and UI. Two families only.
- Color justification recorded per token table above.

## STEP 3 — IMPLEMENTATION (file by file)

### 3a. Global shell — `app/src/index.css` + `app/src/App.jsx`
- index.css: replace tokens (Step 0.3). Body bg = Newsprint, color = Ink, font-family = Newsreader.
- ATMOSPHERE (required): give the page background texture via CSS only — choose ONE and apply globally:
  faint horizontal ruled lines (repeating-linear-gradient of ink @ ~6% every 32px) OR a subtle paper grain
  (tiny SVG noise data-URI at ~3% opacity). No gradients, no blobs.
- Typographic hierarchy (enforce ≥3 sizes + weight contrast): 
  H1/verdict = Fraunces 300–400, clamp(2.5rem,6vw,4.75rem), tight leading, -0.02em;
  Section titles = Fraunces, clamp(1.5rem,3vw,2rem); 
  Body = Newsreader 400, 1.0625rem, line-height 1.6;
  Eyebrow/labels = Newsreader 500, 0.75rem, uppercase, 0.16em tracking, ink @ 38%.
  Let type + rules do the work — no colored boxes for emphasis.
- App.jsx header: keep <header><nav>, but DELETE `.logo-icon` gradient circle and gradient `.logo-text`.
  Brand becomes wordmark "DECISION MIRROR" in Fraunces (pick ONE name — use "Decision Mirror" everywhere).
  Replace the ⚙️ settings button with a lucide `Settings` icon + aria-label="Open settings".
  Replace ☰/✕ with lucide `Menu`/`X`. Active nav item indicated by a 2px Vermilion underline, not a fill.
- Fix Settings coupling: lift `showSettings` (already in App state) and pass an `onOpenSettings` callback
  down to AnalysisView instead of `document.querySelector(...).click()`.
- Error boundary: remove emoji + hardcoded dark colors; restyle in editorial tokens; Fraunces heading.

### 3b. Reusable primitives (create these, then use them everywhere)
- `components/Motion.jsx`: small wrappers around framer-motion for page + item transitions (see Motion spec).
- Replace `.glass-card` everywhere with an editorial `.panel`: Newsprint fill, 1px ink@12% hairline border,
  radius 0, generous padding, NO blur, NO glow. Hover (only where interactive): hairline → Vermilion, a 2px
  Vermilion left-rule slides in. Keep one shared class; do not reintroduce shadows-as-glow.
- `components/EmptyState.jsx`: Fraunces *italic* line (e.g. "Nothing to reflect on yet.") + one accent action.
  Use it in Dashboard and anywhere lists can be empty. No plain divs, no emoji.
- `components/LoadingState.jsx`: typographic loader — NOT a spinner/shimmer. Cycle the existing analysis
  "stage" sentences in Fraunces italic with a blinking Vermilion caret / cursor rule. Use for analysis,
  follow-up, and Suspense fallbacks. Remove the fake percentage progress bar in NewDecision.

### 3c. Landing — `app/src/pages/Landing.jsx`
- Remove `<AnimatedBackground>` usage and gradient hero/badge/gradient-text.
- Hero = editorial masthead: oversized Fraunces headline, a thin Vermilion rule under a Newsreader
  standfirst, one primary CTA (Vermilion) + one text-link CTA. Wrap in <section>.
- Replace STEPS grid + RESEARCH `.science-grid` + comparison grid (all `repeat(auto-fit,minmax(...))`)
  with editorial layouts: STEPS = numbered ledger (01–04) as a single-column ruled list with hanging
  numerals. RESEARCH = a 2-column editorial index (framework left, finding/citation right) separated by
  hairlines — NOT cards. Comparison = a two-column "Chatbot | Decision Mirror" broadsheet table with a
  center hairline. Remove all emoji icons; use lucide where an icon is genuinely needed.
- ASYMMETRIC BREAK (required, one per major page): pull one research finding into a large Fraunces-italic
  pull-quote that bleeds across the grid's left margin.

### 3d. New Decision flow — `app/src/pages/NewDecision.jsx`
- Remove `<AnimatedBackground>`. Keep the 4-phase logic (describe→checkin→discuss→analyzing) intact.
- Step indicator: replace dot-circles with an editorial numbered rule (01 — Describe / 02 — Check In / …),
  current step marked by Vermilion. 
- Emotion check-in: keep the slider + EMOTION_LABELS data but strip emojis; show the label word in Fraunces
  and the description in Newsreader. The slider track/thumb styled in ink + Vermilion thumb.
- Question card: Fraunces question, textarea = ink-on-newsprint with a single bottom hairline (not a boxed
  input), focus = Vermilion underline. Buttons: primary Vermilion, secondary = underlined text link.
- Replace the fake staged percentage loader with `LoadingState` (typographic). Keep the real stage text.
- Wire/verify all buttons (Skip, Submit, retry-on-cooldown). Ensure error states use editorial styling.

### 3e. Analysis view — `app/src/pages/AnalysisView.jsx` (largest file; refactor as you restyle)
- Remove `<AnimatedBackground>`. Replace the legacy-format fallback styling with editorial.
- Convert the tabbed mass into an editorial long-read with section headers (Fraunces) + hairline dividers,
  each section a <section> with an <h2>. The Verdict is the masthead: Fraunces, with confidence shown as a
  single Vermilion key datum (the ONE accent per view rule — pick the verdict/confidence as the key datum).
- Radar chart (react-chartjs-2): recolor to the 3-color system — datasets in Ink at varying opacity + ONE
  Vermilion series; grid/labels in ink@ low opacity. Remove the indigo/violet/teal palette array.
- Scores: render as an editorial data table or ruled stat rows (label left, value right, hairline between),
  NOT colored chips. Emotion/bias/confidence badges → text + accent only on the critical one.
- Bias / pre-mortem / scenarios / 10-10-10 / path-forward: ruled lists, hanging labels, no cards, no emoji.
  FOLLOW_UP_TOPICS + IMPACT_DIMS: drop emoji, keep labels; use lucide icons only if needed.
- Buttons (Share/PDF/Markdown/Upgrade/Follow-up): primary = Vermilion, rest = underlined text actions.
  Share toast styled editorially. Replace `openSettings` DOM hack with the `onOpenSettings` prop from App.
- ASYMMETRIC BREAK: the reflectionQuestion as a full-bleed Fraunces-italic pull-quote between sections.

### 3f. Dashboard — `app/src/pages/Dashboard.jsx`
- Replace `.dashboard-stats` 2x2 card grid with a single ruled "ledger" header row of stats
  (big Fraunces numerals, small Newsreader labels, hairlines between).
- Replace `.decision-grid` cards with an editorial index/table of entries: title (Fraunces), excerpt, date,
  meta as small caps text; Vermilion only on "needs reflection" markers. Row hover = ink@6% wash + Vermilion
  left rule. Keep keyboard a11y (role/tabIndex/onKeyDown) and aria-labels.
- Replace confirm()/alert() with an in-app editorial confirm dialog (framer-motion) component.
- Empty state → `EmptyState` component (Fraunces italic).

### 3g. Values — `app/src/pages/ValuesSetup.jsx`
- Replace alert() with editorial inline "Saved" confirmation (animated). Sliders restyled ink + Vermilion thumb.
- Wrap in <main>/<section>, label each slider properly (aria), Fraunces page title.

### 3h. Decision detail — `app/src/pages/DecisionDetail.jsx`
- Remove the duplicate header wrapper so it doesn't double with AnalysisView's masthead; restyle editorially.

### 3i. Settings modal — `app/src/components/SettingsModal.jsx`
- Restyle to editorial (read full file first). Animate open/close with framer-motion (scale/opacity from
  the metaphor: a card sliding onto paper). aria-modal, focus trap, Esc to close, labeled inputs. No glass.

### 3j. Remove dead design code
- `components/AnimatedBackground.jsx` + `.css`: remove all imports/usages first, then delete the files.
- Delete now-unused CSS (gradients, glass, glow, particle grid, dot-circles) from index.css after migration.

## MOTION SPEC (Framer Motion — must feel editorial/physical, not translateY(-4px) hover)
- Page transitions: content "sets" like print — items animate in as a staggered cascade
  (opacity 0→1 + y 8px→0, stagger 0.04s, duration 0.5s, ease [0.16,1,0.3,1]). Wrap route switches in
  AnimatePresence keyed by `page`.
- Verdict/key data: a brief Vermilion underline that "draws" left→right (scaleX 0→1) on reveal.
- Hover (intentional, not opacity): list rows reveal a Vermilion left-rule (scaleY 0→1, transform-origin top);
  primary buttons depress with a tiny scale 0.98 + the accent fill shifting — no glow, no lift card.
- Loading: typographic — animated italic stage sentences + blinking caret (Step 3b LoadingState).
- Respect `prefers-reduced-motion`: gate all of the above.

## STEP 4 — QUALITY CHECK (must pass before opening PR)
1. `npm run build` and `npm run lint` from `app/` — zero errors/warnings. Open the running dev preview.
2. Use agent-browser to: snapshot + screenshot every route (landing, new-decision all 4 phases, analysis,
   dashboard, decision-detail, values, settings modal). Confirm: no purple, no glass, no emoji icons,
   no rounded corners, exactly the 3 colors, Fraunces+Newsreader only.
3. Console must be clean (no errors/hydration/key warnings) across the full journey.
4. Verify the end-to-end core journey works: describe → check-in → answer questions → analysis renders →
   save → appears in Dashboard → reopen from Dashboard → share link → PDF/Markdown export → reflect.
5. Confirm every interactive element has an aria-label and keyboard access; check reduced-motion.
6. Write the before/after summary of the 5 biggest improvements.
7. Commit with a clear message + `Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>` and push the
   feature branch; open/update the PR. Do not push to main.

## ACCEPTANCE CRITERIA (binary)
[ ] Only #F4F1EA / #1A1714 / #C8412B (+ ink opacities) appear in the codebase.
[ ] Only Fraunces + Newsreader load. No Inter/Playfair/JetBrains/system stacks.
[ ] No backdrop-filter, no linear/radial-gradient, no AnimatedBackground, no glow shadows, no border-radius>0.
[ ] No emoji rendered as a UI icon anywhere.
[ ] framer-motion drives all transitions; no leftover CSS keyframe reveals/spinners.
[ ] All pages use semantic landmarks; all controls labeled; console clean; full journey works.
