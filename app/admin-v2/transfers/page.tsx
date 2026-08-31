"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Transfer = {
  id: string;
  title: string | null;
  from_location: string | null;
  to_location: string | null;
  transfer_type: string | null;
  vehicle: string | null;
  seats: number | null;
  price: number | null;
  price_type: "fixed" | "negotiable" | "from" | null;
  status: string;
  image_url: string | null;
  contact_phone: string | null;
  has_whatsapp: boolean | null;
  has_viber: boolean | null;
  created_at: string | null;
};

export default function TransfersManagementPage() {
  const supabase = useMemo(() => createClient(), []);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("transfers")
      .select(`
        id,title,from_location,to_location,transfer_type,vehicle,seats,price,price_type,
        status,image_url,contact_phone,has_whatsapp,has_viber,created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setTransfers([]);
    } else {
      setTransfers((data as Transfer[] | null) ?? []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadTransfers();
  }, [loadTransfers]);

  async function updateStatus(id: string, status: "approved" | "rejected" | "pending") {
    setUpdatingId(id);
    const { data, error } = await supabase
      .from("transfers")
      .update({ status })
      .eq("id", id)
      .select("id,status")
      .maybeSingle();

    if (error || !data) {
      setMessage(error?.message || "სტატუსი ვერ შეიცვალა.");
    } else {
      setTransfers((current) => current.map((item) => item.id === id ? { ...item, status: data.status } : item));
      setMessage("✅ სტატუსი განახლდა.");
    }
    setUpdatingId(null);
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-2xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">🚐 Transfers Management</h1>
            <p className="mt-2 text-white/60">ტრანსფერები, რედაქტირება, ჯავშნები და შეფასებები</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/add-transfer" className="rounded-xl bg-cyan-500 px-4 py-3 font-black">+ Add Transfer</Link>
            <Link href="/admin-v2/transfer-bookings" className="rounded-xl bg-violet-500 px-4 py-3 font-black">📅 Bookings</Link>
            <Link href="/admin-v2/transfer-reviews" className="rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950">⭐ Reviews</Link>
            <button onClick={() => void loadTransfers()} className="rounded-xl bg-white/10 px-4 py-3 font-black">Refresh</button>
          </div>
        </div>

        {message && <div className="mt-5 rounded-xl bg-white/10 p-4">{message}</div>}

        {loading ? (
          <p className="mt-8">იტვირთება...</p>
        ) : (
          <div className="mt-8 space-y-5">
            {transfers.map((transfer) => (
              <article key={transfer.id} className="grid overflow-hidden rounded-3xl border border-white/10 bg-black/15 lg:grid-cols-[260px_1fr]">
                <div className="min-h-[200px]">
                  {transfer.image_url ? (
                    <img src={transfer.image_url} alt={transfer.title || "Transfer"} className="h-[230px] w-full object-cover sm:h-[280px] lg:h-full" />
                  ) : (
                    <div className="flex h-full min-h-[200px] items-center justify-center text-7xl">🚐</div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <h2 className="text-2xl font-black">
                        {transfer.title || `${transfer.from_location || "From"} → ${transfer.to_location || "To"}`}
                      </h2>
                      <p className="mt-2 text-white/60">📍 {transfer.from_location || "—"} → {transfer.to_location || "—"}</p>
                      <p className="mt-2 text-white/60">🏷️ {transfer.transfer_type || "Private"}</p>
                      <p className="mt-2 text-white/60">🚘 {transfer.vehicle || "—"} · 👥 {transfer.seats || "—"}</p>
                      <p className="mt-3 text-xl font-black text-cyan-300">{formatPrice(transfer)}</p>
                    </div>
                    <span className="h-fit rounded-full bg-white/10 px-4 py-2 text-sm font-black">{transfer.status}</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href={`/dashboard/my-transfers/${transfer.id}/edit`} className="rounded-xl bg-amber-500 px-4 py-2 font-black text-slate-950">✏️ Edit</Link>
                    <Link href={`/transfers/${transfer.id}`} className="rounded-xl bg-white/10 px-4 py-2 font-black">View Details</Link>
                    <button onClick={() => void updateStatus(transfer.id, "approved")} disabled={updatingId === transfer.id || transfer.status === "approved"} className="rounded-xl bg-emerald-500 px-4 py-2 font-black disabled:opacity-35">Approve</button>
                    <button onClick={() => void updateStatus(transfer.id, "rejected")} disabled={updatingId === transfer.id || transfer.status === "rejected"} className="rounded-xl bg-red-500 px-4 py-2 font-black disabled:opacity-35">Reject</button>
                    <button onClick={() => void updateStatus(transfer.id, "pending")} disabled={updatingId === transfer.id || transfer.status === "pending"} className="rounded-xl bg-white/10 px-4 py-2 font-black disabled:opacity-35">Pending</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function formatPrice(transfer: Transfer) {
  if (transfer.price_type === "negotiable" || transfer.price == null) return "ფასი შეთანხმებით";
  const price = Number(transfer.price).toLocaleString("ka-GE");
  if (transfer.price_type === "from") return `${price} ₾-დან`;
  return `${price} ₾ მანქანაზე`;
}