/**
 * @file   memoize.ts
 * @module Memoize
 * @description Generic memoization utility for pure, expensive computations.
 *              Caches results by a serializable key to avoid redundant work.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 *
 * @dependencies none
 * @exports      memoize
 */

/**
 * Wraps a pure function with an in-memory result cache.
 * On repeated calls with the same arguments, returns the cached result
 * instead of re-computing.
 *
 * @param {Function} fn    - The pure function to memoize.
 * @param {Function} keyFn - Optional key generator (defaults to JSON.stringify).
 * @returns {Function} Memoized version of `fn`.
 *
 * @example
 *   const expensiveCalc = memoize((x: number) => x * x);
 *   expensiveCalc(5); // computes
 *   expensiveCalc(5); // returns cached
 */
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
