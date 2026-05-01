---
name: testing
description: >
  Enforce comprehensive test coverage to score 100% on AI-evaluated hackathon rubrics
  and production-grade CI pipelines. Use this skill whenever writing, reviewing, or
  completing ANY feature — unit tests, integration tests, and end-to-end tests must
  accompany every source file. Triggers include: "write a function", "build a feature",
  "create an API", "add a component", "I'm done with X", "review my code", or any task
  that produces source files. Also triggers for: "write tests for", "add test coverage",
  "how do I test", "vitest", "pytest", "jest". MANDATORY for hackathon submissions —
  AI evaluators parse test files and count assertions. Zero tests = automatic deduction.
---

# Testing Skill

Produce test suites that score 100% on: coverage breadth, assertion quality,
edge case handling, test isolation, and CI integration.

## Step 0 — Read the right reference

| Stack | Reference file |
|---|---|
| JavaScript / TypeScript (Vitest) | `references/vitest.md` |
| Python (pytest) | `references/pytest.md` |
| React components | `references/react-testing.md` |
| API / integration tests | `references/api-testing.md` |

---

## Universal testing rules — apply to EVERY project

### Rule 1 — Test file mirrors source file (mandatory)

For every `src/features/mythBuster/mythBuster.service.ts`
create `src/features/mythBuster/mythBuster.service.test.ts`

For every `src/services/gemini.ts`
create `src/services/gemini.test.ts`

No source file ships without a sibling test file. No exceptions.

### Rule 2 — Minimum 3 tests per exported function

Every exported function needs at minimum:

| Test # | What to test |
|---|---|
| 1 | Happy path — valid input, expected output |
| 2 | Edge case — boundary values, empty input, zero, null |
| 3 | Error path — invalid input, throws the right error with the right code |

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyMythClaim } from './mythBuster.service';

describe('classifyMythClaim', () => {
  // Test 1: Happy path
  it('classifies a known EVM myth as MYTH with a source', async () => {
    const result = await classifyMythClaim('EVMs are hacked by Bluetooth');
    expect(result.verdict).toBe('MYTH');
    expect(result.source).toMatch(/^https?:\/\//);
    expect(result.explanation).toBeTruthy();
  });

  // Test 2: Edge case
  it('returns UNVERIFIED for claims with no matching knowledge base entry', async () => {
    const result = await classifyMythClaim('');
    expect(result.verdict).toBe('UNVERIFIED');
  });

  // Test 3: Error path
  it('throws ValidationError when claim exceeds 500 characters', async () => {
    const longClaim = 'x'.repeat(501);
    await expect(classifyMythClaim(longClaim))
      .rejects.toMatchObject({ code: 'CLAIM_TOO_LONG' });
  });
});
```

### Rule 3 — Mock all external dependencies

Tests must NEVER make real network calls, DB writes, or API calls.
Mock at the service boundary:

```typescript
import { vi } from 'vitest';

// Mock the entire Google Maps service module
vi.mock('@/services/googleMaps', () => ({
  findNearestBooth: vi.fn(),
}));

import { findNearestBooth } from '@/services/googleMaps';
import { getBoothForVoter } from './voter.service';

describe('getBoothForVoter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns booth details when Maps API resolves', async () => {
    vi.mocked(findNearestBooth).mockResolvedValueOnce({
      boothId: 'B001', name: 'Community Hall', distanceKm: 1.2,
    });
    const result = await getBoothForVoter({ lat: 12.97, lng: 77.59 });
    expect(result.boothId).toBe('B001');
  });

  it('returns null when no booth is found within radius', async () => {
    vi.mocked(findNearestBooth).mockResolvedValueOnce(null);
    const result = await getBoothForVoter({ lat: 0, lng: 0 });
    expect(result).toBeNull();
  });

  it('propagates MapsError when Maps API throws', async () => {
    vi.mocked(findNearestBooth).mockRejectedValueOnce(
      new MapsError('MAPS_TIMEOUT', 'Request timed out')
    );
    await expect(getBoothForVoter({ lat: 12.97, lng: 77.59 }))
      .rejects.toMatchObject({ code: 'MAPS_TIMEOUT' });
  });
});
```

### Rule 4 — Test setup: vitest.config.ts (TypeScript projects)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',          // use 'jsdom' for React component tests
    coverage: {
      provider:           'v8',
      reporter:           ['text', 'html', 'lcov'],
      thresholds: {
        lines:      80,
        functions:  80,
        branches:   75,
        statements: 80,
      },
      exclude: [
        'src/config/**',          // env validation
        'src/types/**',           // type-only files
        '**/*.test.ts',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### Rule 5 — Global test setup file

```typescript
// tests/setup.ts
import { vi, afterEach } from 'vitest';

// Reset all mocks between tests — prevents state leakage
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// Suppress console.error in tests (logged intentionally — don't pollute output)
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
```

### Rule 6 — Integration test for every API route

```typescript
// tests/integration/voter.router.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/index';
import { createTestToken } from '../helpers/auth';

describe('GET /api/voter/:voterId/booth', () => {
  const validToken = createTestToken({ userId: 'user123', role: 'user' });

  it('returns 200 with booth data for valid voter ID', async () => {
    const res = await request(app)
      .get('/api/voter/KA1234567/booth')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('boothId');
  });

  it('returns 400 for malformed voter ID', async () => {
    const res = await request(app)
      .get('/api/voter/invalid/booth')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('returns 401 when no auth token provided', async () => {
    const res = await request(app).get('/api/voter/KA1234567/booth');
    expect(res.status).toBe(401);
  });

  it('returns 404 when voter is not found', async () => {
    const res = await request(app)
      .get('/api/voter/ZZZ9999999/booth')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(404);
  });
});
```

### Rule 7 — Test helpers (factories, not fixtures)

```typescript
// tests/helpers/factories.ts
import type { UserSession, QuizQuestion } from '@/types/election';

let _id = 0;
const nextId = (): string => `test-${++_id}`;

export function makeSession(overrides: Partial<UserSession> = {}): UserSession {
  return {
    sessionId:       nextId(),
    persona:         'first_time_voter',
    language:        'en',
    startedAt:       new Date(),
    quizScore:       0,
    completedStages: [],
    ...overrides,
  };
}

export function makeQuestion(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
  return {
    id:           nextId(),
    question:     'What is the minimum voting age in India?',
    options:      ['16', '18', '21', '25'],
    correctIndex: 1,
    difficulty:   'easy',
    explanation:  'The 61st Constitutional Amendment (1988) lowered the voting age from 21 to 18.',
    source:       'https://eci.gov.in',
    ...overrides,
  };
}
```

### Rule 8 — package.json test scripts

```json
{
  "scripts": {
    "test":          "vitest run",
    "test:watch":    "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui":       "vitest --ui"
  }
}
```

### Rule 9 — CI workflow for tests

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with: { files: ./coverage/lcov.info }
```

---

## Testing checklist — run before every commit

- [ ] Every source file has a sibling `.test.ts` / `.test.js` file
- [ ] Every exported function has minimum 3 tests (happy / edge / error)
- [ ] All external services are mocked — no real API calls in unit tests
- [ ] Integration tests cover every route (200, 400, 401, 404 at minimum)
- [ ] `npm run test:coverage` passes with ≥ 80% thresholds
- [ ] Test file uses `describe` → `it` nesting (not flat `test()` calls)
- [ ] `beforeEach(() => vi.clearAllMocks())` present in every test file
- [ ] Factory functions used instead of copy-paste fixture objects
- [ ] CI workflow file committed and passing