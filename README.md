# CivicSence — AI Election Education Assistant

> An intelligent, politically neutral civic assistant that empowers Indian citizens to make informed electoral decisions through real-time data, interactive tools, and AI-powered guidance.

---

## 🎯 Challenge Vertical

**Civic / Election Education Assistant** — A smart, dynamic assistant that provides voter education, election data, candidate transparency tools, and guided voting journeys, with state-level awareness for Karnataka.

---

## 🧠 Core Approach & Logic

CivicSence is not a simple chatbot. It implements a **multi-modal civic intelligence system** that combines:

### 1. AI Persona Detection Engine
The system dynamically detects user intent and adapts its communication style:

| Persona | Behavior |
|---------|----------|
| `FIRST_TIME_VOTER` | Step-by-step guidance, plain language, metaphors |
| `STUDENT_RESEARCHER` | Academic structure, comparative analysis, citations |
| `ENGAGED_CITIZEN` | Data-dense, direct, performance-focused responses |
| `ELECTION_OFFICIAL` | Legal references (RPA 1951, MCC), formal register |

### 2. Interactive Tool Modes
Beyond chat, the assistant activates specialized tools based on context:

- **Journey Simulator** — Walk through the 5 stages of voting (Registration → Result)
- **Myth Buster** — Fact-checks common election misconceptions with FACT/MYTH/PARTIALLY TRUE verdicts
- **Civic Quiz** — MCQ-based readiness assessment with explanations
- **Timeline Builder** — Real-time election milestone tracking via Google Search
- **Action Hub** — Live results dashboard, booth locator, candidate comparator, and ECI guidelines

### 3. Strict Neutrality Protocol
The system is hardcoded to **never** express opinions on parties, leaders, or policies. All party-specific questions are redirected to factual data comparison tools.

---

## 🔧 Architecture

```
┌─────────────────────────────────────────────┐
│                 React 19 Frontend            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  Chat UI │ │ Quiz/    │ │ Action Hub   │ │
│  │          │ │ Journey  │ │ (Booth/Live) │ │
│  └────┬─────┘ └──────────┘ └──────┬───────┘ │
│       │          Tailwind v4       │         │
├───────┼────────────────────────────┼─────────┤
│       ▼    Express.js Backend      ▼         │
│  ┌──────────────────────────────────────────┐│
│  │  POST /api/chat      (Gemini + Search)   ││
│  │  POST /api/summarize (Gemini AI)         ││
│  │  GET  /api/timeline  (Gemini + Search)   ││
│  │  GET  /api/candidates(Gov API + Search)  ││
│  │  GET  /api/election-results (Search)     ││
│  │  GET  /api/news      (Google Search)     ││
│  │  GET  /api/health    (Status Check)      ││
│  └──────────────────────────────────────────┘│
│              │              │                │
│     ┌────────┴───┐   ┌─────┴──────┐         │
│     │ Vertex AI  │   │ data.gov.in│         │
│     │ Gemini 2.5 │   │  Open Gov  │         │
│     │ Flash +    │   │  Data API  │         │
│     │ Google     │   └────────────┘         │
│     │ Search     │                           │
│     │ Grounding  │                           │
│     └────────────┘                           │
│              │                               │
│     ┌────────┴───────┐                       │
│     │ Google Maps    │                       │
│     │ Embed API      │                       │
│     │ (Booth Finder) │                       │
│     └────────────────┘                       │
│              │                               │
│     ┌────────┴───────┐                       │
│     │ Firebase       │                       │
│     │ Analytics      │                       │
│     └────────────────┘                       │
└─────────────────────────────────────────────┘
```

---

## 🛡️ Security Implementation

| Area | Implementation |
|------|---------------|
| **API Key Protection** | All AI keys stay server-side only. Never exposed to browser bundle via `vite.config.ts`. |
| **Input Sanitization** | `sanitizeInput()` strips prompt injection patterns before every AI call. |
| **Environment Variables** | All secrets loaded from `.env`. Template provided in `.env.example`. |
| **Firebase Config** | Client-side Firebase uses restricted API keys (auth-domain-scoped). |
| **Prompt Injection Defense** | Regex-based filtering of "ignore instructions" and "system prompt" patterns. |
| **CORS** | Express default — no wildcard in production. |

---

## ⚡ Performance & Efficiency

| Metric | Implementation |
|--------|---------------|
| **Lazy Loading** | Tool panels render on-demand via `AnimatePresence` (no upfront cost). |
| **Streaming UX** | Animated loading indicators (pulse dots) during AI processing. |
| **Real-time Polling** | Live Results auto-refresh every 60 seconds via `setInterval`. |
| **Code Splitting** | Vite automatically tree-shakes unused components. |
| **Font Strategy** | Google Fonts (Inter) preconnected in `<head>` for zero layout shift. |
| **Fallback Architecture** | Every API endpoint has graceful degradation — app never crashes. |

---

## ♿ Accessibility

- Semantic HTML: `<header>`, `<main>`, `<footer>`, `<nav>`, `<aside>` structure
- Keyboard navigation: All buttons, inputs, and tools are fully keyboard-accessible
- Color contrast: Black/white base theme exceeds WCAG AA requirements
- Screen reader: Meaningful labels and descriptions on all interactive elements
- Responsive design: Mobile-first layout works from 375px to 4K displays
- `<noscript>` fallback for JavaScript-disabled environments

---

## 🌐 Google Services Integration

This project demonstrates **deep, meaningful integration** with multiple Google Cloud services:

### 1. Vertex AI — Gemini 2.5 Flash
- **7 distinct AI endpoints** — chat, summarize, timeline, candidates, results, news, health
- Model: `gemini-2.5-flash` via Vertex AI (not API key — uses ADC authentication)
- Structured JSON output with custom parsing for grounded responses

### 2. Google Search Grounding (Live Data)
- Enabled on chat, timeline, candidates, results, and news endpoints
- Provides **real-time, factual election data** from the web
- Replaces static datasets with live, always-current information

### 3. Google Maps Embed API
- Booth Locator tool renders polling station maps for any Karnataka locality
- Dynamic search queries based on user input

### 4. Firebase Analytics
- Initialized conditionally (graceful degradation for unsupported environments)
- Tracks user engagement patterns across tool modes

### 5. Google Cloud Authentication (ADC)
- Uses Application Default Credentials for secure, keyless Vertex AI access
- GCP project and location configured via environment variables

---

## 🚀 How to Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/CivicSense.git
cd CivicSense

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in: GCP project, Maps API key, Firebase config, etc.

# 4. Authenticate with Google Cloud
gcloud auth application-default login

# 5. Start the development server
npm run dev
# → Server starts at http://localhost:3000
```

---

## 📁 Project Structure

```
CivicSense/
├── server.ts                 # Express backend + Vertex AI endpoints
├── index.html                # Entry point with SEO meta tags
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite + Tailwind configuration
├── vitest.config.ts          # Vitest test configuration
├── tsconfig.json             # TypeScript configuration
├── metadata.json             # App metadata
├── .env.example              # Environment variable template
├── .gitignore                # Excludes node_modules, .env, dist
└── src/
    ├── main.tsx              # React entry point
    ├── App.tsx               # Root component with routing logic
    ├── types.ts              # TypeScript interfaces and enums
    ├── index.css             # Tailwind v4 theme + custom utilities
    ├── lib/
    │   ├── firebase.ts       # Firebase initialization
    │   └── utils.ts          # Utility functions (cn helper)
    ├── test/
    │   └── setup.ts          # Vitest + jest-dom bootstrap
    ├── server/
    │   ├── utils.ts          # Input sanitization, JSON parsing helpers
    │   ├── utils.test.ts     # Unit tests — 10 tests
    │   └── api.test.ts       # Integration tests — 8 tests (mocked Gemini)
    └── components/
        ├── ChatInterface.tsx        # AI conversation terminal
        ├── JourneySimulator.tsx     # 5-stage voting walkthrough
        ├── CivicQuiz.tsx            # Interactive quiz engine
        ├── TimelineBuilder.tsx      # Election milestone timeline
        ├── ActionHub.tsx            # Tool switcher (tabs)
        ├── BoothFinder.tsx          # Google Maps booth locator
        ├── CandidateComparator.tsx  # Side-by-side candidate analysis
        ├── LiveResults.tsx          # Real-time election dashboard
        ├── ECIGuidelines.tsx        # ECI rules with AI summarization
        ├── NewsTicker.tsx           # Live news scroll banner
        └── NewsTicker.test.tsx      # Component tests — 3 tests
```

---

## 🧪 Testing

**21 tests across 3 suites — all passing.**

```bash
npm test          # Run full test suite (Vitest)
npm run test:watch  # Watch mode during development
```

| Suite | File | Tests | What it covers |
|-------|------|-------|----------------|
| Unit | `src/server/utils.test.ts` | 10 | sanitizeInput, stripCodeFences, safeJsonParse |
| Component | `src/components/NewsTicker.test.tsx` | 3 | React render, empty state, content |
| Integration | `src/server/api.test.ts` | 8 | All API endpoints with mocked Gemini |

Additional quality gates:
- **Type Safety** — `tsc --noEmit` passes with zero errors
- **Runtime Validation** — `safeJsonParse` validates all AI output before serving
- **Error Resilience** — Every endpoint has `try/catch` with graceful fallbacks
- **Security** — `helmet`, `cors`, and `express-rate-limit` active on all routes

---

## 📜 License

MIT — Built for Indian democracy with ❤️ and AI.
