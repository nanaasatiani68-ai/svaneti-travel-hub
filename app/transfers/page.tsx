"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Transfer = {
  id: string;
  title: string | null;
  transfer_type: string | null;
  from_location: string | null;
  to_location: string | null;
  price: number | null;
  price_type: "fixed" | "negotiable" | "from" | null;
  vehicle: string | null;
  seats: number | null;
  description: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string | null;
};

type Review = {
  transfer_id: string;
  rating: number;
};

type SortOption = "newest" | "rating" | "price-low" | "price-high";

export default function TransfersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMessage("");

      const [transferResult, reviewResult] = await Promise.all([
        supabase
          .from("transfers")
          .select(`
            id,title,transfer_type,from_location,to_location,price,price_type,
            vehicle,seats,description,image_url,status,created_at
          `)
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
        supabase
          .from("transfer_reviews")
          .select("transfer_id,rating")
          .eq("status", "approved"),
      ]);

      if (transferResult.error) {
        setErrorMessage(transferResult.error.message);
        setLoading(false);
        return;
      }

      const loadedTransfers = (transferResult.data as Transfer[] | null) ?? [];
      setTransfers(loadedTransfers);

      const map: Record<string, { total: number; count: number }> = {};
      ((reviewResult.data as Review[] | null) ?? []).forEach((review) => {
        const key = String(review.transfer_id);
        if (!map[key]) map[key] = { total: 0, count: 0 };
        map[key].total += Number(review.rating);
        map[key].count += 1;
      });

      const prepared: Record<string, { average: number; count: number }> = {};
      Object.entries(map).forEach(([key, value]) => {
        prepared[key] = {
          average: value.count ? value.total / value.count : 0,
          count: value.count,
        };
      });

      setRatings(prepared);
      setLoading(false);
    }

    void load();
  }, [supabase]);

  const visibleTransfers = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = transfers.filter((transfer) => {
      if (!q) return true;
      return [
        transfer.title,
        transfer.transfer_type,
        transfer.from_location,
        transfer.to_location,
        transfer.vehicle,
        transfer.description,
      ].some((value) => String(value ?? "").toLowerCase().includes(q));
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "rating") {
        return (ratings[b.id]?.average ?? 0) - (ratings[a.id]?.average ?? 0);
      }

      if (sortBy === "price-low") {
        return sortablePrice(a) - sortablePrice(b);
      }

      if (sortBy === "price-high") {
        return sortablePrice(b) - sortablePrice(a);
      }

      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });
  }, [transfers, ratings, search, sortBy]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-xl font-black">🚐 ტრანსფერები იტვირთება...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="font-black">← Georgia Gateway Hub</Link>
          <Link href="/dashboard/add-transfer" className="rounded-xl bg-cyan-500 px-4 py-2 font-bold">
            + Add Transfer
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Transfers</p>
        <h1 className="mt-2 text-4xl font-black">ტრანსფერები საქართველოში</h1>

        <div className="mt-7 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_240px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="მოძებნე მარშრუტი, მანქანა ან ტიპი..."
            className="rounded-xl bg-white px-4 py-3 text-slate-900 outline-none"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl bg-white px-4 py-3 text-slate-900 outline-none"
          >
            <option value="newest">ჯერ ახალი</option>
            <option value="rating">საუკეთესო შეფასება</option>
            <option value="price-low">ფასი: დაბლიდან მაღლა</option>
            <option value="price-high">ფასი: მაღლიდან დაბლა</option>
          </select>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">
            {errorMessage}
          </div>
        ) : visibleTransfers.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            ტრანსფერები ვერ მოიძებნა.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTransfers.map((transfer) => {
              const rating = ratings[transfer.id];

              return (
                <article key={transfer.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
                  <div className="h-52 bg-slate-900">
                    {transfer.image_url ? (
                      <img src={transfer.image_url} alt={transfer.title || "Transfer"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-7xl">🚐</div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black">
                          {transfer.title || `${transfer.from_location || "From"} → ${transfer.to_location || "To"}`}
                        </h2>
                        <p className="mt-1 text-sm text-white/50">
                          {transfer.transfer_type || "Private transfer"}
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm font-black text-amber-300">
                        ⭐ {rating ? rating.average.toFixed(1) : "—"}
                      </span>
                    </div>

                    <p className="mt-4 text-white/70">
                      📍 {transfer.from_location || "—"} → {transfer.to_location || "—"}
                    </p>
                    <p className="mt-2 text-white/70">🚘 {transfer.vehicle || "მანქანა არ არის მითითებული"}</p>
                    <p className="mt-2 text-white/70">👥 {transfer.seats ? `${transfer.seats} ადგილი` : "ადგილები უცნობია"}</p>

                    <p className="mt-5 text-2xl font-black text-cyan-300">
                      {formatPrice(transfer)}
                    </p>

                    {rating && (
                      <p className="mt-1 text-xs text-white/40">
                        {rating.count} შეფასება
                      </p>
                    )}

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <Link
                        href={`/transfers/${transfer.id}`}
                        className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center font-black hover:bg-white/20"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/book-transfer/${transfer.id}`}
                        className="rounded-2xl bg-cyan-500 px-4 py-3 text-center font-black hover:bg-cyan-600"
                      >
                        Book Transfer
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function sortablePrice(transfer: Transfer) {
  if (transfer.price_type === "negotiable" || transfer.price == null) {
    return Number.POSITIVE_INFINITY;
  }
  return Number(transfer.price);
}

function formatPrice(transfer: Transfer) {
  if (transfer.price_type === "negotiable" || transfer.price == null) {
    return "ფასი შეთანხმებით";
  }
  const price = Number(transfer.price).toLocaleString("ka-GE");
  if (transfer.price_type === "from") return `${price} ₾-დან`;
  return `${price} ₾ მანქანაზე`;
}