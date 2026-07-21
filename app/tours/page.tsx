"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Tour = {
  id: string | number;
  title: string | null;
  description: string | null;
  location: string | null;
  price: number | null;
  image_url: string | null;
  duration: string | null;
  max_people: number | null;
  category: string | null;
  status: string | null;
  created_at: string | null;
};

export default function PublicToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadTours() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("tours")
        .select(
          `
            id,
            title,
            description,
            location,
            price,
            image_url,
            duration,
            max_people,
            category,
            status,
            created_at
          `
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Tours loading error:", error);
        setErrorMessage(`ტურების ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
        setLoading(false);
        return;
      }

      setTours((data as Tour[]) ?? []);
      setLoading(false);
    }

    loadTours();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mb-4 text-6xl">🏔️</div>

          <p className="text-xl font-semibold">ტურები იტვირთება...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
              Georgia Travel Hub
            </p>

            <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
              🏔️ ყველა ტური
            </h1>

            <p className="mt-3 max-w-2xl text-white/60">
              დაათვალიერეთ საქართველოში ხელმისაწვდომი ტურები და დაჯავშნეთ
              სასურველი ტური რეგისტრაციის გარეშე.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/20"
          >
            ← მთავარ გვერდზე დაბრუნება
          </Link>
        </div>

        {errorMessage && (
          <div className="mb-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">
            {errorMessage}
          </div>
        )}

        {!errorMessage && tours.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-10 text-center shadow-2xl backdrop-blur-xl">
            <div className="mb-4 text-7xl">🏔️</div>

            <h2 className="text-2xl font-bold">
              დამტკიცებული ტურები ჯერ არ არის
            </h2>

            <p className="mt-3 text-white/60">
              ახალი ტურები აქ გამოჩნდება ადმინისტრატორის მიერ დამტკიცების
              შემდეგ.
            </p>
          </div>
        )}

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {tours.map((tour) => (
            <article
              key={tour.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/15"
            >
              {tour.image_url ? (
                <img
                  src={tour.image_url}
                  alt={tour.title || "Tour"}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center bg-white/5">
                  <span className="text-8xl">🏔️</span>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {tour.category && (
                      <span className="mb-3 inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                        {tour.category}
                      </span>
                    )}

                    <h2 className="text-2xl font-extrabold">
                      {tour.title || "უსახელო ტური"}
                    </h2>
                  </div>

                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                    ხელმისაწვდომია
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm text-white/70">
                  <p>
                    📍 {tour.location || "მდებარეობა არ არის მითითებული"}
                  </p>

                  <p>
                    ⏱️ {tour.duration || "ხანგრძლივობა არ არის მითითებული"}
                  </p>

                  <p>
                    👥{" "}
                    {tour.max_people
                      ? `მაქსიმუმ ${tour.max_people} ადამიანი`
                      : "რაოდენობა არ არის მითითებული"}
                  </p>
                </div>

                {tour.description && (
                  <p className="mt-5 line-clamp-3 leading-7 text-white/60">
                    {tour.description}
                  </p>
                )}

                <div className="mt-7 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                      ფასი
                    </p>

                    <p className="mt-1 text-2xl font-extrabold text-cyan-300">
                      {tour.price !== null
                        ? `${Number(tour.price).toLocaleString()} ₾`
                        : "შეთანხმებით"}
                    </p>
                  </div>

                  <Link
                    href={`/book-tour/${tour.id}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-white transition hover:bg-cyan-600"
                  >
                    დაჯავშნა
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}