// app/mine/profile/page.tsx — your profile and settings, opened from My WatNu's header.
// Everything here is per phone: the name, the theme, the language, the organizers you manage.
import { getViewOrganizers } from "@/app/e/_lib/view-data";
import { ProfileScreen } from "./_components/ProfileScreen";

export default async function ProfilePage() {
  const organizers = await getViewOrganizers();
  return <ProfileScreen organizers={organizers} />;
}
