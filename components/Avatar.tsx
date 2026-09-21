function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-surface font-bold text-muted"
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.32) }}
    >
      {initials(name)}
    </div>
  );
}
