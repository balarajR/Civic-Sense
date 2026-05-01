import { cn, formatDate } from './utils';
import { describe, it, expect } from 'vitest';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-4 py-2', 'bg-black text-white')).toBe('px-4 py-2 bg-black text-white');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const isInactive = false;
      expect(cn('px-4', isActive && 'active', isInactive && 'inactive')).toBe('px-4 active');
    });

    it('resolves tailwind conflicts', () => {
      expect(cn('px-4 py-2', 'px-8')).toBe('py-2 px-8');
    });
  });

  describe('formatDate', () => {
    it('formats a Date object', () => {
      const date = new Date('2025-04-28T00:00:00Z');
      const formatted = formatDate(date);
      // PPP format output depends on the local timezone, but generally includes month, day, and year.
      // So let's just check that it's a string and contains 2025.
      expect(typeof formatted).toBe('string');
      expect(formatted).toMatch(/2025/);
    });

    it('formats a date string', () => {
      const formatted = formatDate('2025-04-28T00:00:00Z');
      expect(typeof formatted).toBe('string');
      expect(formatted).toMatch(/2025/);
    });
  });
});
