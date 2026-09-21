import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { TabBar } from "@/components/TabBar";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "WatNu",
  description: "Events happening in Maastricht",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background pb-20 text-foreground">
        {children}
        <TabBar />
      </body>
    </html>
  );
}
