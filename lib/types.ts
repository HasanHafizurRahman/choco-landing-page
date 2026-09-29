/**
 * Shape of the shop data. The admin panel / API should return exactly this
 * (see lib/api.ts). Dates that repeat every year are "MM-DD" strings.
 */

export type MonthDay = string; // "MM-DD"
export type IsoDay = string; // "YYYY-MM-DD"

export interface Theme {
  accent: string; // bright season colour (buttons, highlights)
  deep: string; // darker shade, readable on light backgrounds
  soft: string; // page background tint
  glow: string; // light colour used by the hero chocolate
}

export interface Season {
  id: string;
  name: string;
  bn: string;
  en: string;
  months: string;
  from: MonthDay;
  to: MonthDay;
  note: string;
  theme: Theme;
}

export interface Brand {
  name: string;
  nameBn: string;
  tagline: string;
  currency: string;
  phone: string;
  city: string;
  links: { facebook: string; instagram: string; whatsapp: string };
}

export interface DeliveryZone {
  id: string;
  label: string;
  fee: number;
  eta: string;
}

export interface Delivery {
  freeOver: number;
  zones: DeliveryZone[];
}

export interface Payment {
  id: string;
  label: string;
}

export interface CoreCollection {
  id: string;
  kind: 'core';
  title: string;
  tabSub: string;
  shopTitle: string;
}

export type PosterLayout = 'harvest' | 'countdown' | 'grid';

export interface SeasonalCollection {
  id: string;
  kind: 'seasonal';
  /** "auto" = live inside its window; "on"/"off" = admin override */
  status: 'auto' | 'on' | 'off';
  from: MonthDay;
  to: MonthDay;
  theme: string; // season id whose colours this collection uses
  title: string;
  short: string;
  bn: string;
  shopTitle: string;
  countdownTo?: MonthDay;
  /** Top bar text while live (harvest collections list what's ripe instead) */
  announce?: string;
  hero: { now: string; next: string };
  sub: { now: string; next: string };
  cta: { now: string; next: string };
  poster: { layout: PosterLayout; eyebrow: string; title: string; body: string; cta: string };
  closedNote: string;
}

export type Collection = CoreCollection | SeasonalCollection;

export interface Category {
  id: string;
  label: string;
  swatch: string;
}

export interface Variant {
  id: string;
  label: string;
  price: number;
}

export interface Product {
  id: string;
  collection: string;
  category: string;
  brand: string;
  origin: string;
  name: string;
  aka?: string;
  size?: string;
  cocoa?: number;
  price?: number;
  variants?: Variant[];
  bestBefore?: string; // "YYYY-MM"
  tag?: string;
  image: string;
  fit?: 'contain' | 'cover';
  description: string;
  /** Harvest / availability window for seasonal items */
  from?: MonthDay;
  to?: MonthDay;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ShopData {
  brand: Brand;
  delivery: Delivery;
  payments: Payment[];
  seasons: Season[];
  collections: Collection[];
  categories: Category[];
  products: Product[];
  faq: FaqItem[];
}
