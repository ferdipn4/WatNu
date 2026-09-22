"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { isLive } from "@/lib/features";
import type { DraftEvent } from "@/lib/schemas";
import { getJson, postJson } from "@/app/_lib/http";
import { useT } from "@/app/_lib/i18n";
import { claimOrganizer } from "@/app/_lib/store";
import { useToast } from "@/app/_lib/use-toast";
import { toDateInputValue, toTimeInputValue } from "../_lib/datetime";
import { blankForm, draftToForm, formToCheckPayload, formToCreatePayload, isRequiredFilled, isValidOptionalUrl } from "../_lib/form";
import type { CheckResponse, FormState, ImagePayload } from "../_lib/types";
import { PublishStep } from "./PublishStep";
import { ReadingStep } from "./ReadingStep";
import { ReviewStep } from "./ReviewStep";
import { StepShell } from "./StepShell";
import { UploadStep } from "./UploadStep";

type Step = 1 | 2 | 3 | 4;
type IngestPayload = { text?: string; imageBase64?: string; mediaType?: string };
type ApiOrganizer = { slug: string; name: string };

/** POST /api/events/check is only worth calling when at least one of the three checks is shown. */
const ANY_CHECK_LIVE = isLive("conflictCheck") || isLive("duplicateCheck") || isLive("suggestions");

export function CreateFlow() {
  const router = useRouter();
  const t = useT();
  const { toast, showSoon } = useToast();
  const [step, setStep] = useState<Step>(1);

  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [pendingIngest, setPendingIngest] = useState<IngestPayload | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [startInPasteMode, setStartInPasteMode] = useState(false);

  const [draft, setDraft] = useState<DraftEvent | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [highlightDate, setHighlightDate] = useState(false);

  const [organizers, setOrganizers] = useState<Record<string, string>>({});

  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResponse | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const missingFields = new Set(draft?.missing_fields ?? []);

  useEffect(() => {
    getJson<{ organizers: ApiOrganizer[] }>("/api/organizers")
      .then((body) => {
        const map: Record<string, string> = {};
        for (const organizer of body.organizers) map[organizer.slug] = organizer.name;
        setOrganizers(map);
      })
      .catch(() => {
        // Purely cosmetic (the step-4 preview's organizer label); a failed
        // fetch here must not block the create flow.
      });
  }, []);

  // Step 2: run the real extraction once, when a payload is queued. `draft`
  // and `ingestError` are reset by the callers that set `pendingIngest`
  // (below), not here, so this effect never sets state synchronously.
  useEffect(() => {
    if (!pendingIngest) return;
    let cancelled = false;

    postJson<{ events: DraftEvent[] }>("/api/ingest", pendingIngest)
      .then((body) => {
        if (cancelled) return;
        const [first] = body.events;
        if (!first) throw new Error(t("create.error.noEvent"));
        setDraft(first);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setIngestError(error instanceof Error ? error.message : t("create.error.read"));
      });

    return () => {
      cancelled = true;
    };
  }, [pendingIngest, t]);

  function goToUpload() {
    router.push("/");
  }

  function startImageIngest(payload: ImagePayload) {
    setPosterImage(`data:${payload.mediaType};base64,${payload.base64}`);
    setUploadError(null);
    setDraft(null);
    setIngestError(null);
    setStep(2);
    setPendingIngest({ imageBase64: payload.base64, mediaType: payload.mediaType });
  }

  function startTextIngest(text: string) {
    setPosterImage(null);
    setUploadError(null);
    setDraft(null);
    setIngestError(null);
    setStep(2);
    setPendingIngest({ text });
  }

  function createManually() {
    setDraft(null);
    setPosterImage(null);
    setForm(blankForm());
    setStep(3);
  }

  function retryAsPaste() {
    setPendingIngest(null);
    setIngestError(null);
    setPosterImage(null);
    setStartInPasteMode(true);
    setStep(1);
  }

  function handleReadingFinished() {
    if (!draft) return;
    setForm(draftToForm(draft));
    setStep(3);
  }

  function handleReviewChange(next: FormState) {
    setForm(next);
    setCheckResult(null);
  }

  function handleChangeImage(payload: ImagePayload) {
    setPosterImage(`data:${payload.mediaType};base64,${payload.base64}`);
  }

  const canContinueFromReview = isRequiredFilled(form) && isValidOptionalUrl(form.signup_url);

  function goToChecks() {
    if (!canContinueFromReview) return;
    setCheckResult(null);
    setStep(4);
  }

  function backToReview() {
    setCheckResult(null);
    setStep(3);
  }

  async function runCheck() {
    setChecking(true);
    setCheckError(null);
    try {
      const result = await postJson<CheckResponse>("/api/events/check", formToCheckPayload(form));
      setCheckResult(result);
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : t("create.publish.checkError"));
    } finally {
      setChecking(false);
    }
  }

  const checkRequested = useRef(false);
  useEffect(() => {
    if (step !== 4) {
      checkRequested.current = false;
      return;
    }
    if (checkRequested.current || !ANY_CHECK_LIVE) return;
    checkRequested.current = true;
    void runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, checkResult]);

  function moveToSuggested(suggestedStartIso: string) {
    setForm((prev) => ({
      ...prev,
      date: toDateInputValue(suggestedStartIso),
      startTime: toTimeInputValue(suggestedStartIso),
    }));
    setHighlightDate(true);
    setTimeout(() => setHighlightDate(false), 2200);
    setCheckResult(null);
    setStep(3);
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    try {
      const organizerSlug = draft?.organizer_slug ?? null;
      const result = await postJson<{ event: { id: string } }>("/api/events", formToCreatePayload(form, organizerSlug, posterImage));
      // v1 organizer token: this browser now counts as the organizer (design/screens.md §2).
      if (organizerSlug) claimOrganizer(organizerSlug);
      // After publishing: Home, scrolled to the event, with the one maas toast (design/screens.md §3).
      router.push(`/?published=${encodeURIComponent(result.event.id)}`);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : t("create.publish.error"));
      setPublishing(false);
    }
  }

  const organizerName = draft?.organizer_slug ? organizers[draft.organizer_slug] ?? null : null;

  return (
    <div className="relative flex min-h-dvh flex-col">
      {step === 1 ? (
        <StepShell step={1} title={t("create.newEvent")} close onBack={goToUpload}>
          <UploadStep
            onSubmitImage={startImageIngest}
            onSubmitText={startTextIngest}
            onCreateManually={createManually}
            onSoon={showSoon}
            error={uploadError}
            startInPasteMode={startInPasteMode}
          />
        </StepShell>
      ) : null}

      {step === 2 ? (
        <StepShell step={2} title={t("create.newEvent")} close onBack={goToUpload}>
          <ReadingStep
            posterImage={posterImage}
            draft={draft}
            error={ingestError}
            onFinished={handleReadingFinished}
            onPasteInstead={retryAsPaste}
          />
        </StepShell>
      ) : null}

      {step === 3 ? (
        <StepShell
          step={3}
          title={t("create.checkDetails")}
          onBack={() => setStep(1)}
          footer={
            <Button size="lg" full disabled={!canContinueFromReview} onClick={goToChecks}>
              {t("create.review.continue")}
            </Button>
          }
        >
          <ReviewStep
            form={form}
            onChange={handleReviewChange}
            missingFields={missingFields}
            draft={draft}
            posterImage={posterImage}
            onChangeImage={handleChangeImage}
            highlightDate={highlightDate}
          />
        </StepShell>
      ) : null}

      {step === 4 ? (
        <StepShell
          step={4}
          title={t("create.beforePublish")}
          onBack={backToReview}
          footer={
            <Button size="lg" full disabled={publishing} onClick={handlePublish}>
              {publishing ? t("create.publish.publishing") : t("create.publish.publish")}
            </Button>
          }
        >
          <PublishStep
            form={form}
            organizerName={organizerName}
            posterImage={posterImage}
            checkResult={checkResult}
            checking={checking}
            checkError={checkError}
            onRetryCheck={runCheck}
            onMoveToSuggested={moveToSuggested}
            publishError={publishError}
          />
        </StepShell>
      ) : null}

      {toast ? <Toast tone={toast.tone}>{toast.text}</Toast> : null}
    </div>
  );
}
