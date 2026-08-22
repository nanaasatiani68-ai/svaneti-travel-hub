"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Review = {
  id: string;
  transfer_id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  transfer_title?: string;
};

export default function TransferReviewsAdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      window.location.replace(`/login?next=${encodeURIComponent("/admin-v2/transfer-reviews")}`);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = String(profile?.role || "").toLowerCase();
    if (role !== "director" && role !== "admin") {
      window.location.replace("/dashboard");
      return;
    }

    const { data, error } = await supabase
      .from("transfer_reviews")
      .select("id,transfer_id,rating,comment,status,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const rows = (data as Review[] | null) ?? [];
    const ids = Array.from(new Set(rows.map((row) => row.transfer_id)));
    const names = new Map<string, string>();

    if (ids.length) {
      const { data: transfers } = await supabase.from("transfers").select("id,title,from_location,to_location").in("id", ids);
      ((transfers as any[] | null) ?? []).forEach((transfer) => {
        names.set(
          String(transfer.id),
          transfer.title || `${transfer.from_location || "From"} → ${transfer.to_location || "To"}`
        );
      });
    }

    setReviews(rows.map((row) => ({ ...row, transfer_title: names.get(row.transfer_id) || "უცნობი ტრანსფერი" })));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: "approved" | "rejected" | "pending") {
    setUpdatingId(id);
    const { data, error } = await supabase
      .from("transfer_reviews")
      .update({
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select("id,status,approved_at")
      .maybeSingle();

    if (error || !data) {
      setMessage(error?.message || "სტატუსი ვერ შეიცვალა.");
    } else {
      setReviews((current) => current.map((review) => review.id === id ? { ...review, status: data.status } : review));
      setMessage("✅ შეფასების სტატუსი განახლდა.");
    }

    setUpdatingId(null);
  }

  const visible = reviews.filter((review) => filter === "all" || review.status === filter);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-2xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-black">⭐ Transfer Reviews</h1>
            <p className="mt-2 text-white/60">ტრანსფერის შეფასებების დამტკიცება</p>
          </div>
          <Link href="/admin-v2/transfers" className="rounded-xl bg-white/10 px-4 py-3 font-bold">← Transfers</Link>
        </div>

        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="mt-6 rounded-xl bg-white px-4 py-3 text-slate-900">
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="all">ყველა</option>
        </select>

        {message && <div className="mt-5 rounded-xl bg-white/10 p-4">{message}</div>}

        {loading ? (
          <p className="mt-8">იტვირთება...</p>
        ) : (
          <div className="mt-8 space-y-4">
            {visible.map((review) => (
              <article key={review.id} className="rounded-2xl border border-white/10 bg-black/15 p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <h2 className="font-black">{review.transfer_title}</h2>
                    <p className="mt-2 text-amber-300">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                    {review.comment && <p className="mt-3 text-white/70">{review.comment}</p>}
                  </div>
                  <span className="h-fit rounded-full bg-white/10 px-4 py-2 text-sm font-black">{review.status}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => void setStatus(review.id, "approved")} disabled={updatingId === review.id} className="rounded-xl bg-emerald-500 px-4 py-2 font-black disabled:opacity-40">
                    Approve
                  </button>
                  <button onClick={() => void setStatus(review.id, "rejected")} disabled={updatingId === review.id} className="rounded-xl bg-red-500 px-4 py-2 font-black disabled:opacity-40">
                    Reject
                  </button>
                  <button onClick={() => void setStatus(review.id, "pending")} disabled={updatingId === review.id} className="rounded-xl bg-white/10 px-4 py-2 font-black disabled:opacity-40">
                    Pending
                  </button>
                </div>
              </article>
            ))}

            {visible.length === 0 && <div className="rounded-2xl bg-white/5 p-8 text-center">შეფასებები არ არის.</div>}
          </div>
        )}
      </div>
    </main>
  );
}