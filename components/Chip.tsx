export function Chip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center whitespace-nowrap rounded-pill bg-accent px-3 py-1 text-xs font-bold text-on-accent"
          : "inline-flex items-center whitespace-nowrap rounded-pill border border-border bg-surface px-3 py-1 text-xs font-bold text-muted"
      }
    >
      {label}
    </span>
  );
}
