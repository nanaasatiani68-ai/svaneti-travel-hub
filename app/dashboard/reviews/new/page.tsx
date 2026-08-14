"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Booking = {
  id: string;
  tour_id: number | string | null;
  user_id: string | null;
  status: string | null;
  completed_at: string | null;
};

type Tour = {
  id: number | string;
  title: string | null;
};

export default function NewReviewPage() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking") || "";

  const [userId, setUserId] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [tourTitle, setTourTitle] = useState("ტური");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMessage("");

      try {
        if (!bookingId) {
          throw new Error("ჯავშნის ID ვერ მოიძებნა.");
        }

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
        }

        let user = sessionData.session?.user ?? null;

        if (!user) {
          const {
            data: refreshData,
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error("Refresh error:", refreshError);
          }

          user = refreshData.user ?? null;
        }

        if (!user) {
          window.location.replace(
            `/login?next=${encodeURIComponent(
              `/dashboard/reviews/new?booking=${bookingId}`
            )}`
          );
          return;
        }

        if (!mounted) return;
        setUserId(user.id);

        const {
          data: bookingData,
          error: bookingError,
        } = await supabase
          .from("bookings")
          .select("id, tour_id, user_id, status, completed_at")
          .eq("id", bookingId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (bookingError) {
          throw bookingError;
        }

        if (!bookingData) {
          throw new Error("ეს ჯავშანი შენს ანგარიშზე ვერ მოიძებნა.");
        }

        const typedBooking = bookingData as Booking;

        if (
          typedBooking.status !== "completed" ||
          !typedBooking.completed_at
        ) {
          throw new Error(
            "შეფასების დატოვება შესაძლებელია მხოლოდ შესრულებული ტურის შემდეგ."
          );
        }

        if (!mounted) return;
        setBooking(typedBooking);

        if (typedBooking.tour_id !== null) {
          const { data: tourData } = await supabase
            .from("tours")
            .select("id, title")
            .eq("id", typedBooking.tour_id)
            .maybeSingle();

          const tour = tourData as Tour | null;

          if (mounted && tour?.title) {
            setTourTitle(tour.title);
          }
        }

        const {
          data: existingReview,
          error: existingReviewError,
        } = await supabase
          .from("tour_reviews")
          .select("id")
          .eq("booking_id", bookingId)
          .maybeSingle();

        if (existingReviewError) {
          throw existingReviewError;
        }

        if (mounted && existingReview) {
          setAlreadyReviewed(true);
        }
      } catch (error) {
        console.error("Review page loading error:", error);

        if (mounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "შეფასების გვერდი ვერ ჩაიტვირთა."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [bookingId, supabase]);

  async function submitReview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      saving ||
      !booking ||
      !userId ||
      booking.tour_id === null
    ) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("tour_reviews")
        .insert({
          booking_id: booking.id,
          tour_id: booking.tour_id,
          user_id: userId,
          rating,
          comment: comment.trim() || null,
        });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "შეფასება წარმატებით დაემატა. მადლობა!"
      );
      setAlreadyReviewed(true);
    } catch (error) {
      console.error("Review insert error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "შეფასების შენახვა ვერ მოხერხდა."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="font-bold text-slate-600">
          ⭐ შეფასების გვერდი იტვირთება...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/bookings"
        className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white"
      >
        ← ჯავშნებზე დაბრუნება
      </Link>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-500">
          Tour Review
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          ⭐ შეაფასე ტური
        </h1>

        <p className="mt-3 text-lg font-bold text-slate-700">
          {tourTitle}
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
            ✅ {successMessage}
          </div>
        )}

        {alreadyReviewed ? (
          <div className="mt-7 rounded-2xl bg-amber-50 p-6 text-center">
            <div className="text-5xl">⭐</div>
            <h2 className="mt-3 text-xl font-black text-slate-900">
              ამ ჯავშანზე შეფასება უკვე დატოვებულია
            </h2>
          </div>
        ) : booking && !errorMessage ? (
          <form
            onSubmit={submitReview}
            className="mt-7 space-y-6"
          >
            <div>
              <p className="font-black text-slate-900">
                შეფასება
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`rounded-2xl px-4 py-3 text-2xl transition ${
                      value <= rating
                        ? "bg-amber-100"
                        : "bg-slate-100 opacity-40"
                    }`}
                    aria-label={`${value} ვარსკვლავი`}
                  >
                    ⭐
                  </button>
                ))}
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {rating} / 5
              </p>
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="font-black text-slate-900"
              >
                კომენტარი
              </label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                rows={6}
                maxLength={1500}
                placeholder="როგორი იყო ტური? რას ურჩევდი სხვა მოგზაურებს?"
                className="mt-3 w-full resize-none rounded-2xl border border-slate-200 px-4 py-4 text-slate-900 outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-amber-500 px-6 py-4 font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "ინახება..."
                : "⭐ შეფასების გამოქვეყნება"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}