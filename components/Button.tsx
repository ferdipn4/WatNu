import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "rounded-pill px-4 py-2.5 text-[13px] font-bold transition disabled:opacity-40";
  const variantClass =
    variant === "primary"
      ? "bg-accent text-on-accent"
      : "border border-border bg-surface text-foreground";

  return (
    <button className={`${base} ${variantClass} ${className}`} {...props} />
  );
}
