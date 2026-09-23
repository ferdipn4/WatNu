"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { TopBar } from "@/app/_components/TopBar";
import { useAuth } from "@/app/_lib/auth";
import { useT } from "@/app/_lib/i18n";

/** Email + password for organizers, in the flow layout (52px top bar, heading, fields, one primary button). */
export function SignInScreen({ next }: { next: string }) {
  const router = useRouter();
  const t = useT();
  const { ready, available, user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in: straight on to where they were going.
  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  function close() {
    if (window.history.length > 1) router.back();
    else router.push("/profile");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await signIn(email, password);
    if (result === "ok") {
      router.replace(next);
      return;
    }
    setError(result === "invalid" ? t("signin.error") : result === "unavailable" ? t("signin.unavailable") : t("signin.error"));
    setBusy(false);
  }

  const canSubmit = available && email.trim().length > 0 && password.length > 0 && !busy;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title={t("signin.title")} close onBack={close} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pt-2">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="user" size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="t-heading text-ink">{t("signin.heading")}</h2>
            <p className="t-meta mt-1 text-ink-muted">{t("signin.meta")}</p>
          </div>
        </div>

        <Field id="signin-email" label={t("signin.email")} type="email" inputMode="email" value={email} onChange={setEmail} />
        <Field id="signin-password" label={t("signin.password")} type="password" value={password} onChange={setPassword} />

        {error ? <p className="t-meta text-warn">{error}</p> : null}
        {!available ? <p className="t-meta text-ink-muted">{t("signin.unavailable")}</p> : null}

        <Button type="submit" size="lg" full disabled={!canSubmit}>
          {busy ? t("signin.submitting") : t("signin.submit")}
        </Button>
        <Button variant="ghost" full href="/organizers/join">
          {t("join.link")}
        </Button>
      </form>
    </div>
  );
}
