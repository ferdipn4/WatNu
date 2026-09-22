/** A day-group header: "Today" / "Tomorrow" / the weekday, with the date beside it in `meta` (bundle.css `.wn-day`). */
export function DayHeader({ name, date }: { name: string; date: string }) {
  return (
    <div className="flex items-baseline gap-2 px-4 pt-6 pb-3">
      <h2 className="t-heading text-ink">{name}</h2>
      <span className="t-meta text-ink-muted">{date}</span>
    </div>
  );
}
