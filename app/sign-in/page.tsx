// app/sign-in/page.tsx — organizer sign-in (email + password). Accounts are created by
// scripts/create-demo-organizer.ts; there is no self-signup. Students never see this.
import { safeNextPath } from "@/app/_lib/auth-paths";
import { SignInScreen } from "./_components/SignInScreen";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <SignInScreen next={safeNextPath(next)} />;
}
