import type * as React from 'react';

/** The six event categories. Chips filter by them; every event has exactly one. */
export type Category = 'Sport' | 'Party' | 'Café & Food' | 'Culture' | 'Study & Career' | 'Social';
/** What kind of organizer: sets the monogram tile colour when there is no logo. */
export type OrganizerType = 'association' | 'cafe' | 'club' | 'venue';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = accent fill, one per screen; secondary = sunken neutral; outline = 1px ink on a tint; ghost = accent text only */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** md = 44px (default), lg = 52px full-width actions, sm = 36px inside cards and panels */
  size?: 'sm' | 'md' | 'lg';
  /** width: 100% */
  full?: boolean;
  /** an icon name (see Icon) or element, leading */
  icon?: string | React.ReactNode;
  /** square button showing only the icon; pass aria-label */
  iconOnly?: boolean;
  /** pill shape (icon-only buttons over images) */
  round?: boolean;
  /** raised white/dark chip style for buttons placed over an image */
  onImage?: boolean;
  /** renders an <a> */
  href?: string;
  /** the feature behind this button is not in this version yet (features.ts → 'soon'): dashed, muted, a "Soon" tag inside, aria-disabled; tapping calls onSoon (show the "Not in this version yet" Toast) */
  soon?: boolean;
  onSoon?: () => void;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface ChipProps {
  label?: string;
  children?: React.ReactNode;
  /** md (default) = a 34px filter pill, tappable, aria-pressed; sm = a 22px static tag on cards */
  size?: 'md' | 'sm';
  /** filter chips only */
  selected?: boolean;
  onClick?: () => void;
  /** sm tags only: neutral (category), maas (Free, Newcomers welcome), accent (promo), warn (missing), ink (over images), soon (dashed: not in this version yet, clock icon by default) */
  tone?: 'neutral' | 'accent' | 'maas' | 'warn' | 'ink' | 'soon';
  icon?: string | React.ReactNode;
  className?: string;
}
export declare function Chip(props: ChipProps): React.ReactElement;

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** raised (default, white on hairline) · sunken · accent (promo) · maas (translation note, stats) · upload (dashed drop area) */
  tone?: 'raised' | 'sunken' | 'accent' | 'maas' | 'upload';
  /** 12px padding instead of 16px */
  tight?: boolean;
  /** element to render; a card with onClick renders a <button> */
  as?: 'div' | 'button' | 'article' | 'section' | 'a';
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): React.ReactElement;

export interface EventCardProps {
  title: string;
  /** 24-hour start, "19:30" */
  time: string;
  endTime?: string;
  location: string;
  organizer: string;
  category: Category;
  /** number in euros; 0, null or undefined shows the Free tag */
  price?: number | null;
  /** the organizer's image (their uploaded poster by default): a url, or an element in previews. With it the card is vertical: image on top at 16:9, then the same row. Without it the card stays compact. */
  image?: string | React.ReactNode;
  /** shows the "Newcomers welcome" tag */
  newcomers?: boolean;
  saved?: boolean;
  /** bookmark toggle; pass null to hide the bookmark (the publish preview) */
  onSave?: ((saved: boolean) => void) | null;
  /** opens the detail screen; the whole card is the tap target */
  onClick?: () => void;
  className?: string;
}
export declare function EventCard(props: EventCardProps): React.ReactElement;

export interface OrganizerCardProps {
  name: string;
  type: OrganizerType;
  category: Category;
  /** two letters for the monogram tile; derived from the name when omitted */
  initials?: string;
  /** logo image url; the monogram shows without it */
  logo?: string;
  following?: boolean;
  /** follow toggle; pass null to show a chevron instead (a plain directory row) */
  onFollow?: ((following: boolean) => void) | null;
  /** opens the organizer profile */
  onClick?: () => void;
  className?: string;
}
export declare function OrganizerCard(props: OrganizerCardProps): React.ReactElement;

export interface WarningPanelProps {
  /** conflict and duplicate are amber (check this); suggestion is maas (a better option); soon is neutral and dashed (this check is not in this version yet) */
  tone: 'conflict' | 'duplicate' | 'suggestion' | 'soon';
  /** one line, the fact: "3 other events Thursday evening" */
  title: string;
  /** the detail, one or two sentences */
  children?: React.ReactNode;
  /** sm buttons, outline on amber and maas */
  actions?: React.ReactNode;
  /** override the small label above the title */
  kicker?: string;
  icon?: string;
  className?: string;
}
export declare function WarningPanel(props: WarningPanelProps): React.ReactElement;

export interface TabBarProps {
  active: 'week' | 'organizers' | 'create' | 'mine';
  onChange?: (tab: 'week' | 'organizers' | 'create' | 'mine') => void;
  className?: string;
}
export declare function TabBar(props: TabBarProps): React.ReactElement;

export interface FieldProps {
  label?: string;
  id?: string;
  /** text (default) · textarea · select · search · switch */
  kind?: 'text' | 'textarea' | 'select' | 'search' | 'switch';
  value?: string;
  placeholder?: string;
  /** switch only */
  checked?: boolean;
  /** amber ground and border: the AI could not read this from the poster */
  missing?: boolean;
  /** under the control; a missing field gets a default hint */
  hint?: string;
  /** small text right of the label, e.g. "AI guess" */
  trailing?: React.ReactNode;
  onChange?: (value: any) => void;
  /** select only */
  onOpen?: () => void;
  type?: string;
  inputMode?: string;
  className?: string;
}
export declare function Field(props: FieldProps): React.ReactElement;

export interface OrgLogoProps {
  name?: string;
  initials?: string;
  type?: OrganizerType;
  src?: string;
  /** sm 28px · md 44px (default) · lg 72px */
  size?: 'sm' | 'md' | 'lg';
  round?: boolean;
  className?: string;
}
export declare function OrgLogo(props: OrgLogoProps): React.ReactElement;

export type IconName = 'home' | 'users' | 'plus' | 'bookmark' | 'clock' | 'pin' | 'calendar' | 'chevron-right' | 'chevron-down' | 'arrow-left' | 'search' | 'share' | 'warning' | 'copy' | 'bulb' | 'check' | 'upload' | 'image' | 'at' | 'text' | 'scan' | 'ticket' | 'qr' | 'trend-up' | 'translate' | 'x' | 'euro' | 'star' | 'spinner';
export interface IconProps {
  name: IconName;
  /** 16 · 20 (default) · 24 · 28 */
  size?: number;
  filled?: boolean;
  /** accessible name; without it the icon is decorative */
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): React.ReactElement;

export interface ToastProps {
  /** info (ink, clock icon): "Not in this version yet"; done (maas, check icon): "Published" */
  tone?: 'info' | 'done';
  children: React.ReactNode;
  icon?: IconName;
  /** an inline text action, e.g. "Undo" */
  action?: string;
  onAction?: () => void;
  className?: string;
}
/** One line above the tab bar for 4 seconds; only one at a time. */
export declare function Toast(props: ToastProps): React.ReactElement;

/** How a feature ships in this build; every control that depends on the backend reads its flag (see design/features.ts). */
export type FeatureStatus = 'live' | 'local' | 'soon' | 'off';

declare global {
  interface Window {
    WatNu: {
      Button: typeof Button; Chip: typeof Chip; Card: typeof Card; EventCard: typeof EventCard; OrganizerCard: typeof OrganizerCard;
      WarningPanel: typeof WarningPanel; TabBar: typeof TabBar; Field: typeof Field; OrgLogo: typeof OrgLogo; Icon: typeof Icon; Toast: typeof Toast; icons: IconName[];
    };
  }
}
