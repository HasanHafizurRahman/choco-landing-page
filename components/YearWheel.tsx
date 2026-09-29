'use client';

import { useState } from 'react';
import type { Season, SeasonalCollection } from '@/lib/types';
import { formatDay, formatMonthDay, inWindow, monthDayOf, monthName, wheelAngle } from '@/lib/season';
import { useStore } from './store';

const C = 320;
const DAY_DEG = 360 / 365;
const pad = (n: number) => String(n).padStart(2, '0');
const r2 = (n: number) => Math.round(n * 100) / 100;

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r2(C + r * Math.cos(a)), r2(C + r * Math.sin(a))] as const;
}

/** Clockwise arc from a0 to a1 (degrees, 0 = top). `reverse` draws it the other way so text reads upright. */
function arc(r: number, a0: number, a1: number, reverse = false) {
  let sweep = a1 - a0;
  if (sweep <= 0) sweep += 360;
  const large = sweep > 180 ? 1 : 0;
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a0 + sweep);
  return reverse
    ? `M${x1} ${y1}A${r} ${r} 0 ${large} 0 ${x0} ${y0}`
    : `M${x0} ${y0}A${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

function span(from: string, to: string) {
  const a0 = wheelAngle(from);
  let a1 = wheelAngle(to) + DAY_DEG;
  if (a1 <= a0) a1 += 360;
  return { a0, a1, mid: (a0 + (a1 - a0) / 2) % 360, sweep: a1 - a0 };
}

function overlaps(season: Season, c: SeasonalCollection) {
  return inWindow(`2001-${c.from}`, season.from, season.to) || inWindow(`2001-${season.from}`, c.from, c.to);
}

export function YearWheel() {
  const { shop, s } = useStore();
  const [focus, setFocus] = useState<string | null>(null);
  const focused = shop.seasons.find((x) => x.id === focus) ?? null;
  const shown = focused ?? s.season;
  const seasonal = shop.collections.filter((c): c is SeasonalCollection => c.kind === 'seasonal' && c.status !== 'off');
  const today = wheelAngle(monthDayOf(s.day));
  const [tx0, ty0] = polar(150, today);
  const [tx1, ty1] = polar(284, today);

  const status = focused
    ? seasonal.filter((c) => overlaps(focused, c)).map((c) => `${c.short} from ${formatMonthDay(c.from, true)}`).join(' · ') || 'Chocolate, as always'
    : `Today, ${formatDay(s.day)}`;

  // Seasonal collections share a ring unless their windows overlap
  const lanes: { a0: number; a1: number }[][] = [];
  const arcs = seasonal.map((c) => {
    const sp = span(c.from, c.to);
    let lane = lanes.findIndex((l) => l.every((o) => sp.a1 <= o.a0 || sp.a0 >= o.a1));
    if (lane === -1) { lanes.push([]); lane = lanes.length - 1; }
    lanes[lane].push(sp);
    const theme = shop.seasons.find((x) => x.id === c.theme)?.theme;
    return { c, sp, lane, color: theme?.accent ?? '#fff' };
  });

  return (
    <section className="year" id="year" aria-labelledby="year-title">
      <div className="year-inner">
        <div className="year-copy">
          <p className="eyebrow eyebrow-on-dark"><span lang="bn">ষড়ঋতু</span> · The six seasons</p>
          <h2 className="section-title" id="year-title">Six seasons. Chocolate in every one.</h2>
          <p className="year-lede">
            Bangladesh runs on six seasons, and so does this shop. The chocolate shelf never empties. Each season just adds something to it.
          </p>
          <ul className="season-list">
            {shop.seasons.map((se) => (
              <li key={se.id}>
                <button
                  type="button"
                  className={`season-btn${focus === se.id ? ' is-focus' : ''}`}
                  onMouseEnter={() => setFocus(se.id)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(se.id)}
                  onBlur={() => setFocus(null)}
                  onClick={() => setFocus(se.id)}
                >
                  <span className="season-swatch" style={{ '--c': se.theme.accent } as React.CSSProperties} />
                  <span className="season-bn" lang="bn">{se.bn}</span>
                  <span className="season-meta">
                    <b>
                      {se.name} <em>· {se.en}</em>
                      {se.id === s.season.id && <span className="season-now">Now</span>}
                    </b>
                    <span>{se.note}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={`wheel${focus ? ' has-focus' : ''}`}>
          <svg viewBox="0 0 640 640" role="img" aria-labelledby="wheel-title wheel-desc">
            <title id="wheel-title">{`The year at ${shop.brand.name}`}</title>
            <desc id="wheel-desc">{[
              'A circle of the six Bengali seasons, starting with Boishakh in mid-April. Chocolate is available all year.',
              ...arcs.map(({ c }) => `${c.title}: ${formatMonthDay(c.from)} to ${formatMonthDay(c.to)}.`),
              `Today is ${formatDay(s.day)}, in ${s.season.name}.`,
            ].join(' ')}</desc>

            {/* Months */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = wheelAngle(`${pad(i + 1)}-01`);
              const [lx, ly] = polar(307, a + 15 * DAY_DEG);
              const [ax, ay] = polar(284, a);
              const [bx, by] = polar(293, a);
              return (
                <g key={i}>
                  <line x1={ax} y1={ay} x2={bx} y2={by} className="w-tick" />
                  <text x={lx} y={ly} className="w-month" textAnchor="middle" dominantBaseline="central">{monthName(i + 1, true).toUpperCase()}</text>
                </g>
              );
            })}

            {/* The six seasons */}
            {shop.seasons.map((se) => {
              const sp = span(se.from, se.to);
              const flip = sp.mid > 90 && sp.mid < 270;
              return (
                <g
                  key={se.id}
                  className={`w-season${focus === se.id ? ' is-focus' : ''}`}
                  onMouseEnter={() => setFocus(se.id)}
                  onMouseLeave={() => setFocus(null)}
                >
                  <path d={arc(258, sp.a0 + 0.45, sp.a1 - 0.45)} stroke={se.theme.accent} strokeWidth={46} fill="none" />
                  <path id={`w-label-${se.id}`} d={arc(258, sp.a0, sp.a1, flip)} fill="none" />
                  <text className="w-season-label" textAnchor="middle" dominantBaseline="central">
                    <textPath href={`#w-label-${se.id}`} startOffset="50%">{se.bn}</textPath>
                  </text>
                </g>
              );
            })}

            {/* Chocolate: a ring of squares, all year */}
            <circle cx={C} cy={C} r={216} className="w-choc" pathLength={560} />

            {/* Seasonal collections */}
            {arcs.map(({ c, sp, lane, color }) => {
              const r = 188 - lane * 22;
              const flip = sp.mid > 90 && sp.mid < 270;
              const fits = (sp.sweep * Math.PI * r) / 180 > c.short.length * 8.5 + 16;
              return (
                <g key={c.id} className="w-col">
                  <path d={arc(r, sp.a0, sp.a1)} stroke={color} strokeWidth={17} fill="none" />
                  {fits && (
                    <>
                      <path id={`w-col-${c.id}`} d={arc(r, sp.a0, sp.a1, flip)} fill="none" />
                      <text className="w-col-label" textAnchor="middle" dominantBaseline="central">
                        <textPath href={`#w-col-${c.id}`} startOffset="50%">{c.short.toUpperCase()}</textPath>
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Centre */}
            <circle cx={C} cy={C} r={146} className="w-center" />
            <text x={C} y={C - 22} className="w-center-bn" textAnchor="middle" dominantBaseline="central" lang="bn">{shown.bn}</text>
            <text x={C} y={C + 30} className="w-center-en" textAnchor="middle">{shown.name} · {shown.en}</text>
            <text x={C} y={C + 52} className="w-center-note" textAnchor="middle">{shown.months}</text>
            <text x={C} y={C + 84} className="w-center-status" textAnchor="middle">{status}</text>

            {/* Today */}
            <line x1={tx0} y1={ty0} x2={tx1} y2={ty1} className="w-needle" />
            <circle cx={tx0} cy={ty0} r={4.5} className="w-needle-dot" />
            <circle cx={tx1} cy={ty1} r={6} className="w-needle-dot" />
          </svg>
          <ul className="wheel-legend">
            <li><span className="lg-choc" />Chocolate, all year</li>
            {arcs.map(({ c, color }) => (
              <li key={c.id}>
                <span className="lg-col" style={{ '--c': color } as React.CSSProperties} />
                {c.title}, {formatMonthDay(c.from, true)} – {formatMonthDay(c.to, true)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
