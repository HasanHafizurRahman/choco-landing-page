'use client';

import type { ReactNode } from 'react';
import { useStore, type Tab } from './store';
import { useCart } from './cart';

/** A link that switches the shop tab, for use inside server components. */
export function GoLink({ to, children }: { to: Tab; children: ReactNode }) {
  const { go } = useStore();
  return (
    <a href="#shop" onClick={(e) => { e.preventDefault(); go(to); }}>
      {children}
    </a>
  );
}

export function OpenCartButton({ children }: { children: ReactNode }) {
  const { setOpen } = useCart();
  return (
    <button type="button" className="footer-link" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}
