"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Tour = {
  id: number;
  title: string | null;
  max_people: number | null;
  user_id: string;
};

type Availability = {
  id: number;
  tour_id: number;
  available_date: string;
  total_spots: number;
  booked_spots: number;
  is_available: boolean;
  created_at: string;
};

export default function TourAvailabilityPage() {
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);

  const tourId = Number(params.id);

  const [tour, setTour] = useState<Tour | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);

  const [availableDate, setAvailableDate] = useState("");
  const [totalSpots, setTotalSpots] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadPage();
  }, [tourId]);

  async function loadPage() {
    setLoading(true);
    setError("");

    try {
      if (!Number.isInteger(tourId) || tourId <= 0) {
        throw new Error("ტურის ID არასწორია.");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "კალენდრის სამართავად საჭიროა ავტორიზაცია."
        );
      }

      const { data: tourData, error: tourError } = await supabase
        .from("tours")
        .select("id, title, max_people, user_id")
        .eq("id", tourId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (tourError) {
        throw tourError;
      }

      if (!tourData) {
        throw new Error(
          "ტური ვერ მოიძებნა ან მისი მართვის უფლება არ გაქვს."
        );
      }

      setTour(tourData as Tour);

      const { data: availabilityData, error: availabilityError } =
        await supabase
          .from("tour_availability")
          .select(
            "id, tour_id, available_date, total_spots, booked_spots, is_available, created_at"
          )
          .eq("tour_id", tourId)
          .order("available_date", {
            ascending: true,
          });

      if (availabilityError) {
        throw availabilityError;
      }

      setAvailability(
        (availabilityData ?? []) as Availability[]
      );
    } catch (caughtError) {
      console.error("Load availability error:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "მონაცემების ჩატვირთვა ვერ მოხერხდა."
      );
    } finally {
      setLoading(false);
    }
  }

  async function addAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!tour) {
      setError("ტური ვერ მოიძებნა.");
      return;
    }

    if (!availableDate) {
      setError("აირჩიე თარიღი.");
      return;
    }

    const spots = Number(totalSpots);

    if (!Number.isInteger(spots) || spots < 1) {
      setError("ადგილების რაოდენობა უნდა იყოს მინიმუმ 1.");
      return;
    }

    if (tour.max_people && spots > tour.max_people) {
      setError(
        `ამ ტურის მაქსიმალური რაოდენობაა ${tour.max_people} ადამიანი.`
      );
      return;
    }

    const selectedDate = new Date(
      `${availableDate}T00:00:00`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate < today
    ) {
      setError("წარსული თარიღის დამატება შეუძლებელია.");
      return;
    }

    setSaving(true);

    try {
      const { error: insertError } = await supabase
        .from("tour_availability")
        .insert({
          tour_id: tour.id,
          available_date: availableDate,
          total_spots: spots,
          booked_spots: 0,
          is_available: true,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error(
            "ეს თარიღი ამ ტურისთვის უკვე დამატებულია."
          );
        }

        throw insertError;
      }

      setAvailableDate("");
      setTotalSpots("");

      setSuccess("თარიღი წარმატებით დაემატა.");

      await loadAvailability();
    } catch (caughtError) {
      console.error("Add availability error:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "თარიღის დამატება ვერ მოხერხდა."
      );
    } finally {
      setSaving(false);
    }
  }

  async function loadAvailability() {
    const { data, error: loadError } = await supabase
      .from("tour_availability")
      .select(
        "id, tour_id, available_date, total_spots, booked_spots, is_available, created_at"
      )
      .eq("tour_id", tourId)
      .order("available_date", {
        ascending: true,
      });

    if (loadError) {
      throw loadError;
    }

    setAvailability((data ?? []) as Availability[]);
  }

  async function deleteAvailability(item: Availability) {
    const confirmed = window.confirm(
      `წავშალოთ ${formatDate(item.available_date)}?`
    );

    if (!confirmed) {
      return;
    }

    if (item.booked_spots > 0) {
      setError(
        "ამ თარიღზე უკვე არსებობს ჯავშანი და მისი წაშლა შეუძლებელია."
      );
      setSuccess("");
      return;
    }

    setDeletingId(item.id);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("tour_availability")
        .delete()
        .eq("id", item.id)
        .eq("tour_id", tourId);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess("თარიღი წარმატებით წაიშალა.");

      await loadAvailability();
    } catch (caughtError) {
      console.error("Delete availability error:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "თარიღის წაშლა ვერ მოხერხდა."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleAvailability(item: Availability) {
    setError("");
    setSuccess("");

    try {
      const newValue = !item.is_available;

      const { error: updateError } = await supabase
        .from("tour_availability")
        .update({
          is_available: newValue,
        })
        .eq("id", item.id)
        .eq("tour_id", tourId);

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        newValue
          ? "თარიღი კვლავ ხელმისაწვდომია."
          : "თარიღი დროებით დაიხურა."
      );

      await loadAvailability();
    } catch (caughtError) {
      console.error("Toggle availability error:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "სტატუსის შეცვლა ვერ მოხერხდა."
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            იტვირთება...
          </div>
        </div>
      </main>
    );
  }

  if (!tour) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dashboard/my-tours"
            className="text-cyan-300 hover:text-cyan-200"
          >
            ← ჩემი ტურები
          </Link>

          <div className="mt-6 rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">
            {error || "ტური ვერ მოიძებნა."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard/my-tours"
          className="inline-flex items-center text-sm font-bold text-cyan-300 transition hover:text-cyan-200"
        >
          ← ჩემი ტურები
        </Link>

        <section className="mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl">
          <div className="border-b border-white/10 p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
              Availability
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              📅 ხელმისაწვდომობის კალენდარი
            </h1>

            <p className="mt-3 text-lg text-white/70">
              {tour.title || `Tour #${tour.id}`}
            </p>

            {tour.max_people ? (
              <p className="mt-2 text-sm text-white/50">
                👥 ტურის მაქსიმალური რაოდენობა:{" "}
                <strong className="text-white">
                  {tour.max_people}
                </strong>
              </p>
            ) : null}
          </div>

          <form
            onSubmit={addAvailability}
            className="grid gap-5 p-6 sm:p-8 lg:grid-cols-[1fr_1fr_auto]"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-white/70">
                📅 თარიღი
              </span>

              <input
                type="date"
                value={availableDate}
                onChange={(event) =>
                  setAvailableDate(event.target.value)
                }
                required
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-white/70">
                👥 ადგილების რაოდენობა
              </span>

              <input
                type="number"
                min="1"
                max={tour.max_people ?? undefined}
                value={totalSpots}
                onChange={(event) =>
                  setTotalSpots(event.target.value)
                }
                placeholder={
                  tour.max_people
                    ? `მაქს. ${tour.max_people}`
                    : "მაგ. 10"
                }
                required
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
              >
                {saving ? "ემატება..." : "＋ დამატება"}
              </button>
            </div>
          </form>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">
            ⚠️ {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-100">
            ✅ {success}
          </div>
        ) : null}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">
              დამატებული თარიღები
            </h2>

            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/70">
              {availability.length} თარიღი
            </span>
          </div>

          {availability.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
              <div className="text-5xl">📅</div>

              <h3 className="mt-4 text-xl font-black">
                თარიღები ჯერ არ არის დამატებული
              </h3>

              <p className="mt-2 text-white/50">
                ზემოთ აირჩიე პირველი ხელმისაწვდომი თარიღი
                და ადგილების რაოდენობა.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availability.map((item) => {
                const remainingSpots = Math.max(
                  item.total_spots - item.booked_spots,
                  0
                );

                const soldOut = remainingSpots === 0;

                return (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-black">
                            {formatDate(item.available_date)}
                          </h3>

                          {soldOut ? (
                            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-black text-red-200">
                              SOLD OUT
                            </span>
                          ) : item.is_available ? (
                            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-200">
                              AVAILABLE
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-200">
                              CLOSED
                            </span>
                          )}
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3 text-center sm:max-w-lg">
                          <StatBox
                            label="სულ"
                            value={item.total_spots}
                          />

                          <StatBox
                            label="დაჯავშნილი"
                            value={item.booked_spots}
                          />

                          <StatBox
                            label="დარჩენილი"
                            value={remainingSpots}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        {!soldOut ? (
                          <button
                            type="button"
                            onClick={() =>
                              toggleAvailability(item)
                            }
                            className="rounded-2xl bg-amber-500 px-5 py-3 font-bold text-white transition hover:bg-amber-600"
                          >
                            {item.is_available
                              ? "⏸️ დახურვა"
                              : "▶️ გახსნა"}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() =>
                            deleteAvailability(item)
                          }
                          disabled={
                            deletingId === item.id ||
                            item.booked_spots > 0
                          }
                          className="rounded-2xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingId === item.id
                            ? "იშლება..."
                            : "🗑️ წაშლა"}
                        </button>
                      </div>
                    </div>

                    {item.booked_spots > 0 ? (
                      <p className="mt-4 text-xs text-white/40">
                        ამ თარიღზე უკვე არის ჯავშანი, ამიტომ
                        თარიღის წაშლა დაბლოკილია.
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-black/20 p-3">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
