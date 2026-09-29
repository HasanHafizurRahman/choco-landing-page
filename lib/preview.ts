import type { IsoDay } from './types';

/**
 * PROTOTYPE ONLY. Lets you see the site on different dates before the admin
 * panel exists. Delete this file and components/PreviewDock.tsx when the API
 * decides what is live, and pass today's date instead (see app/page.tsx).
 */
export type PreviewId = 'mango' | 'gifts' | 'today';

export interface PreviewOption {
  id: PreviewId;
  label: string;
  day: IsoDay | null; // null = the real date
}

export const PREVIEWS: PreviewOption[] = [
  { id: 'mango', label: '12 June', day: '2027-06-12' },
  { id: 'gifts', label: '6 February', day: '2027-02-06' },
  { id: 'today', label: 'Today', day: null },
];

export const DEFAULT_PREVIEW: PreviewId = 'mango';

export function findPreview(id: string | undefined): PreviewOption {
  return PREVIEWS.find((p) => p.id === id) ?? PREVIEWS.find((p) => p.id === DEFAULT_PREVIEW)!;
}
