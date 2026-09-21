"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { Icon, cx, type IconName } from "./Icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = accent fill, one per screen; secondary = sunken neutral; outline = 1px ink on a tint; ghost = accent text only */
  variant?: "primary" | "secondary" | "outline" | "ghost";
  /** md = 44px (default), lg = 52px full-width actions, sm = 36px inside cards and panels */
  size?: "sm" | "md" | "lg";
  /** width: 100% */
  full?: boolean;
  /** an icon name (see Icon) or element, leading */
  icon?: string | ReactNode;
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

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-9 px-3 text-[13px] leading-4",
  md: "h-11 px-4 text-[15px] leading-5",
  lg: "h-[52px] px-5 text-base leading-5",
};

const ICON_SIZE: Record<"sm" | "md" | "lg", number> = { sm: 16, md: 20, lg: 20 };

const RADIUS_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "rounded-[10px]",
  md: "rounded-xl",
  lg: "rounded-xl",
};

const VARIANT_CLASSES: Record<"primary" | "secondary" | "outline" | "ghost" | "soon", string> = {
  primary: "border-transparent bg-accent text-on-accent active:bg-accent-strong",
  secondary: "border-transparent bg-surface-sunken text-ink",
  outline: "border-ink bg-transparent text-ink",
  ghost: "border-transparent bg-transparent text-accent",
  soon: "border-dashed border-ink-muted bg-transparent text-ink-muted",
};

const ICON_ONLY_WIDTH: Record<"sm" | "md" | "lg", string> = {
  sm: "w-9 px-0",
  md: "w-11 px-0",
  lg: "w-[52px] px-0",
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  icon,
  iconOnly,
  round,
  onImage,
  href,
  soon,
  onSoon,
  className,
  children,
  onClick,
  type,
  ...rest
}: ButtonProps) {
  const effectiveVariant = soon ? "soon" : variant;
  const isGhost = effectiveVariant === "ghost";
  const iconEl = typeof icon === "string" ? <Icon name={icon as IconName} size={ICON_SIZE[size]} /> : icon;

  const classes = cx(
    "inline-flex items-center justify-center gap-2 border font-semibold whitespace-nowrap no-underline transition-[background-color,transform] duration-150 ease-out active:scale-[.98] focus-visible:outline-none focus-visible:shadow-ring disabled:pointer-events-none disabled:opacity-[.45]",
    round ? "rounded-full" : RADIUS_CLASSES[size],
    isGhost ? "h-auto px-2 py-0" : SIZE_CLASSES[size],
    onImage ? "border-transparent bg-surface-raised text-ink shadow-float" : VARIANT_CLASSES[effectiveVariant],
    full && "w-full",
    iconOnly && ICON_ONLY_WIDTH[size],
    soon && "cursor-pointer",
    className,
  );

  const soonTag = soon ? (
    <span className="ml-0.5 inline-flex h-[18px] flex-none items-center rounded-lg border border-dashed border-ink-muted px-1.5 text-[11px] font-semibold leading-4 text-ink-muted">
      Soon
    </span>
  ) : null;

  const content = (
    <>
      {iconEl}
      {!iconOnly ? children : null}
      {soonTag}
    </>
  );

  const resolvedOnClick = soon ? onSoon ?? onClick : onClick;

  if (href) {
    return (
      <a
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        href={href}
        className={classes}
        onClick={resolvedOnClick as MouseEventHandler<HTMLAnchorElement> | undefined}
        {...(soon ? { "aria-disabled": true } : null)}
      >
        {content}
      </a>
    );
  }

  return (
    <button {...rest} type={type ?? "button"} className={classes} onClick={resolvedOnClick} {...(soon ? { "aria-disabled": true } : null)}>
      {content}
    </button>
  );
}
