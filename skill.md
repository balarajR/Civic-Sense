---
name: code-quality
description: >
  Enforce production-grade code quality standards to score 100% on AI-evaluated hackathon rubrics
  and real-world code reviews. Use this skill whenever writing, reviewing, or refactoring ANY code —
  JavaScript, TypeScript, Python, or any other language. Triggers include: "write me a function",
  "build this feature", "fix this code", "refactor", "review my code", "create a component",
  "write an API", "build a service", "implement", or any task that produces source code files.
  This skill is MANDATORY for hackathon submissions. Apply it to every single file generated,
  not just entry points. Failure to use this skill produces code that scores below 90% on
  structure, maintainability, and alignment — the most common deduction area in AI evaluations.
---

# Code Quality Skill

Produce code that scores 100% on: structure, readability, maintainability, security,
testability, accessibility, and alignment. These are the exact axes evaluated by
AI-powered hackathon judges (e.g., Hack2Skill, Devpost AI evaluators).

## Step 0 — Read the right reference before writing any code

| Language / stack | Reference file to read first |
|---|---|
| JavaScript / TypeScript | `references/js-ts.md` |
| Python | `references/python.md` |
| React / Next.js | `references/react.md` |
| REST API / FastAPI / Express | `references/api.md` |
| Firebase / Firestore | `references/firebase.md` |

Read the relevant file(s) before generating a single line of code.
If multiple stacks are involved, read all relevant files.

---

## Universal rules — apply to EVERY file in EVERY language

These override any framework convention when there's a conflict.

### 1. File header (mandatory on every file)

Every source file starts with a structured header comment:

```js
/**
 * @file   featureName.js
 * @module ModuleName
 * @description One sentence: what this file does and why it exists.
 *
 * @author  <name or team>
 * @created YYYY-MM-DD
 *
 * @dependencies List external packages this file imports
 * @exports      List what this file exports
 */
```

For Python:
```python
"""
Module: feature_name.py
Description: One sentence — what this module does and why it exists.

Author:  <name or team>
Created: YYYY-MM-DD

Dependencies: list external packages imported
Exports:      list public symbols
"""
```

### 2. Function documentation (mandatory on every function)

Every function — including arrow functions assigned to a const — gets a JSDoc/docstring:

```js
/**
 * Verifies the user's OTP against the stored hash.
 *
 * @param {string} otp     - 6-digit code entered by the user
 * @param {string} hash    - bcrypt hash stored in Firestore
 * @returns {Promise<boolean>} true if OTP is valid and not expired
 * @throws {ValidationError} if otp is not a 6-digit string
 *
 * @example
 *   const valid = await verifyOtp('123456', storedHash);
 */
async function verifyOtp(otp, hash) { ... }
```

Python equivalent uses Google-style docstrings:
```python
def verify_otp(otp: str, stored_hash: str) -> bool:
    """
    Verify a 6-digit OTP against its stored bcrypt hash.

    Args:
        otp: 6-digit string entered by the user.
        stored_hash: bcrypt hash retrieved from the database.

    Returns:
        True if the OTP matches and has not expired.

    Raises:
        ValidationError: If otp is not a 6-digit numeric string.

    Example:
        >>> verify_otp("123456", stored_hash)
        True
    """
```

### 3. Naming conventions

| Element | JavaScript/TS | Python |
|---|---|---|
| Variables | camelCase | snake_case |
| Constants | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE |
| Functions | camelCase (verb prefix) | snake_case (verb prefix) |
| Classes | PascalCase | PascalCase |
| Files | kebab-case.js | snake_case.py |
| Booleans | isX / hasX / canX / shouldX | is_x / has_x |
| Async functions | fetchX / loadX / sendX | fetch_x / load_x |

Verb prefixes for functions (non-negotiable):
- `get` → synchronous retrieval from memory/cache
- `fetch` → async retrieval from network/DB
- `create` / `build` → constructors / factories
- `update` / `patch` → mutations
- `delete` / `remove` → deletions
- `validate` / `check` → predicates that throw on failure
- `is` / `has` / `can` → pure boolean predicates

### 4. Error handling (never swallow errors)

```js
// BAD — swallows the error, no user context
try {
  await saveUser(data);
} catch (e) {
  console.log(e);
}

// GOOD — typed error, user-facing message, structured logging
try {
  await saveUser(data);
} catch (error) {
  logger.error('Failed to save user', {
    userId: data.id,
    error: error.message,
    stack: error.stack,
  });
  throw new AppError('USER_SAVE_FAILED', 'Could not save user profile. Please try again.', { cause: error });
}
```

Always define a custom error class per module:
```js
class AppError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = 'AppError';
    this.code = code;
  }
}
```

### 5. Constants file — no magic values

Every module-level magic value lives in a `constants.js` or `config.py`:
```js
// constants/election.js
export const VOTING_BOOTH_SEARCH_RADIUS_KM = 5;
export const QUIZ_DIFFICULTY_LEVELS = Object.freeze(['easy', 'medium', 'hard']);
export const MAX_MYTH_BUST_SOURCES = 3;
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
```

### 6. Module boundaries — single responsibility

Each file exports EXACTLY ONE of:
- One class
- One family of related pure functions (max 5)
- One React component (+ its prop types)
- One route handler family

If a file exports more than one class or more than 5 functions, split it.

### 7. Input validation at every public boundary

Every public function that accepts external data validates before processing:

```js
import { z } from 'zod';

const UserLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

function findNearestBooth(location) {
  const parsed = UserLocationSchema.safeParse(location);
  if (!parsed.success) {
    throw new ValidationError('INVALID_LOCATION', parsed.error.flatten());
  }
  // proceed with parsed.data — guaranteed safe
}
```

### 8. Environment variables — never hardcode secrets

```js
// BAD
const apiKey = 'AIzaSy...';

// GOOD
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not set in environment');
```

Create a `config/env.js` that validates all env vars at startup:
```js
const requiredEnvVars = [
  'GOOGLE_MAPS_API_KEY',
  'FIREBASE_PROJECT_ID',
  'GEMINI_API_KEY',
];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  geminiApiKey: process.env.GEMINI_API_KEY,
};
```

### 9. Logging — structured, never console.log

Use a logger wrapper (not raw console):
```js
// utils/logger.js
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

export const logger = {
  info:  (msg, meta = {}) => console.log(JSON.stringify({ level: 'info',  msg, ...meta, ts: Date.now() })),
  warn:  (msg, meta = {}) => console.warn(JSON.stringify({ level: 'warn',  msg, ...meta, ts: Date.now() })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', msg, ...meta, ts: Date.now() })),
  debug: (msg, meta = {}) => process.env.NODE_ENV === 'development' && console.debug(JSON.stringify({ level: 'debug', msg, ...meta, ts: Date.now() })),
};
```

### 10. Tests — one test file per source file

For every `featureName.js`, create `featureName.test.js`:
```js
// votingBooth.test.js
import { describe, it, expect, vi } from 'vitest';
import { findNearestBooth } from './votingBooth.js';

describe('findNearestBooth', () => {
  it('returns the closest booth within 5km radius', async () => {
    const result = await findNearestBooth({ lat: 12.9716, lng: 77.5946 });
    expect(result).toHaveProperty('boothId');
    expect(result.distanceKm).toBeLessThanOrEqual(5);
  });

  it('throws ValidationError for out-of-range coordinates', () => {
    expect(() => findNearestBooth({ lat: 200, lng: 77 }))
      .toThrow('INVALID_LOCATION');
  });

  it('returns null when no booth exists within radius', async () => {
    const result = await findNearestBooth({ lat: 0, lng: 0 });
    expect(result).toBeNull();
  });
});
```

Minimum 3 test cases per function:
1. Happy path (valid input, expected output)
2. Edge case (boundary values, empty arrays, null)
3. Error path (invalid input, throws correctly)

---

## Project structure — use this layout for every hackathon project

```
project-root/
├── src/
│   ├── config/
│   │   ├── env.js          ← validates all env vars at startup
│   │   └── constants.js    ← all magic values
│   ├── services/           ← one file per external service
│   │   ├── gemini.js
│   │   ├── googleMaps.js
│   │   └── firebase.js
│   ├── features/           ← one folder per feature vertical
│   │   ├── voter-journey/
│   │   │   ├── index.js
│   │   │   ├── journey.service.js
│   │   │   └── journey.test.js
│   │   └── myth-buster/
│   │       ├── index.js
│   │       ├── mythBuster.service.js
│   │       └── mythBuster.test.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── errors.js
│   │   └── validators.js
│   └── index.js            ← entry point only, no business logic
├── tests/
│   └── integration/        ← cross-service tests
├── .env.example            ← template with all required keys (no values)
├── README.md
└── package.json
```

---

## README.md quality standard

The README must contain ALL of these sections to score 100% on Problem Statement Alignment:

```markdown
# Project Name

> One-line description of what the project does.

## Problem statement
What problem does this solve? For whom? Why now?

## Solution approach
How does the architecture solve the problem? Include a diagram if possible.

## Features
- Feature 1: what it does and why it matters
- Feature 2: ...

## Google Services used
| Service | How it's used |
|---|---|
| Gemini API | ... |
| Google Maps | ... |

## Setup and installation
\`\`\`bash
git clone ...
cd project
cp .env.example .env
# fill in .env values
npm install
npm run dev
\`\`\`

## Environment variables
| Variable | Description | Required |
|---|---|---|
| GEMINI_API_KEY | Gemini API key from Google AI Studio | Yes |

## Assumptions made
- Assumption 1
- Assumption 2

## Limitations and future work
- What's not yet built and why

## License
MIT
```

---

## Code review checklist — run before every commit

Before writing "done" on any file, verify:

- [ ] File header comment present
- [ ] Every function has a JSDoc/docstring with @param, @returns, @throws
- [ ] No magic strings or numbers (all in constants)
- [ ] No console.log (use logger)
- [ ] No hardcoded secrets or API keys
- [ ] Every external input is validated with a schema
- [ ] Error handling: every try/catch either rethrows or logs + rethrows
- [ ] At least 3 tests per exported function
- [ ] Single responsibility: file exports one thing
- [ ] Naming follows the verb-prefix convention
- [ ] `.env.example` updated if a new env var was added
- [ ] README updated if a new feature was added