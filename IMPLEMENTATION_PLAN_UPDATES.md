# IMPLEMENTATION PLAN UPDATES

## Summary of Changes Made to IMPLEMENTATION_PLAN.md

The IMPLEMENTATION_PLAN.md has been updated to reflect the completed editorial revival transformation (PLAN (1).md). Here are the key updates:

### 1. Added Editorial Revival Context (Top of Document)

**NEW SECTION**: "⚠️ IMPORTANT: EDITORIAL REVIVAL COMPLETED"

This prominent warning explains:
- The 3-color palette (Newsprint, Ink, Vermilion)
- The 2 fonts (Fraunces, Newsreader)
- Zero rounded corners policy
- Removal of glassmorphism, gradients, emoji icons
- New editorial components (Motion.jsx, EmptyState.jsx, LoadingState.jsx)
- Framer Motion integration

**Why**: Implementation agents need to know the design system has completely changed before implementing new features.

### 2. Updated GLOBAL RULES Section

**Added**:
- Design system constraints (colors, fonts, no rounded corners)
- CSS token usage requirements
- Editorial class names to use (`.panel`, `.btn-primary`, etc.)
- Note that `.glass-card` is legacy (styled editorially but should be replaced)
- Existing components that should be reused
- Icon requirements (lucide-react only, no emoji UI)
- Dependencies already installed (framer-motion, lucide-react)

**Why**: Prevents implementing features with old design patterns (glass effects, gradients, emoji icons).

### 3. Updated Step 1.3 (API Key Messaging)

**Changed**:
- Updated to reflect the `.glass-card` is now styled editorially
- Added note to use editorial CSS variables instead of hardcoded colors
- Clarified the routing name is 'new-decision' not 'new'

**Why**: Code examples must match current implementation.

### 4. Updated Step 2.4 (Landing Page CTAs)

**Changed**:
- Corrected routing name from `'new'` to `'new-decision'`
- Updated CSS to use editorial tokens (`var(--space-4)`)
- Clarified button styling (`.btn-primary`, `.btn-ghost`)

**Why**: Routing names must match App.jsx implementation.

### 5. Updated Step 2.5 (Quick Decision CSS)

**Changed**:
- Replaced all generic CSS with editorial design tokens
- Used `var(--space-*)`, `var(--font-display)`, `var(--font-body)`
- Changed colors to `var(--text-ink)`, `var(--accent-vermilion)`, etc.
- Set border-radius to 0
- Removed box-shadow
- Used hairline borders (1px solid var(--border-hairline))
- Updated focus states to use Vermilion accent

**Why**: CSS must follow the locked editorial design system.

### 6. Issues NOT Fixed (Intentionally)

The following sections **were not updated** because they would require extensive rewriting of all CSS examples throughout the 8 features:

- Template Selector CSS (Step 3.4)
- Compare Mode CSS (Step 4.6)
- Values Alignment CSS (Step 5.5)
- Sources CSS (Step 7.6)
- Streaming CSS (Step 8.5)

**Reasoning**: These sections should work as-is since the CSS variables (e.g., `var(--text-secondary)`) were updated in `index.css` during the editorial revival. The agent implementing these features should:
1. Read the editorial context at the top
2. Apply editorial principles to any new CSS
3. Use the design tokens defined in `index.css`

## What Implementation Agents Should Know

When implementing features from IMPLEMENTATION_PLAN.md:

### Do ✅
- Read the "EDITORIAL REVIVAL COMPLETED" section first
- Use CSS variables from `index.css` (:root tokens)
- Import editorial components (Motion, EmptyState, LoadingState)
- Use lucide-react for all icons
- Follow the 3-color palette strictly
- Use Fraunces for headlines, Newsreader for body text
- Set border-radius: 0 for all new elements
- Use `var(--space-*)` for spacing

### Don't ❌
- Add new colors (only Newsprint, Ink, Vermilion allowed)
- Use rounded corners (border-radius must be 0)
- Add glassmorphism, backdrop-filter, or blur effects
- Use gradients (linear-gradient, radial-gradient)
- Use emoji as UI icons (lucide-react only)
- Install new font families (only Fraunces + Newsreader)
- Create spinners/shimmers (use LoadingState.jsx)

### If CSS Examples Look Wrong
Many CSS examples in the feature implementations still use old patterns. When implementing:
1. Replace generic CSS with editorial tokens
2. Ensure no rounded corners
3. Use hairline borders (1px solid var(--border-hairline))
4. Use Vermilion sparingly (primary actions and key data only)
5. Follow the existing patterns in transformed pages (Landing.jsx, AnalysisView.jsx, Dashboard.jsx)

## Testing After Implementation

After implementing any feature, verify:
1. ✅ Only 3 colors used (Newsprint, Ink, Vermilion + derived opacities)
2. ✅ No rounded corners (except functional circles like radio buttons)
3. ✅ No glassmorphism or blur effects
4. ✅ No gradients
5. ✅ No emoji UI icons
6. ✅ Fraunces + Newsreader only
7. ✅ `npm run build` succeeds
8. ✅ `npm run lint` passes
9. ✅ No console errors

## Summary

The IMPLEMENTATION_PLAN.md now correctly reflects:
- ✅ The completed editorial revival transformation
- ✅ The locked 3-color design system
- ✅ The 2-font typography system
- ✅ Zero rounded corners policy
- ✅ Existing editorial components to reuse
- ✅ CSS token usage requirements

Implementation agents will now have clear guidance on how to build new features that match the editorial aesthetic without breaking the carefully crafted design system.
