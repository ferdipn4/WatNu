/** Whether `original_language` (from the draft) is worth a "Translated from …" note. */
export function isTranslatedLanguage(language: string | null | undefined): boolean {
  if (!language) return false;
  const normalized = language.trim().toLowerCase();
  return normalized !== "" && normalized !== "en" && normalized !== "english" && normalized !== "unknown";
}
