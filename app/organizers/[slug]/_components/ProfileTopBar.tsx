"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/** 52px top bar for the organizer profile: round back button left, round share button right (features.ts → share: 'live'). */
export function ProfileTopBar({ name }: { name: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        // The user cancelled the share sheet, or it isn't supported here — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — nothing more we can do without a backend.
    }
  }

  return (
    <div className="relative flex h-[52px] items-center justify-between">
      <Button iconOnly round variant="secondary" icon="arrow-left" aria-label="Back" onClick={() => router.back()} />
      <div className="flex items-center gap-2">
        {copied ? <span className="t-caption text-maas">Link copied</span> : null}
        <Button iconOnly round variant="secondary" icon="share" aria-label="Share" onClick={handleShare} />
      </div>
    </div>
  );
}
