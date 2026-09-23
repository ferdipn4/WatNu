// app/mine/profile/page.tsx — the profile moved to its own tab (/profile); the old link still lands there.
import { permanentRedirect } from "next/navigation";

export default function LegacyProfilePage() {
  permanentRedirect("/profile");
}
