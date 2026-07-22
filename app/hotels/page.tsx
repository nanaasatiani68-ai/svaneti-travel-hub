"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Hotel = {
  id: number | string;
  name: string | null;
  location: string | null;
  price_per_night: number | null;
  description: string | null;
  image_url: string | null;
  rooms: number | null;
  phone: string | null;
  status: string | null;
  created_at: string | null;
};

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadHotels() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("hotels")
        .select(
          `
            id,
            name,
            location,
            price_per_night,
            description,
            image_url,
            rooms,
            phone,
            status,
            created_at
          `
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Hotels loading error:", error);
        setErrorMessage(
          `სასტუმროების ჩატვირთვა ვერ მოხერხდა: ${error.message}`
        );
        setLoading(false);
        return;
      }

      setHotels((data as Hotel[]) ?? []);
      setLoading(false);
    }

    loadHotels();
  }, []);

  const filteredHotels = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return hotels;
    }

    return hotels.filter((hotel) => {
      const name = String(hotel.name || "").toLowerCase();
      const location = String(hotel.location || "").toLowerCase();
      const description = String(hotel.description || "").toLowerCase();

      return (
        name.includes(searchValue) ||
        location.includes(searchValue) ||
        description.includes(searchValue)
      );
    });
  }, [hotels, search]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-2xl">
              🏨
            </div>

            <div>
              <h1 className="font-extrabold">Georgia Travel Hub</h1>
              <p className="text-xs text-white/50">სასტუმროები</p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
          >
            ← მთავარი
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            Hotels
          </p>

          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            სასტუმროების ნახვა
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-white/60">
            მოძებნე სასტუმრო მდებარეობის, სახელის ან აღწერის მიხედვით.
          </p>

          <div className="mt-8 max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="მოძებნე სასტუმრო ან ადგილი..."
              className="w-full rounded-2xl border border-white/10 bg-white px-5 py-4 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
              <div className="text-5xl">⏳</div>
              <p className="mt-4 text-lg font-semibold">
                სასტუმროები იტვირთება...
              </p>
            </div>
          )}

          {!loading && errorMessage && (
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-200">
              {errorMessage}
            </div>
          )}

          {!loading && !errorMessage && filteredHotels.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
              <div className="text-6xl">🏨</div>

              <h3 className="mt-4 text-2xl font-bold">
                სასტუმრო ვერ მოიძებნა
              </h3>

              <p className="mt-2 text-white/50">
                ჯერ არცერთი დამტკიცებული სასტუმრო არ არის დამატებული.
              </p>
            </div>
          )}

          {!loading && !errorMessage && filteredHotels.length > 0 && (
            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {filteredHotels.map((hotel) => (
                <article
                  key={hotel.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl transition hover:-translate-y-1 hover:bg-white/10"
                >
                  {hotel.image_url ? (
                    <img
                      src={hotel.image_url}
                      alt={hotel.name || "Hotel"}
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-white/5 text-8xl">
                      🏨
                    </div>
                  )}

                  <div className="p-6">
                    <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                      ხელმისაწვდომია
                    </span>

                    <h3 className="mt-4 text-2xl font-extrabold">
                      {hotel.name || "სასტუმრო"}
                    </h3>

                    <p className="mt-3 text-white/60">
                      📍 {hotel.location || "საქართველო"}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <InfoBox
                        icon="🛏️"
                        value={
                          hotel.rooms
                            ? `${hotel.rooms} ოთახი`
                            : "ოთახები უცნობია"
                        }
                      />

                      <InfoBox
                        icon="📞"
                        value={hotel.phone || "ნომერი არ არის"}
                      />
                    </div>

                    {hotel.description && (
                      <p className="mt-5 line-clamp-3 leading-7 text-white/55">
                        {hotel.description}
                      </p>
                    )}

                    <div className="mt-7 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-white/35">
                          ფასი ერთ ღამეზე
                        </p>

                        <p className="mt-1 text-2xl font-black text-emerald-300">
                          {hotel.price_per_night !== null
                            ? `${Number(
                                hotel.price_per_night
                              ).toLocaleString()} ₾`
                            : "შეთანხმებით"}
                        </p>
                      </div>

                      <Link
                        href={`/book-hotel/${hotel.id}`}
                        className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 font-bold transition hover:bg-emerald-600"
                      >
                        დაჯავშნა
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoBox({
  icon,
  value,
}: {
  icon: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-black/20 p-3 text-white/70">
      <span className="mr-2">{icon}</span>
      <span>{value}</span>
    </div>
  );
}