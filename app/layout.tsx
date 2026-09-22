// app/layout.tsx (Next.js 16 App Router). The two Google Fonts arrive as CSS variables; globals.css maps them to font-display / font-sans.
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import Script from 'next/script';
import { AuthProvider } from '@/app/_lib/auth';
import { LocaleProvider } from '@/app/_lib/i18n/provider';
import { getServerLocale } from '@/app/_lib/i18n/server';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], axes: ['opsz'], variable: '--font-bricolage', display: 'swap' });
const sans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

export const metadata: Metadata = { title: 'WatNu', description: "What's on in Maastricht this week." };
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f5' },
    { media: '(prefers-color-scheme: dark)', color: '#141110' },
  ],
};

// Sets data-theme on <html> before the first paint (design/layout.snippet.tsx: "set it from
// localStorage / prefers-color-scheme in a small client component later"). A saved choice in
// localStorage ("watnu:theme" = "light" | "dark", set on the profile page via app/_lib/theme.ts)
// wins; otherwise the system preference, kept in sync when it changes. Runs beforeInteractive so
// there is no flash of the wrong theme.
const THEME_SCRIPT = `(function(){try{var k='watnu:theme',m=window.matchMedia('(prefers-color-scheme: dark)'),d=document.documentElement;function a(){var s=localStorage.getItem(k);d.setAttribute('data-theme',s==='dark'||s==='light'?s:(m.matches?'dark':'light'))}a();m.addEventListener('change',a)}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The UI language comes from a cookie so the server already renders the right one (app/_lib/i18n).
  const locale = await getServerLocale();
  // data-theme="dark" on <html> switches every token; THEME_SCRIPT sets it from localStorage / prefers-color-scheme
  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        <Script id="watnu-theme" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>
            <div id="app">{children}</div>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
