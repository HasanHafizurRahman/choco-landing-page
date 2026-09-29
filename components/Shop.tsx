'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import type { CoreCollection, Product } from '@/lib/types';
import { availability, formatMonthDay } from '@/lib/season';
import { useStore, type Tab } from './store';
import { ProductCard } from './ProductCard';
import { NotifyForm } from './NotifyForm';

interface Chip {
  id: string;
  label: string;
  count: number;
  swatch?: string;
}

function ShopPanel({ items, chips, match }: { items: Product[]; chips: Chip[]; match: (p: Product, chip: string) => boolean }) {
  const [filter, setFilter] = useState('all');
  const visible = filter === 'all' ? items : items.filter((p) => match(p, filter));
  const shown = chips.filter((c) => c.id === 'all' || c.count > 0);

  return (
    <>
      {shown.length > 2 && (
        <div className="chips" role="group" aria-label="Filter">
          {shown.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.swatch && <span className="chip-swatch" style={{ '--sw': c.swatch } as React.CSSProperties} />}
              {c.label}
              <span className="chip-count">{c.count}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid is-entering" key={filter}>
        {visible.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
      </div>
    </>
  );
}

/** Seasonal tab while a collection is being teased */
function SoonPanel() {
  const { s, go } = useStore();
  const next = s.announced;
  if (!next) return null;
  const c = next.collection;
  const opens = formatMonthDay(c.from);
  return (
    <div className="next-panel">
      <div>
        <p className="eyebrow eyebrow-on-dark">Coming soon</p>
        <h3>{c.teaser.title}</h3>
        <p>{c.teaser.body}</p>
        <NotifyForm opensOn={opens} what={c.title} dark />
      </div>
      <div className="next-count">
        <p className="next-days">{next.days}<small>days to go</small></p>
        <button type="button" className="poster-link on-dark" onClick={() => go('premium')}>Browse chocolate instead</button>
      </div>
    </div>
  );
}

export function Shop() {
  const { shop, s, tab: chosenTab, setTab } = useStore();
  const premium = shop.collections.find((c): c is CoreCollection => c.kind === 'core')!;
  const tabs = useRef<Record<Tab, HTMLButtonElement | null>>({ premium: null, seasonal: null });

  // Chocolate-only: no switch, just the shelf
  const showSwitch = s.mode !== 'none';
  const tab: Tab = showSwitch ? chosenTab : 'premium';
  const seasonalSub = s.primary
    ? `${s.primary.title} · live`
    : s.announced
      ? `${s.announced.collection.short} · opens ${formatMonthDay(s.announced.collection.from, true)}`
      : '';
  const title = tab === 'premium' ? premium.shopTitle : s.primary ? s.primary.shopTitle : 'Coming soon.';

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next: Tab = tab === 'premium' ? 'seasonal' : 'premium';
    setTab(next);
    tabs.current[next]?.focus();
  };

  let panel: React.ReactNode;
  if (tab === 'premium') {
    const items = shop.products.filter((p) => p.collection === premium.id);
    const chips: Chip[] = [
      { id: 'all', label: 'All', count: items.length },
      ...shop.categories.map((c) => ({ id: c.id, label: c.label, swatch: c.swatch, count: items.filter((p) => p.category === c.id).length })),
    ];
    panel = <ShopPanel key="premium" items={items} chips={chips} match={(p, f) => p.category === f} />;
  } else if (s.live.length) {
    const liveIds = s.live.map((c) => c.id);
    const items = shop.products.filter((p) => liveIds.includes(p.collection));
    let chips: Chip[];
    let match: (p: Product, f: string) => boolean;
    if (s.live.length > 1) {
      chips = [{ id: 'all', label: 'All', count: items.length }, ...s.live.map((c) => ({ id: c.id, label: c.short, count: items.filter((p) => p.collection === c.id).length }))];
      match = (p, f) => p.collection === f;
    } else {
      const group = (p: Product) => (['in', 'last'].includes(availability(p, s.day)) ? 'in' : availability(p, s.day));
      chips = [
        { id: 'all', label: 'All', count: items.length },
        { id: 'in', label: 'In season', count: items.filter((p) => group(p) === 'in').length },
        { id: 'soon', label: 'Pre-book', count: items.filter((p) => group(p) === 'soon').length },
      ];
      match = (p, f) => group(p) === f;
    }
    panel = <ShopPanel key={`seasonal-${liveIds.join('+')}-${s.day}`} items={items} chips={chips} match={match} />;
  } else {
    panel = <SoonPanel />;
  }

  return (
    <section className="shop" id="shop" aria-labelledby="shop-title">
      <div className="shop-head">
        <div>
          <p className="eyebrow">The shop</p>
          <h2 className="section-title" id="shop-title">{title}</h2>
        </div>
        {showSwitch && (
          <div className="switch" role="tablist" aria-label="Collections" onKeyDown={onKey}>
            <button
              ref={(el) => { tabs.current.premium = el; }}
              className="switch-btn" role="tab" id="tab-premium" type="button"
              aria-selected={tab === 'premium'} aria-controls="shop-panel" tabIndex={tab === 'premium' ? 0 : -1}
              onClick={() => setTab('premium')}
            >
              <span className="switch-title">Premium</span>
              <span className="switch-sub">{premium.tabSub}</span>
            </button>
            <button
              ref={(el) => { tabs.current.seasonal = el; }}
              className="switch-btn switch-btn-season" role="tab" id="tab-seasonal" type="button"
              aria-selected={tab === 'seasonal'} aria-controls="shop-panel" tabIndex={tab === 'seasonal' ? 0 : -1}
              onClick={() => setTab('seasonal')}
            >
              <span className="switch-title">
                <span className="live-dot" aria-hidden="true" />
                Seasonal
              </span>
              <span className="switch-sub">{seasonalSub}</span>
            </button>
          </div>
        )}
      </div>
      <div className="shop-panel" id="shop-panel" {...(showSwitch ? { role: 'tabpanel', 'aria-labelledby': `tab-${tab}` } : {})}>
        {panel}
      </div>
    </section>
  );
}
