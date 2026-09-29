'use client';

import type { ReactNode } from 'react';
import type { IsoDay, ShopData } from '@/lib/types';
import type { PreviewId } from '@/lib/preview';
import { StoreProvider, useStore } from './store';
import { CartProvider } from './cart';
import { IconSprite } from './Icons';
import { Announcement, Header, MobileMenu } from './Header';
import { Hero } from './Hero';
import { Shop } from './Shop';
import { SeasonPoster } from './SeasonPoster';
import { YearWheel } from './YearWheel';
import { CartDrawer } from './CartDrawer';
import { ProductSheet } from './ProductSheet';
import { CartBar, LiveRegion, PreviewDock } from './PreviewDock';

/** Applies the season's colours to everything inside it. */
function ThemeRoot({ children }: { children: ReactNode }) {
  const { s } = useStore();
  const style = {
    '--season': s.theme.accent,
    '--season-deep': s.theme.deep,
    '--season-soft': s.theme.soft,
    '--season-glow': s.theme.glow,
  } as React.CSSProperties;
  return (
    <div className="site" id="top" style={style} data-state={s.primary ? 'live' : 'off'} data-season={s.themeSeason.id}>
      {children}
    </div>
  );
}

export function Storefront({ shop, initialDay, initialPreview, deliveryPromise, faq, footer }: {
  shop: ShopData;
  initialDay: IsoDay;
  initialPreview: PreviewId;
  deliveryPromise: ReactNode;
  faq: ReactNode;
  footer: ReactNode;
}) {
  return (
    <StoreProvider shop={shop} initialDay={initialDay} initialPreview={initialPreview}>
      <CartProvider shop={shop}>
        <ThemeRoot>
          <IconSprite />
          <a className="skip-link" href="#shop">Skip to the shop</a>
          <Announcement />
          <Header />
          <main>
            <Hero />
            <Shop />
            <SeasonPoster />
            <YearWheel />
            {deliveryPromise}
            {faq}
          </main>
          {footer}
          <CartDrawer />
          <ProductSheet />
          <MobileMenu />
          <CartBar />
          <PreviewDock />
          <LiveRegion />
        </ThemeRoot>
      </CartProvider>
    </StoreProvider>
  );
}
