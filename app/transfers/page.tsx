"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Transfer = {
  id: number | string;
  title: string | null;
  transfer_type: string | null;
  from_location: string | null;
  to_location: string | null;
  price: number | null;
  vehicle: string | null;
  seats: number | null;
  description: string | null;
  image_url: string | null;
  contact_phone: string | null;
  has_whatsapp: boolean | null;
  has_viber: boolean | null;
  status: string | null;
  created_at: string | null;
};

type SortOption = "newest" | "price-low" | "price-high" | "seats-high";

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minimumSeats, setMinimumSeats] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  async function loadTransfers() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("transfers")
        .select(`
          id,
          title,
          transfer_type,
          from_location,
          to_location,
          price,
          vehicle,
          seats,
          description,
          image_url,
          contact_phone,
          has_whatsapp,
          has_viber,
          status,
          created_at
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransfers((data as Transfer[] | null) ?? []);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "უცნობი შეცდომა დაფიქსირდა.";

      setTransfers([]);
      setErrorMessage(`ტრანსფერების ჩატვირთვა ვერ მოხერხდა. ${message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTransfers();
  }, []);

  const filteredTransfers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const minimumPrice = minPrice.trim() === "" ? null : Number(minPrice);
    const maximumPrice = maxPrice.trim() === "" ? null : Number(maxPrice);
    const requestedSeats =
      minimumSeats.trim() === "" ? null : Number(minimumSeats);

    const result = transfers.filter((transfer) => {
      const searchableText = [
        transfer.title,
        transfer.transfer_type,
        transfer.from_location,
        transfer.to_location,
        transfer.vehicle,
        transfer.description,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");

      const numericPrice =
        transfer.price === null ? null : Number(transfer.price);

      return (
        (searchValue === "" || searchableText.includes(searchValue)) &&
        (minimumPrice === null ||
          (numericPrice !== null && numericPrice >= minimumPrice)) &&
        (maximumPrice === null ||
          (numericPrice !== null && numericPrice <= maximumPrice)) &&
        (requestedSeats === null ||
          transfer.seats === null ||
          Number(transfer.seats) >= requestedSeats)
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price-low") {
        return (
          (a.price === null ? Infinity : Number(a.price)) -
          (b.price === null ? Infinity : Number(b.price))
        );
      }

      if (sortBy === "price-high") {
        return (
          (b.price === null ? -Infinity : Number(b.price)) -
          (a.price === null ? -Infinity : Number(a.price))
        );
      }

      if (sortBy === "seats-high") {
        return Number(b.seats ?? 0) - Number(a.seats ?? 0);
      }

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [transfers, search, minPrice, maxPrice, minimumSeats, sortBy]);

  function clearFilters() {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setMinimumSeats("");
    setSortBy("newest");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        ტრანსფერები იტვირთება...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-black">
            Georgia Gateway Hub
          </Link>

          <div className="flex gap-2">
            <Link
              href="/dashboard/add-transfer"
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold"
            >
              + დამატება
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold"
            >
              ← მთავარი
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            Transfers
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            ტრანსფერების ნახვა
          </h1>

          <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-white/10 p-5 md:grid-cols-2 xl:grid-cols-5">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="სახელი, ადგილი, ტიპი..."
              className="rounded-xl bg-white px-4 py-3 text-slate-900"
            />

            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="მინ. ფასი"
              className="rounded-xl bg-white px-4 py-3 text-slate-900"
            />

            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="მაქს. ფასი"
              className="rounded-xl bg-white px-4 py-3 text-slate-900"
            />

            <input
              type="number"
              min={1}
              value={minimumSeats}
              onChange={(event) => setMinimumSeats(event.target.value)}
              placeholder="ადგილები"
              className="rounded-xl bg-white px-4 py-3 text-slate-900"
            />

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as SortOption)
              }
              className="rounded-xl bg-white px-4 py-3 text-slate-900"
            >
              <option value="newest">ჯერ ახალი</option>
              <option value="price-low">ფასი ↑</option>
              <option value="price-high">ფასი ↓</option>
              <option value="seats-high">მეტი ადგილები</option>
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold"
          >
            ფილტრების გასუფთავება
          </button>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          {errorMessage && (
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6">
              {errorMessage}
            </div>
          )}

          {!errorMessage && filteredTransfers.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              შესაბამისი ტრანსფერი ვერ მოიძებნა.
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTransfers.map((transfer) => (
              <article
                key={transfer.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl"
              >
                <div className="relative h-56">
                  {transfer.image_url ? (
                    <img
                      src={transfer.image_url}
                      alt={transfer.title || "Transfer"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-900 text-7xl">
                      🚐
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                  {transfer.transfer_type && (
                    <span className="absolute right-4 top-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold text-cyan-200">
                      {transfer.transfer_type}
                    </span>
                  )}

                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-black">
                      {transfer.title ||
                        `${transfer.from_location || "საწყისი"} → ${
                          transfer.to_location || "დანიშნულება"
                        }`}
                    </h2>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-white/65">
                    📍 {transfer.from_location || "—"} →{" "}
                    {transfer.to_location || "—"}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-black/20 p-3">
                      🚘 {transfer.vehicle || "არ არის მითითებული"}
                    </div>
                    <div className="rounded-xl bg-black/20 p-3">
                      👥 {transfer.seats ? `${transfer.seats} ადგილი` : "—"}
                    </div>
                  </div>

                  {transfer.description && (
                    <p className="mt-4 line-clamp-3 text-white/55">
                      {transfer.description}
                    </p>
                  )}

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-white/40">ფასი</p>
                      <p className="text-2xl font-black text-cyan-300">
                        {transfer.price !== null
                          ? `${Number(transfer.price).toLocaleString(
                              "ka-GE"
                            )} ₾`
                          : "შეთანხმებით"}
                      </p>
                    </div>

                    <Link
                      href={`/book-transfer/${transfer.id}`}
                      className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold"
                    >
                      დაჯავშნა
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
