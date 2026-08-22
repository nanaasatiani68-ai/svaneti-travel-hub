"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Transfer = {
  id: string;
  title: string | null;
  from_location: string | null;
  to_location: string | null;
  price: number | null;
  price_type: "fixed" | "negotiable" | "from" | null;
  vehicle: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string | null;
};

export default function MyTransfersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.replace(`/login?next=${encodeURIComponent("/dashboard/my-transfers")}`);
        return;
      }

      const { data, error } = await supabase
        .from("transfers")
        .select("id,title,from_location,to_location,price,price_type,vehicle,image_url,status,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) setMessage(error.message);
      setTransfers((data as Transfer[] | null) ?? []);
      setLoading(false);
    }

    void load();
  }, [supabase]);

  if (loading) {
    return <main className="p-8">ტრანსფერები იტვირთება...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">My Transfers</p>
            <h1 className="mt-2 text-4xl font-black">ჩემი ტრანსფერები</h1>
          </div>
          <Link href="/dashboard/add-transfer" className="rounded-xl bg-cyan-500 px-5 py-3 text-center font-black">
            + ტრანსფერის დამატება
          </Link>
        </div>

        {message && <div className="mt-6 rounded-xl bg-red-500/10 p-4 text-red-200">{message}</div>}

        <div className="mt-8 space-y-5">
          {transfers.map((transfer) => (
            <article key={transfer.id} className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/5 md:grid-cols-[240px_1fr]">
              <div className="min-h-[180px] bg-black/20">
                {transfer.image_url ? (
                  <img src={transfer.image_url} alt={transfer.title || "Transfer"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full min-h-[180px] items-center justify-center text-6xl">🚐</div>
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <h2 className="text-2xl font-black">
                      {transfer.title || `${transfer.from_location || "From"} → ${transfer.to_location || "To"}`}
                    </h2>
                    <p className="mt-2 text-white/60">
                      {transfer.from_location || "—"} → {transfer.to_location || "—"}
                    </p>
                    <p className="mt-2 text-cyan-300 font-black">{formatPrice(transfer)}</p>
                    {transfer.vehicle && <p className="mt-2 text-white/60">🚘 {transfer.vehicle}</p>}
                  </div>
                  <Status status={transfer.status || "pending"} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/dashboard/my-transfers/${transfer.id}/edit`} className="rounded-xl bg-amber-500 px-5 py-3 font-black text-slate-950">
                    ✏️ Edit
                  </Link>
                  {transfer.status === "approved" && (
                    <Link href={`/transfers/${transfer.id}`} className="rounded-xl bg-white/10 px-5 py-3 font-black">
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}

          {transfers.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
              ტრანსფერები ჯერ არ დაგიმატებია.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Status({ status }: { status: string }) {
  const value = status.toLowerCase();
  const cls =
    value === "approved"
      ? "bg-emerald-500/20 text-emerald-300"
      : value === "rejected"
        ? "bg-red-500/20 text-red-300"
        : "bg-amber-500/20 text-amber-300";

  return <span className={`h-fit w-fit rounded-full px-4 py-2 text-sm font-black ${cls}`}>{value}</span>;
}

function formatPrice(transfer: Transfer) {
  if (transfer.price_type === "negotiable" || transfer.price == null) return "ფასი შეთანხმებით";
  const price = Number(transfer.price).toLocaleString("ka-GE");
  if (transfer.price_type === "from") return `${price} ₾-დან`;
  return `${price} ₾ მანქანაზე`;
}