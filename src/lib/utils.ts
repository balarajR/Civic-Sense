/**
 * Common utility for Tailwind class merging.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format dates consistently.
 */
import { format } from 'date-fns';

export function formatDate(date: Date | string) {
  return format(new Date(date), 'PPP');
}
