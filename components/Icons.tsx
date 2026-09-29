export type IconName = 'rosette' | 'bag' | 'close' | 'menu' | 'arrow' | 'bell' | 'check';

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className} aria-hidden="true" focusable="false">
      <use href={`#i-${name}`} />
    </svg>
  );
}

/** Inline sprite, rendered once. The rosette's six petals are the six seasons. */
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <mask id="rosette-hole">
          <rect x="-20" y="-20" width="40" height="40" fill="#fff" />
          <circle r="2.6" fill="#000" />
        </mask>
        <path id="rosette-petal" d="M0-2.2C5-6.4 5.6-13.6 0-18.6-5.6-13.6-5-6.4 0-2.2Z" />
        <symbol id="i-rosette" viewBox="-20 -20 40 40">
          <g mask="url(#rosette-hole)" fill="currentColor">
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <use key={deg} href="#rosette-petal" transform={`rotate(${deg})`} />
            ))}
          </g>
        </symbol>
        <symbol id="i-bag" viewBox="0 0 24 24">
          <path d="M6 8h12l-1 12H7L6 8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </symbol>
        <symbol id="i-close" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </symbol>
        <symbol id="i-menu" viewBox="0 0 24 24">
          <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24">
          <path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
        <symbol id="i-bell" viewBox="0 0 24 24">
          <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
      </defs>
    </svg>
  );
}
