"use client";

import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

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

type SortOption =
  | "newest"
  | "price-low"
  | "price-high"
  | "rooms-high"
  | "name";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minimumRooms, setMinimumRooms] = useState("");
  const [sortBy, setSortBy] =
    useState<SortOption>("newest");

  async function loadHotels() {
    setLoading(true);
    setErrorMessage("");

    try {
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
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setHotels((data as Hotel[] | null) ?? []);
    } catch (error: unknown) {
      console.error("Hotels loading error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setHotels([]);

      setErrorMessage(
        `სასტუმროების ჩატვირთვა ვერ მოხერხდა: ${message}`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHotels();
  }, []);

  const filteredHotels = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const minimumPrice =
      minPrice.trim() === ""
        ? null
        : Number(minPrice);

    const maximumPrice =
      maxPrice.trim() === ""
        ? null
        : Number(maxPrice);

    const requestedRooms =
      minimumRooms.trim() === ""
        ? null
        : Number(minimumRooms);

    const result = hotels.filter((hotel) => {
      const name = String(
        hotel.name ?? ""
      ).toLowerCase();

      const location = String(
        hotel.location ?? ""
      ).toLowerCase();

      const description = String(
        hotel.description ?? ""
      ).toLowerCase();

      const phone = String(
        hotel.phone ?? ""
      ).toLowerCase();

      const matchesSearch =
        searchValue === "" ||
        name.includes(searchValue) ||
        location.includes(searchValue) ||
        description.includes(searchValue) ||
        phone.includes(searchValue);

      const numericPrice =
        hotel.price_per_night === null
          ? null
          : Number(hotel.price_per_night);

      const matchesMinPrice =
        minimumPrice === null ||
        (numericPrice !== null &&
          numericPrice >= minimumPrice);

      const matchesMaxPrice =
        maximumPrice === null ||
        (numericPrice !== null &&
          numericPrice <= maximumPrice);

      const matchesRooms =
        requestedRooms === null ||
        hotel.rooms === null ||
        Number(hotel.rooms) >= requestedRooms;

      return (
        matchesSearch &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesRooms
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price-low") {
        const priceA =
          a.price_per_night === null
            ? Number.POSITIVE_INFINITY
            : Number(a.price_per_night);

        const priceB =
          b.price_per_night === null
            ? Number.POSITIVE_INFINITY
            : Number(b.price_per_night);

        return priceA - priceB;
      }

      if (sortBy === "price-high") {
        const priceA =
          a.price_per_night === null
            ? Number.NEGATIVE_INFINITY
            : Number(a.price_per_night);

        const priceB =
          b.price_per_night === null
            ? Number.NEGATIVE_INFINITY
            : Number(b.price_per_night);

        return priceB - priceA;
      }

      if (sortBy === "rooms-high") {
        return (
          Number(b.rooms ?? 0) -
          Number(a.rooms ?? 0)
        );
      }

      if (sortBy === "name") {
        return String(a.name ?? "").localeCompare(
          String(b.name ?? ""),
          "ka"
        );
      }

      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : 0;

      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [
    hotels,
    search,
    minPrice,
    maxPrice,
    minimumRooms,
    sortBy,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    minPrice.trim() !== "" ||
    maxPrice.trim() !== "" ||
    minimumRooms.trim() !== "" ||
    sortBy !== "newest";

  function clearFilters() {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setMinimumRooms("");
    setSortBy("newest");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />

          <h1 className="mt-6 text-2xl font-black">
            სასტუმროები იტვირთება
          </h1>

          <p className="mt-2 text-white/55">
            გთხოვთ, მოიცადოთ...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-2xl shadow-lg">
              🏨
            </div>

            <div className="min-w-0">
              <h1 className="truncate font-extrabold">
                Georgia Gateway Hub
              </h1>

              <p className="text-xs text-white/50">
                სასტუმროები საქართველოში
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/add-hotel"
              className="hidden rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold transition hover:bg-emerald-600 sm:inline-flex"
            >
              + დამატება
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              ← მთავარი
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            Hotels
          </p>

          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            ყველა სასტუმრო
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-white/60">
            მოძებნე სასტუმრო სახელის, მდებარეობის,
            ოთახების რაოდენობისა და ერთი ღამის ფასის
            მიხედვით.
          </p>

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FilterField label="ძიება">
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="სასტუმრო, ადგილი, ტელეფონი..."
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </FilterField>

              <FilterField label="მინიმალური ფასი">
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(event) =>
                    setMinPrice(event.target.value)
                  }
                  placeholder="მაგალითად: 100"
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </FilterField>

              <FilterField label="მაქსიმალური ფასი">
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(event) =>
                    setMaxPrice(event.target.value)
                  }
                  placeholder="მაგალითად: 500"
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </FilterField>

              <FilterField label="მინიმალური ოთახები">
                <input
                  type="number"
                  min={1}
                  value={minimumRooms}
                  onChange={(event) =>
                    setMinimumRooms(event.target.value)
                  }
                  placeholder="მაგალითად: 2"
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </FilterField>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
              <FilterField label="დალაგება">
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as SortOption
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="newest">
                    ჯერ ახალი
                  </option>

                  <option value="price-low">
                    ფასი: დაბლიდან მაღლა
                  </option>

                  <option value="price-high">
                    ფასი: მაღლიდან დაბლა
                  </option>

                  <option value="rooms-high">
                    მეტი ოთახების მიხედვით
                  </option>

                  <option value="name">
                    სახელის მიხედვით
                  </option>
                </select>
              </FilterField>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  გასუფთავება
                </button>
              </div>
            </div>

            <p className="mt-5 border-t border-white/10 pt-5 text-sm text-white/60">
              ნაპოვნია{" "}
              <span className="font-black text-emerald-300">
                {filteredHotels.length}
              </span>{" "}
              სასტუმრო
            </p>
          </section>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {errorMessage && (
            <ErrorState
              message={errorMessage}
              onRetry={loadHotels}
            />
          )}

          {!errorMessage && hotels.length === 0 && (
            <EmptyState
              title="დამტკიცებული სასტუმროები ჯერ არ არის"
              description="ახალი სასტუმროები აქ გამოჩნდება ადმინისტრატორის მიერ დამტკიცების შემდეგ."
              showClearButton={false}
              onClear={clearFilters}
            />
          )}

          {!errorMessage &&
            hotels.length > 0 &&
            filteredHotels.length === 0 && (
              <EmptyState
                title="შესაბამისი სასტუმრო ვერ მოიძებნა"
                description="შეცვალე საძიებო სიტყვა ან გაასუფთავე ფილტრები."
                showClearButton
                onClear={clearFilters}
              />
            )}

          {!errorMessage &&
            filteredHotels.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredHotels.map((hotel) => (
                  <article
                    key={hotel.id}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/10"
                  >
                    <div className="relative h-56 overflow-hidden">
                      {hotel.image_url ? (
                        <img
                          src={hotel.image_url}
                          alt={
                            hotel.name ||
                            "სასტუმრო"
                          }
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900 text-7xl">
                          🏨
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-transparent" />

                      <span className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        ხელმისაწვდომია
                      </span>

                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-2xl font-extrabold text-white">
                          {hotel.name ||
                            "უსახელო სასტუმრო"}
                        </h3>

                        <p className="mt-2 text-sm text-white/80">
                          📍{" "}
                          {hotel.location ||
                            "საქართველო"}
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
                          value={
                            hotel.phone ||
                            "ნომერი არ არის"
                          }
                        />
                      </div>

                      {hotel.description && (
                        <p className="mt-4 line-clamp-3 leading-7 text-white/60">
                          {hotel.description}
                        </p>
                      )}

                      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-white/35">
                            ფასი ერთ ღამეზე
                          </p>

                          <p className="mt-1 text-2xl font-black text-emerald-300">
                            {hotel.price_per_night !==
                            null
                              ? `${Number(
                                  hotel.price_per_night
                                ).toLocaleString(
                                  "ka-GE"
                                )} ₾`
                              : "შეთანხმებით"}
                          </p>
                        </div>

                        <Link
                          href={`/book-hotel/${hotel.id}`}
                          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-white transition hover:bg-emerald-600"
                        >
                          ნახვა და დაჯავშნა
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

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/70">
        {label}
      </span>

      {children}
    </label>
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

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center text-red-100">
      <div className="text-6xl">⚠️</div>

      <h2 className="mt-4 text-2xl font-black">
        სასტუმროები ვერ ჩაიტვირთა
      </h2>

      <p className="mx-auto mt-3 max-w-2xl text-red-200/80">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-2xl bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-600"
      >
        ხელახლა ცდა
      </button>
    </div>
  );
}

function EmptyState({
  title,
  description,
  showClearButton,
  onClear,
}: {
  title: string;
  description: string;
  showClearButton: boolean;
  onClear: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl">
      <div className="text-7xl">🏨</div>

      <h2 className="mt-4 text-2xl font-black">
        {title}
      </h2>

      <p className="mt-3 text-white/55">
        {description}
      </p>

      {showClearButton ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 rounded-2xl bg-emerald-500 px-6 py-3 font-bold transition hover:bg-emerald-600"
        >
          ფილტრების გასუფთავება
        </button>
      ) : (
        <Link
          href="/dashboard/add-hotel"
          className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 font-bold transition hover:bg-emerald-600"
        >
          სასტუმროს დამატება
        </Link>
      )}
    </div>
  );
}