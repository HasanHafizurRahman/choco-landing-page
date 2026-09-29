'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { Icon } from './Icons';
import { createChocolateRenderer, type ChocolateRenderer } from '@/lib/chocolate-gl';

export function Hero() {
  const { shop, s, go } = useStore();
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ChocolateRenderer | null>(null);
  const [failed, setFailed] = useState(false);
  const [snapped, setSnapped] = useState(false);
  const [touch, setTouch] = useState(false);
  const initialGlow = useRef(s.theme.glow); // later changes go through setGlow below

  useEffect(() => {
    if (!canvas.current || !section.current || !stage.current) return;
    setTouch(window.matchMedia('(hover: none)').matches);
    const css = getComputedStyle(document.documentElement);
    const r = createChocolateRenderer(canvas.current, {
      word: shop.brand.name,
      wordFont: css.getPropertyValue('--font-caprasimo').trim() || 'Georgia, serif',
      glyph: shop.brand.mark,
      glyphFont: css.getPropertyValue('--font-anek').trim() || 'sans-serif',
      glow: initialGlow.current,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      stage: stage.current,
      events: section.current,
      onSnap: () => setSnapped(true),
      onRegrow: () => setSnapped(false),
    });
    if (!r) setFailed(true);
    renderer.current = r;
    return () => {
      r?.destroy();
      renderer.current = null;
    };
  }, [shop.brand.name, shop.brand.mark]);

  useEffect(() => {
    renderer.current?.setGlow(s.theme.glow);
  }, [s.theme.glow]);

  const live = s.primary;
  const soon = s.announced?.collection;
  const sub = live ? live.sub.now : soon ? soon.sub.next : '';
  const hint = snapped
    ? 'It grows back. Chocolate, always.'
    : touch ? 'Tap a square to snap it off.' : 'Click a square to snap it off.';

  return (
    <section ref={section} className={`hero${failed ? ' no-webgl' : ''}`} aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">
        {live ? `Chocolate, always. ${live.title} is on now.` : 'Chocolate, always.'}
      </h1>
      <div className="hero-inner">
        {/* The bar floats between the two words: behind "Chocolate," and in front of "always." */}
        <p className="hero-word hero-word-back" aria-hidden="true">Chocolate,</p>
        <div ref={stage} className="hero-stage" aria-hidden="true" />
        <p className="hero-word hero-word-front" aria-hidden="true">always.</p>
        <div className="hero-foot">
          <p className="hero-sub">
            Imported chocolate from the brands you love, stored cool and delivered cool anywhere in Bangladesh.
            {sub && <span className="hero-sub-season"> {sub}</span>}
          </p>
          <div className="hero-ctas">
            <a className="btn btn-butter" href="#shop" onClick={(e) => { e.preventDefault(); go('premium'); }}>
              Shop chocolate
            </a>
            {live && (
              <a className="btn btn-season" href="#shop" onClick={(e) => { e.preventDefault(); go('seasonal'); }}>
                <span className="live-dot" aria-hidden="true" />
                {live.cta.now}
              </a>
            )}
            {!live && soon && (
              <a className="btn btn-season is-next" href="#shop" onClick={(e) => { e.preventDefault(); go('seasonal'); }}>
                <Icon name="bell" className="btn-bell" />
                {soon.cta.next}
              </a>
            )}
            {!live && !soon && (
              <a className="hero-link" href="#delivery">
                How we keep it cool <Icon name="arrow" />
              </a>
            )}
          </div>
          {!failed && (
            <p className="hero-hint hero-hint-inline" aria-hidden="true">
              <span className="hint-dot" />
              {hint}
            </p>
          )}
        </div>
      </div>
      <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />
      {!failed && (
        <p className="hero-hint" aria-hidden="true">
          <span className="hint-dot" />
          {hint}
        </p>
      )}
    </section>
  );
}
