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

        setHotels([]);
        setLoading(false);
        return;
      }

      setHotels((data as Hotel[] | null) ?? []);
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
      const phone = String(hotel.phone || "").toLowerCase();

      return (
        name.includes(searchValue) ||
        location.includes(searchValue) ||
        description.includes(searchValue) ||
        phone.includes(searchValue)
      );
    });
  }, [hotels, search]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-2xl shadow-lg">
              🏨
            </div>

            <div>
              <h1 className="font-extrabold">Georgia Travel Hub</h1>

              <p className="text-xs text-white/50">
                სასტუმროები
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              Dashboard
            </Link>

            <Link
              href="/"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold transition hover:bg-emerald-600"
            >
              ← მთავარი
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            Hotels
          </p>

          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            ყველა სასტუმრო
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-white/60">
            დაათვალიერე ყველა დამტკიცებული სასტუმრო, მოძებნე სასურველი
            მდებარეობა და გააგზავნე დაჯავშნის მოთხოვნა.
          </p>

          <div className="mt-8 flex max-w-3xl flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl sm:flex-row">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="მოძებნე სასტუმრო, ადგილი ან ტელეფონი..."
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white px-5 py-4 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
              >
                გასუფთავება
              </button>
            )}
          </div>

          {!loading && !errorMessage && hotels.length > 0 && (
            <p className="mt-4 text-sm text-white/50">
              ნაპოვნია: {filteredHotels.length} სასტუმრო
            </p>
          )}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
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
              <p className="font-bold">
                სასტუმროების ჩატვირთვა ვერ მოხერხდა
              </p>

              <p className="mt-2 text-sm">
                {errorMessage}
              </p>
            </div>
          )}

          {!loading &&
            !errorMessage &&
            filteredHotels.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
                <div className="text-6xl">🏨</div>

                <h3 className="mt-4 text-2xl font-bold">
                  სასტუმრო ვერ მოიძებნა
                </h3>

                <p className="mt-2 text-white/50">
                  {search
                    ? "შეცვალე საძიებო სიტყვა და თავიდან სცადე."
                    : "ჯერ არცერთი დამტკიცებული სასტუმრო არ არის დამატებული."}
                </p>

                <Link
                  href="/dashboard/add-hotel"
                  className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 font-bold transition hover:bg-emerald-600"
                >
                  ➕ სასტუმროს დამატება
                </Link>
              </div>
            )}

          {!loading &&
            !errorMessage &&
            filteredHotels.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredHotels.map((hotel) => (
                  <article
                    key={hotel.id}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/10"
                  >
                    <div className="relative h-60 overflow-hidden">
                      {hotel.image_url ? (
                        <img
                          src={hotel.image_url}
                          alt={hotel.name || "Hotel"}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900 text-8xl">
                          🏨
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      <span className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        ხელმისაწვდომია
                      </span>

                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-2xl font-extrabold text-white drop-shadow-lg">
                          {hotel.name || "უსახელო სასტუმრო"}
                        </h3>

                        <p className="mt-1 text-sm text-white/80">
                          📍 {hotel.location || "საქართველო"}
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3 text-sm">
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
                        <p className="mt-5 line-clamp-3 leading-7 text-white/60">
                          {hotel.description}
                        </p>
                      )}

                      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
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
                          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-white transition hover:bg-emerald-600"
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
    <div className="min-w-0 rounded-xl bg-black/20 p-3 text-white/70">
      <span className="mr-2">{icon}</span>

      <span className="break-words">
        {value}
      </span>
    </div>
  );
}