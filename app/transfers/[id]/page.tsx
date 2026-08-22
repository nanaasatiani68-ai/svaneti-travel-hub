"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Transfer = {
  id: string;
  user_id: string | null;
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
  contact_phone: string | null;
  has_whatsapp: boolean | null;
  has_viber: boolean | null;
};

type Review = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
};

export default function TransferDetailsPage() {
  const params = useParams<{ id: string }>();
  const transferId = params?.id;
  const supabase = useMemo(() => createClient(), []);

  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingReview, setSavingReview] = useState(false);
  const [message, setMessage] = useState("");

  const loadReviews = useCallback(async () => {
    if (!transferId) return;

    const { data } = await supabase
      .from("transfer_reviews")
      .select("id,user_id,rating,comment,status,created_at")
      .eq("transfer_id", transferId)
      .order("created_at", { ascending: false });

    const rows = (data as Review[] | null) ?? [];
    setReviews(rows.filter((review) => review.status === "approved"));

    if (currentUserId) {
      const own = rows.find((review) => review.user_id === currentUserId) ?? null;
      setMyReview(own);
      if (own) {
        setRating(own.rating);
        setComment(own.comment || "");
      }
    }
  }, [supabase, transferId, currentUserId]);

  useEffect(() => {
    async function load() {
      if (!transferId) return;
      setLoading(true);

      const { data: transferData, error } = await supabase
        .from("transfers")
        .select(`
          id,user_id,title,transfer_type,from_location,to_location,price,price_type,
          vehicle,seats,description,image_url,contact_phone,has_whatsapp,has_viber
        `)
        .eq("id", transferId)
        .eq("status", "approved")
        .maybeSingle();

      if (error || !transferData) {
        setTransfer(null);
        setLoading(false);
        return;
      }

      setTransfer(transferData as Transfer);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (user) {
        setCurrentUserId(user.id);

        const { data: eligible } = await supabase
          .from("transfer_bookings")
          .select("id")
          .eq("transfer_id", transferId)
          .eq("status", "completed")
          .or(`user_id.eq.${user.id},guest_email.eq.${user.email || ""}`)
          .limit(1);

        setCanReview(Boolean(eligible?.length));
      }

      setLoading(false);
    }

    void load();
  }, [supabase, transferId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  async function saveReview(event: FormEvent) {
    event.preventDefault();
    if (!currentUserId || !transferId || !canReview) return;

    setSavingReview(true);
    setMessage("");

    const payload = {
      transfer_id: transferId,
      user_id: currentUserId,
      rating,
      comment: comment.trim() || null,
      status: "pending",
      updated_at: new Date().toISOString(),
      approved_at: null,
    };

    const result = myReview
      ? await supabase
          .from("transfer_reviews")
          .update(payload)
          .eq("id", myReview.id)
          .eq("user_id", currentUserId)
      : await supabase.from("transfer_reviews").insert(payload);

    if (result.error) {
      setMessage(`შეფასება ვერ შეინახა: ${result.error.message}`);
    } else {
      setMessage("✅ შეფასება შენახულია და გამოქვეყნდება დირექტორის დამტკიცების შემდეგ.");
      await loadReviews();
    }

    setSavingReview(false);
  }

  async function deleteReview() {
    if (!myReview || !currentUserId) return;
    if (!window.confirm("ნამდვილად გინდა შეფასების წაშლა?")) return;

    const { error } = await supabase
      .from("transfer_reviews")
      .delete()
      .eq("id", myReview.id)
      .eq("user_id", currentUserId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMyReview(null);
    setRating(5);
    setComment("");
    setMessage("✅ შეფასება წაიშალა.");
    await loadReviews();
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">იტვირთება...</main>;
  }

  if (!transfer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-black">ტრანსფერი ვერ მოიძებნა</h1>
          <Link href="/transfers" className="mt-5 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-bold">ყველა ტრანსფერი</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl justify-between px-4 py-5 sm:px-6">
          <Link href="/transfers" className="font-black">← Transfers</Link>
          <Link href={`/book-transfer/${transfer.id}`} className="rounded-xl bg-cyan-500 px-5 py-2 font-black">
            Book Transfer
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          {transfer.image_url ? (
            <img src={transfer.image_url} alt={transfer.title || "Transfer"} className="h-[320px] w-full object-cover sm:h-[520px]" />
          ) : (
            <div className="flex h-[320px] items-center justify-center text-9xl">🚐</div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                  {transfer.transfer_type || "Private transfer"}
                </p>
                <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                  {transfer.title || `${transfer.from_location || "From"} → ${transfer.to_location || "To"}`}
                </h1>
                <p className="mt-4 text-xl text-white/70">
                  📍 {transfer.from_location || "—"} → {transfer.to_location || "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-cyan-500/10 px-5 py-4">
                <p className="text-sm text-white/50">ფასი</p>
                <p className="text-2xl font-black text-cyan-300">{formatPrice(transfer)}</p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="ტიპი" value={transfer.transfer_type || "არ არის მითითებული"} />
              <Info label="მანქანა" value={transfer.vehicle || "არ არის მითითებული"} />
              <Info label="ადგილები" value={transfer.seats ? `${transfer.seats}` : "არ არის მითითებული"} />
              <Info label="შეფასება" value={reviews.length ? `⭐ ${average.toFixed(1)} (${reviews.length})` : "შეფასება ჯერ არ არის"} />
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-black">აღწერა</h2>
              <p className="mt-4 whitespace-pre-line leading-8 text-white/70">
                {transfer.description || "აღწერა ჯერ არ არის დამატებული."}
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-black">დაჯავშნის პირობები</h2>
              <div className="mt-4 space-y-3 text-white/70">
                <p>• დაჯავშნის მოთხოვნა საბოლოო დადასტურება არ არის.</p>
                <p>• მძღოლი ან ორგანიზატორი დაგიკავშირდება დეტალების დასადასტურებლად.</p>
                <p>• მგზავრების რაოდენობა არ უნდა აღემატებოდეს მითითებულ ადგილებს.</p>
                <p>• „From“ და „Negotiable“ ფასებზე საბოლოო თანხა შეთანხმებით დასტურდება.</p>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">შეფასებები</h2>
                  <p className="mt-1 text-sm text-white/50">
                    საშუალო: {reviews.length ? `${average.toFixed(1)} / 5` : "—"}
                  </p>
                </div>
                <div className="text-3xl">⭐</div>
              </div>

              {reviews.length === 0 ? (
                <p className="mt-5 text-white/50">დამტკიცებული შეფასებები ჯერ არ არის.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-2xl bg-black/20 p-5">
                      <p className="font-black">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                      {review.comment && <p className="mt-3 text-white/70">{review.comment}</p>}
                    </article>
                  ))}
                </div>
              )}

              {canReview && (
                <form onSubmit={saveReview} className="mt-7 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-5">
                  <h3 className="font-black">{myReview ? "შეფასების შეცვლა" : "დატოვე შეფასება"}</h3>
                  {myReview && (
                    <p className="mt-1 text-xs text-white/45">
                      მიმდინარე სტატუსი: {myReview.status}. ცვლილების შემდეგ ისევ pending გახდება.
                    </p>
                  )}

                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-slate-900"
                  >
                    <option value={5}>5 ★★★★★</option>
                    <option value={4}>4 ★★★★☆</option>
                    <option value={3}>3 ★★★☆☆</option>
                    <option value={2}>2 ★★☆☆☆</option>
                    <option value={1}>1 ★☆☆☆☆</option>
                  </select>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder="კომენტარი..."
                    className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-slate-900"
                  />

                  <div className="mt-3 flex flex-wrap gap-3">
                    <button disabled={savingReview} className="rounded-xl bg-cyan-500 px-5 py-3 font-black disabled:opacity-50">
                      {savingReview ? "ინახება..." : myReview ? "შეფასების განახლება" : "შეფასების გაგზავნა"}
                    </button>
                    {myReview && (
                      <button type="button" onClick={deleteReview} className="rounded-xl bg-red-500 px-5 py-3 font-black">
                        წაშლა
                      </button>
                    )}
                  </div>
                </form>
              )}

              {message && <p className="mt-4 rounded-xl bg-white/10 p-4 text-sm">{message}</p>}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-black">კონტაქტი</h2>

              <div className="mt-5 space-y-3">
                {transfer.contact_phone && (
                  <a href={`tel:${transfer.contact_phone}`} className="block rounded-xl bg-white/10 px-4 py-3 font-bold">
                    📞 {transfer.contact_phone}
                  </a>
                )}
                {transfer.has_whatsapp && transfer.contact_phone && (
                  <a
                    href={`https://wa.me/${digits(transfer.contact_phone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl bg-emerald-500 px-4 py-3 text-center font-black"
                  >
                    WhatsApp
                  </a>
                )}
                {transfer.has_viber && transfer.contact_phone && (
                  <a
                    href={`viber://chat?number=%2B${digits(transfer.contact_phone)}`}
                    className="block rounded-xl bg-violet-500 px-4 py-3 text-center font-black"
                  >
                    Viber
                  </a>
                )}
              </div>
            </section>

            <Link href={`/book-transfer/${transfer.id}`} className="block rounded-2xl bg-cyan-500 px-6 py-4 text-center text-lg font-black">
              Book Transfer
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-xs font-black uppercase text-white/40">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function formatPrice(transfer: Transfer) {
  if (transfer.price_type === "negotiable" || transfer.price == null) return "ფასი შეთანხმებით";
  const price = Number(transfer.price).toLocaleString("ka-GE");
  if (transfer.price_type === "from") return `${price} ₾-დან`;
  return `${price} ₾ მანქანაზე`;
}

function digits(phone: string) {
  return phone.replace(/\D/g, "");
}