"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Tour = {
  id: number;
  title: string | null;
  description: string | null;
  location: string | null;
  price: number | null;
  image_url: string | null;
  duration: string | null;
  max_people: number | null;
  status: string | null;
};

export default function BookTourPage() {
  const params = useParams<{ id: string }>();
  const tourId = Number(params.id);

  const [tour, setTour] = useState<Tour | null>(null);
  const [loadingTour, setLoadingTour] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [people, setPeople] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadTour() {
      setLoadingTour(true);
      setErrorMessage("");

      if (!Number.isInteger(tourId) || tourId < 1) {
        setErrorMessage("ტურის ID არასწორია.");
        setLoadingTour(false);
        return;
      }

      const { data, error } = await supabase
        .from("tours")
        .select(
          `
            id,
            title,
            description,
            location,
            price,
            image_url,
            duration,
            max_people,
            status
          `
        )
        .eq("id", tourId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) {
        console.error("Tour loading error:", error);
        setErrorMessage(`ტურის ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
        setLoadingTour(false);
        return;
      }

      if (!data) {
        setErrorMessage("ტური ვერ მოიძებნა ან ჯერ არ არის დამტკიცებული.");
        setLoadingTour(false);
        return;
      }

      setTour(data as Tour);
      setLoadingTour(false);
    }

    loadTour();
  }, [tourId]);

  const totalPrice =
    tour?.price !== null && tour?.price !== undefined
      ? Number(tour.price) * people
      : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccess(false);

    if (!tour) {
      setErrorMessage("ტურის ინფორმაცია ვერ მოიძებნა.");
      return;
    }

    if (!guestName.trim()) {
      setErrorMessage("ჩაწერე სტუმრის სახელი და გვარი.");
      return;
    }

    if (!guestEmail.trim()) {
      setErrorMessage("ჩაწერე ელფოსტა.");
      return;
    }

    if (!guestPhone.trim()) {
      setErrorMessage("ჩაწერე ტელეფონის ნომერი.");
      return;
    }

    if (!bookingDate) {
      setErrorMessage("აირჩიე ტურის თარიღი.");
      return;
    }

    if (!Number.isInteger(people) || people < 1) {
      setErrorMessage("სტუმრების რაოდენობა უნდა იყოს მინიმუმ 1.");
      return;
    }

    if (tour.max_people && people > tour.max_people) {
      setErrorMessage(
        `ამ ტურზე მაქსიმალური რაოდენობაა ${tour.max_people} ადამიანი.`
      );
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User loading error:", userError);
    }

    const { error } = await supabase.from("bookings").insert({
      tour_id: tour.id,
      user_id: user?.id ?? null,
      guest_name: guestName.trim(),
      guest_email: guestEmail.trim(),
      guest_phone: guestPhone.trim(),
      booking_date: bookingDate,
      people,
      total_price: tour.price !== null ? totalPrice : null,
      notes: notes.trim() || null,
      status: "pending",
    });

    if (error) {
      console.error("Booking error:", error);
      setErrorMessage(`დაჯავშნა ვერ გაიგზავნა: ${error.message}`);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);

    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setBookingDate("");
    setPeople(1);
    setNotes("");
  }

  const today = new Date().toISOString().split("T")[0];

  if (loadingTour) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mb-4 text-5xl">⏳</div>
          <p className="text-lg">ტურის ინფორმაცია იტვირთება...</p>
        </div>
      </main>
    );
  }

  if (!tour) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mb-4 text-6xl">🏔️</div>

          <h1 className="text-2xl font-bold">ტური ვერ მოიძებნა</h1>

          <p className="mt-3 text-white/70">{errorMessage}</p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-white transition hover:bg-cyan-600"
          >
            მთავარ გვერდზე დაბრუნება
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          ← მთავარ გვერდზე დაბრუნება
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_460px]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
            {tour.image_url ? (
              <img
                src={tour.image_url}
                alt={tour.title || "Tour"}
                className="h-[300px] w-full object-cover sm:h-[430px]"
              />
            ) : (
              <div className="flex h-[300px] items-center justify-center bg-white/5 sm:h-[430px]">
                <span className="text-8xl">🏔️</span>
              </div>
            )}

            <div className="p-6 sm:p-8">
              <span className="inline-block rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-300">
                ხელმისაწვდომია
              </span>

              <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">
                {tour.title || "ტური"}
              </h1>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoBox
                  label="მდებარეობა"
                  value={tour.location || "არ არის მითითებული"}
                  icon="📍"
                />

                <InfoBox
                  label="ხანგრძლივობა"
                  value={tour.duration || "არ არის მითითებული"}
                  icon="⏱️"
                />

                <InfoBox
                  label="ფასი ერთ ადამიანზე"
                  value={
                    tour.price !== null
                      ? `${Number(tour.price).toLocaleString()} ₾`
                      : "ფასი შეთანხმებით"
                  }
                  icon="💰"
                />

                <InfoBox
                  label="მაქსიმალური რაოდენობა"
                  value={
                    tour.max_people
                      ? `${tour.max_people} ადამიანი`
                      : "არ არის მითითებული"
                  }
                  icon="👥"
                />
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold">ტურის აღწერა</h2>

                <p className="mt-4 whitespace-pre-line leading-8 text-white/70">
                  {tour.description || "ტურის აღწერა არ არის დამატებული."}
                </p>
              </div>
            </div>
          </section>

          <section className="h-fit rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-8 lg:sticky lg:top-6">
            <div className="mb-7">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">
                Booking
              </p>

              <h2 className="mt-2 text-3xl font-extrabold">
                ტურის დაჯავშნა
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                შეავსე მონაცემები. მოთხოვნა გაიგზავნება ადმინისტრატორთან
                დასადასტურებლად.
              </p>
            </div>

            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                <p className="font-bold">
                  ✅ მოთხოვნა წარმატებით გაიგზავნა
                </p>

                <p className="mt-2 text-sm">
                  ადმინისტრატორი დაგიკავშირდება მითითებულ ტელეფონზე ან
                  ელფოსტაზე.
                </p>
              </div>
            )}

            {errorMessage && !success && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField label="სახელი და გვარი">
                <input
                  type="text"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  placeholder="მაგალითად: Anna Brown"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label="ელფოსტა">
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(event) => setGuestEmail(event.target.value)}
                  placeholder="guest@example.com"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label="ტელეფონის ნომერი">
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(event) => setGuestPhone(event.target.value)}
                  placeholder="+995 5XX XX XX XX"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="ტურის თარიღი">
                  <input
                    type="date"
                    value={bookingDate}
                    min={today}
                    onChange={(event) => setBookingDate(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </FormField>

                <FormField label="სტუმრების რაოდენობა">
                  <input
                    type="number"
                    min={1}
                    max={tour.max_people || undefined}
                    value={people}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setPeople(Number.isNaN(value) ? 1 : Math.max(1, value));
                    }}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </FormField>
              </div>

              <FormField label="დამატებითი შეტყობინება">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="მაგალითად: გვჭირდება სასტუმროდან აყვანა..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <div className="rounded-2xl bg-slate-100 p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    ფასი ერთ ადამიანზე
                  </span>

                  <span className="font-bold">
                    {tour.price !== null
                      ? `${Number(tour.price).toLocaleString()} ₾`
                      : "შეთანხმებით"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    სტუმრების რაოდენობა
                  </span>

                  <span className="font-bold">{people}</span>
                </div>

                <div className="mt-4 border-t border-slate-300 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-bold">ჯამური ფასი</span>

                    <span className="text-2xl font-extrabold text-cyan-700">
                      {tour.price !== null
                        ? `${totalPrice.toLocaleString()} ₾`
                        : "შეთანხმებით"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "იგზავნება..."
                  : "დაჯავშნის მოთხოვნის გაგზავნა"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                მოთხოვნის გაგზავნით ჯავშანი ჯერ არ არის ავტომატურად
                დადასტურებული.
              </p>
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
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/40">
            {label}
          </p>

          <p className="mt-1 font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  );
}