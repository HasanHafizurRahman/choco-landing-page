import type { IsoDay } from './types';

/**
 * PROTOTYPE ONLY. Lets you see the site in each state before the admin panel
 * exists. Delete this file and components/PreviewDock.tsx when the API decides
 * what is live, and pass today's date instead (see app/page.tsx).
 */
export type PreviewId = 'none' | 'soon' | 'mango' | 'gifts';

export interface PreviewOption {
  id: PreviewId;
  label: string;
  note: string;
  day: IsoDay | null; // null = the real date
  /** Force every seasonal collection off: the chocolate-only site */
  seasonalOff?: boolean;
}

export const PREVIEWS: PreviewOption[] = [
  { id: 'none', label: 'No season', note: 'Chocolate only', day: null, seasonalOff: true },
  { id: 'soon', label: '20 January', note: 'Gift boxes coming soon', day: '2027-01-20' },
  { id: 'mango', label: '12 June', note: 'Mango season', day: '2027-06-12' },
  { id: 'gifts', label: '6 February', note: 'Gift boxes', day: '2027-02-06' },
];

export const DEFAULT_PREVIEW: PreviewId = 'none';

export function findPreview(id: string | undefined): PreviewOption {
  return PREVIEWS.find((p) => p.id === id) ?? PREVIEWS.find((p) => p.id === DEFAULT_PREVIEW)!;
}
