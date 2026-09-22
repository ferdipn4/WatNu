import type { ReactNode } from "react";
import { Wordmark } from "./Wordmark";

/**
 * The header of every top-level screen (design/screens.md): the wordmark row with an optional
 * element on the right, the `display` title, one `meta` line. Plain markup per design/README.md
 * ("What stays plain markup"), values from bundle.css `.wn-header`.
 */
export function ScreenHeader({ title, meta, right }: { title: string; meta?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-3">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <Wordmark />
        {right ?? null}
      </div>
      <h1 className="t-display text-ink">{title}</h1>
      {meta ? <p className="t-meta mt-1 text-ink-muted">{meta}</p> : null}
    </div>
  );
}
