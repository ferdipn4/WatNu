import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./Icon";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** raised (default, white on hairline) · sunken · accent (promo) · maas (translation note, stats) · upload (dashed drop area) */
  tone?: "raised" | "sunken" | "accent" | "maas" | "upload";
  /** 12px padding instead of 16px */
  tight?: boolean;
  /** element to render; a card with onClick renders a <button> */
  as?: "div" | "button" | "article" | "section" | "a";
  children?: ReactNode;
}

const BG_CLASSES: Record<"sunken" | "accent" | "maas", string> = {
  sunken: "bg-surface-sunken",
  accent: "bg-accent-soft",
  maas: "bg-maas-soft",
};

/** The surface everything else is built on: surface-raised on a 1px line hairline, radius-lg, 16px padding. */
export function Card({ tone = "raised", tight, as, className, children, ...rest }: CardProps) {
  const Tag = (as ?? (rest.onClick ? "button" : "div")) as ElementType;
  const isButton = Tag === "button";
  const isUpload = tone === "upload";

  const bg = isUpload || tone === "raised" ? "bg-surface-raised" : BG_CLASSES[tone];
  const border = isUpload ? "border-2 border-dashed border-line" : tone === "raised" ? "border border-line" : "border border-transparent";
  const shadow = tone === "raised" ? "shadow-card" : "shadow-none";
  const radius = isUpload ? "rounded-3xl" : "rounded-2xl";
  const padding = isUpload ? "px-5 py-8" : tight ? "p-3" : "p-4";
  const layout = isUpload ? "flex! flex-col items-center gap-3 text-center" : "block";

  return (
    <Tag
      {...rest}
      {...(isButton ? { type: "button" } : null)}
      className={cx(
        "w-full text-left text-ink",
        layout,
        bg,
        border,
        shadow,
        radius,
        padding,
        isButton && "cursor-pointer focus-visible:outline-none focus-visible:shadow-ring",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
