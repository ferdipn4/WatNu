/**
 * Creates (or reuses) a demo organizer account and links it to an organizer.
 * There is no self-signup: this is how accounts come to exist for now.
 *
 * Usage (needs SUPABASE_SERVICE_ROLE_KEY, so pass the env file):
 *   node --env-file=.env.local --experimental-strip-types scripts/create-demo-organizer.ts <email> <password> <organizer-slug>
 *
 * Example:
 *   node --env-file=.env.local --experimental-strip-types scripts/create-demo-organizer.ts demo@complex.test hunter2-demo complex-maastricht
 */
import { createClient } from "@supabase/supabase-js";

const [email, password, slug] = process.argv.slice(2);

function projectUrl(value: string | undefined): string {
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  return new URL(value).origin;
}

async function main(): Promise<void> {
  if (!email || !password || !slug) {
    console.error("Usage: create-demo-organizer.ts <email> <password> <organizer-slug>");
    process.exitCode = 1;
    return;
  }
  if (password.length < 6) {
    console.error("Supabase requires a password of at least 6 characters.");
    process.exitCode = 1;
    return;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (pass --env-file=.env.local).");

  const supabase = createClient(projectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL), serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: organizer, error: organizerError } = await supabase
    .from("organizers")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (organizerError) throw new Error(`Could not read organizers: ${organizerError.message}`);
  if (!organizer) throw new Error(`No organizer with slug "${slug}".`);

  // Create the user, or reuse an existing one with this email.
  let userId: string;
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) {
    userId = created.data.user.id;
    console.log(`Created account ${email} (${userId}).`);
  } else if (created.error?.code === "email_exists") {
    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw new Error(`Could not list users: ${listError.message}`);
    const existing = list.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (!existing) throw new Error(`An account for ${email} exists but could not be found.`);
    userId = existing.id;
    console.log(`Reusing account ${email} (${userId}); the password was not changed.`);
  } else {
    throw new Error(`Could not create the account: ${created.error?.message ?? "unknown error"}`);
  }

  const { error: memberError } = await supabase
    .from("organizer_members")
    .upsert({ user_id: userId, organizer_id: organizer.id }, { onConflict: "user_id,organizer_id" });
  if (memberError) {
    throw new Error(
      `Could not link the account: ${memberError.message} (is the organizer_members table from supabase/schema.sql applied?)`,
    );
  }

  console.log(`${email} now manages ${organizer.name} (${organizer.slug}).`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
