import { Icon } from "@/components/ui/Icon";

/** The star + "WatNu" in the header row of every top-level screen (bundle.css `.wn-wordmark`). */
export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-1 font-display text-[18px] leading-5 font-extrabold tracking-[-0.02em] text-accent">
      <Icon name="star" size={16} />
      WatNu
    </span>
  );
}
