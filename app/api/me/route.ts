import { NextResponse } from "next/server";
import { HttpError, handleRouteError, requireUser } from "@/lib/api";

export const runtime = "nodejs";

const MEMBERSHIP_COLUMNS = "organizers ( id, slug, name, type, category, logo_file )";

type MembershipRow = {
  organizers:
    | { id: string; slug: string; name: string; type: string | null; category: string | null; logo_file: string | null }
    | { id: string; slug: string; name: string; type: string | null; category: string | null; logo_file: string | null }[]
    | null;
};

/** Who is signed in, and which organizers they manage (row level security shows them only their own memberships). */
export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUser(request);

    const { data, error } = await supabase
      .from("organizer_members")
      .select(MEMBERSHIP_COLUMNS)
      .eq("user_id", user.id);

    if (error) {
      throw new HttpError(502, `Could not read your organizers: ${error.message}`);
    }

    const organizers = ((data ?? []) as MembershipRow[])
      .flatMap((row) => (Array.isArray(row.organizers) ? row.organizers : row.organizers ? [row.organizers] : []))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ user: { id: user.id, email: user.email ?? null }, organizers });
  } catch (error) {
    return handleRouteError(error);
  }
}
