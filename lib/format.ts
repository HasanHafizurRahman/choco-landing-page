import type { CSSProperties } from 'react';
import type { Theme } from './types';

/** CSS variables that paint an element (and everything inside it) in a theme */
export function themeStyle(t: Theme): CSSProperties {
  return {
    '--season': t.accent,
    '--season-deep': t.deep,
    '--season-soft': t.soft,
    '--season-glow': t.glow,
  } as CSSProperties;
}

/** ৳1,800 · ৳1,25,000 (Bangladeshi digit grouping) */
export function money(amount: number, currency = '৳'): string {
  return currency + amount.toLocaleString('en-IN');
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
