import type { ReactNode } from "react";
import type { Category } from "./EventCard";

/**
 * A deterministic, category-coloured poster shown on `EventCard` /
 * `EventDetailScreen` / the create-flow preview whenever an event has no
 * uploaded photo yet. Same idea as the pre-redesign `EventPoster`: a fixed
 * colour per category (never a theme token — this stands in for a real
 * photo, not chrome UI) with a couple of soft wave shapes and the event's
 * own title, so every "photo-less" event still reads at a glance and
 * different categories are visually distinct in a list.
 */
const CATEGORY_COLORS: Record<Category, string> = {
  Sport: "#2E7D5B",
  Party: "#D6352B",
  "Café & Food": "#C77D2E",
  Culture: "#6B4FA0",
  "Study & Career": "#2B6CB0",
  Social: "#D9A441",
};

function lighten(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

function fontSizeForWord(word: string): number {
  if (word.length > 12) return 30;
  if (word.length > 8) return 38;
  return 46;
}

export function EventPoster({ category, title, className }: { category: Category; title: string; className?: string }) {
  const baseColor = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Social;
  const tintA = lighten(baseColor, 0.3);
  const tintB = lighten(baseColor, 0.45);

  const words = title.trim().split(/\s+/).filter(Boolean);
  const firstWord = (words[0] ?? "").toUpperCase();
  const secondWord = words.length > 1 ? words[1].toUpperCase() : null;
  const firstFontSize = fontSizeForWord(firstWord);
  const secondFontSize = secondWord ? fontSizeForWord(secondWord) : firstFontSize;

  return (
    <svg
      viewBox="0 0 358 201"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      className={className}
      role="img"
      aria-label={title}
    >
      <rect x={0} y={0} width={358} height={201} fill={baseColor} />
      <path d="M-20,126 C54,81 126,162 198,108 C270,54 324,135 378,99 L378,198 L-20,198 Z" fill={tintA} opacity={0.55} />
      <path d="M-20,54 C63,18 117,72 189,36 C261,0 315,54 378,27 L378,-18 L-20,-18 Z" fill={tintB} opacity={0.5} />
      <path d="M-20,153 C81,126 135,180 216,144 C297,108 342,171 378,144 L378,198 L-20,198 Z" fill={tintB} opacity={0.4} />
      <text x={22} y={90} fill="#ffffff" fontSize={firstFontSize} fontWeight={800} fontFamily="var(--font-display)" letterSpacing="-0.02em">
        {firstWord}
      </text>
      {secondWord ? (
        <text
          x={22}
          y={135}
          fill="#ffffff"
          fillOpacity={0.16}
          stroke="#ffffff"
          strokeWidth={1.5}
          fontSize={secondFontSize}
          fontWeight={800}
          fontFamily="var(--font-display)"
          letterSpacing="-0.02em"
        >
          {secondWord}
        </text>
      ) : null}
    </svg>
  );
}

/** A real uploaded photo url, or the deterministic category poster. Fixture `demo-poster:` markers are not urls. */
export function resolveEventImage(image: string | undefined | null, category: Category, title: string): string | ReactNode {
  if (image && !image.startsWith("demo-poster:")) return image;
  return <EventPoster category={category} title={title} />;
}
