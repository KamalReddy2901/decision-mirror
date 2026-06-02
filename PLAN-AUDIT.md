# DECISION MIRROR — EDITORIAL REVIVAL AUDIT

## PURPOSE & USER
A decision-intelligence "thinking mirror" for anyone facing an emotionally-charged personal or professional choice. Wants structured reflection, not chatbot advice. Core value: the app reflects the user's own thoughts back as considered prose—a magazine essay about their decision, not a dashboard with AI advice.

## CURRENT DESIGN LANGUAGE (PRE-REVIVAL)
- **Colors**: Dark void (#06060f), indigo→violet gradient (#6366f1/#a855f7), 6+ accent colors (teal #2dd4bf, amber #fbbf24, rose #f43f5e, emerald #34d399)
- **Fonts**: Inter (sans), Playfair Display (serif), JetBrains Mono (mono)
- **Visual style**: Glassmorphism (backdrop-filter blur), particle canvas background, gradient text, gradient buttons, radial glow effects, heavy box-shadow glows
- **Border radius**: 8–24px throughout (rounded corners everywhere)
- **Icons**: Emoji used as UI icons throughout (⚙️, ☰, ✕, 🧠, ⚖️, 💀, ⏰, 🔍, 🌡️, 💬, 🪞, 🎯, etc.)

## WORST UI/UX PROBLEMS FOUND

### Design Issues
1. **Emoji-as-icons everywhere**: Research steps (🧠⚖️💀⏰🔍🌡️), process steps (💬🌡️🪞🎯), settings button (⚙️), mobile menu (☰✕), emotion labels (🧊🌊⚖️🌡️🔥), science cards, etc. No semantic meaning, poor a11y.
2. **Purple-gradient + glass = generic AI look**: Indistinguishable from every other AI product. Nothing conveys the "mirror" / editorial / reflection metaphor.
3. **Gradient text in hero**: `.gradient-text` class uses `-webkit-background-clip: text` with the indigo/violet gradient—overused AI aesthetic.
4. **Pervasive inline style div-soup**: Landing.jsx has large inline `style={{...}}` blocks for comparison grids, CTA sections, stats rows.
5. **6+ accent colors**: Violates simplicity—indigo, violet, teal, amber, rose, emerald all compete for attention.

### Code Quality Issues
6. **1453-line AnalysisView.jsx**: Monolithic component, hard to maintain, not refactored.
7. **Fake staged percentage loader in NewDecision**: `analyzeProgress` increments on a timer, not tied to actual work—misleading UX.
8. **Plain "Loading analysis…" divs**: No proper loading state component, just inline text divs.
9. **alert()/confirm() in Dashboard & ValuesSetup**: Native browser alerts instead of in-app modals—breaks design consistency.
10. **Brand name inconsistency**: "Decision Mirror" in spec vs "MirrorWise" in code (index.html, Landing.jsx, App.jsx).
11. **README says Gemini but code uses Groq**: Documentation drift.

### Fragile Patterns
12. **Settings opened via DOM coupling**: `document.querySelector('.nav-link[title="Settings"]').click()` in NewDecision and AnalysisView—brittle.
13. **DecisionDetail renders its own header AND nests AnalysisView**: Risk of double header rendering.

### Accessibility Issues
14. **Missing aria-labels on icon buttons**: Settings (⚙️), mobile menu (☰/✕) have aria-label but emoji icon buttons in Landing/steps do not.
15. **Emoji buttons unlabeled**: No screen-reader text for emoji-based UI elements.

## DESIGN SYSTEM JUSTIFICATION (LOCKED)

### Aesthetic: Editorial / Literary Print
**Why**: The product's core metaphor is a "mirror" that reflects the user's words back as considered prose—a magazine essay or therapist's notebook, not a dashboard. The app is about *reading yourself*, not interacting with an AI chatbot. This demands:
- Warm, calm reading surfaces (not dark voids)
- High-contrast editorial ink for long-form reading
- Typographic hierarchy doing the heavy lifting (not colored boxes)
- Ruled lines, hairlines, section breaks (not rounded cards)

### Typography
- **Fraunces (display)**: Characterful old-style serif with a soul and gorgeous italic. Used for headlines, verdicts, reflective prompts. Conveys thoughtfulness and literary quality.
- **Newsreader (body)**: Designed specifically for on-screen long-form reading. Used for all body copy, data, labels, UI.
- **Two families only**: Simplicity. No Inter, no Playfair, no JetBrains Mono.

### Color System (3 colors + derived opacities)
- **#F4F1EA Newsprint**: Warm paper reading surface. Calm, non-screen, anti-AI aesthetic. The inevitable background for a product about reflection.
- **#1A1714 Ink**: Warm near-black for high-contrast editorial ink. Long-form reading demands it.
- **#C8412B Vermilion**: The proofreader's red pen. Used ONLY for primary actions, the single key datum per view, and critical states. Never decorative. The accent that matters.
- **Derived**: Ink @ 62% = secondary text, Ink @ 38% = tertiary/captions, Ink @ 12% = hairlines, Ink @ 6% = hover wash. Newsprint is the only fill.

### No Rounded Corners, No Glass, No Gradients
- **Border radius = 0**: Editorial aesthetic is rectilinear. Rounded corners signal "friendly app"; editorial signals "serious thought".
- **No glassmorphism**: Backdrop-filter removed entirely—it's a tech-forward effect, not editorial.
- **No gradients**: Text gradients, background gradients, button gradients all removed. Flat color + type hierarchy only.
- **No glow shadows**: Editorial uses hairlines and rules, not glowing boxes.

### Motion: Editorial, Not Bounce
- **Framer Motion**: All transitions via framer-motion, not CSS keyframes. Content "sets" like print—staggered cascade (opacity 0→1, y 8px→0, stagger 0.04s, ease [0.16,1,0.3,1]).
- **Hover intentionality**: List rows reveal a Vermilion left-rule (scaleY 0→1); primary buttons depress (scale 0.98). No lift, no glow.
- **Loading = typographic**: Animated italic stage sentences with a blinking Vermilion caret/cursor rule. No spinners, no shimmers.

## ACCEPTANCE CRITERIA SUMMARY
- [ ] Only 3 colors: #F4F1EA, #1A1714, #C8412B (+ ink opacities)
- [ ] Only Fraunces + Newsreader fonts
- [ ] No backdrop-filter, no gradients, no AnimatedBackground, no glow shadows, no border-radius > 0
- [ ] No emoji rendered as UI icons
- [ ] framer-motion drives all transitions
- [ ] All pages semantic + labeled; console clean; full journey works
