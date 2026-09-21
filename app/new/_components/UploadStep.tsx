"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { isSoon } from "@/lib/features";
import { resizeImageFile } from "../_lib/resize-image";
import type { ImagePayload } from "../_lib/types";

export function UploadStep({
  onSubmitImage,
  onSubmitText,
  onCreateManually,
  error,
}: {
  onSubmitImage: (payload: ImagePayload) => void;
  onSubmitText: (text: string) => void;
  onCreateManually: () => void;
  error?: string | null;
}) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [text, setText] = useState("");
  const [resizing, setResizing] = useState(false);
  const [resizeError, setResizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setResizeError(null);
    setResizing(true);
    try {
      const resized = await resizeImageFile(file);
      onSubmitImage(resized);
    } catch (caught) {
      setResizeError(caught instanceof Error ? caught.message : "Could not process that image.");
    } finally {
      setResizing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    void handleFile(event.dataTransfer.files?.[0]);
  }

  const uploadCopy = isSoon("pdfUpload") ? "Instagram post or story · PDF soon" : "Instagram post, story or PDF poster";

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div>
        <h2 className="t-heading text-ink">Add what you already made</h2>
        <p className="t-meta mt-1 text-ink-muted">
          WatNu turns it into a clean English listing that every student in Maastricht can find.
        </p>
      </div>

      {mode === "upload" ? (
        <Card
          tone="upload"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          className="min-h-[300px] justify-center"
        >
          <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="upload" size={28} />
          </span>
          <div className="t-body-strong text-[17px] text-ink">Upload screenshot or poster</div>
          <div className="t-meta text-ink-muted">
            {uploadCopy}
            <br />
            Dutch is fine — we translate.
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </Card>
      ) : (
        <Field
          kind="textarea"
          label="Event text"
          placeholder="Paste the caption, poster text, or event details here…"
          value={text}
          onChange={setText}
        />
      )}

      {resizing ? <p className="t-caption text-ink-muted">Resizing image…</p> : null}
      {resizeError ? <p className="t-meta text-warn">{resizeError}</p> : null}

      <div className="t-caption flex items-center gap-3 text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      {mode === "upload" ? (
        <Button variant="secondary" full icon="text" onClick={() => setMode("paste")}>
          Paste text instead
        </Button>
      ) : (
        <Button size="lg" full disabled={!text.trim()} onClick={() => onSubmitText(text.trim())}>
          Continue
        </Button>
      )}

      <p className="t-caption text-center text-ink-muted">
        About 20 seconds. You check everything before it goes live.
      </p>

      {error ? <p className="t-meta text-center text-warn">{error}</p> : null}

      <button
        type="button"
        onClick={onCreateManually}
        className="t-meta mx-auto text-ink-muted underline decoration-line underline-offset-2"
      >
        Create manually
      </button>
    </div>
  );
}
