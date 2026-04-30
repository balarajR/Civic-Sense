# Contributing to CivicSense

## Problem Statement Alignment

CivicSense addresses the critical gap in **civic education and voter engagement in India** by providing an AI-powered platform that empowers citizens with:

1. **Real-time Electoral Intelligence** — Live election results, constituency data, and trending civic news powered by Data.gov.in and Google's Gemini AI.
2. **Polling Booth Discovery** — A geospatial booth finder integrated with ECI's official records, making voter participation frictionless.
3. **AI-Powered Civic Education** — An intelligent chatbot (CivicBot) that answers questions about voting rights, electoral processes, the Indian Constitution, and government schemes in multiple languages.
4. **Candidate Transparency** — Side-by-side candidate comparison with AI-summarized profiles to help voters make informed decisions.
5. **Gamified Civic Learning** — Interactive quizzes, journey simulators, and timeline builders that turn civic education into an engaging experience.

### Why This Matters

India's democracy has 960+ million eligible voters, yet civic literacy remains low. CivicSense bridges this gap with technology, making democratic participation accessible, informed, and engaging for every citizen regardless of their technical background.

## How to Contribute

### Prerequisites
- Node.js 18+ and npm 9+
- A Google Cloud project with Vertex AI enabled (for AI features)
- Firebase project (for authentication and data storage)

### Getting Started

```bash
git clone https://github.com/your-org/CivicSense.git
cd CivicSense
npm install
cp .env.example .env  # Configure your API keys
npm run dev            # Start development server
npm test               # Run test suite (90+ tests)
```

### Development Guidelines

1. **Code Quality**: Follow TypeScript strict mode. No `any` types without explicit justification.
2. **Testing**: Every new feature must include unit tests. Minimum 80% coverage.
3. **Accessibility**: All interactive elements must have ARIA labels. Follow WCAG 2.2 AA standards.
4. **Security**: Sanitize all user inputs. Never expose API keys in client-side code.
5. **Performance**: Target Lighthouse scores of 90+ across all categories.

### Architecture Overview

```
CivicSense/
├── src/
│   ├── components/     # React UI components
│   ├── App.tsx         # Main application entry
│   └── index.css       # Global styles
├── server.ts           # Express API server (Vertex AI, Data.gov.in)
├── public/
│   └── api/            # Static fallback data
├── tests/              # Server-side test suites
└── index.html          # Entry HTML with SEO/CSP/a11y
```

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Write tests for your changes
4. Ensure all tests pass: `npm test`
5. Submit a pull request with a clear description

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors are expected to adhere to respectful and constructive communication.

## License

This project is licensed under the MIT License.
