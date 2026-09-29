'use client';

import type { ReactNode } from 'react';
import type { IsoDay, ShopData } from '@/lib/types';
import type { PreviewId } from '@/lib/preview';
import { themeStyle } from '@/lib/format';
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

/** Applies the current colours (brand, or the live season's) to everything inside it. */
function ThemeRoot({ children }: { children: ReactNode }) {
  const { s } = useStore();
  return (
    <div className="site" id="top" style={themeStyle(s.theme)} data-state={s.mode} data-theme={s.themeId}>
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
