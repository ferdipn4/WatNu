/**
 * Makes an existing account an admin: it may then edit or delete any organizer and any event,
 * and handle the access requests at /admin/requests. Run it once for yourself.
 *
 * Usage (needs SUPABASE_SERVICE_ROLE_KEY, so pass the env file):
 *   node --env-file=.env.local --experimental-strip-types scripts/make-admin.ts <email>
 *
 * The account must exist (scripts/create-demo-organizer.ts creates one, linked to an organizer).
 */
import { createClient } from "@supabase/supabase-js";

const [email] = process.argv.slice(2);

function projectUrl(value: string | undefined): string {
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  return new URL(value).origin;
}

async function main(): Promise<void> {
  if (!email) {
    console.error("Usage: make-admin.ts <email>");
    process.exitCode = 1;
    return;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (pass --env-file=.env.local).");

  const supabase = createClient(projectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL), serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error(`Could not list users: ${listError.message}`);
  const user = list.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`No account with the email ${email}. Create one with scripts/create-demo-organizer.ts first.`);

  const { error } = await supabase.from("admins").upsert({ user_id: user.id }, { onConflict: "user_id" });
  if (error) throw new Error(`Could not add the admin: ${error.message} (is the admins table from supabase/schema.sql applied?)`);

  console.log(`${email} is now an admin.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
