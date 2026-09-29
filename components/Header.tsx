'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { useCart } from './cart';
import { Icon, LogoMark } from './Icons';
import { availability } from '@/lib/season';
import { money } from '@/lib/format';

function listNames(names: string[]) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function Announcement() {
  const { shop, s } = useStore();
  let text: string;
  if (s.primary?.poster.layout === 'harvest') {
    const ripe = shop.products
      .filter((p) => p.collection === s.primary!.id && ['in', 'last'].includes(availability(p, s.day)))
      .map((p) => p.name);
    text = ripe.length ? `In season now: ${listNames(ripe)}.` : s.primary.sub.now;
  } else if (s.primary) {
    text = s.primary.announce ?? s.primary.sub.now;
  } else if (s.announced) {
    text = s.announced.collection.soonAnnounce;
  } else {
    text = `Free delivery inside Dhaka on orders over ${money(shop.delivery.freeOver, shop.brand.currency)}.`;
  }
  return (
    <div className="announce" role="note">
      <p>{text}</p>
    </div>
  );
}

/** Label for the seasonal link, or null when the site is chocolate only. */
export function useSeasonalLabel() {
  const { s } = useStore();
  if (s.primary) return s.primary.short;
  if (s.announced) return `${s.announced.collection.short} · soon`;
  return null;
}

export function Header() {
  const { shop, go, setMenuOpen } = useStore();
  const { count, setOpen } = useCart();
  const seasonal = useSeasonalLabel();
  const [solid, setSolid] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Transparent over the dark hero, solid once the shop scrolls under it.
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const hero = document.querySelector<HTMLElement>('.hero');
      const h = ref.current?.offsetHeight ?? 0;
      setSolid(hero ? hero.getBoundingClientRect().bottom <= h + 1 : window.scrollY > 10);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header ref={ref} className={`site-header${solid ? ' is-solid' : ''}`}>
      <a className="logo" href="#top" aria-label={`${shop.brand.name}, back to top`}>
        <LogoMark mark={shop.brand.mark} />
        <span className="logo-word">{shop.brand.name}</span>
        <span className="logo-bn" lang="bn">{shop.brand.nameBn}</span>
      </a>
      <nav className="nav" aria-label="Main">
        <a href="#shop" onClick={(e) => { e.preventDefault(); go('premium'); }}>Chocolate</a>
        {seasonal && (
          <a href="#shop" onClick={(e) => { e.preventDefault(); go('seasonal'); }}>
            <span className="live-dot" aria-hidden="true" />
            {seasonal}
          </a>
        )}
        {seasonal && <a href="#year">The year</a>}
        <a href="#delivery">Delivery</a>
        {!seasonal && <a href="#faq">Questions</a>}
      </nav>
      <div className="header-actions">
        <button className="cart-btn" type="button" data-cart-target onClick={() => setOpen(true)}
          aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
          <Icon name="bag" />
          <span className="cart-count" aria-hidden="true">{count}</span>
        </button>
        <button className="menu-btn" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Icon name="menu" />
        </button>
      </div>
    </header>
  );
}

export function MobileMenu() {
  const { shop, go, menuOpen, setMenuOpen } = useStore();
  const seasonal = useSeasonalLabel();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (menuOpen && !d.open) d.showModal();
    if (!menuOpen && d.open) d.close();
  }, [menuOpen]);

  const follow = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }));
  };

  return (
    <dialog ref={ref} className="menu" aria-label="Menu" onClose={() => setMenuOpen(false)}>
      <div className="menu-head">
        <span className="logo">
          <LogoMark mark={shop.brand.mark} />
          <span className="logo-word">{shop.brand.name}</span>
        </span>
        <button className="icon-btn" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
          <Icon name="close" />
        </button>
      </div>
      <nav className="menu-nav" aria-label="Mobile">
        <a href="#shop" onClick={(e) => { e.preventDefault(); go('premium'); }}>Chocolate</a>
        {seasonal && <a href="#shop" onClick={(e) => { e.preventDefault(); go('seasonal'); }}>{seasonal}</a>}
        {seasonal && <a href="#year" onClick={follow('#year')}>The year</a>}
        <a href="#delivery" onClick={follow('#delivery')}>Delivery</a>
        <a href="#faq" onClick={follow('#faq')}>Questions</a>
      </nav>
    </dialog>
  );
}
