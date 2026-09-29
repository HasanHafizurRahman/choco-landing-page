'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { Icon } from './Icons';
import { createChocolateRenderer, type ChocolateRenderer } from '@/lib/chocolate-gl';
import { formatDay } from '@/lib/season';

const HINTS = {
  pointer: 'Move your cursor. The light follows.',
  tilt: 'Tilt your phone. The light follows.',
  tap: 'Tap the bar. The light follows.',
} as const;

export function Hero() {
  const { shop, s, go } = useStore();
  const stage = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ChocolateRenderer | null>(null);
  const [failed, setFailed] = useState(false);
  const [hint, setHint] = useState<keyof typeof HINTS>('pointer');
  const glow = s.theme.glow;
  const initialGlow = useRef(glow); // later changes go through setGlow below

  useEffect(() => {
    if (!canvas.current || !stage.current) return;
    if (window.matchMedia('(hover: none)').matches) setHint('tap');
    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-caprasimo').trim() || 'Georgia';
    const r = createChocolateRenderer(canvas.current, {
      word: shop.brand.name,
      fontFamily,
      glow: initialGlow.current,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      stage: stage.current,
      avoid: stage.current.querySelector<HTMLElement>('.hero-inner'),
      onHint: (kind) => setHint(kind),
    });
    if (!r) setFailed(true);
    renderer.current = r;
    return () => {
      r?.destroy();
      renderer.current = null;
    };
  }, [shop.brand.name]);

  useEffect(() => {
    renderer.current?.setGlow(glow);
  }, [glow]);

  const c = s.primary;
  const next = s.next?.collection;
  const line = c ? c.hero.now : next ? next.hero.next : 'Something new, every season.';
  const sub = c ? c.sub.now : next ? next.sub.next : '';
  const cta = c ? c.cta.now : next ? next.cta.next : 'Seasonal';

  return (
    <section ref={stage} className={`hero${failed ? ' no-webgl' : ''}`} aria-labelledby="hero-title">
      <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />
      <div className="hero-fallback" aria-hidden="true" />
      <div className="hero-inner">
        <p className="hero-eyebrow">
          <span className="season-chip">
            <span className="season-chip-dot" />
            <span lang="bn">{s.season.bn}</span>
          </span>
          <span>{s.season.name}, {s.season.en} · {formatDay(s.day)}</span>
        </p>
        <h1 className="hero-title" id="hero-title">
          <span className="hero-line">Chocolate, always.</span>
          <span className="hero-line hero-line-season">{line}</span>
        </h1>
        <p className="hero-sub">
          Imported chocolate from the brands you love, stored cool and delivered cool anywhere in Bangladesh. {sub}
        </p>
        <div className="hero-ctas">
          <a className="btn btn-butter" href="#shop" onClick={(e) => { e.preventDefault(); go('premium'); }}>
            Shop chocolate
          </a>
          <a className={`btn btn-season${c ? '' : ' is-next'}`} href="#shop" onClick={(e) => { e.preventDefault(); go('seasonal'); }}>
            {c ? <span className="live-dot" aria-hidden="true" /> : <Icon name="bell" className="btn-bell" />}
            {cta}
          </a>
        </div>
      </div>
      {!failed && (
        <p className="hero-hint" aria-hidden="true">
          <span className="hint-dot" />
          {HINTS[hint]}
        </p>
      )}
    </section>
  );
}
