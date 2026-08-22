import type { Language } from "@/app/lib/i18n/translations";

export function localizedValue(
  language: Language,
  kaValue: string | null | undefined,
  enValue: string | null | undefined,
  fallbackValue?: string | null
) {
  if (language === "en") {
    return (
      clean(enValue) ||
      clean(kaValue) ||
      clean(fallbackValue) ||
      ""
    );
  }

  return (
    clean(kaValue) ||
    clean(enValue) ||
    clean(fallbackValue) ||
    ""
  );
}

function clean(
  value: string | null | undefined
) {
  const text = String(value ?? "").trim();
  return text || "";
}