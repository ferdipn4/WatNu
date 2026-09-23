"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { TopBar } from "@/app/_components/TopBar";
import { useAuth } from "@/app/_lib/auth";
import { postJson } from "@/app/_lib/http";
import { useT } from "@/app/_lib/i18n";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Put your events on WatNu": the way in for an organizer that is not on the app yet. The form
 * lands in organizer_requests; an admin reads it, creates the account and passes the password on
 * personally — nothing is mailed, so the screen says what to expect.
 */
export function JoinScreen() {
  const router = useRouter();
  const t = useT();
  const { user, organizers } = useAuth();

  const [organization, setOrganization] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [message, setMessage] = useState("");
  // A honeypot: hidden from people, filled by bots. The API stores nothing when it has a value.
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const canSubmit = organization.trim().length >= 2 && contact.trim().length >= 2 && emailValid && !busy;

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/organizers");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await postJson("/api/organizer-requests", {
        organization: organization.trim(),
        contact_name: contact.trim(),
        email: email.trim(),
        instagram_handle: instagram.trim() || null,
        message: message.trim() || null,
        website,
      });
      setSentTo(email.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("join.error"));
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title={t("join.title")} close onBack={goBack} />
        <div className="flex flex-col items-center gap-3 px-6 pt-20 text-center">
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-maas-soft text-maas">
            <Icon name="check" size={32} />
          </span>
          <h2 className="t-heading text-ink">{t("join.done.title")}</h2>
          <p className="t-body text-ink-muted">{t("join.done.body", { email: sentTo })}</p>
          <Button className="mt-2" href="/">
            {t("join.done.action")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <TopBar title={t("join.title")} close onBack={goBack} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pt-2">
        <div>
          <h2 className="t-heading text-ink">{t("join.heading")}</h2>
          <p className="t-meta mt-1 text-ink-muted">{t("join.meta")}</p>
        </div>

        {user && organizers.length > 0 ? <p className="t-meta text-maas">{t("join.signedIn")}</p> : null}

        <Field id="join-organization" label={t("join.organization")} placeholder={t("join.organizationPlaceholder")} value={organization} onChange={setOrganization} />
        <Field id="join-contact" label={t("join.contact")} value={contact} onChange={setContact} />
        <Field
          id="join-email"
          label={t("join.email")}
          type="email"
          inputMode="email"
          value={email}
          onChange={setEmail}
          hint={t("join.emailHint")}
        />
        <Field id="join-instagram" label={t("join.instagram")} placeholder="@" value={instagram} onChange={setInstagram} hint={t("join.instagramHint")} />
        <Field id="join-message" kind="textarea" label={t("join.message")} placeholder={t("join.messagePlaceholder")} value={message} onChange={setMessage} />
        <input
          type="text"
          name="website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {error ? <p className="t-meta text-warn">{error}</p> : null}

        <Button type="submit" size="lg" full disabled={!canSubmit}>
          {busy ? t("join.submitting") : t("join.submit")}
        </Button>
      </form>
    </div>
  );
}
