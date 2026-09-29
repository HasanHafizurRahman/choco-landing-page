'use client';

import { useState } from 'react';
import { PREVIEWS } from '@/lib/preview';
import { resolveSeason, todayInDhaka } from '@/lib/season';
import { money, plural } from '@/lib/format';
import { useStore } from './store';
import { useCart } from './cart';
import { Icon } from './Icons';

/**
 * PROTOTYPE ONLY: preview the site on different dates.
 * Remove it (and lib/preview.ts) once the API decides what's live.
 */
export function PreviewDock() {
  const { shop, preview, setPreview } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <aside className="preview" aria-label="Prototype preview">
      <div className="preview-options" id="preview-options" hidden={!open}>
        <p className="preview-note">Prototype: see how the site changes through the year.</p>
        {PREVIEWS.map((opt) => {
          const day = opt.day ?? todayInDhaka();
          const st = resolveSeason(shop, day);
          const note = st.primary
            ? st.primary.countdownTo ? `${st.primary.title} are live` : `${st.primary.title} is live`
            : `${st.season.name} · nothing seasonal`;
          return (
            <button
              key={opt.id}
              type="button"
              className="preview-opt"
              aria-pressed={preview === opt.id}
              style={{ '--c': st.theme.accent } as React.CSSProperties}
              onClick={(e) => setPreview(opt.id, { x: e.clientX, y: e.clientY })}
            >
              <i aria-hidden="true" />
              <b>{opt.label}</b>
              <span>{note}</span>
            </button>
          );
        })}
      </div>
      <button className="preview-toggle" type="button" aria-expanded={open} aria-controls="preview-options" onClick={() => setOpen(!open)}>
        <span className="preview-dot" aria-hidden="true" />
        {open ? 'Hide preview' : 'Preview dates'}
      </button>
    </aside>
  );
}

export function CartBar() {
  const { shop } = useStore();
  const cart = useCart();
  if (!cart.count) return null;
  return (
    <button className="cartbar" type="button" onClick={() => cart.setOpen(true)}>
      <span>{plural(cart.count, 'item')} · {money(cart.subtotal, shop.brand.currency)}</span>
      <span className="cartbar-cta">View cart <Icon name="arrow" /></span>
    </button>
  );
}

export function LiveRegion() {
  const { message } = useCart();
  return <p className="sr-only" aria-live="polite">{message}</p>;
}
