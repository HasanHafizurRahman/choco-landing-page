'use client';

import type { Product, SeasonalCollection } from '@/lib/types';
import { availability, dayOfYear, daysUntil, formatMonthDay, monthDayOf, monthName } from '@/lib/season';
import { money } from '@/lib/format';
import { useStore } from './store';
import { BuyControls, ProductCard } from './ProductCard';
import { NotifyForm } from './NotifyForm';

const monthOfDoy = (doy: number) => new Date(Date.UTC(2001, 0, 1 + doy)).getUTCMonth() + 1;
const pad = (n: number) => String(n).padStart(2, '0');

function HarvestCalendar({ items }: { items: Product[] }) {
  const { s, shop } = useStore();
  const lo = Math.min(...items.map((p) => dayOfYear(p.from!))) - 7;
  const hi = Math.max(...items.map((p) => dayOfYear(p.to!))) + 7;
  const pct = (doy: number) => ((doy - lo) / (hi - lo)) * 100;
  const months: { label: string; left: number }[] = [];
  for (let m = monthOfDoy(lo); m <= monthOfDoy(hi); m++) {
    months.push({ label: monthName(m, true), left: Math.max(0, pct(dayOfYear(`${pad(m)}-01`))) });
  }
  const today = pct(dayOfYear(monthDayOf(s.day)));
  const showToday = today >= 0 && today <= 100;
  const statusText = { in: 'In season', last: 'Last few days', soon: 'Pre-book', over: 'Season over' } as const;

  return (
    <div className="harvest">
      <div className="harvest-head">
        <h3>Harvest calendar</h3>
        <p className="legend">
          <span><i />Picking now</span>
          <span><i className="soon" />Pre-book</span>
        </p>
      </div>
      <div className="hgrid" role="table" aria-label="Mango harvest calendar">
        <div className="hmonths" role="row" aria-hidden="true">
          <span />
          <div className="htrack">
            {months.map((m) => <span key={m.label} className="hmonth" style={{ left: `${m.left}%` }}>{m.label}</span>)}
            {showToday && <span className="htoday" style={{ left: `${today}%` }}><span className="htoday-label">Today</span></span>}
          </div>
          <span />
        </div>
        {items.map((p) => {
          const a = availability(p, s.day);
          const crate = p.variants?.[p.variants.length - 1];
          const from = pct(dayOfYear(p.from!));
          const to = pct(dayOfYear(p.to!) + 1);
          return (
            <div className="hrow" role="row" key={p.id}>
              <p className="hname" role="rowheader">
                <b>{p.name}</b>
                <small>{formatMonthDay(p.from!, true)} – {formatMonthDay(p.to!, true)}</small>
              </p>
              <div className="htrack" role="cell" aria-label={`${statusText[a]}, ${formatMonthDay(p.from!)} to ${formatMonthDay(p.to!)}`}>
                <span className={`hbar is-${a === 'last' ? 'in' : a}`} style={{ left: `${from}%`, width: `${to - from}%` }} />
                {showToday && <span className="htoday" style={{ left: `${today}%` }} />}
              </div>
              <div className="hact" role="cell">
                <p className="hprice">
                  <span className="price">{money(crate?.price ?? p.price ?? 0, shop.brand.currency)}</span>
                  <span className="hstatus">{crate?.label} · {statusText[a]}</span>
                </p>
                <BuyControls p={p} variantId={crate?.id} light />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PosterCopy({ c, children }: { c: SeasonalCollection; children?: React.ReactNode }) {
  const { go } = useStore();
  return (
    <div className="poster-copy">
      <p className="eyebrow">{c.poster.eyebrow}</p>
      {children}
      <h2 className="poster-title" id="poster-title">{c.poster.title}</h2>
      <p className="poster-body">{c.poster.body}</p>
      <div className="poster-actions">
        <button type="button" className="btn btn-choc" onClick={() => go('seasonal')}>{c.poster.cta}</button>
      </div>
    </div>
  );
}

function OffSeason() {
  const { shop, s, go } = useStore();
  const seasonal = shop.collections.filter((c): c is SeasonalCollection => c.kind === 'seasonal' && c.status !== 'off');
  const lastClosed = seasonal
    .map((c) => ({ c, since: 365 - daysUntil(s.day, c.to) }))
    .sort((a, b) => a.since - b.since)[0]?.c;
  const upcoming = seasonal
    .map((c) => ({ c, days: daysUntil(s.day, c.from) }))
    .sort((a, b) => a.days - b.days);
  const next = s.next;

  return (
    <>
      <div className="poster-copy">
        <p className="eyebrow">{s.season.name}, {s.season.en} · Between seasons</p>
        <h2 className="poster-title" id="poster-title">
          {next ? `${next.collection.title} open on ${formatMonthDay(next.collection.from)}.` : 'The chocolate shelf is open all year.'}
        </h2>
        <p className="poster-body">
          {lastClosed?.closedNote} {next ? 'Leave your number and we’ll text you the morning the next season opens.' : ''}
        </p>
        {next && <NotifyForm opensOn={formatMonthDay(next.collection.from)} what={next.collection.title} />}
        <div className="poster-actions">
          <button type="button" className="poster-link" onClick={() => go('premium')}>Meanwhile, the chocolate shelf is full</button>
        </div>
      </div>
      <div className="upcoming">
        <h3>Coming up</h3>
        <ul>
          {upcoming.map(({ c, days }) => {
            const theme = shop.seasons.find((x) => x.id === c.theme)?.theme;
            return (
              <li key={c.id}>
                <span className="up-swatch" style={{ '--c': theme?.accent } as React.CSSProperties} />
                <span className="up-name">
                  <b>{c.title}</b>
                  <span>{formatMonthDay(c.from)} – {formatMonthDay(c.to)}</span>
                </span>
                <span className="up-days">{days}<small>days</small></span>
              </li>
            );
          })}
        </ul>
        <p className="up-note"><span lang="bn">{s.season.bn}</span> · {s.season.note}</p>
      </div>
    </>
  );
}

export function SeasonPoster() {
  const { shop, s } = useStore();
  const c = s.primary;
  const items = c ? shop.products.filter((p) => p.collection === c.id) : [];
  const days = c?.countdownTo ? daysUntil(s.day, c.countdownTo) : 0;

  let body: React.ReactNode;
  if (!c) {
    body = <OffSeason />;
  } else if (c.poster.layout === 'harvest') {
    body = (
      <>
        <PosterCopy c={c} />
        <HarvestCalendar items={items} />
      </>
    );
  } else if (c.poster.layout === 'countdown') {
    body = (
      <>
        <PosterCopy c={c}>
          <p className="countdown">
            {days === 0 ? (
              <span className="countdown-label">It’s today.</span>
            ) : (
              <>
                <span className="countdown-num">{days}</span>
                <span className="countdown-label">{days === 1 ? 'day' : 'days'}<br />to go</span>
              </>
            )}
          </p>
        </PosterCopy>
        <div className="gift-row">{items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>
      </>
    );
  } else {
    body = (
      <>
        <PosterCopy c={c} />
        <div className="gift-row">{items.slice(0, 3).map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>
      </>
    );
  }

  return (
    <section className={`poster poster-${c ? c.poster.layout : 'off'}`} id="season" aria-labelledby="poster-title">
      <p className="poster-word" aria-hidden="true" lang="bn">{c ? c.bn : s.season.bn}</p>
      <div className="poster-inner">{body}</div>
    </section>
  );
}
