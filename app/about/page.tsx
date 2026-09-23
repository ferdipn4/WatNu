// app/about/page.tsx — "/about": what WatNu is and what it keeps about you, linked from the
// profile tab. The contact address comes from NEXT_PUBLIC_CONTACT_EMAIL; without it the line is left out.
import type { Metadata } from "next";
import { AboutScreen } from "./_components/AboutScreen";

export const metadata: Metadata = {
  title: "About WatNu",
  description: "What WatNu is, and what it keeps about you.",
};

export default function AboutPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;
  return <AboutScreen contact={contact} />;
}
