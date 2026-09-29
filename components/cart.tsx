'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product, ShopData, Variant } from '@/lib/types';
import { prefersReducedMotion } from './store';

interface StoredLine {
  key: string;
  productId: string;
  variantId?: string;
  qty: number;
}

export interface CartLine extends StoredLine {
  product: Product;
  variant?: Variant;
  unit: number;
}

interface CartValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  qtyOf: (key: string) => number;
  add: (product: Product, variantId?: string, from?: HTMLElement | null) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  message: string;
}

const CartContext = createContext<CartValue | null>(null);
const STORAGE_KEY = 'ritu-cart-v1';

export const lineKey = (productId: string, variantId?: string) => (variantId ? `${productId}:${variantId}` : productId);

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside <CartProvider>');
  return value;
}

/** A small chocolate square flies from the button to the cart. */
function flyToCart(from: HTMLElement) {
  const target = [...document.querySelectorAll<HTMLElement>('[data-cart-target]')].find((el) => el.offsetParent !== null);
  if (!target || prefersReducedMotion()) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const sx = a.left + a.width / 2 - 11;
  const sy = a.top + a.height / 2 - 11;
  const dx = b.left + b.width / 2 - 11 - sx;
  const dy = b.top + b.height / 2 - 11 - sy;
  const el = document.createElement('div');
  el.className = 'flyer';
  el.style.left = `${sx}px`;
  el.style.top = `${sy}px`;
  document.body.appendChild(el);
  const lift = Math.min(-80, dy * 0.5 - 60);
  el.animate(
    [
      { transform: 'translate(0, 0) rotate(0) scale(1)' },
      { transform: `translate(${dx * 0.45}px, ${lift}px) rotate(160deg) scale(1.25)`, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) rotate(320deg) scale(.45)`, opacity: 0.9 },
    ],
    { duration: 720, easing: 'cubic-bezier(.45,0,.2,1)' },
  ).finished.finally(() => {
    el.remove();
    target.classList.remove('is-bumped');
    void target.offsetWidth;
    target.classList.add('is-bumped');
  });
}

export function CartProvider({ shop, children }: { shop: ShopData; children: ReactNode }) {
  const [stored, setStored] = useState<StoredLine[]>([]);
  const [restored, setRestored] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Restore after hydration so server and client render the same first frame.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredLine[];
        setStored(parsed.filter((l) => shop.products.some((p) => p.id === l.productId) && l.qty > 0));
      }
    } catch {
      /* storage unavailable: start empty */
    }
    setRestored(true);
  }, [shop]);

  // Only save once the saved cart has been read back, or the first save would erase it.
  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* ignore */
    }
  }, [stored, restored]);

  const lines = useMemo<CartLine[]>(() => stored.flatMap((l) => {
    const product = shop.products.find((p) => p.id === l.productId);
    if (!product) return [];
    const variant = product.variants?.find((v) => v.id === l.variantId);
    return [{ ...l, product, variant, unit: variant?.price ?? product.price ?? 0 }];
  }), [stored, shop]);

  const add = useCallback((product: Product, variantId?: string, from?: HTMLElement | null) => {
    const key = lineKey(product.id, variantId);
    setStored((prev) => {
      const hit = prev.find((l) => l.key === key);
      if (hit) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { key, productId: product.id, variantId, qty: 1 }];
    });
    const variant = product.variants?.find((v) => v.id === variantId);
    setMessage(`Added ${product.name}${variant ? `, ${variant.label}` : ''} to your cart.`);
    if (from) flyToCart(from);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setStored((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l))));
  }, []);

  const value = useMemo<CartValue>(() => ({
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: lines.reduce((n, l) => n + l.qty * l.unit, 0),
    qtyOf: (key) => stored.find((l) => l.key === key)?.qty ?? 0,
    add,
    setQty,
    clear: () => setStored([]),
    open,
    setOpen,
    message,
  }), [lines, stored, add, setQty, open, message]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
