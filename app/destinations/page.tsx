"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/app/providers/LanguageProvider";

type Destination = {
  id: string;
  title_ka: string;
  title_en: string | null;
  description_ka: string | null;
  description_en: string | null;
  image_url: string | null;
  sort_order: number | null;
};

export default function DestinationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { language } = useLanguage();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const isEnglish = language === "en";

  useEffect(() => {
    let mounted = true;

    async function loadDestinations() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("travel_tips")
        .select(`
          id,
          title_ka,
          title_en,
          description_ka,
          description_en,
          image_url,
          sort_order
        `)
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!mounted) {
        return;
      }

      if (error) {
        console.error("Destinations loading error:", error);

        setDestinations([]);
        setErrorMessage(
          isEnglish
            ? "Destinations could not be loaded."
            : "მიმართულებების ჩატვირთვა ვერ მოხერხდა."
        );

        setLoading(false);
        return;
      }

      setDestinations((data as Destination[] | null) ?? []);
      setLoading(false);
    }

    void loadDestinations();

    return () => {
      mounted = false;
    };
  }, [supabase, isEnglish]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-600"
          >
            ← {isEnglish ? "Back to home" : "მთავარ გვერდზე დაბრუნება"}
          </Link>

          <div className="mt-6 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              {isEnglish ? "Explore Georgia" : "აღმოაჩინე საქართველო"}
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              {isEnglish
                ? "Popular Destinations"
                : "პოპულარული მიმართულებები"}
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-600">
              {isEnglish
                ? "Choose a destination and discover available tours, transfers, hotels and guides across Georgia."
                : "აირჩიე სასურველი მიმართულება და აღმოაჩინე შესაბამისი ტურები, ტრანსფერები, სასტუმროები და გიდები საქართველოში."}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[280px] animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-bold text-red-700">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && destinations.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">📍</div>

            <h2 className="mt-4 text-xl font-black text-slate-900">
              {isEnglish
                ? "No destinations yet"
                : "მიმართულებები ჯერ არ არის"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {isEnglish
                ? "Published destinations will appear here."
                : "გამოქვეყნებული მიმართულებები აქ გამოჩნდება."}
            </p>
          </div>
        )}

        {!loading && !errorMessage && destinations.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-slate-500">
                {isEnglish
                  ? `${destinations.length} destinations`
                  : `${destinations.length} მიმართულება`}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination) => {
                const title = isEnglish
                  ? destination.title_en || destination.title_ka
                  : destination.title_ka ||
                    destination.title_en ||
                    "";

                const description = isEnglish
                  ? destination.description_en ||
                    destination.description_ka
                  : destination.description_ka ||
                    destination.description_en;

                const searchValue =
                  destination.title_en || destination.title_ka;

                return (
                  <Link
                    key={destination.id}
                    href={`/search?destination=${encodeURIComponent(
                      searchValue
                    )}`}
                    className="group relative min-h-[280px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {destination.image_url ? (
                      <img
                        src={destination.image_url}
                        alt={title}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-800 via-slate-800 to-slate-950">
                        <span className="text-7xl opacity-70">🏔️</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <div className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-emerald-300">
                        <span>📍</span>
                        <span>
                          {isEnglish ? "Georgia" : "საქართველო"}
                        </span>
                      </div>

                      <h2 className="text-2xl font-black text-white">
                        {title}
                      </h2>

                      {description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/75">
                          {description}
                        </p>
                      )}

                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-white">
                        {isEnglish
                          ? "Explore destination"
                          : "მიმართულების ნახვა"}
                        <span>→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}