import type { CSSProperties } from "react";
import {
  Home,
  Users,
  Plus,
  Bookmark,
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Search,
  Share,
  TriangleAlert,
  Copy,
  Lightbulb,
  Check,
  Upload,
  Image,
  AtSign,
  Text,
  Scan,
  Ticket,
  QrCode,
  TrendingUp,
  Languages,
  X,
  Euro,
  Star,
  Loader,
  Pencil,
  User,
  type LucideIcon,
} from "lucide-react";

/** Joins truthy class name fragments; shared by every component in this bundle. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** The public icon names used by every component prop in this bundle (see index.d.ts). */
export type IconName =
  | "home"
  | "users"
  | "plus"
  | "bookmark"
  | "clock"
  | "pin"
  | "calendar"
  | "chevron-right"
  | "chevron-down"
  | "arrow-left"
  | "search"
  | "share"
  | "warning"
  | "copy"
  | "bulb"
  | "check"
  | "upload"
  | "image"
  | "at"
  | "text"
  | "scan"
  | "ticket"
  | "qr"
  | "trend-up"
  | "translate"
  | "x"
  | "euro"
  | "star"
  | "spinner"
  /** two glyphs beyond the handoff's 29: Edit profile on the organizer screens, and the profile button on My WatNu */
  | "pencil"
  | "user";

export interface IconProps {
  name: IconName;
  /** 16 · 20 (default) · 24 · 28 */
  size?: number;
  filled?: boolean;
  /** accessible name; without it the icon is decorative */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

const GLYPHS: Record<IconName, LucideIcon> = {
  home: Home,
  users: Users,
  plus: Plus,
  bookmark: Bookmark,
  clock: Clock,
  pin: MapPin,
  calendar: Calendar,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  "arrow-left": ArrowLeft,
  search: Search,
  share: Share,
  warning: TriangleAlert,
  copy: Copy,
  bulb: Lightbulb,
  check: Check,
  upload: Upload,
  image: Image,
  at: AtSign,
  text: Text,
  scan: Scan,
  ticket: Ticket,
  qr: QrCode,
  "trend-up": TrendingUp,
  translate: Languages,
  x: X,
  euro: Euro,
  star: Star,
  spinner: Loader,
  pencil: Pencil,
  user: User,
};

/** Stroke icons on a 24px grid, 1.75px stroke, round caps. The bookmark and the star are the two glyphs that fill. */
export function Icon({ name, size = 20, filled = false, title, className, style }: IconProps) {
  const Glyph = GLYPHS[name] ?? Star;
  const isFilled = name === "star" || filled;

  return (
    <Glyph
      width={size}
      height={size}
      strokeWidth={1.75}
      fill={isFilled ? "currentColor" : "none"}
      stroke={isFilled ? "none" : "currentColor"}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={cx("inline-block shrink-0 align-middle", className)}
      style={style}
    >
      {title ? <title>{title}</title> : null}
    </Glyph>
  );
}
