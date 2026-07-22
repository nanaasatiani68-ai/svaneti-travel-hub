"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Guide = {
  id: string;
  full_name: string;
  location: string | null;
  languages: string | null;
  experience_years: number | null;
  price_per_day: number | null;
  phone: string | null;
  description: string | null;
  image_url: string | null;
};

type Review = {
  id: string;
  guest_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function GuideDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const guideId = params.id;

  const [guide, setGuide] = useState<Guide | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      const { data: guideData, error: guideError } = await supabase
        .from("guides")
        .select(
          `
            id,
            full_name,
            location,
            languages,
            experience_years,
            price_per_day,
            phone,
            description,
            image_url
          `
        )
        .eq("id", guideId)
        .eq("status", "approved")
        .maybeSingle();

      if (guideError) {
        setErrorMessage(
          `გიდის ჩატვირთვა ვერ მოხერხდა: ${guideError.message}`
        );
        setLoading(false);
        return;
      }

      if (!guideData) {
        setErrorMessage("გიდი ვერ მოიძებნა ან ჯერ არ არის დამტკიცებული.");
        setLoading(false);
        return;
      }

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("guide_reviews")
        .select("id, guest_name, rating, comment, created_at")
        .eq("guide_id", guideId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Reviews loading error:", reviewsError);
      }

      setGuide(guideData as Guide);
      setReviews((reviewsData as Review[]) ?? []);
      setLoading(false);
    }

    loadPage();
  }, [guideId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!guestName.trim()) {
      setErrorMessage("ჩაწერე შენი სახელი.");
      return;
    }

    if (!comment.trim()) {
      setErrorMessage("ჩაწერე შეფასების ტექსტი.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "შეფასების დასაწერად ჯერ უნდა შეხვიდე ანგარიშში."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1500);

      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("guide_reviews").insert({
      guide_id: guideId,
      user_id: user.id,
      guest_name: guestName.trim(),
      rating,
      comment: comment.trim(),
      status: "pending",
    });

    if (error) {
      console.error("Review insert error:", error);
      setErrorMessage(
        `შეფასების გაგზავნა ვერ მოხერხდა: ${error.message}`
      );
      setSubmitting(false);
      return;
    }

    setSuccessMessage(
      "შეფასება წარმატებით გაიგზავნა. გამოჩნდება ადმინისტრატორის დამტკიცების შემდეგ."
    );

    setGuestName("");
    setRating(5);
    setComment("");
    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="text-6xl">⏳</div>
          <p className="mt-4">გიდის ინფორმაცია იტვირთება...</p>
        </div>
      </main>
    );
  }

  if (!guide) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-6xl">🧑‍💼</div>

          <h1 className="mt-4 text-2xl font-bold">
            გიდი ვერ მოიძებნა
          </h1>

          <p className="mt-3 text-white/60">{errorMessage}</p>

          <Link
            href="/guides"
            className="mt-6 inline-flex rounded-2xl bg-cyan-500 px-6 py-3 font-bold"
          >
            გიდებზე დაბრუნება
          </Link>
        </div>
      </main>
    );
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length
      : 0;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/guides"
          className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold"
        >
          ← გიდებზე დაბრუნება
        </Link>

        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_430px]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
            {guide.image_url ? (
              <img
                src={guide.image_url}
                alt={guide.full_name}
                className="h-[360px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[360px] items-center justify-center text-9xl">
                🧑‍💼
              </div>
            )}

            <div className="p-7">
              <h1 className="text-4xl font-black">
                {guide.full_name}
              </h1>

              <p className="mt-4 text-lg text-white/60">
                📍 {guide.location || "საქართველო"}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <InfoBox
                  label="ენები"
                  value={guide.languages || "არ არის მითითებული"}
                />

                <InfoBox
                  label="გამოცდილება"
                  value={
                    guide.experience_years
                      ? `${guide.experience_years} წელი`
                      : "არ არის მითითებული"
                  }
                />

                <InfoBox
                  label="ფასი"
                  value={
                    guide.price_per_day !== null
                      ? `${guide.price_per_day} ₾`
                      : "შეთანხმებით"
                  }
                />
              </div>

              {guide.description && (
                <p className="mt-7 whitespace-pre-line leading-8 text-white/65">
                  {guide.description}
                </p>
              )}

              <div className="mt-8 border-t border-white/10 pt-7">
                <h2 className="text-2xl font-bold">
                  შეფასებები
                </h2>

                <p className="mt-2 text-amber-300">
                  ⭐ {averageRating.toFixed(1)} — {reviews.length} შეფასება
                </p>

                {reviews.length === 0 ? (
                  <p className="mt-6 text-white/50">
                    ჯერ დამტკიცებული შეფასება არ არის.
                  </p>
                ) : (
                  <div className="mt-6 space-y-4">
                    {reviews.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-bold">
                            {review.guest_name}
                          </h3>

                          <span className="text-amber-300">
                            {"⭐".repeat(review.rating)}
                          </span>
                        </div>

                        <p className="mt-3 leading-7 text-white/65">
                          {review.comment}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="h-fit rounded-3xl bg-white p-7 text-slate-900 shadow-2xl lg:sticky lg:top-6">
            <h2 className="text-3xl font-black">
              შეფასების დაწერა
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              შეფასება გამოჩნდება ადმინისტრატორის დამტკიცების შემდეგ.
            </p>

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                ✅ {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  შენი სახელი
                </span>

                <input
                  type="text"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                />
              </label>

              <div>
                <p className="mb-2 text-sm font-bold">
                  ვარსკვლავების რაოდენობა
                </p>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`text-3xl transition ${
                        value <= rating
                          ? "opacity-100"
                          : "opacity-30"
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  კომენტარი
                </span>

                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={5}
                  required
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50"
              >
                {submitting
                  ? "იგზავნება..."
                  : "შეფასების გაგზავნა"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-xs font-bold uppercase text-white/40">
        {label}
      </p>

      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}