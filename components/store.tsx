'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import type { IsoDay, Product, ShopData } from '@/lib/types';
import { resolveSeason, todayInDhaka, type SeasonState } from '@/lib/season';
import { findPreview, type PreviewId } from '@/lib/preview';

export type Tab = 'premium' | 'seasonal';

interface StoreValue {
  shop: ShopData;
  s: SeasonState;
  preview: PreviewId;
  setPreview: (id: PreviewId, origin?: { x: number; y: number }) => void;
  tab: Tab;
  setTab: (tab: Tab) => void;
  /** Switch the shop tab and scroll to it */
  go: (tab: Tab) => void;
  product: Product | null;
  openProduct: (id: string | null) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside <StoreProvider>');
  return value;
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function StoreProvider({ shop, initialDay, initialPreview, children }: {
  shop: ShopData;
  initialDay: IsoDay;
  initialPreview: PreviewId;
  children: ReactNode;
}) {
  const [day, setDay] = useState(initialDay);
  const [preview, setPreviewId] = useState(initialPreview);
  const [tab, setTab] = useState<Tab>('premium');
  const [productId, setProductId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const seasonalOff = !!findPreview(preview).seasonalOff;
  const s = useMemo(() => resolveSeason(shop, day, { seasonalOff }), [shop, day, seasonalOff]);
  const product = useMemo(() => shop.products.find((p) => p.id === productId) ?? null, [shop, productId]);

  const setPreview = useCallback((id: PreviewId, origin?: { x: number; y: number }) => {
    const nextDay = findPreview(id).day ?? todayInDhaka();
    const url = new URL(window.location.href);
    url.searchParams.set('preview', id);
    window.history.replaceState(null, '', url);

    const apply = () => {
      setPreviewId(id);
      setDay(nextDay);
    };
    if (!document.startViewTransition || prefersReducedMotion()) {
      apply();
      return;
    }
    // The new season floods in as a circle from wherever you clicked.
    const root = document.documentElement;
    root.classList.add('is-switching');
    const vt = document.startViewTransition(() => flushSync(apply));
    // If the page can't render a frame soon (throttled tab), skip the animation; the update still runs.
    const guard = window.setTimeout(() => vt.skipTransition(), 400);
    vt.updateCallbackDone.finally(() => window.clearTimeout(guard));
    vt.ready
      .then(() => {
        const x = origin?.x ?? window.innerWidth / 2;
        const y = origin?.y ?? window.innerHeight / 2;
        const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 950, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {});
    vt.finished.finally(() => root.classList.remove('is-switching'));
  }, []);

  const go = useCallback((next: Tab) => {
    setTab(next);
    setMenuOpen(false);
    requestAnimationFrame(() => {
      document.getElementById('shop')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
  }, []);

  const value = useMemo<StoreValue>(() => ({
    shop, s, preview, setPreview, tab, setTab, go,
    product, openProduct: setProductId, menuOpen, setMenuOpen,
  }), [shop, s, preview, setPreview, tab, go, product, menuOpen]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
