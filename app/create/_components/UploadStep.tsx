"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { resizeImageFile } from "../_lib/resize-image";

type ImagePayload = { base64: string; mediaType: string };

export function UploadStep({
  onSubmit,
  disabled,
  error,
}: {
  onSubmit: (payload: {
    text?: string;
    imageBase64?: string;
    mediaType?: string;
  }) => void;
  disabled?: boolean;
  error?: string | null;
}) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePayload, setImagePayload] = useState<ImagePayload | null>(null);
  const [resizing, setResizing] = useState(false);
  const [resizeError, setResizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setResizeError(null);
    setResizing(true);
    try {
      const resized = await resizeImageFile(file);
      setImagePayload(resized);
      setImagePreview(`data:${resized.mediaType};base64,${resized.base64}`);
    } catch (caught) {
      setImagePayload(null);
      setImagePreview(null);
      setResizeError(
        caught instanceof Error ? caught.message : "Could not process that image.",
      );
    } finally {
      setResizing(false);
    }
  }

  function removeImage() {
    setImagePayload(null);
    setImagePreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleContinue() {
    if (imagePayload) {
      onSubmit({ imageBase64: imagePayload.base64, mediaType: imagePayload.mediaType });
    } else if (text.trim()) {
      onSubmit({ text: text.trim() });
    }
  }

  const canContinue = Boolean(imagePayload) || text.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <label
        className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border bg-surface p-4 text-center text-sm text-muted"
        onDrop={(event) => {
          event.preventDefault();
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        onDragOver={(event) => event.preventDefault()}
      >
        {imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreview}
            alt="Selected poster"
            className="h-full max-h-40 rounded-[12px] object-contain"
          />
        ) : (
          <>
            <span className="font-bold text-foreground">
              Tap to upload a screenshot or poster
            </span>
            <span className="text-xs">or drag and drop an image here</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>

      {resizing ? <p className="text-xs text-muted">Resizing image…</p> : null}
      {resizeError ? <p className="text-xs text-red-600">{resizeError}</p> : null}
      {imagePayload ? (
        <button
          type="button"
          className="self-start text-xs font-bold text-accent underline"
          onClick={removeImage}
        >
          Remove image
        </button>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <textarea
        className="min-h-32 rounded-[12px] border border-border bg-card p-2 text-sm disabled:bg-surface"
        placeholder="Paste the event text instead…"
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={Boolean(imagePayload)}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button
        type="button"
        disabled={disabled || resizing || !canContinue}
        onClick={handleContinue}
      >
        Extract event
      </Button>
    </div>
  );
}
