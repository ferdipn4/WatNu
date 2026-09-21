import type { ReactElement } from "react";

/**
 * The organizers' own posters, as uploaded: fixed colours, they are images
 * and do not re-theme with light/dark. Ported 1:1 from
 * watnu-design-handoff/design/components/Home/preview.html so fixture events
 * look exactly like the reference screenshots until real uploads replace
 * them. Keyed by `FixtureEvent.image`.
 */
function SalsaPoster() {
  return (
    <svg viewBox="0 0 358 224" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Salsa Night poster">
      <rect width={358} height={224} fill="#d01f29" />
      <path d="M-10 150c40-30 80-30 120 0s80 30 120 0 80-30 120 0 40 30 60 30v60H-10z" fill="#ffffff" opacity={0.18} />
      <path d="M-10 178c40-30 80-30 120 0s80 30 120 0 80-30 120 0 40 30 60 30v40H-10z" fill="#ffffff" opacity={0.28} />
      <text x={24} y={88} fill="#ffffff" fontSize={58} fontFamily="var(--font-display)" fontWeight={800} letterSpacing="-0.02em">
        SALSA
      </text>
      <text x={24} y={138} fill="none" stroke="#ffffff" strokeWidth={1.5} fontSize={58} fontFamily="var(--font-display)" fontWeight={800} letterSpacing="-0.02em">
        NIGHT
      </text>
      <text x={26} y={172} fill="#ffffff" fontSize={13} fontFamily="var(--font-sans)" fontWeight={600}>
        elke maandag · 20:00 · Café Mestreech
      </text>
    </svg>
  );
}

function RowPoster() {
  return (
    <svg viewBox="0 0 358 201" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Sunrise Row poster">
      <rect width={358} height={201} fill="#0b6b76" />
      <circle cx={270} cy={92} r={58} fill="#ffc857" />
      <path d="M-10 120c40-26 80-26 120 0s80 26 120 0 80-26 120 0 40 26 60 26v70H-10z" fill="#083f46" />
      <path d="M-10 150c40-26 80-26 120 0s80 26 120 0 80-26 120 0 40 26 60 26v40H-10z" fill="#052a2f" />
      <text x={22} y={70} fill="#ffffff" fontSize={40} fontFamily="var(--font-display)" fontWeight={800} letterSpacing="-0.02em">
        SUNRISE
      </text>
      <text x={22} y={108} fill="#ffffff" fontSize={40} fontFamily="var(--font-display)" fontWeight={800} letterSpacing="-0.02em">
        ROW
      </text>
      <text x={24} y={182} fill="#ffffff" fontSize={12} fontFamily="var(--font-sans)" fontWeight={600}>
        elke dinsdag 07:00 · botenhuis Sint Pieter
      </text>
    </svg>
  );
}

function TechnoPoster() {
  const dots: ReactElement[] = [];
  for (let i = 0; i < 12; i++) {
    for (let k = 0; k < 7; k++) {
      dots.push(<circle key={`${i}-${k}`} cx={20 + i * 30} cy={20 + k * 30} r={2.5} fill="#ffffff" opacity={0.35} />);
    }
  }
  return (
    <svg viewBox="0 0 358 201" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Loods Maas techno poster">
      <rect width={358} height={201} fill="#1a1614" />
      {dots}
      <rect x={0} y={118} width={358} height={44} fill="#d01f29" />
      <text x={22} y={96} fill="#ffffff" fontSize={62} fontFamily="var(--font-display)" fontWeight={800} letterSpacing="-0.02em">
        LOODS
      </text>
      <text x={24} y={149} fill="#ffffff" fontSize={16} fontFamily="var(--font-sans)" fontWeight={600}>
        TECHNO · VR 25 SEPT · 23:00 – LAAT
      </text>
    </svg>
  );
}

function BoardPoster() {
  return (
    <svg viewBox="0 0 358 224" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Bordspelavond poster (Dutch)">
      <rect width={358} height={224} fill="#0b6b76" />
      <circle cx={300} cy={40} r={44} fill="#ffffff" opacity={0.16} />
      <circle cx={40} cy={200} r={60} fill="#ffffff" opacity={0.12} />
      <text x={26} y={92} fill="#ffffff" fontSize={44} fontFamily="var(--font-display)" fontWeight={800} letterSpacing="-0.02em">
        BORDSPEL
      </text>
      <text x={26} y={136} fill="#ffffff" fontSize={44} fontFamily="var(--font-display)" fontWeight={800} letterSpacing="-0.02em">
        AVOND
      </text>
      <text x={26} y={168} fill="#ffffff" fontSize={14} fontFamily="var(--font-sans)" fontWeight={600}>
        do 24 sept · 19:30
      </text>
      <text x={26} y={188} fill="#ffffff" fontSize={14} fontFamily="var(--font-sans)" fontWeight={600}>
        Café Mestreech
      </text>
      <text x={26} y={208} fill="#ffffff" fontSize={14} fontFamily="var(--font-sans)" fontWeight={600}>
        gratis · iedereen welkom!
      </text>
    </svg>
  );
}

const POSTERS: Record<string, () => ReactElement> = {
  salsa: SalsaPoster,
  row: RowPoster,
  techno: TechnoPoster,
  board: BoardPoster,
};

/** Renders the fixture poster illustration for a `FixtureEvent.image` key, or `undefined` when there isn't one. */
export function fixturePoster(key?: string): ReactElement | undefined {
  const Poster = key ? POSTERS[key] : undefined;
  return Poster ? <Poster /> : undefined;
}
