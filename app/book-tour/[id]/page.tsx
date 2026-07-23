"use client";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Tour = {
  id: number | string;
  user_id: string | null;
  title: string | null;
  description: string | null;
  location: string | null;
  price: number | null;
  image_url: string | null;
  duration: string | null;
  max_people: number | null;
  category: string | null;
  status: string | null;
  created_at: string | null;
};

type OwnerProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
};

export default function BookTourPage() {
  const params = useParams<{ id: string }>();
  const tourId = params?.id;

  const [tour, setTour] = useState<Tour | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [ownerTours, setOwnerTours] = useState<Tour[]>([]);

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

      if (!tourId) {
        setErrorMessage("ტურის ID არასწორია.");
        setLoadingTour(false);
        return;
      }

      const { data, error } = await supabase
        .from("tours")
        .select(
          `
            id,
            user_id,
            title,
            description,
            location,
            price,
            image_url,
            duration,
            max_people,
            category,
            status,
            created_at
          `
        )
        .eq("id", tourId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) {
        console.error("Tour loading error:", error);

        setErrorMessage(
          `ტურის ჩატვირთვა ვერ მოხერხდა: ${error.message}`
        );

        setLoadingTour(false);
        return;
      }

      if (!data) {
        setErrorMessage(
          "ტური ვერ მოიძებნა ან ჯერ არ არის დამტკიცებული."
        );

        setLoadingTour(false);
        return;
      }

      const loadedTour = data as Tour;

      setTour(loadedTour);

      if (loadedTour.user_id) {
        const { data: ownerData, error: ownerError } =
          await supabase
            .from("profiles")
            .select(
              `
                id,
                full_name,
                avatar_url,
                phone,
                country,
                city,
                bio
              `
            )
            .eq("id", loadedTour.user_id)
            .maybeSingle();

        if (ownerError) {
          console.error("Owner loading error:", ownerError);
        } else {
          setOwner(ownerData as OwnerProfile | null);
        }

        const { data: ownerToursData, error: ownerToursError } =
          await supabase
            .from("tours")
            .select(
              `
                id,
                user_id,
                title,
                description,
                location,
                price,
                image_url,
                duration,
                max_people,
                category,
                status,
                created_at
              `
            )
            .eq("user_id", loadedTour.user_id)
            .eq("status", "approved")
            .neq("id", loadedTour.id)
            .order("created_at", { ascending: false })
            .limit(3);

        if (ownerToursError) {
          console.error(
            "Owner tours loading error:",
            ownerToursError
          );
        } else {
          setOwnerTours(
            (ownerToursData as Tour[] | null) ?? []
          );
        }
      }

      setLoadingTour(false);
    }

    loadTour();
  }, [tourId]);

  useEffect(() => {
    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      setGuestEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setGuestName(profile.full_name);
      } else if (user.user_metadata?.full_name) {
        setGuestName(user.user_metadata.full_name);
      }

      if (profile?.phone) {
        setGuestPhone(profile.phone);
      }
    }

    loadCurrentUser();
  }, []);

  const totalPrice = useMemo(() => {
    if (tour?.price === null || tour?.price === undefined) {
      return null;
    }

    return Number(tour.price) * people;
  }, [tour?.price, people]);

  const today = getLocalToday();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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

    if (bookingDate < today) {
      setErrorMessage("გასული თარიღის არჩევა შეუძლებელია.");
      return;
    }

    if (!Number.isInteger(people) || people < 1) {
      setErrorMessage(
        "სტუმრების რაოდენობა უნდა იყოს მინიმუმ 1."
      );
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
      total_price: totalPrice,
      notes: notes.trim() || null,
      status: "pending",
    });

    if (error) {
      console.error("Booking error:", error);

      setErrorMessage(
        `დაჯავშნის მოთხოვნა ვერ გაიგზავნა: ${error.message}`
      );

      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    setBookingDate("");
    setPeople(1);
    setNotes("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (loadingTour) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">⏳</div>

          <p className="mt-4 text-lg font-semibold">
            ტურის ინფორმაცია იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  if (!tour) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl">
          <div className="text-7xl">🏔️</div>

          <h1 className="mt-5 text-2xl font-black">
            ტური ვერ მოიძებნა
          </h1>

          <p className="mt-3 leading-7 text-white/65">
            {errorMessage}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/tours"
              className="rounded-2xl bg-cyan-500 px-6 py-3 font-bold transition hover:bg-cyan-600"
            >
              ყველა ტური
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
            >
              მთავარი გვერდი
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 font-black"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-2xl shadow-lg">
              🏔️
            </div>

            <div>
              <p>Georgia Travel Hub</p>

              <p className="text-xs font-medium text-white/45">
                ტურის დეტალები
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/tours"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20"
            >
              ← ყველა ტური
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold transition hover:bg-cyan-600"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {success && (
          <div className="mb-8 rounded-3xl border border-emerald-400/30 bg-emerald-500/15 p-6 text-emerald-100 shadow-xl">
            <p className="text-xl font-black">
              ✅ დაჯავშნის მოთხოვნა წარმატებით გაიგზავნა
            </p>

            <p className="mt-2 leading-7 text-emerald-100/75">
              მოთხოვნა მიღებულია. ტურის ორგანიზატორი დაგიკავშირდება
              ტელეფონზე ან ელფოსტაზე.
            </p>
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
              <div className="relative">
                {tour.image_url ? (
                  <img
                    src={tour.image_url}
                    alt={tour.title || "Tour"}
                    className="h-[300px] w-full object-cover sm:h-[480px]"
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center bg-gradient-to-br from-cyan-950 to-slate-900 sm:h-[480px]">
                    <span className="text-9xl">🏔️</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-black shadow-lg">
                      ✓ ხელმისაწვდომია
                    </span>

                    {tour.category && (
                      <span className="rounded-full border border-white/20 bg-slate-950/60 px-4 py-2 text-xs font-bold backdrop-blur-md">
                        {tour.category}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-4 text-3xl font-black drop-shadow-xl sm:text-5xl">
                    {tour.title || "უსახელო ტური"}
                  </h1>

                  <p className="mt-3 text-lg text-white/80">
                    📍 {tour.location || "საქართველო"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                  label="ფასი"
                  value={
                    tour.price !== null
                      ? `${Number(tour.price).toLocaleString()} ₾`
                      : "შეთანხმებით"
                  }
                  icon="💰"
                />

                <InfoBox
                  label="მაქსიმუმ"
                  value={
                    tour.max_people
                      ? `${tour.max_people} ადამიანი`
                      : "არ არის მითითებული"
                  }
                  icon="👥"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                Tour description
              </p>

              <h2 className="mt-3 text-3xl font-black">
                ტურის აღწერა
              </h2>

              <p className="mt-5 whitespace-pre-line leading-8 text-white/70">
                {tour.description ||
                  "ტურის სრული აღწერა ჯერ არ არის დამატებული."}
              </p>
            </section>

            <OwnerCard owner={owner} />

            <section className="grid gap-5 md:grid-cols-2">
              <DetailCard
                icon="✅"
                title="რა შეიძლება შედიოდეს ფასში"
                items={[
                  "პროფესიონალი გიდის მომსახურება",
                  "მარშრუტის დაგეგმვა",
                  "ტურის ორგანიზება",
                  "ტურის დროს მხარდაჭერა",
                ]}
                note="ზუსტი მომსახურებები გადაამოწმე ორგანიზატორთან."
              />

              <DetailCard
                icon="❌"
                title="რა შეიძლება არ შედიოდეს ფასში"
                items={[
                  "კვება და სასმელი",
                  "სასტუმროში განთავსება",
                  "პირადი ხარჯები",
                  "დამატებითი აქტივობები",
                ]}
                note="პირობები შეიძლება განსხვავდებოდეს კონკრეტული ტურის მიხედვით."
              />
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                Important information
              </p>

              <h2 className="mt-3 text-3xl font-black">
                მნიშვნელოვანი ინფორმაცია
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NoticeCard
                  icon="📅"
                  title="წინასწარი დაჯავშნა"
                  text="ტურის მოთხოვნა სასურველია წინასწარ გააგზავნო."
                />

                <NoticeCard
                  icon="🌦️"
                  title="ამინდი"
                  text="მარშრუტი შეიძლება შეიცვალოს ამინდის პირობების მიხედვით."
                />

                <NoticeCard
                  icon="🥾"
                  title="ტანსაცმელი"
                  text="თან იქონიე კომფორტული ფეხსაცმელი და შესაბამისი ტანსაცმელი."
                />

                <NoticeCard
                  icon="📞"
                  title="დადასტურება"
                  text="დაჯავშნა საბოლოოდ დადასტურდება ორგანიზატორთან დაკავშირების შემდეგ."
                />
              </div>
            </section>

            {ownerTours.length > 0 && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                  More tours
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  ორგანიზატორის სხვა ტურები
                </h2>

                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {ownerTours.map((ownerTour) => (
                    <Link
                      key={ownerTour.id}
                      href={`/book-tour/${ownerTour.id}`}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-black/20 transition hover:-translate-y-1 hover:bg-white/10"
                    >
                      <div className="h-48 overflow-hidden">
                        {ownerTour.image_url ? (
                          <img
                            src={ownerTour.image_url}
                            alt={ownerTour.title || "Tour"}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-slate-900 text-6xl">
                            🏔️
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="text-xl font-black">
                          {ownerTour.title || "უსახელო ტური"}
                        </h3>

                        <p className="mt-2 text-sm text-white/60">
                          📍 {ownerTour.location || "საქართველო"}
                        </p>

                        <p className="mt-4 text-xl font-black text-cyan-300">
                          {ownerTour.price !== null
                            ? `${Number(
                                ownerTour.price
                              ).toLocaleString()} ₾`
                            : "შეთანხმებით"}
                        </p>

                        <div className="mt-4 text-sm font-bold text-cyan-300">
                          ტურის ნახვა →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7 lg:sticky lg:top-24">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
                Booking
              </p>

              <h2 className="mt-2 text-3xl font-black">
                ტურის დაჯავშნა
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                შეავსე მონაცემები და გააგზავნე მოთხოვნა.
              </p>
            </div>

            {errorMessage && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <FormField label="სახელი და გვარი">
                <input
                  type="text"
                  value={guestName}
                  onChange={(event) =>
                    setGuestName(event.target.value)
                  }
                  placeholder="მაგალითად: Anna Brown"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label="ელფოსტა">
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(event) =>
                    setGuestEmail(event.target.value)
                  }
                  placeholder="guest@example.com"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label="ტელეფონის ნომერი">
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(event) =>
                    setGuestPhone(event.target.value)
                  }
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
                    onChange={(event) =>
                      setBookingDate(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </FormField>

                <FormField label="ადამიანების რაოდენობა">
                  <input
                    type="number"
                    min={1}
                    max={tour.max_people || undefined}
                    value={people}
                    onChange={(event) => {
                      const value = Number(event.target.value);

                      setPeople(
                        Number.isNaN(value)
                          ? 1
                          : Math.max(1, Math.floor(value))
                      );
                    }}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </FormField>
              </div>

              <FormField label="დამატებითი შეტყობინება">
                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="მაგალითად: გვჭირდება სასტუმროდან აყვანა..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <div className="rounded-2xl bg-slate-100 p-5">
                <PriceRow
                  label="ფასი ერთ ადამიანზე"
                  value={
                    tour.price !== null
                      ? `${Number(tour.price).toLocaleString()} ₾`
                      : "შეთანხმებით"
                  }
                />

                <PriceRow
                  label="ადამიანების რაოდენობა"
                  value={String(people)}
                />

                <div className="mt-4 border-t border-slate-300 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-black">
                      ჯამური ფასი
                    </span>

                    <span className="text-2xl font-black text-cyan-700">
                      {totalPrice !== null
                        ? `${totalPrice.toLocaleString()} ₾`
                        : "შეთანხმებით"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "მოთხოვნა იგზავნება..."
                  : "დაჯავშნის მოთხოვნის გაგზავნა"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                მოთხოვნის გაგზავნა ავტომატურად დადასტურებულ
                ჯავშანს არ ნიშნავს.
              </p>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}

function OwnerCard({
  owner,
}: {
  owner: OwnerProfile | null;
}) {
  if (!owner) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
        <h2 className="text-2xl font-black">
          👤 ტურის ორგანიზატორი
        </h2>

        <p className="mt-3 text-white/60">
          ორგანიზატორის ინფორმაცია ჯერ არ არის დამატებული.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-white/5 p-6 shadow-xl sm:p-8">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
        Tour organizer
      </p>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
        {owner.avatar_url ? (
          <img
            src={owner.avatar_url}
            alt={owner.full_name || "Organizer"}
            className="h-28 w-28 shrink-0 rounded-3xl border-4 border-white/15 object-cover shadow-xl"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-cyan-500 text-5xl shadow-xl">
            👤
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-black">
            {owner.full_name || "ტურის ორგანიზატორი"}
          </h2>

          {(owner.city || owner.country) && (
            <p className="mt-2 text-white/65">
              📍 {[owner.city, owner.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}

          {owner.bio && (
            <p className="mt-4 whitespace-pre-line leading-7 text-white/65">
              {owner.bio}
            </p>
          )}

          {owner.phone && (
            <a
              href={`tel:${owner.phone}`}
              className="mt-5 inline-flex rounded-2xl bg-cyan-500 px-5 py-3 font-bold text-white transition hover:bg-cyan-600"
            >
              📞 {owner.phone}
            </a>
          )}
        </div>
      </div>
    </section>
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

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-white/40">
            {label}
          </p>

          <p className="mt-1 break-words font-bold text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  icon,
  title,
  items,
  note,
}: {
  icon: string;
  title: string;
  items: string[];
  note: string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <div className="text-4xl">{icon}</div>

      <h2 className="mt-4 text-2xl font-black">{title}</h2>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 text-white/70"
          >
            <span className="mt-1 text-cyan-300">•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/40">
        {note}
      </p>
    </section>
  );
}

function NoticeCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-3 font-black">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/55">
        {text}
      </p>
    </div>
  );
}

function PriceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right font-bold">{value}</span>
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

function getLocalToday() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
}