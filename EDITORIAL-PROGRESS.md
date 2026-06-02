# EDITORIAL REVIVAL — PROGRESS TRACKER

## ✅ COMPLETED (Builds Successfully)

### Phase 1: Foundations
- [x] Install framer-motion & lucide-react
- [x] Replace fonts: Fraunces + Newsreader in index.html
- [x] Rewrite index.css: 3-color system, paper texture, hairlines, zero radius
- [x] Create Motion.jsx, EmptyState.jsx, LoadingState.jsx components

### Phase 2: Core Pages
- [x] App.jsx: "DECISION MIRROR" wordmark, lucide icons (Settings, Menu, X), remove gradient logo
- [x] Landing.jsx: Editorial masthead, numbered ledger (01-04), 2-column research index, broadsheet comparison table, pull-quote
- [x] NewDecision.jsx: Remove emojis, editorial styling, typographic LoadingState, remove AnimatedBackground
- [x] Dashboard.jsx: Ruled ledger stats, editorial decision index, lucide Trash2 icon, inline confirm dialogs
- [x] ValuesSetup.jsx: Editorial sliders (Vermilion thumb), animated save confirmation (no alert())
- [x] SettingsModal.jsx: Editorial styling, ModalTransition, lucide icons (X, Settings)

## 🚧 IN PROGRESS / REMAINING

### Critical: AnalysisView.jsx (1453 lines)
**Current status:** Not yet transformed
**Required changes:**
- Remove AnimatedBackground usage
- Convert tabbed UI to editorial long-read with section headers (Fraunces) + hairline dividers
- Verdict = masthead with confidence as Vermilion key datum
- Radar chart: recolor to 3-color system (ink opacities + ONE Vermilion series)
- Scores: editorial data table / ruled stat rows (NOT colored chips)
- Bias/pre-mortem/scenarios: ruled lists, hanging labels, NO cards, NO emoji
- FOLLOW_UP_TOPICS + IMPACT_DIMS: drop emoji, use lucide icons sparingly
- Buttons: primary = Vermilion, rest = underlined text links
- Replace Settings DOM hack with onOpenSettings prop
- Pull-quote: reflectionQuestion as full-bleed Fraunces-italic

### Smaller Tasks
- [ ] DecisionDetail.jsx: Remove duplicate header wrapper
- [ ] Delete AnimatedBackground.jsx + AnimatedBackground.css entirely
- [ ] Verify all old CSS (gradients, glass, glows, particles) removed from index.css

## 📋 STEP 4: QUALITY CHECK (Before PR)
- [ ] `npm run build` — zero errors/warnings
- [ ] `npm run lint` — clean
- [ ] Dev preview: screenshot every route (landing, new-decision phases, analysis, dashboard, detail, values, settings)
- [ ] Confirm: no purple, no glass, no emoji icons, no rounded corners, only 3 colors, only 2 fonts
- [ ] Console: no errors/hydration/key warnings
- [ ] End-to-end journey: describe → check-in → answer → analysis → save → Dashboard → reopen → share → PDF/Markdown → reflect
- [ ] Accessibility: every interactive element has aria-label + keyboard access
- [ ] Reduced-motion: verify animations respect prefers-reduced-motion

## 📝 ACCEPTANCE CRITERIA (Binary Checklist)
- [ ] Only #F4F1EA / #1A1714 / #C8412B (+ ink opacities) appear in codebase
- [ ] Only Fraunces + Newsreader load (no Inter/Playfair/JetBrains)
- [ ] No backdrop-filter, no gradients, no AnimatedBackground, no glow shadows, no border-radius > 0
- [ ] No emoji rendered as UI icon anywhere
- [ ] framer-motion drives all transitions (no leftover CSS keyframe reveals/spinners)
- [ ] All pages use semantic landmarks; all controls labeled; console clean; full journey works

## 🎯 NEXT STEPS
1. Transform AnalysisView.jsx (largest remaining file)
2. Update DecisionDetail.jsx
3. Delete AnimatedBackground files
4. Run full quality check
5. Open PR with before/after summary

## 📊 ESTIMATED COMPLETION
- AnalysisView transformation: ~30-45 min (largest file, needs refactoring)
- DecisionDetail + cleanup: ~10 min
- Quality check + testing: ~15 min
- **Total remaining: ~1 hour**
