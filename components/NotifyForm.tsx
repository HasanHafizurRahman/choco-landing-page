'use client';

import { useId, useState } from 'react';
import { Icon } from './Icons';

const BD_MOBILE = /^(?:\+?88)?01[3-9]\d{8}$/;

export const isBdMobile = (value: string) => BD_MOBILE.test(value.replace(/[\s-]/g, ''));

/**
 * Collects a phone number for a "text me when it opens" reminder.
 * Prototype: nothing is sent yet. Wire onSubmit to the API later.
 */
export function NotifyForm({ opensOn, what, dark = false }: { opensOn: string; what: string; dark?: boolean }) {
  const id = useId();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="notify-done" role="status">
        <Icon name="check" className="notify-check" />
        Done. We’ll text you on {opensOn}, the morning {what.toLowerCase()} open.
      </p>
    );
  }

  return (
    <form
      className={`notify${dark ? ' notify-dark' : ''}`}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!isBdMobile(phone)) {
          setError('Enter a Bangladeshi mobile number, like 01712 345678.');
          return;
        }
        setError('');
        setDone(true);
      }}
    >
      <label htmlFor={id}>Text me when {what.toLowerCase()} open</label>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="01712 345678"
        value={phone}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : `${id}-hint`}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button className={`btn ${dark ? 'btn-season' : 'btn-choc'}`} type="submit">Remind me</button>
      {error
        ? <p className="notify-error" id={`${id}-err`}>{error}</p>
        : <p className="notify-hint" id={`${id}-hint`}>One text on opening day. No spam, ever.</p>}
    </form>
  );
}
