import type { IsoDay, MonthDay, Product, Season, SeasonalCollection, ShopData, Theme } from './types';

const DAY_MS = 86_400_000;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

function parseIso(day: IsoDay) {
  const [y, m, d] = day.split('-').map(Number);
  return { y, m, d };
}

function parseMd(md: MonthDay) {
  const [m, d] = md.split('-').map(Number);
  return { m, d };
}

export function monthDayOf(day: IsoDay): MonthDay {
  return day.slice(5);
}

/** Is `day` inside a yearly window? Windows may wrap the new year (e.g. 12-16 → 02-13). */
export function inWindow(day: IsoDay, from: MonthDay, to: MonthDay): boolean {
  const { m, d } = parseIso(day);
  const x = m * 100 + d;
  const a = parseMd(from);
  const b = parseMd(to);
  const lo = a.m * 100 + a.d;
  const hi = b.m * 100 + b.d;
  return lo <= hi ? x >= lo && x <= hi : x >= lo || x <= hi;
}

/** Days from `day` until the next time `target` comes round (0 = today). */
export function daysUntil(day: IsoDay, target: MonthDay): number {
  const { y, m, d } = parseIso(day);
  const t = parseMd(target);
  const now = Date.UTC(y, m - 1, d);
  let next = Date.UTC(y, t.m - 1, t.d);
  if (next < now) next = Date.UTC(y + 1, t.m - 1, t.d);
  return Math.round((next - now) / DAY_MS);
}

export function formatMonthDay(md: MonthDay, short = false): string {
  const { m, d } = parseMd(md);
  return `${d} ${(short ? MONTHS_SHORT : MONTHS)[m - 1]}`;
}

export function formatDay(day: IsoDay): string {
  return formatMonthDay(monthDayOf(day));
}

export function monthName(month: number, short = false): string {
  return (short ? MONTHS_SHORT : MONTHS)[month - 1];
}

export function formatBestBefore(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-');
  return `${m}·${y}`;
}

/** Today's date in Bangladesh, as YYYY-MM-DD (same answer on server and client). */
export function todayInDhaka(): IsoDay {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export function seasonOn(seasons: Season[], day: IsoDay): Season {
  return seasons.find((s) => inWindow(day, s.from, s.to)) ?? seasons[0];
}

export function isLive(c: SeasonalCollection, day: IsoDay): boolean {
  if (c.status === 'on') return true;
  if (c.status === 'off') return false;
  return inWindow(day, c.from, c.to);
}

export interface SeasonState {
  day: IsoDay;
  /** The Bengali season on this date */
  season: Season;
  /** Seasonal collections that are live right now (admin override or inside their window) */
  live: SeasonalCollection[];
  /** The live collection that leads the page, if any */
  primary: SeasonalCollection | null;
  /** The next collection to open, when nothing is live */
  next: { collection: SeasonalCollection; days: number } | null;
  /** Colours in use: the live collection's, otherwise the Bengali season's */
  theme: Theme;
  themeSeason: Season;
}

export function resolveSeason(shop: ShopData, day: IsoDay): SeasonState {
  const seasonal = shop.collections.filter((c): c is SeasonalCollection => c.kind === 'seasonal');
  const live = seasonal.filter((c) => isLive(c, day));
  const primary = live[0] ?? null;
  const upcoming = seasonal
    .filter((c) => c.status !== 'off' && !live.includes(c))
    .map((collection) => ({ collection, days: daysUntil(day, collection.from) }))
    .sort((a, b) => a.days - b.days);
  const season = seasonOn(shop.seasons, day);
  const themeSeason = (primary && shop.seasons.find((s) => s.id === primary.theme)) || season;
  return { day, season, live, primary, next: upcoming[0] ?? null, theme: themeSeason.theme, themeSeason };
}

export type Availability = 'in' | 'last' | 'soon' | 'over';

/** Where a seasonal item (e.g. a mango variety) is in its own harvest window. */
export function availability(p: Product, day: IsoDay): Availability {
  if (!p.from || !p.to) return 'in';
  if (inWindow(day, p.from, p.to)) return daysUntil(day, p.to) <= 4 ? 'last' : 'in';
  const untilStart = daysUntil(day, p.from);
  const sinceEnd = 365 - daysUntil(day, p.to);
  return untilStart < sinceEnd ? 'soon' : 'over';
}

/** Days since 1 January for a month-day (non-leap reference year). */
export function dayOfYear(md: MonthDay): number {
  const { m, d } = parseMd(md);
  return (Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / DAY_MS;
}

/** Angle on the year wheel: degrees clockwise from Pohela Boishakh (14 April) at 12 o'clock. */
export function wheelAngle(md: MonthDay): number {
  const { m, d } = parseMd(md);
  let diff = (Date.UTC(2001, m - 1, d) - Date.UTC(2001, 3, 14)) / DAY_MS;
  if (diff < 0) diff += 365;
  return (diff / 365) * 360;
}
