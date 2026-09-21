// app/layout.tsx (Next.js 16 App Router). The two Google Fonts arrive as CSS variables; globals.css maps them to font-display / font-sans.
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], axes: ['opsz'], variable: '--font-bricolage', display: 'swap' });
const sans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

export const metadata: Metadata = { title: 'WatNu', description: "What's on in Maastricht this week." };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#faf8f5' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // data-theme="dark" on <html> switches every token; set it from localStorage / prefers-color-scheme in a small client component later
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        <div id="app">{children}</div>
      </body>
    </html>
  );
}
