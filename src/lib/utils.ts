/**
 * @file   utils.ts
 * @module ClientUtils
 * @description Client-side utility functions shared across React components.
 *              Provides Tailwind class merging and date formatting helpers.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies clsx, tailwind-merge, date-fns
 * @exports      cn, formatDate
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

/**
 * Merges Tailwind CSS class names with conflict resolution.
 * Combines clsx (conditional classes) with twMerge (deduplication).
 *
 * @param {...ClassValue[]} inputs - Class values to merge.
 * @returns {string} Merged, deduplicated class string.
 *
 * @example
 *   cn('px-4 py-2', isActive && 'bg-black text-white', 'px-8');
 *   // → 'py-2 bg-black text-white px-8'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Date (or date string) into a human-readable string (e.g. "April 28th, 2025").
 *
 * @param {Date | string} date - Date object or ISO date string.
 * @returns {string} Formatted date string using 'PPP' format.
 *
 * @example
 *   formatDate(new Date('2025-04-28')); // 'April 28th, 2025'
 */
export function formatDate(date: Date | string): string {
  return format(new Date(date), 'PPP');
}
