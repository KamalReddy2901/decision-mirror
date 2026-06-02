  
## PROJECT NAME: ‘Decision Mirror’
## PROJECT SPECIFICATION: Decision Intelligence App  
## PROJECT OVERVIEW  
Build a web application that helps users make better decisions by applying psychological decision-science frameworks. The app guides users through structured reasoning, surfaces cognitive biases, and provides multi-dimensional analysis of their choices.  
## CORE USER FLOW  
1. User describes their decision dilemma (free text input)  
2. AI categorizes decision type and stakes level  
3. Optional: AI asks 3-5 clarifying questions (user can skip)  
4. AI generates comprehensive analysis using multiple frameworks  
5. User receives structured recommendation  
6. 24 hours later: user receives reflection prompt (not sure if this is needed…)  
## TECHNICAL STACK  
**Frontend:**  
* Framework: Next.js 14+ (React)  
* Styling: Tailwind CSS  
* UI Components: shadcn/ui  
* State Management: React Context + hooks  
* Deployment: Vercel  
**Backend:**  
* Runtime: Node.js 20+  
* Framework: Express.js  
* Database: PostgreSQL (via Prisma ORM)  
* Caching: Redis (optional for MVP)  
* AI Integration: Anthropic Claude API (claude-sonnet-4-5)  
* Deployment: Railway or Render  
**Authentication:**  
* Auth provider: Clerk  
* Session management: JWT tokens  
**Additional Services:**  
* Email notifications: Resend or SendGrid  
* Analytics: PostHog (privacy-focused)  
## DATABASE SCHEMA  
```
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  createdAt     DateTime @default(now())
  decisions     Decision[]
  values        UserValues?
  subscription  Subscription?
}

model UserValues {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  values    Json     // {family: 9, autonomy: 7, security: 8, growth: 6, etc}
  updatedAt DateTime @updatedAt
}

model Decision {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  title           String
  description     String
  decisionType    String   // career, financial, relationship, lifestyle, purchase, etc
  stakesLevel     String   // low, medium, high
  options         Json     // Array of options being considered
  questions       Json?    // Questions asked and answers given
  analysis        Json     // Full analysis output
  assumptions     Json     // Explicit assumptions made
  recommendation  String?
  userChoice      String?  // What they actually decided
  reflectionSent  Boolean  @default(false)
  reflectionData  Json?    // Their reflection after 24hrs
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Subscription {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  tier      String   // free, pro
  status    String   // active, cancelled, expired
  startDate DateTime
  endDate   DateTime?
}

```
## API ENDPOINTS  
**Authentication:**  
* POST /api/auth/signup - Create new user  
* POST /api/auth/login - Login user  
* POST /api/auth/logout - Logout user  
* GET /api/auth/me - Get current user  
**Decisions:**  
* POST /api/decisions - Create new decision  
* GET /api/decisions - Get user's decisions (paginated)  
* GET /api/decisions/:id - Get specific decision  
* PATCH /api/decisions/:id - Update decision (add reflection, user choice)  
* DELETE /api/decisions/:id - Delete decision  
**Analysis:**  
* POST /api/analyze/categorize - Categorize decision type and stakes  
* POST /api/analyze/questions - Generate clarifying questions  
* POST /api/analyze/comprehensive - Run full analysis  
* POST /api/analyze/quick - Skip questions, run direct analysis  
**User:**  
* GET /api/user/values - Get user values  
* PUT /api/user/values - Update user values  
* GET /api/user/stats - Get decision statistics  
**Subscription:**  
* POST /api/subscription/create - Create subscription  
* POST /api/subscription/cancel - Cancel subscription  
* GET /api/subscription/status - Get subscription status  
## FRONTEND STRUCTURE  
```
/app
  /(auth)
    /login - Login page
    /signup - Signup page
  /(dashboard)
    /dashboard - Main dashboard showing past decisions
    /new-decision - New decision flow (multi-step)
    /decision/[id] - View specific decision analysis
    /values - Set/edit personal values
    /settings - Account settings
  /landing - Marketing landing page

/components
  /ui - shadcn/ui components
  /decision
    DecisionInput.tsx - Main input form
    QuestionFlow.tsx - Adaptive questioning component
    AnalysisDisplay.tsx - Analysis results display
    AssumptionsAudit.tsx
    ImpactMatrix.tsx
    BiasAlert.tsx
    ScenarioPlanning.tsx
    ValuesAlignment.tsx
  /layout
    Header.tsx
    Navigation.tsx
    Footer.tsx

/lib
  /ai
    claude.ts - Claude API client
    prompts.ts - All AI prompts
    analyzers.ts - Decision analysis functions
  /db
    prisma.ts - Prisma client
  /utils
    decision-types.ts - Decision categorization logic
    bias-detection.ts - Cognitive bias detection

```
## AI PROMPT ENGINEERING  
**System Prompt for Decision Analysis:**  
```
You are a decision science expert trained in psychological frameworks for better decision-making. Your role is to help users think through decisions systematically without imposing your judgment.

Core principles:
- Surface unconscious biases and assumptions
- Ask insightful questions that reveal hidden motivations
- Present multiple perspectives without prescribing a choice
- Use established decision science frameworks
- Be warm but analytical, supportive but objective

Frameworks to apply:
1. Prospective Hindsight (Premortem)
2. Loss Aversion Reframing
3. Cognitive Bias Detection (sunk cost, status quo, confirmation, anchoring)
4. Values Alignment Analysis
5. Temporal Discounting Correction
6. Opportunity Cost Evaluation

Always maintain user agency - your job is to illuminate, not decide.

```
**Decision Categorization Prompt:**  
```
Analyze this decision and categorize it:

Decision: {user_input}

Provide:
1. Decision Type (career, financial, relationship, health, lifestyle, purchase, education, location, moral, other)
2. Stakes Level (low/medium/high) based on reversibility and impact
3. Primary decision factors (2-3 most relevant considerations)
4. Suggested number of clarifying questions (0-5)

Return as JSON.

```
**Adaptive Questioning Prompt:**  
```
Generate 3-5 insightful questions to help clarify this decision:

Decision: {decision_description}
Type: {decision_type}
Stakes: {stakes_level}

Questions should:
- Reveal hidden motivations and values
- Surface long-term vs short-term thinking
- Identify what they're running FROM vs TO
- Probe assumptions they might not be aware of
- Be open-ended but focused

Avoid yes/no questions. Make them thought-provoking.

Return as JSON array of questions.

```
**Comprehensive Analysis Prompt:**  
```
Provide a comprehensive decision analysis for:

Decision: {decision_description}
Options: {options}
User Answers: {question_answers}
User Values: {user_values}

Generate:

1. ASSUMPTIONS AUDIT
   - List explicit assumptions you're making
   - Flag assumptions for user verification

2. MULTI-DIMENSIONAL IMPACT MATRIX
   For each option, score impact (1-10) across:
   - Financial (immediate and 5-year)
   - Emotional wellbeing
   - Relationships
   - Personal growth
   - Time/energy investment
   - Alignment with stated values

3. COGNITIVE BIAS ALERTS
   - Identify potential biases affecting their thinking
   - Explain each bias gently
   - Provide counter-framing

4. SCENARIO PLANNING
   For each option:
   - Best case (what goes right)
   - Likely case (realistic expectation)
   - Worst case (what could go wrong)
   - What needs to be true for each scenario

5. OPPORTUNITY COST ANALYSIS
   - What else could they do with these resources?
   - What are they giving up by choosing each option?

6. VALUES ALIGNMENT
   - How does each option align with their core values?
   - Where are the conflicts?

7. SYNTHESIS & CONDITIONAL RECOMMENDATION
   - If priority is X, choose Y
   - If priority is A, choose B
   - Explain the trade-offs clearly

Return structured JSON that maps to React components.

```
## UI/UX SPECIFICATIONS  
**Design System:**  
* Color palette:  
    * Primary: Deep blue (#1E40AF)  
    * Secondary: Teal (#0D9488)  
    * Background: Warm white (#FAFAF9)  
    * Text: Charcoal (#1F2937)  
    * Accent: Amber (#F59E0B) for important insights  
* Typography: Inter for UI, Merriweather for content  
* Spacing: 8px base unit  
* Border radius: 12px (cards), 8px (buttons)  
* Shadows: Subtle, elevation-based  
**Key Screens:**  
**1. New Decision Input Page**  
* Large, welcoming heading: "What decision are you facing?"  
* Textarea with placeholder: "I'm trying to decide whether to..."  
* Character counter (500 chars recommended, 2000 max)  
* Subtle helper text: "Be specific. Include context that matters to you."  
* Primary button: "Help me think this through"  
* No distractions, centered layout  
**2. Decision Type Detection (Auto-shown after input)**  
* Display detected type and stakes  
* Visual indicator: "This seems like a [HIGH-STAKES] [CAREER] decision"  
* Option to correct if wrong  
* Transition to questioning phase  
**3. Adaptive Questioning Flow**  
* Show modal: "I can ask a few questions to understand better (2-3 min), or skip straight to analysis. Your choice."  
* If proceeding: One question per screen  
* Progress indicator: "Question 2 of 4"  
* Large text input for each answer  
* Buttons: "Skip remaining" | "Next"  
* Smooth transitions between questions  
**4. Analysis Display Page**  
* Sticky header showing decision title  
* Tabbed or accordion interface for different analysis sections  
* Each section expandable/collapsible  
* Visual elements:  
    * Impact matrix as colored grid/heatmap  
    * Scenario planning as three columns (best/likely/worst)  
    * Values alignment as radar chart or bar graph  
    * Bias alerts as gentle callout boxes (not alarming)  
**5. Recommendation Section**  
* Presented last, after all analysis  
* Clear conditional structure: "If your top priority is [X]..."  
* NO single "correct answer" - always present trade-offs  
* Action button: "Save this analysis" | "Start over"  
* Follow-up: "Would you like a reminder to reflect on this in 24 hours?"  
**6. Dashboard**  
* Grid/list of past decisions  
* Each card shows:  
    * Decision title  
    * Date  
    * Decision type badge  
    * Status: "Pending reflection" | "Completed" | "In progress"  
* Filter by type, date, stakes level  
* Quick stats: "You've made 12 decisions using structured thinking"  
## DECISION ANALYSIS ALGORITHMS  
**Bias Detection Logic:**  
```
// Pseudo-code for bias detection

function detectBiases(decision, answers) {
  const biases = [];
  
  // Sunk Cost Fallacy
  if (mentionsPastInvestment(answers) && !mentionsFutureValue(answers)) {
    biases.push({
      type: 'sunk_cost',
      description: 'You may be weighing past investment too heavily',
      reframe: 'Consider only future costs and benefits, not what you\'ve already spent'
    });
  }
  
  // Status Quo Bias
  if (hasCurrentState(decision) && showsChangeResistance(answers)) {
    biases.push({
      type: 'status_quo',
      description: 'There may be a tendency to prefer keeping things as they are',
      reframe: 'What if you were starting fresh today? Would you choose your current situation?'
    });
  }
  
  // Loss Aversion
  if (emphasizesLosses(answers) && !emphasizesGains(answers)) {
    biases.push({
      type: 'loss_aversion',
      description: 'You might be overweighting potential losses',
      reframe: 'What opportunities might you be missing by avoiding this loss?'
    });
  }
  
  // Confirmation Bias
  if (showsPreference(answers) && lacksCounterArguments(answers)) {
    biases.push({
      type: 'confirmation',
      description: 'You may already have a preference that\'s coloring your evaluation',
      reframe: 'Steel-man the option you\'re least inclined toward'
    });
  }
  
  return biases;
}

```
**Values Alignment Scoring:**  
```
function calculateValuesAlignment(options, userValues, analysisData) {
  return options.map(option => {
    const scores = Object.keys(userValues).map(value => {
      // Use AI analysis to determine how well this option serves each value
      const alignment = assessAlignment(option, value, analysisData);
      const weight = userValues[value]; // User's importance rating
      return alignment * weight;
    });
    
    return {
      option: option.name,
      totalScore: scores.reduce((a, b) => a + b, 0),
      valueBreakdown: scores
    };
  });
}

```
## NOTIFICATION SYSTEM  
**24-Hour Reflection Email:**  
```
Subject: Ready to reflect on your decision?

Hi {name},

Yesterday you were thinking through: "{decision_title}"

Now that you've had 24 hours to sit with it, let's check in:

- Has your thinking changed?
- Do you feel more or less certain?
- Have new factors emerged?

[Reflect on this decision]

This quick reflection helps you learn from your decision-making process.

- Decision Intelligence

```
## MONETIZATION IMPLEMENTATION  
**Free Tier Limits:**  
* 3 decisions per month  
* Basic analysis (all frameworks)  
* No decision history export  
* No reflection tracking  
**Pro Tier (Rs.49/decision)**  
* Unlimited decisions  
* Full decision history with search  
* 24-hour reflection system  
* Export decisions as PDF  
* Priority AI responses  
* Pattern insights (coming soon)  
**Implementation:**  
```
// Middleware to check decision quota
async function checkDecisionQuota(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      subscription: true,
      decisions: {
        where: {
          createdAt: {
            gte: startOfMonth(new Date())
          }
        }
      }
    }
  });
  
  if (user.subscription?.tier === 'pro') {
    return { allowed: true };
  }
  
  const monthlyCount = user.decisions.length;
  if (monthlyCount >= 3) {
    return { 
      allowed: false, 
      message: 'You\'ve reached your monthly limit. Upgrade to Pro for unlimited decisions.' 
    };
  }
  
  return { allowed: true, remaining: 3 - monthlyCount };
}

```
## TESTING STRATEGY  
**Unit Tests:**  
* Bias detection algorithms  
* Decision categorization logic  
* Values alignment calculations  
* API endpoint responses  
**Integration Tests:**  
* Full decision flow (input → analysis → save)  
* Authentication flow  
* Subscription upgrade/downgrade  
**E2E Tests (Playwright):**  
* Complete user journey from landing to decision analysis  
* Mobile responsiveness  
* Question flow with skip functionality  
**AI Prompt Testing:**  
* Create test cases with known decision types  
* Verify categorization accuracy  
* Check analysis quality against rubric:  
    * Are assumptions explicit?  
    * Are biases correctly identified?  
    * Is analysis balanced (not prescriptive)?  
    * Are trade-offs clearly presented?  
## PERFORMANCE TARGETS  
* Page load: < 2s (LCP)  
* AI analysis generation: < 15s for comprehensive analysis  
* Database queries: < 100ms  
* Lighthouse score: > 90 (Performance, Accessibility)  
## SECURITY REQUIREMENTS  
* All user data encrypted at rest  
* HTTPS only  
* Rate limiting on API endpoints (100 req/min per user)  
* Input sanitization for all user content  
* CORS properly configured  
* Environment variables for all secrets  
* Regular dependency updates  
## ANALYTICS EVENTS TO TRACK  
* decision_started  
* decision_categorized  
* questions_skipped  
* questions_completed  
* analysis_generated  
* decision_saved  
* reflection_completed  
* upgrade_to_pro  
* decision_exported  
## MVP LAUNCH CHECKLIST  
**Pre-launch:**  
* [ ] Deploy backend to Railway/Render  
* [ ] Deploy frontend to Vercel  
* [ ] Configure Clerk authentication  
* [ ] Set up Anthropic API key with rate limits  
* [ ] Configure PostgreSQL database  
* [ ] Set up error tracking (Sentry)  
* [ ] Create privacy policy and terms of service  
* [ ] Set up domain and SSL  
* [ ] Configure email service for notifications  
* [ ] Test payment flow (Stripe integration)  
**Launch Features:**  
* [ ] Decision input and categorization  
* [ ] Adaptive questioning (with skip)  
* [ ] Comprehensive analysis using all frameworks  
* [ ] Decision saving and history  
* [ ] 24-hour reflection email  
* [ ] User values setup  
* [ ] Free/Pro tier logic  
* [ ] Responsive mobile design  
* [ ] Basic analytics  
**Post-Launch (Week 2-4):**  
* [ ] Add decision export (PDF)  
* [ ] Implement search in decision history  
* [ ] Add decision pattern insights  
* [ ] Optimize AI prompts based on user feedback  
* [ ] A/B test question wording  
## DEVELOPMENT PHASES  
**Phase 1 (Week 1-2): Core Infrastructure**  
* Set up Next.js project with Tailwind  
* Configure database and Prisma  
* Implement authentication with Clerk  
* Build basic UI shell  
* Integrate Claude API  
**Phase 2 (Week 3-4): Decision Flow**  
* Build decision input page  
* Implement categorization logic  
* Create adaptive questioning system  
* Develop analysis generation pipeline  
**Phase 3 (Week 5-6): Analysis Display**  
* Build analysis UI components  
* Implement all framework sections  
* Create visualization components (charts, matrices)  
* Add export functionality  
**Phase 4 (Week 7): Polish & Launch Prep**  
* Implement subscription logic  
* Set up notification system  
* Testing and bug fixes  
* Performance optimization  
* Deploy to production  
**Phase 5 (Post-launch): Iterate**  
* Monitor analytics  
* Gather user feedback  
* Refine AI prompts  
* Add V2 features  
