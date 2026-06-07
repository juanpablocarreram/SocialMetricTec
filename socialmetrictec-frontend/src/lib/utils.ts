import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Appends a two-digit hex alpha to a 6-digit hex color. opacity: 0–1 */
export function withOpacity(hex: string, opacity: number): string {
  const clamped = Math.max(0, Math.min(1, opacity));
  const alpha = Math.round(clamped * 255).toString(16).padStart(2, '0');
  return hex + alpha;
}
