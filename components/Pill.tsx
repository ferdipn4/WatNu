import type { ReactNode } from "react";

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      className={[
        "inline-flex items-center whitespace-nowrap rounded-pill border border-border bg-surface px-2.5 py-1 text-xs font-bold",
        tone === "accent" ? "text-accent" : "text-foreground",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
