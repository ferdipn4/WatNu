const CATEGORY_COLORS: Record<string, string> = {
  sport: "#2E7D5B",
  party: "#D6352B",
  "café & food": "#C77D2E",
  culture: "#6B4FA0",
  "study & career": "#2B6CB0",
  social: "#D9A441",
};

const FALLBACK_COLOR = "#D6352B";

function lighten(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount);
  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

function colorForCategory(category: string): string {
  return CATEGORY_COLORS[category.trim().toLowerCase()] ?? FALLBACK_COLOR;
}

function fontSizeForWord(word: string): number {
  if (word.length > 12) return 34;
  if (word.length > 8) return 42;
  return 52;
}

export function EventPoster({
  category,
  title,
  className,
}: {
  category: string;
  title: string;
  className?: string;
}) {
  const baseColor = colorForCategory(category);
  const tintA = lighten(baseColor, 0.3);
  const tintB = lighten(baseColor, 0.45);

  const words = title.trim().split(/\s+/).filter(Boolean);
  const firstWord = (words[0] ?? "").toUpperCase();
  const secondWord = words.length > 1 ? words[1].toUpperCase() : null;

  const firstFontSize = fontSizeForWord(firstWord);
  const secondFontSize = secondWord ? fontSizeForWord(secondWord) : firstFontSize;

  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      className={className}
      role="img"
      aria-label={title}
    >
      <rect x="0" y="0" width="400" height="200" fill={baseColor} />
      <path
        d="M-20,140 C 60,90 140,180 220,120 C 300,60 360,150 420,110 L 420,220 L -20,220 Z"
        fill={tintA}
        opacity="0.55"
      />
      <path
        d="M-20,60 C 70,20 130,80 210,40 C 290,0 350,60 420,30 L 420,-20 L -20,-20 Z"
        fill={tintB}
        opacity="0.5"
      />
      <path
        d="M-20,170 C 90,140 150,200 240,160 C 330,120 380,190 420,160 L 420,220 L -20,220 Z"
        fill={tintB}
        opacity="0.4"
      />
      <text
        x="24"
        y="100"
        fill="white"
        fontSize={firstFontSize}
        fontWeight={800}
        style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
      >
        {firstWord}
      </text>
      {secondWord ? (
        <text
          x="24"
          y="150"
          fill="white"
          fillOpacity={0.15}
          stroke="white"
          strokeWidth={1.5}
          fontSize={secondFontSize}
          fontWeight={800}
          style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
        >
          {secondWord}
        </text>
      ) : null}
    </svg>
  );
}
