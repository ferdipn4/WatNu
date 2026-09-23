import { NextResponse } from "next/server";
import webpush from "web-push";
import { EVENT_COLUMNS, HttpError, handleRouteError, requireSupabaseReadClient } from "@/lib/api";
import { addDaysToDateKey, amsterdamDateKey, amsterdamInstant, amsterdamParts } from "@/lib/datetime";
import { expandOccurrences, type OccurrenceRow } from "@/lib/occurrences";
import { dateNames } from "@/app/_lib/i18n/dates";

export const runtime = "nodejs";
/** Sending a few hundred pushes takes a while; Vercel allows up to this on every plan. */
export const maxDuration = 60;

/** A reminder goes out for an occurrence starting within this window (the cron runs once a day, in the morning). */
const REMINDER_HOURS = 24;
/** A cancellation goes out for a skipped date this far ahead. */
const CANCELLED_DAYS = 14;
/** How long the push service keeps an undelivered reminder. */
const TTL_SECONDS = 6 * 3600;
const IN_CHUNK = 100;

type Subscription = {
  id: string;
  token: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  event_ids: string[];
  locale: string;
};

type SentRow = { subscription_id: string; event_id: string; occurrence_date: string; kind: string };

type EventRow = OccurrenceRow & { id: string; title: string; location_name: string | null };

type Due = {
  subscription: Subscription;
  event: EventRow;
  dateKey: string;
  kind: "reminder" | "cancelled";
  title: string;
  body: string;
  url: string;
};

const COPY = {
  en: { today: "Today", tomorrow: "Tomorrow", cancelled: "Cancelled", off: "is off", next: "Next" },
  nl: { today: "Vandaag", tomorrow: "Morgen", cancelled: "Afgelast", off: "gaat niet door", next: "Volgende" },
} as const;

const pad = (value: number) => String(value).padStart(2, "0");

function localeOf(subscription: Subscription): "en" | "nl" {
  return subscription.locale === "nl" ? "nl" : "en";
}

/** "Thu 1 Oct" in the phone's language. */
function shortDate(dateKey: string, locale: "en" | "nl"): string {
  const names = dateNames(locale);
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = names.weekdayShort[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} ${day} ${names.monthShort[month - 1]}`;
}

function timeOf(iso: string): string {
  const { hour, minute } = amsterdamParts(iso);
  return `${pad(hour)}:${pad(minute)}`;
}

/** What is due for one subscription: reminders for its saved events' next occurrences, cancellations for skipped dates ahead. */
function dueFor(subscription: Subscription, events: Map<string, EventRow>, sent: Set<string>, now: Date): Due[] {
  const locale = localeOf(subscription);
  const copy = COPY[locale];
  const todayKey = amsterdamDateKey(now);
  const tomorrowKey = addDaysToDateKey(todayKey, 1);
  const reminderUntil = new Date(now.getTime() + REMINDER_HOURS * 3_600_000);
  const cancelledUntilKey = addDaysToDateKey(todayKey, CANCELLED_DAYS);
  const due: Due[] = [];

  for (const eventId of subscription.event_ids) {
    const event = events.get(eventId);
    if (!event) continue;

    for (const occurrence of expandOccurrences(event, now, reminderUntil)) {
      if (occurrence.cancelled) continue;
      const dateKey = amsterdamDateKey(occurrence.start);
      if (sent.has(`${subscription.id}|${event.id}|${dateKey}|reminder`)) continue;
      const day = dateKey === todayKey ? copy.today : dateKey === tomorrowKey ? copy.tomorrow : shortDate(dateKey, locale);
      due.push({
        subscription,
        event,
        dateKey,
        kind: "reminder",
        title: event.title,
        body: [`${day} ${timeOf(occurrence.start)}`, event.location_name].filter(Boolean).join(" · "),
        url: `/e/${event.id}?on=${dateKey}`,
      });
    }

    for (const dateKey of event.skipped_dates ?? []) {
      if (dateKey < todayKey || dateKey > cancelledUntilKey) continue;
      if (sent.has(`${subscription.id}|${event.id}|${dateKey}|cancelled`)) continue;
      const after = new Date(amsterdamInstant(addDaysToDateKey(dateKey, 1)).getTime());
      const next = expandOccurrences(event, after, null).find((occurrence) => !occurrence.cancelled);
      const nextText = next ? ` ${copy.next}: ${shortDate(amsterdamDateKey(next.start), locale)}.` : "";
      due.push({
        subscription,
        event,
        dateKey,
        kind: "cancelled",
        title: `${copy.cancelled}: ${event.title}`,
        body: `${shortDate(dateKey, locale)} ${copy.off}.${nextText}`,
        url: `/e/${event.id}?on=${dateKey}`,
      });
    }
  }
  return due;
}

/**
 * The sender. A Vercel cron calls it once a day (vercel.json) with `Authorization: Bearer $CRON_SECRET`;
 * the same secret sits in app_config so the definer functions hand out the subscriptions to it alone.
 * Idempotent: push_sent remembers what went out per phone, event, date and kind.
 */
export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new HttpError(503, "CRON_SECRET is not set.");
    if (request.headers.get("authorization") !== `Bearer ${secret}`) throw new HttpError(401, "Not the cron.");

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) throw new HttpError(503, "NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are not set.");
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:hello@watnu.app", publicKey, privateKey);

    const supabase = requireSupabaseReadClient();
    const now = new Date();

    const { data: subscriptionRows, error: listError } = await supabase.rpc("push_list", { p_secret: secret });
    if (listError) throw new HttpError(502, `Could not read the subscriptions: ${listError.message}`);
    const subscriptions = (subscriptionRows ?? []) as Subscription[];

    const { data: sentRows, error: sentError } = await supabase.rpc("push_sent_list", {
      p_secret: secret,
      p_from: addDaysToDateKey(amsterdamDateKey(now), -1),
    });
    if (sentError) throw new HttpError(502, `Could not read what was sent: ${sentError.message}`);
    const sent = new Set(((sentRows ?? []) as SentRow[]).map((row) => `${row.subscription_id}|${row.event_id}|${row.occurrence_date}|${row.kind}`));

    // Every saved event across all phones, read once.
    const ids = Array.from(new Set(subscriptions.flatMap((subscription) => subscription.event_ids)));
    const events = new Map<string, EventRow>();
    for (let index = 0; index < ids.length; index += IN_CHUNK) {
      const { data, error } = await supabase.from("events").select(EVENT_COLUMNS).in("id", ids.slice(index, index + IN_CHUNK));
      if (error) throw new HttpError(502, `Could not read the events: ${error.message}`);
      for (const row of (data ?? []) as EventRow[]) events.set(row.id, row);
    }

    const due = subscriptions.flatMap((subscription) => dueFor(subscription, events, sent, now));

    let delivered = 0;
    let failed = 0;
    let dropped = 0;
    for (const item of due) {
      const { subscription } = item;
      const payload = JSON.stringify({ title: item.title, body: item.body, url: item.url, tag: `${item.event.id}-${item.dateKey}-${item.kind}` });
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
          { TTL: TTL_SECONDS },
        );
        delivered += 1;
        await supabase.rpc("push_mark_sent", {
          p_secret: secret,
          p_subscription_id: subscription.id,
          p_event_id: item.event.id,
          p_occurrence_date: item.dateKey,
          p_kind: item.kind,
        });
      } catch (caught) {
        const status = (caught as { statusCode?: number }).statusCode;
        // 404 / 410: the phone unsubscribed or the browser dropped the subscription — forget it.
        if (status === 404 || status === 410) {
          await supabase.rpc("push_drop", { p_secret: secret, p_subscription_id: subscription.id });
          dropped += 1;
        } else {
          failed += 1;
        }
      }
    }

    return NextResponse.json({ subscriptions: subscriptions.length, due: due.length, delivered, failed, dropped });
  } catch (error) {
    return handleRouteError(error);
  }
}
