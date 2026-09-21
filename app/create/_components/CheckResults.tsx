import type { CheckResponse } from "../_lib/types";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

export function CheckResults({ result }: { result: CheckResponse }) {
  const hasConflicts = result.conflicts.length > 0;
  const hasDuplicates = result.possible_duplicates.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {hasConflicts ? (
        <div className="rounded-card border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-bold text-amber-800">Scheduling conflicts</p>
          <ul className="mt-1 flex flex-col gap-1">
            {result.conflicts.map((conflict) => (
              <li key={conflict.id}>
                {conflict.title} — {formatWhen(conflict.start)} (
                {conflict.hours_apart}h apart
                {conflict.same_category ? ", same category" : ""})
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasDuplicates ? (
        <div className="rounded-card border border-red-300 bg-red-50 p-3 text-sm">
          <p className="font-bold text-red-800">Possible duplicates</p>
          <ul className="mt-1 flex flex-col gap-1">
            {result.possible_duplicates.map((duplicate) => (
              <li key={duplicate.id}>
                {duplicate.title} — {formatWhen(duplicate.start)} (
                {Math.round(duplicate.similarity * 100)}% similar
                {duplicate.reason ? `, ${duplicate.reason}` : ""})
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!hasConflicts && !hasDuplicates ? (
        <div className="rounded-card border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          No conflicts or duplicates found.
        </div>
      ) : null}

      <div className="rounded-card border border-border bg-surface p-3 text-sm text-foreground">
        <p className="font-bold">Suggestion</p>
        <p>{result.suggestion.message}</p>
      </div>
    </div>
  );
}
