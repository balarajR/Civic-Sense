/**
 * @file   useDebounce.ts
 * @module UseDebounce
 * @description Custom React hook that debounces a value by a specified delay.
 *              Prevents excessive API calls on every keystroke or rapid state change.
 *
 * @author  CivicSense Team
 * @created 2025-04-30
 *
 * @dependencies react
 * @exports      useDebounce
 */

import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates after `delayMs`
 * milliseconds of inactivity. Use for search inputs, location lookups,
 * and any user-driven API trigger.
 *
 * @param {T}      value   - The value to debounce.
 * @param {number} delayMs - Milliseconds to wait after the last change.
 * @returns {T} The debounced value.
 *
 * @example
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 400);
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
