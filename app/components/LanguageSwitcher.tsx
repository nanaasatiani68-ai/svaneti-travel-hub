"use client";

import { useLanguage } from "@/app/providers/LanguageProvider";

export default function LanguageSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const {
    language,
    setLanguage,
  } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-2xl border border-white/15 bg-white/10 p-1 ${
        compact ? "gap-0" : "gap-1"
      }`}
      aria-label="Language switcher"
    >
      <button
        type="button"
        onClick={() =>
          setLanguage("ka")
        }
        className={`rounded-xl px-3 py-2 text-sm font-black transition ${
          language === "ka"
            ? "bg-white text-slate-950"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        KA
      </button>

      <button
        type="button"
        onClick={() =>
          setLanguage("en")
        }
        className={`rounded-xl px-3 py-2 text-sm font-black transition ${
          language === "en"
            ? "bg-white text-slate-950"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}