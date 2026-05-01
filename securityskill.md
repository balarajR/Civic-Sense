---
name: security
description: >
  Enforce production-grade security standards to score 100% on AI-evaluated hackathon rubrics
  and real-world security reviews. Use this skill whenever writing ANY code that handles user
  data, authentication, API keys, file uploads, HTTP requests, database operations, or
  environment configuration. Triggers include: "build an API", "add authentication", "handle
  user input", "store data", "connect to Firebase", "use an API key", "add a login", "build
  a form", "write a route", or any task touching network, storage, or user identity.
  MANDATORY for hackathon submissions. Skipping this skill produces code with exploitable
  vulnerabilities that AI evaluators flag immediately — the most common disqualifier.
---

# Security Skill

Produce code that scores 100% on: input sanitization, secret management, authentication,
authorization, dependency safety, and responsible data handling.

## Step 0 — Read the right reference

| Topic | Reference file |
|---|---|
| Authentication & sessions | `references/auth.md` |
| Input validation & injection | `references/input.md` |
| Secret & environment management | `references/secrets.md` |
| API & HTTP security headers | `references/api-security.md` |

---

## Universal security rules — apply to EVERY file

### Rule 1 — Never trust user input

Every value from `req.body`, `req.query`, `req.params`, URL params, or any external source
is **untrusted until validated**. Validate with a schema library before touching the value:

```typescript
import { z } from 'zod';

// Define schema — single source of truth
const VoterSearchSchema = z.object({
  voterId:   z.string().regex(/^[A-Z]{3}[0-9]{7}$/, 'Invalid EPIC format'),
  stateCode: z.enum(['KA', 'MH', 'DL', 'TN', 'UP']),
});

// Validate before use — ALWAYS
function searchVoter(rawInput: unknown) {
  const result = VoterSearchSchema.safeParse(rawInput);
  if (!result.success) {
    throw new ValidationError('INVALID_INPUT', result.error.flatten().fieldErrors);
  }
  const { voterId, stateCode } = result.data; // guaranteed safe types here
  // proceed...
}
```

### Rule 2 — Never log secrets or PII

```typescript
// BAD — logs sensitive data
logger.info('User login', { password: req.body.password, ssn: user.ssn });

// GOOD — log only identifiers and outcome
logger.info('User login', { userId: user.id, success: true, ip: req.ip });
```

PII (Personally Identifiable Information) that must NEVER be logged:
- Passwords or password hashes
- OTPs or verification codes
- Aadhaar / PAN / voter ID numbers (full)
- Phone numbers (mask last 6 digits: `98xx xxxx 12`)
- Email addresses (mask: `b***@gmail.com`)
- API keys or tokens

### Rule 3 — Rate limit every public endpoint

```typescript
import rateLimit from 'express-rate-limit';

// Apply globally
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,
  message:  { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Stricter limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, error: { code: 'AUTH_RATE_LIMITED', message: 'Too many login attempts.' } },
});

// Apply in app.ts
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
```

### Rule 4 — Set security HTTP headers (helmet)

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", 'https://maps.googleapis.com'],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https://maps.gstatic.com'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseio.com'],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
    },
  },
  hsts:                  { maxAge: 31_536_000, includeSubDomains: true },
  noSniff:               true,
  referrerPolicy:        { policy: 'strict-origin-when-cross-origin' },
  xssFilter:             true,
  frameguard:            { action: 'deny' },
}));
```

### Rule 5 — CORS — restrict to known origins

```typescript
import cors from 'cors';

const ALLOWED_ORIGINS = [
  'https://civicsense.app',
  'https://www.civicsense.app',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials:     true,
  allowedHeaders:  ['Content-Type', 'Authorization'],
  exposedHeaders:  ['X-Request-Id'],
  maxAge:          86400, // 24h preflight cache
}));
```

### Rule 6 — Never store raw passwords

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // never below 10

async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
// Never use MD5, SHA1, or unsalted SHA256 for passwords
```

### Rule 7 — JWT — sign, verify, expire

```typescript
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';

const TOKEN_EXPIRY = '24h';

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn:  TOKEN_EXPIRY,
    algorithm:  'HS256',
    issuer:     'civicsense-api',
    audience:   'civicsense-client',
  });
}

export function verifyToken(token: string): { userId: string; role: string } {
  try {
    return jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer:     'civicsense-api',
      audience:   'civicsense-client',
    }) as { userId: string; role: string };
  } catch (err) {
    throw new AuthError('TOKEN_INVALID', 'Session expired or invalid. Please log in again.');
  }
}
```

### Rule 8 — Sanitize HTML output to prevent XSS

```typescript
import DOMPurify from 'isomorphic-dompurify';

// ONLY use when you MUST render HTML (e.g. rich text from Gemini)
function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS:  ['p', 'b', 'i', 'ul', 'ol', 'li', 'a', 'strong', 'em'],
    ALLOWED_ATTR:  ['href'],
    ALLOW_DATA_ATTR: false,
  });
}
// For plain text: never use innerHTML — use textContent
```

### Rule 9 — SQL / NoSQL injection prevention

For Firestore — never build query strings from user input:
```typescript
// BAD — field path from user input
const query = db.collection('voters').where(req.body.field, '==', req.body.value);

// GOOD — whitelist field names
const ALLOWED_FILTER_FIELDS = ['stateCode', 'constituencyId'] as const;
type FilterField = typeof ALLOWED_FILTER_FIELDS[number];

function buildVoterQuery(field: FilterField, value: string) {
  if (!ALLOWED_FILTER_FIELDS.includes(field)) {
    throw new ValidationError('INVALID_FIELD', `Field '${field}' is not queryable`);
  }
  return db.collection('voters').where(field, '==', value);
}
```

### Rule 10 — Dependency audit in every project

Add to `package.json` scripts:
```json
{
  "scripts": {
    "audit":        "npm audit --audit-level=high",
    "audit:fix":    "npm audit fix",
    "check-deps":   "npx depcheck"
  }
}
```

Add `.github/workflows/security.yml` or run before every submission:
```bash
npm audit --audit-level=high
# If any HIGH or CRITICAL vulnerabilities: fix before submitting
```

---

## Security checklist — run before every commit

- [ ] All user inputs validated with Zod schema
- [ ] No secrets in source code (use `process.env`)
- [ ] `.env` is in `.gitignore`, `.env.example` committed instead
- [ ] Helmet middleware applied globally
- [ ] Rate limiting on all public endpoints (stricter on auth)
- [ ] CORS restricted to known origins only
- [ ] Passwords hashed with bcrypt (≥ 10 rounds)
- [ ] JWT signed with strong secret, short expiry, algorithm pinned
- [ ] HTML output sanitized with DOMPurify before rendering
- [ ] Firestore security rules in `firestore.rules` — no open reads/writes
- [ ] `npm audit` passes with no HIGH or CRITICAL issues
- [ ] No PII or secrets in log statements
- [ ] Error responses never expose stack traces or internal paths