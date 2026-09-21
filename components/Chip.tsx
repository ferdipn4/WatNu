export function Chip({ label }: { label: string }) {
  return (
    <span className="rounded border border-zinc-300 px-2 py-0.5 text-xs uppercase tracking-wide text-zinc-600">
      {label}
    </span>
  );
}
