/**
 * @file   memoize.test.ts
 * @module MemoizeTest
 * @description Unit tests for the generic memoize utility.
 *              Verifies caching behaviour, cache misses, and custom key functions.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 */

import { describe, it, expect, vi } from 'vitest';
import { memoize } from './memoize';

describe('memoize', () => {
  it('returns the correct result on first call', () => {
    const fn = vi.fn((x: number) => x * x);
    const memoFn = memoize(fn);
    expect(memoFn(5)).toBe(25);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('returns cached result on second call with same args (no recompute)', () => {
    const fn = vi.fn((x: number) => x * x);
    const memoFn = memoize(fn);

    memoFn(7);
    memoFn(7);
    memoFn(7);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(memoFn(7)).toBe(49);
  });

  it('recomputes when called with different arguments', () => {
    const fn = vi.fn((x: number) => x + 1);
    const memoFn = memoize(fn);

    expect(memoFn(1)).toBe(2);
    expect(memoFn(2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('supports multi-arg functions', () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memoFn = memoize(fn);

    expect(memoFn(3, 4)).toBe(7);
    expect(memoFn(3, 4)).toBe(7);
    expect(fn).toHaveBeenCalledTimes(1);

    expect(memoFn(5, 6)).toBe(11);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('supports a custom key function', () => {
    const fn = vi.fn((obj: { id: number }) => obj.id * 2);
    const memoFn = memoize(fn, (obj) => String(obj.id));

    expect(memoFn({ id: 10 })).toBe(20);
    expect(memoFn({ id: 10 })).toBe(20);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('returns correct results for string arguments', () => {
    const fn = vi.fn((s: string) => s.toUpperCase());
    const memoFn = memoize(fn);

    expect(memoFn('hello')).toBe('HELLO');
    expect(memoFn('hello')).toBe('HELLO');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('keeps separate cache entries for different args', () => {
    const fn = vi.fn((n: number) => n * 10);
    const memoFn = memoize(fn);

    memoFn(1);
    memoFn(2);
    memoFn(3);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(memoFn(1)).toBe(10);
    expect(memoFn(2)).toBe(20);
    expect(memoFn(3)).toBe(30);
    expect(fn).toHaveBeenCalledTimes(3); // no extra calls
  });
});
