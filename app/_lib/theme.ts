/**
 * The theme choice, per phone (localStorage `watnu:theme`). "system" = no key, follow
 * prefers-color-scheme. The inline script in app/layout.tsx applies the same rule before the
 * first paint and re-applies it when the system preference changes; keep the two in sync.
 */
export type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "watnu:theme";

export function getThemeMode(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "dark" || value === "light" ? value : "system";
  } catch {
    return "system";
  }
}

export function setThemeMode(mode: ThemeMode): void {
  try {
    if (mode === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Storage unavailable — the choice still applies until the page reloads.
  }
  applyTheme(mode);
}

function applyTheme(mode: ThemeMode): void {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}
