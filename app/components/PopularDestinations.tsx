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

export default function PopularDestinations() {
  const supabase = useMemo(() => createClient(), []);
  const { language } = useLanguage();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  const isEnglish = language === "en";

  useEffect(() => {
    let mounted = true;

    async function loadDestinations() {
      setLoading(true);

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
        .limit(6);

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          "Popular destinations loading error:",
          error
        );

        setDestinations([]);
        setLoading(false);
        return;
      }

      setDestinations(
        (data as Destination[] | null) ?? []
      );

      setLoading(false);
    }

    void loadDestinations();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
            {isEnglish
              ? "Popular Destinations"
              : "პოპულარული მიმართულებები"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {isEnglish
              ? "Discover some of Georgia's most popular places."
              : "აღმოაჩინე საქართველოს პოპულარული ადგილები."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-[150px] animate-pulse rounded-2xl bg-slate-200"
              />
            )
          )}
        </div>
      </section>
    );
  }

  if (destinations.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
            {isEnglish ? "Explore Georgia" : "აღმოაჩინე საქართველო"}
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            {isEnglish
              ? "Popular Destinations"
              : "პოპულარული მიმართულებები"}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {isEnglish
              ? "Choose a destination and discover available tours, transfers, hotels and guides."
              : "აირჩიე მიმართულება და ნახე შესაბამისი ტურები, ტრანსფერები, სასტუმროები და გიდები."}
          </p>
        </div>

        <Link
          href="/destinations"
          className="text-sm font-black text-emerald-700 transition hover:text-emerald-600"
        >
          {isEnglish
            ? "View all →"
            : "ყველას ნახვა →"}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {destinations.map((destination) => {
          const title =
            isEnglish
              ? destination.title_en ||
                destination.title_ka
              : destination.title_ka ||
                destination.title_en ||
                "";

          const description =
            isEnglish
              ? destination.description_en ||
                destination.description_ka
              : destination.description_ka ||
                destination.description_en;

          const searchValue =
            destination.title_en ||
            destination.title_ka;

          return (
            <Link
              key={destination.id}
              href={`/search?destination=${encodeURIComponent(
                searchValue
              )}`}
              className="group relative min-h-[150px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {destination.image_url ? (
                <img
                  src={destination.image_url}
                  alt={title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-800 via-slate-800 to-slate-950">
                  <span className="text-5xl opacity-70">
                    🏔️
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
                  <span>📍</span>
                  <span>
                    {isEnglish
                      ? "Georgia"
                      : "საქართველო"}
                  </span>
                </div>

                <h3 className="line-clamp-1 text-base font-black text-white">
                  {title}
                </h3>

                {description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/70">
                    {description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}


