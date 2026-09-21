"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { OrgLogo } from "@/components/ui/OrgLogo";
import { getDisplayName, setDisplayName } from "../_lib/profile";

/**
 * A small local "profile" — not part of the design handoff, added with
 * explicit approval. There is no login, so this is only a display name for
 * this browser: an initials tile, a tap-to-edit name, and a one-line hint
 * that it never leaves the phone, matching the app's no-account ethos.
 */
export function ProfileCard() {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setName(getDisplayName());
  }, []);

  function startEditing() {
    setDraft(name);
    setEditing(true);
  }

  function save() {
    const trimmed = draft.trim();
    setDisplayName(trimmed);
    setName(trimmed);
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  return (
    <Card tight className="flex! items-center gap-3">
      <OrgLogo name={name || "You"} round size="md" />
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") cancel();
            }}
            placeholder="Your name"
            autoFocus
            className="h-9 w-full rounded-xl border border-line bg-surface-raised px-3 text-[15px] font-medium leading-5 text-ink placeholder:text-ink-muted focus:outline-none focus:shadow-ring"
          />
        ) : (
          <button type="button" onClick={startEditing} className="block w-full text-left">
            <span className="block t-body-strong text-ink">{name || "Add your name"}</span>
          </button>
        )}
        <span className="mt-0.5 block t-meta text-ink-muted">No account — this name lives on this phone too.</span>
      </div>
    </Card>
  );
}
