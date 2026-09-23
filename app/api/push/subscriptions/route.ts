import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { HttpError, handleRouteError, readJsonBody, requireSupabaseReadClient } from "@/lib/api";
import { pushSubscribeSchema, pushUpdateSchema, validationError } from "@/lib/schemas";

export const runtime = "nodejs";

/**
 * A phone's push subscription, keyed by a token only that phone knows (students have no account).
 * The definer functions in supabase/schema.sql do the writes; the table itself is not readable.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = pushSubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { token, subscription, event_ids, locale } = parsed.data;
    const supabase = requireSupabaseReadClient();
    const { error } = await supabase.rpc("push_subscribe", {
      p_token: token,
      p_endpoint: subscription.endpoint,
      p_p256dh: subscription.keys.p256dh,
      p_auth: subscription.keys.auth,
      p_event_ids: event_ids,
      p_locale: locale ?? "en",
    });
    if (error) {
      throw new HttpError(502, `Could not save the subscription: ${error.message}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** The phone saved or unsaved an event: the list to remind about follows. 404 means the phone should subscribe again. */
export async function PATCH(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = pushUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const supabase = requireSupabaseReadClient();
    const { data, error } = await supabase.rpc("push_update", {
      p_token: parsed.data.token,
      p_event_ids: parsed.data.event_ids,
      p_locale: parsed.data.locale ?? null,
    });
    if (error) {
      throw new HttpError(502, `Could not update the subscription: ${error.message}`);
    }
    if (data !== true) {
      throw new HttpError(404, "No subscription for this token.");
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Reminders off: `?token=` names the phone's subscription. */
export async function DELETE(request: NextRequest) {
  try {
    const token = z.string().uuid().safeParse(request.nextUrl.searchParams.get("token"));
    if (!token.success) {
      return NextResponse.json(validationError(token.error), { status: 400 });
    }

    const supabase = requireSupabaseReadClient();
    const { error } = await supabase.rpc("push_unsubscribe", { p_token: token.data });
    if (error) {
      throw new HttpError(502, `Could not remove the subscription: ${error.message}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
