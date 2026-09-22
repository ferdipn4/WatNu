"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { isOff, isSoon } from "@/lib/features";
import { useT } from "@/app/_lib/i18n";
import { resizeImageFile } from "../_lib/resize-image";
import type { ImagePayload } from "../_lib/types";

export function UploadStep({
  onSubmitImage,
  onSubmitText,
  onCreateManually,
  onSoon,
  error,
  startInPasteMode,
}: {
  onSubmitImage: (payload: ImagePayload) => void;
  onSubmitText: (text: string) => void;
  onCreateManually: () => void;
  /** shows the "Not in this version yet" toast for a `soon` control */
  onSoon: () => void;
  error?: string | null;
  /** the reading step's "Paste text instead" recovery lands here directly */
  startInPasteMode?: boolean;
}) {
  const t = useT();
  const [mode, setMode] = useState<"upload" | "paste">(startInPasteMode ? "paste" : "upload");
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
      setResizeError(caught instanceof Error ? caught.message : t("image.error"));
    } finally {
      setResizing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    void handleFile(event.dataTransfer.files?.[0]);
  }

  const uploadCopy = isSoon("pdfUpload") ? t("create.upload.kindsPdfSoon") : t("create.upload.kinds");
  const aiImportSoon = isSoon("aiImport");
  const pasteOff = isOff("pasteText");
  const pasteSoon = isSoon("pasteText");

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div>
        <h2 className="t-heading text-ink">{t("create.upload.title")}</h2>
        <p className="t-meta mt-1 text-ink-muted">{t("create.upload.meta")}</p>
      </div>

      {mode === "upload" ? (
        <Card
          tone="upload"
          onClick={aiImportSoon ? onSoon : () => inputRef.current?.click()}
          onDrop={aiImportSoon ? undefined : handleDrop}
          onDragOver={(event) => event.preventDefault()}
          className="min-h-[300px] justify-center"
        >
          <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="upload" size={28} />
          </span>
          <div className="t-body-strong text-[17px] text-ink">{t("create.upload.cta")}</div>
          <div className="t-meta text-ink-muted">
            {uploadCopy}
            <br />
            {t("create.upload.dutch")}
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
          label={t("create.upload.textLabel")}
          placeholder={t("create.upload.textPlaceholder")}
          value={text}
          onChange={setText}
        />
      )}

      {resizing ? <p className="t-caption text-ink-muted">{t("create.upload.resizing")}</p> : null}
      {resizeError ? <p className="t-meta text-warn">{resizeError}</p> : null}

      {!pasteOff ? (
        <div className="t-caption flex items-center gap-3 text-ink-muted">
          <span className="h-px flex-1 bg-line" />
          {t("create.upload.or")}
          <span className="h-px flex-1 bg-line" />
        </div>
      ) : null}

      {pasteOff ? null : mode === "upload" ? (
        <Button variant="secondary" full icon="text" soon={pasteSoon} onSoon={onSoon} onClick={() => setMode("paste")}>
          {t("create.upload.paste")}
        </Button>
      ) : (
        <Button size="lg" full disabled={!text.trim()} onClick={() => onSubmitText(text.trim())}>
          {t("common.continue")}
        </Button>
      )}

      <p className="t-caption text-center text-ink-muted">{t("create.upload.caption")}</p>

      {error ? <p className="t-meta text-center text-warn">{error}</p> : null}

      <button
        type="button"
        onClick={onCreateManually}
        className="t-meta mx-auto text-ink-muted underline decoration-line underline-offset-2"
      >
        {t("create.upload.manual")}
      </button>
    </div>
  );
}
