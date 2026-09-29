'use client';

import { useEffect, useRef, useState } from 'react';
import { availability, formatBestBefore, formatMonthDay } from '@/lib/season';
import { money } from '@/lib/format';
import { useStore } from './store';
import { Icon } from './Icons';
import { BuyControls, CocoaMeter, ProductImage, statusTag, VariantPicker } from './ProductCard';

export function ProductSheet() {
  const { shop, s, product: p, openProduct } = useStore();
  const ref = useRef<HTMLDialogElement>(null);
  const [variantId, setVariantId] = useState<string | undefined>();

  useEffect(() => {
    setVariantId(p?.variants?.[p.variants.length - 1]?.id);
    const d = ref.current;
    if (!d) return;
    if (p && !d.open) d.showModal();
    if (!p && d.open) d.close();
  }, [p]);

  const variant = p?.variants?.find((v) => v.id === variantId);
  const tag = p ? statusTag(availability(p, s.day), p) : null;
  const isChocolate = p && shop.categories.some((c) => c.id === p.category);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={() => openProduct(null)}
      onClick={(e) => { if (e.target === ref.current) openProduct(null); }}
    >
      {p && (
        <>
          <button className="icon-btn sheet-close" type="button" aria-label="Close" onClick={() => openProduct(null)}>
            <Icon name="close" />
          </button>
          <div className="sheet-body">
            <div className={`sheet-media${p.fit === 'cover' ? ' is-cover' : ''}`}>
              <ProductImage p={p} sizes="(max-width: 760px) 100vw, 470px" className="sheet-img" />
              {tag && <span className={`tag ${tag.cls}`}>{tag.label}</span>}
            </div>
            <div className="sheet-info">
              <p className="card-brand">{p.brand} · {p.origin}</p>
              <h2 id="sheet-title">{p.name}</h2>
              <p className="sheet-desc">{p.description}</p>
              <dl className="specs">
                {p.size && <><dt>Size</dt><dd>{p.size}</dd></>}
                {p.cocoa && <><dt>Cocoa</dt><dd><CocoaMeter value={p.cocoa} /></dd></>}
                {p.aka && <><dt>Also called</dt><dd>{p.aka}</dd></>}
                {p.from && p.to && <><dt>Season</dt><dd>{formatMonthDay(p.from)} – {formatMonthDay(p.to)}</dd></>}
                {p.bestBefore && <><dt>Best before</dt><dd className="inkjet-inline">{formatBestBefore(p.bestBefore)}</dd></>}
                {isChocolate && <><dt>Storage</dt><dd>Below 20°C, out of the sun</dd></>}
                {p.category === 'mango' && <><dt>Ripening</dt><dd>Room temperature, then chill</dd></>}
              </dl>
              <VariantPicker p={p} value={variantId} onChange={setVariantId} />
              <div className="sheet-buy">
                <span className="price">{money(variant?.price ?? p.price ?? 0, shop.brand.currency)}</span>
                <BuyControls p={p} variantId={variantId} />
              </div>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
