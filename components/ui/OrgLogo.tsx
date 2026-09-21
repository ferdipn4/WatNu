import { cx } from "./Icon";

/** What kind of organizer: sets the monogram tile colour when there is no logo. */
export type OrganizerType = "association" | "cafe" | "club" | "venue";

export interface OrgLogoProps {
  name?: string;
  initials?: string;
  type?: OrganizerType;
  src?: string;
  /** sm 28px · md 44px (default) · lg 72px */
  size?: "sm" | "md" | "lg";
  round?: boolean;
  className?: string;
}

const TYPE_CLASSES: Record<OrganizerType, string> = {
  association: "bg-accent-soft text-accent",
  cafe: "bg-surface-sunken text-ink",
  club: "bg-ink text-surface",
  venue: "bg-maas-soft text-maas",
};

const DIMENSION_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-7 w-7",
  md: "h-11 w-11",
  lg: "h-[72px] w-[72px]",
};

const RADIUS_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
};

const TEXT_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "text-[11px]",
  md: "text-base",
  lg: "text-[26px]",
};

function deriveInitials(name?: string) {
  const source = name || "?";
  return source
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** An organizer's logo, or a two-letter monogram tile in the display face, coloured by type. */
export function OrgLogo({ name, initials, type = "association", src, size = "md", round, className }: OrgLogoProps) {
  const label = initials || deriveInitials(name);

  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "grid flex-none place-items-center overflow-hidden font-display font-extrabold leading-none tracking-[-0.02em]",
        DIMENSION_CLASSES[size],
        TEXT_CLASSES[size],
        round ? "rounded-full" : RADIUS_CLASSES[size],
        TYPE_CLASSES[type],
        className,
      )}
    >
      {src ? <img src={src} alt="" className="block h-full w-full object-cover" /> : label}
    </span>
  );
}
