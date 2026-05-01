/**
 * @file   useDebounce.test.ts
 * @module UseDebounceTest
 * @description Unit tests for the useDebounce React hook.
 *              Tests initial value, delayed update, and rapid-fire changes.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update value before the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } },
    );

    rerender({ value: 'b', delay: 500 });
    // Only 200ms passed — should still be 'a'
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('a');
  });

  it('updates value after the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } },
    );

    rerender({ value: 'b', delay: 300 });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('b');
  });

  it('only emits the last value when rapid changes occur', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 400 } },
    );

    // Rapid fire changes
    rerender({ value: 'b', delay: 400 });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: 'c', delay: 400 });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: 'd', delay: 400 });
    act(() => { vi.advanceTimersByTime(400); });

    // Should only have the final value
    expect(result.current).toBe('d');
  });

  it('handles numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 200 } },
    );

    rerender({ value: 42, delay: 200 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe(42);
  });

  it('handles zero delay (immediate)', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'x', delay: 0 } },
    );

    rerender({ value: 'y', delay: 0 });
    act(() => { vi.advanceTimersByTime(0); });
    expect(result.current).toBe('y');
  });
});
