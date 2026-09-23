import { cx } from "@/components/ui/Icon";

/**
 * Loading placeholders in the shape of what is coming (route-level loading.tsx files use them),
 * so a tap feels answered at once instead of showing a blank screen while the server reads.
 */
export function Bone({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("animate-pulse rounded-lg bg-surface-sunken", className)} />;
}

/** An EventCard with its poster on top. */
export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-raised">
      <Bone className="aspect-video w-full rounded-none" />
      <div className="flex gap-3 p-3">
        <Bone className="h-5 w-[50px]" />
        <div className="flex flex-1 flex-col gap-2">
          <Bone className="h-4 w-3/4" />
          <Bone className="h-3 w-1/2" />
          <div className="mt-0.5 flex gap-1">
            <Bone className="h-[22px] w-16" />
            <Bone className="h-[22px] w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ cards = 3 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-3 px-4">
      {Array.from({ length: cards }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

/** A top-level screen: wordmark row, title, meta, a chip row, then cards. */
export function SkeletonScreen() {
  return (
    <div role="status" className="flex min-h-dvh flex-col gap-4 pt-[calc(env(safe-area-inset-top)+8px)]">
      <div className="flex flex-col gap-2 px-4">
        <Bone className="h-7 w-24" />
        <Bone className="mt-2 h-9 w-44" />
        <Bone className="h-4 w-56" />
      </div>
      <div className="flex gap-2 px-4">
        {[0, 1, 2, 3].map((index) => (
          <Bone key={index} className="h-[34px] w-20 rounded-full" />
        ))}
      </div>
      <div className="px-4">
        <Bone className="h-5 w-32" />
      </div>
      <SkeletonList />
    </div>
  );
}

/** The event detail: hero, tags, title, three fact rows. */
export function SkeletonDetail() {
  return (
    <div role="status" className="flex flex-col gap-4 pb-6">
      <Bone className="mx-4 mt-[calc(env(safe-area-inset-top)+4px)] aspect-[16/10] rounded-3xl" />
      <div className="flex flex-col gap-3.5 px-4">
        <div className="flex gap-1">
          <Bone className="h-[22px] w-16" />
          <Bone className="h-[22px] w-32" />
        </div>
        <Bone className="h-8 w-4/5" />
        <Bone className="h-5 w-2/3" />
        <Bone className="h-5 w-1/2" />
        <Bone className="h-5 w-1/3" />
        <Bone className="mt-2 h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}
