'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { availability, formatMonthDay } from '@/lib/season';
import { money, plural } from '@/lib/format';
import { useStore } from './store';
import { useCart } from './cart';
import { Icon } from './Icons';
import { ProductImage } from './ProductCard';
import { isBdMobile } from './NotifyForm';

type View = 'cart' | 'checkout' | 'done';
type Errors = Partial<Record<'name' | 'phone' | 'address', string>>;

export function CartDrawer() {
  const { shop, s, go } = useStore();
  const cart = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>('cart');
  const [zoneId, setZoneId] = useState(shop.delivery.zones[0].id);
  const [errors, setErrors] = useState<Errors>({});
  const [order, setOrder] = useState<{ id: string; name: string; total: number; eta: string } | null>(null);
  const cur = shop.brand.currency;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (cart.open && !d.open) d.showModal();
    if (!cart.open && d.open) d.close();
    if (cart.open && view === 'done' && cart.count > 0) setView('cart');
  }, [cart.open]);

  const zone = shop.delivery.zones.find((z) => z.id === zoneId) ?? shop.delivery.zones[0];
  const freeEligible = zone.id === shop.delivery.zones[0].id;
  const free = freeEligible && cart.subtotal >= shop.delivery.freeOver;
  const fee = cart.count === 0 || free ? 0 : zone.fee;
  const total = cart.subtotal + fee;
  const toFree = Math.max(0, shop.delivery.freeOver - cart.subtotal);
  const filled = Math.min(10, Math.floor((cart.subtotal / shop.delivery.freeOver) * 10));

  const placeOrder = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const address = String(data.get('address') ?? '').trim();
    const next: Errors = {};
    if (!name) next.name = 'Enter the name for the delivery.';
    if (!isBdMobile(phone)) next.phone = 'Enter a Bangladeshi mobile number, like 01712 345678.';
    if (address.length < 8) next.address = 'Enter the full address, with area and road.';
    setErrors(next);
    if (Object.keys(next).length) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }
    // Prototype: send { lines, zone, payment, contact } to the order API here.
    setOrder({ id: `RT-${String(Date.now()).slice(-5)}`, name: name.split(' ')[0], total, eta: zone.eta });
    cart.clear();
    setView('done');
  };

  const title = view === 'checkout' ? 'Delivery details' : view === 'done' ? 'Thank you' : 'Your cart';

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="cart-title"
      onClose={() => cart.setOpen(false)}
      onClick={(e) => { if (e.target === ref.current) cart.setOpen(false); }}
    >
      <div className="drawer-head">
        <h2 id="cart-title">{title}</h2>
        <button className="icon-btn" type="button" aria-label="Close cart" onClick={() => cart.setOpen(false)}>
          <Icon name="close" />
        </button>
      </div>

      <div className="drawer-body">
        {view === 'done' && order && (
          <div className="done">
            <Icon name="rosette" className="done-mark" />
            <h3>Order placed, {order.name}.</h3>
            <p className="done-id">#{order.id}</p>
            <p>We’ll call to confirm within the hour. Delivery {order.eta}. Total {money(order.total, cur)}.</p>
            <p className="proto-note">Prototype: no order was sent anywhere.</p>
            <button type="button" className="btn btn-choc" onClick={() => { cart.setOpen(false); setView('cart'); }}>Keep browsing</button>
          </div>
        )}

        {view !== 'done' && cart.count === 0 && (
          <div className="cart-empty">
            <Icon name="rosette" />
            <p>Your cart is empty. The shelf isn’t.</p>
            <button type="button" className="btn btn-choc" onClick={() => { cart.setOpen(false); go('premium'); }}>Shop chocolate</button>
          </div>
        )}

        {view === 'cart' && cart.count > 0 && (
          <>
            <ul className="lines">
              {cart.lines.map((l) => {
                const soon = availability(l.product, s.day) === 'soon';
                return (
                  <li className="line" key={l.key}>
                    <span className={`line-img${l.product.fit === 'cover' ? ' is-cover' : ''}`}>
                      <ProductImage p={l.product} sizes="72px" className="line-img-inner" />
                    </span>
                    <div>
                      <p className="line-name">{l.product.name}</p>
                      <p className="line-meta">{[l.variant?.label ?? l.product.size, money(l.unit, cur)].filter(Boolean).join(' · ')}</p>
                      {soon && l.product.from && <span className="line-pre">Pre-book · ships from {formatMonthDay(l.product.from, true)}</span>}
                    </div>
                    <div className="line-side">
                      <span className="price">{money(l.unit * l.qty, cur)}</span>
                      <div className="stepper stepper-light" role="group" aria-label={`${l.product.name} quantity`}>
                        <button type="button" aria-label="One less" onClick={() => cart.setQty(l.key, l.qty - 1)}>−</button>
                        <output>{l.qty}</output>
                        <button type="button" aria-label="One more" onClick={() => cart.setQty(l.key, l.qty + 1)}>+</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="summary">
              {freeEligible && (
                <div className="free-bar">
                  <span>{free ? 'Free delivery inside Dhaka unlocked.' : `Add ${money(toFree, cur)} more for free delivery inside Dhaka.`}</span>
                  <span className="free-squares" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < filled ? 'on' : undefined} />)}
                  </span>
                </div>
              )}
              <div className="zone" role="group" aria-label="Delivery area">
                {shop.delivery.zones.map((z) => (
                  <button key={z.id} type="button" aria-pressed={z.id === zoneId} onClick={() => setZoneId(z.id)}>{z.label}</button>
                ))}
              </div>
              <p className="sum-row"><span>Subtotal · {plural(cart.count, 'item')}</span><span>{money(cart.subtotal, cur)}</span></p>
              <p className="sum-row"><span>Delivery, {zone.eta}</span><span>{fee === 0 ? 'Free' : money(fee, cur)}</span></p>
              <p className="sum-row total"><span>Total</span><span>{money(total, cur)}</span></p>
              <button type="button" className="btn btn-choc" onClick={() => setView('checkout')}>Checkout</button>
            </div>
          </>
        )}

        {view === 'checkout' && cart.count > 0 && (
          <form className="checkout" noValidate onSubmit={placeOrder}>
            <button type="button" className="back-link" onClick={() => setView('cart')}>Back to cart</button>
            <div className="field">
              <label htmlFor="co-name">Full name</label>
              <input id="co-name" name="name" autoComplete="name" aria-invalid={!!errors.name || undefined} aria-describedby={errors.name ? 'co-name-err' : undefined} />
              {errors.name && <p className="field-error" id="co-name-err">{errors.name}</p>}
            </div>
            <div className="field">
              <label htmlFor="co-phone">Mobile number</label>
              <input id="co-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01712 345678"
                aria-invalid={!!errors.phone || undefined} aria-describedby={errors.phone ? 'co-phone-err' : 'co-phone-hint'} />
              {errors.phone
                ? <p className="field-error" id="co-phone-err">{errors.phone}</p>
                : <p className="field-hint" id="co-phone-hint">The rider calls this number on arrival.</p>}
            </div>
            <div className="field">
              <label htmlFor="co-address">Address</label>
              <textarea id="co-address" name="address" autoComplete="street-address" placeholder="House, road, area"
                aria-invalid={!!errors.address || undefined} aria-describedby={errors.address ? 'co-address-err' : undefined} />
              {errors.address && <p className="field-error" id="co-address-err">{errors.address}</p>}
            </div>
            <div className="field">
              <span className="field-label" id="co-zone">Delivery area</span>
              <div className="zone" role="group" aria-labelledby="co-zone">
                {shop.delivery.zones.map((z) => (
                  <button key={z.id} type="button" aria-pressed={z.id === zoneId} onClick={() => setZoneId(z.id)}>{z.label}</button>
                ))}
              </div>
            </div>
            <fieldset className="field">
              <legend>Payment</legend>
              <div className="pay">
                {shop.payments.map((p, i) => (
                  <label key={p.id}>
                    <input type="radio" name="payment" value={p.id} defaultChecked={i === 0} />
                    {p.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="field">
              <label htmlFor="co-note">Gift note <span className="field-optional">(optional)</span></label>
              <textarea id="co-note" name="note" placeholder="We’ll write it on a card and leave the price out." />
            </div>
            <p className="sum-row total"><span>Total, delivery {fee === 0 ? 'free' : `${money(fee, cur)}`}</span><span>{money(total, cur)}</span></p>
            <button type="submit" className="btn btn-choc">Place order</button>
          </form>
        )}
      </div>
    </dialog>
  );
}
