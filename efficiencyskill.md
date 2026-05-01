---
name: efficiency
description: >
  Enforce runtime efficiency, memory optimization, and resource management standards to
  score 100% on AI-evaluated hackathon rubrics. Use this skill whenever writing ANY code
  that handles data fetching, list rendering, loops, caching, database queries, API calls,
  image loading, or state management. Triggers include: "fetch data", "render a list",
  "query Firestore", "call an API", "load images", "search through", "filter array",
  "build a cache", "optimize", "it's slow", or any task involving data processing or
  network I/O. Also triggers for React component trees with props drilling or excessive
  re-renders. AI evaluators measure: load time, bundle size, query count, and render cycles.
---

# Efficiency Skill

Produce code that scores 100% on: load time, memory usage, query efficiency,
render performance, bundle size, and resource management.

## Step 0 — Read the right reference

| Topic | Reference file |
|---|---|
| Caching strategies | `references/caching.md` |
| React rendering | `references/react-perf.md` |
| Database queries | `references/queries.md` |
| Bundle & asset optimization | `references/bundle.md` |

---

## Universal efficiency rules — apply to EVERY project

### Rule 1 — Cache expensive operations (never call the same API twice)

```typescript
// utils/cache.ts — in-memory TTL cache
interface CacheEntry<T> { value: T; expiresAt: number; }

class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
}

// One cache per concern — explicit TTLs
export const boothCache    = new TtlCache<PollingBooth>(60 * 60 * 1000);   // 1 hour
export const mythCache     = new TtlCache<MythResult>(24 * 60 * 60 * 1000); // 24 hours
export const translateCache = new TtlCache<string>(7 * 24 * 60 * 60 * 1000); // 7 days
```

Wrap every expensive call with cache-check-first:
```typescript
export async function findNearestBoothCached(lat: number, lng: number): Promise<PollingBooth | null> {
  const cacheKey = `booth:${lat.toFixed(3)}:${lng.toFixed(3)}`; // ~100m precision
  const cached = boothCache.get(cacheKey);
  if (cached) {
    logger.debug('Booth cache hit', { cacheKey });
    return cached;
  }
  const result = await findNearestPollingBooth(lat, lng);
  if (result) boothCache.set(cacheKey, result);
  return result;
}
```

### Rule 2 — Debounce user input — never call APIs on every keystroke

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates after `delayMs` of inactivity.
 * Use for search inputs, location lookups, and any user-driven API trigger.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// Usage in component:
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 400); // wait 400ms after typing stops

useEffect(() => {
  if (debouncedQuery.length >= 3) fetchMythResults(debouncedQuery);
}, [debouncedQuery]);
```

### Rule 3 — Firestore — batch reads, never loop-fetch

```typescript
// BAD — N+1 problem: one read per voter (100 voters = 100 round trips)
const voters = voterIds.map(async (id) => {
  const doc = await getDoc(doc(db, 'voters', id));
  return doc.data();
});

// GOOD — one batched read
import { getDoc, getDocs, query, where, documentId } from 'firebase/firestore';

async function fetchVotersBatch(voterIds: string[]): Promise<VoterRecord[]> {
  // Firestore 'in' supports up to 30 items per query
  const chunks = chunkArray(voterIds, 30);
  const results = await Promise.all(
    chunks.map((chunk) =>
      getDocs(query(collection(db, 'voters'), where(documentId(), 'in', chunk)))
    )
  );
  return results.flatMap((snap) => snap.docs.map((d) => d.data() as VoterRecord));
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
```

### Rule 4 — React — prevent unnecessary re-renders

```tsx
import { memo, useMemo, useCallback } from 'react';

// Wrap pure components with memo — won't re-render if props are the same
const QuizOption = memo(function QuizOption({
  text, index, isSelected, onSelect,
}: QuizOptionProps) {
  return (
    <button onClick={() => onSelect(index)} aria-pressed={isSelected}>
      {text}
    </button>
  );
});

// Parent: stabilize callback reference with useCallback
function QuizCard({ questions, onAnswer }) {
  // useMemo for derived/filtered data
  const easyQuestions = useMemo(
    () => questions.filter((q) => q.difficulty === 'easy'),
    [questions]
  );

  // useCallback so QuizOption doesn't re-render due to new function reference
  const handleSelect = useCallback((index: number) => {
    onAnswer(index);
  }, [onAnswer]);

  return easyQuestions.map((q, i) => (
    <QuizOption key={q.id} text={q.options[i]} index={i} isSelected={false} onSelect={handleSelect} />
  ));
}
```

### Rule 5 — Images — always optimize

```tsx
// Next.js: use next/image (automatic WebP, lazy load, size optimization)
import Image from 'next/image';

<Image
  src="/election-booth.jpg"
  alt="Polling booth exterior"
  width={800}
  height={450}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQ..." // tiny base64 preview
/>

// Vanilla: always specify width + height to prevent layout shift (CLS)
<img
  src="/election-booth.jpg"
  alt="Polling booth exterior"
  width="800"
  height="450"
  loading="lazy"
  decoding="async"
/>
```

### Rule 6 — Parallel async calls with Promise.all

```typescript
// BAD — sequential: total time = A + B + C
const userSession  = await fetchSession(sessionId);
const boothDetails = await findNearestBooth(lat, lng);
const mythStats    = await fetchMythStats(userId);

// GOOD — parallel: total time = max(A, B, C)
const [userSession, boothDetails, mythStats] = await Promise.all([
  fetchSession(sessionId),
  findNearestBooth(lat, lng),
  fetchMythStats(userId),
]);

// When some calls are optional / may fail independently:
const [sessionResult, boothResult] = await Promise.allSettled([
  fetchSession(sessionId),
  findNearestBooth(lat, lng),
]);
const session = sessionResult.status === 'fulfilled' ? sessionResult.value : null;
const booth   = boothResult.status   === 'fulfilled' ? boothResult.value   : null;
```

### Rule 7 — Lazy load routes and heavy components

```tsx
// Next.js: dynamic import (defers loading until component is needed)
import dynamic from 'next/dynamic';

const GoogleMap = dynamic(() => import('@/components/GoogleMap'), {
  loading: () => <div aria-busy="true">Loading map…</div>,
  ssr:     false,  // Maps SDK is browser-only
});

const MythBusterPanel = dynamic(() => import('@/features/myth-buster/MythBusterPanel'));

// React (without Next.js):
const QuizEngine = React.lazy(() => import('./features/quiz/QuizEngine'));

function App() {
  return (
    <React.Suspense fallback={<span aria-busy="true">Loading quiz…</span>}>
      <QuizEngine />
    </React.Suspense>
  );
}
```

### Rule 8 — Memoize pure utility functions

```typescript
// utils/memoize.ts
export function memoize<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  keyFn: (...args: Args) => string = (...args) => JSON.stringify(args),
): (...args: Args) => Return {
  const cache = new Map<string, Return>();
  return (...args: Args): Return => {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Apply to pure, expensive computations
const getConstituencyFromPincode = memoize(
  (pincode: string) => lookupConstituency(pincode),
  (pincode) => pincode,  // simple string key
);
```

### Rule 9 — Bundle size — measure before submitting

```bash
# Next.js — analyze bundle
npx @next/bundle-analyzer

# Check for large dependencies before installing
npx bundlephobia <package-name>

# Target: main JS bundle < 200 KB gzipped for initial load
```

---

## Efficiency checklist — before every commit

- [ ] Every Google API call wrapped in a cache with appropriate TTL
- [ ] User-input-driven API calls debounced (≥ 300ms)
- [ ] No N+1 database queries — use batched reads or `in` queries
- [ ] `Promise.all` used for independent async operations
- [ ] React list items keyed by stable ID (not array index)
- [ ] Pure child components wrapped in `React.memo`
- [ ] Derived state computed with `useMemo`, callbacks with `useCallback`
- [ ] Heavy components / routes lazy-loaded with `dynamic()` or `React.lazy`
- [ ] All images have `loading="lazy"` and explicit `width`/`height`
- [ ] Bundle size checked — main chunk < 200 KB gzipped