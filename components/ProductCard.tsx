'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Product } from '@/lib/types';
import { availability, formatBestBefore, formatMonthDay, type Availability } from '@/lib/season';
import { money } from '@/lib/format';
import { useStore } from './store';
import { lineKey, useCart } from './cart';

/** Ten little squares: how dark is this bar? */
export function CocoaMeter({ value }: { value: number }) {
  const on = Math.round(value / 10);
  return (
    <span className="cocoa" role="img" aria-label={`${value}% cocoa`}>
      {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < on ? 'on' : undefined} />)}
      <span className="cocoa-num" aria-hidden="true">{value}%</span>
    </span>
  );
}

export function ProductImage({ p, sizes, className = 'plate-img' }: { p: Product; sizes: string; className?: string }) {
  return (
    <span className={className}>
      <Image src={p.image} alt="" fill sizes={sizes} />
    </span>
  );
}

export function statusTag(a: Availability, p: Product): { label: string; cls: string } | null {
  if (!p.from || !p.to) return p.tag ? { label: p.tag, cls: '' } : null;
  if (a === 'in') return { label: 'In season', cls: 'tag-in' };
  if (a === 'last') return { label: 'Last few days', cls: 'tag-last' };
  if (a === 'soon') return { label: `From ${formatMonthDay(p.from, true)}`, cls: 'tag-soon' };
  return { label: 'Season over', cls: 'tag-over' };
}

export function VariantPicker({ p, value, onChange }: { p: Product; value?: string; onChange: (id: string) => void }) {
  if (!p.variants?.length) return null;
  return (
    <div className="variants" role="group" aria-label={`${p.name} crate size`}>
      {p.variants.map((v) => (
        <button key={v.id} type="button" className="variant" aria-pressed={v.id === value} onClick={() => onChange(v.id)}>
          {v.label}
        </button>
      ))}
    </div>
  );
}

/** Add / Pre-book button that turns into a quantity stepper once it's in the cart. */
export function BuyControls({ p, variantId, light = false }: { p: Product; variantId?: string; light?: boolean }) {
  const { s } = useStore();
  const cart = useCart();
  const a = availability(p, s.day);
  const key = lineKey(p.id, variantId);
  const qty = cart.qtyOf(key);
  const variant = p.variants?.find((v) => v.id === variantId);
  const label = `${p.name}${variant ? `, ${variant.label}` : ''}`;

  if (a === 'over') {
    return <button className="add-btn" type="button" disabled>Season over</button>;
  }
  if (qty > 0) {
    return (
      <div className={`stepper${light ? ' stepper-light' : ''}`} role="group" aria-label={`${label} quantity`}>
        <button type="button" aria-label={`One less ${label}`} onClick={() => cart.setQty(key, qty - 1)}>−</button>
        <output aria-live="polite">{qty}</output>
        <button type="button" aria-label={`One more ${label}`} onClick={() => cart.setQty(key, qty + 1)}>+</button>
      </div>
    );
  }
  const soon = a === 'soon';
  return (
    <button
      className={`add-btn${soon ? ' is-prebook' : ''}`}
      type="button"
      aria-label={`${soon ? 'Pre-book' : 'Add'} ${label}`}
      onClick={(e) => cart.add(p, variantId, e.currentTarget)}
    >
      {soon ? 'Pre-book' : 'Add'}
      {!soon && <span aria-hidden="true">+</span>}
    </button>
  );
}

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { s, shop, openProduct } = useStore();
  const [variantId, setVariantId] = useState(p.variants?.[p.variants.length - 1]?.id);
  const variant = p.variants?.find((v) => v.id === variantId);
  const price = variant?.price ?? p.price ?? 0;
  const a = availability(p, s.day);
  const tag = statusTag(a, p);

  return (
    <article className={`card${a === 'over' ? ' is-over' : ''}`} style={{ '--i': index } as React.CSSProperties}>
      <button type="button" className={`plate${p.fit === 'cover' ? ' is-cover' : ''}`} onClick={() => openProduct(p.id)} aria-label={`${p.name}: details`}>
        <ProductImage p={p} sizes="(max-width: 760px) 46vw, (max-width: 1140px) 31vw, 300px" />
        {tag && <span className={`tag ${tag.cls}`}>{tag.label}</span>}
        {p.bestBefore && <span className="bb" aria-hidden="true">BB {formatBestBefore(p.bestBefore)}</span>}
      </button>
      <div className="card-body">
        <p className="card-brand">{p.brand} · {p.origin}</p>
        <h3 className="card-name">
          {p.name}
          {p.aka && <span className="card-aka"> ({p.aka})</span>}
        </h3>
        <p className="card-meta">
          {p.size && <span>{p.size}</span>}
          {p.cocoa && <CocoaMeter value={p.cocoa} />}
          {p.from && p.to && <span>{formatMonthDay(p.from, true)} – {formatMonthDay(p.to, true)}</span>}
        </p>
        <VariantPicker p={p} value={variantId} onChange={setVariantId} />
        <div className="card-foot">
          <span className="price">{money(price, shop.brand.currency)}</span>
          <BuyControls p={p} variantId={variantId} />
        </div>
      </div>
    </article>
  );
}
