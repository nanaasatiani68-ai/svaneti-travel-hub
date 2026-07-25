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

type Hotel = {
  id: number | string;
  user_id: string | null;
  name: string | null;
  location: string | null;
  price_per_night: number | null;
  description: string | null;
  image_url: string | null;
  rooms: number | null;
  phone: string | null;
  status: string | null;
  created_at: string | null;
};

export default function BookHotelPage() {
  const params = useParams<{ id: string }>();
  const hotelId = params?.id;

  const [hotel, setHotel] = useState<Hotel | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

  const [guests, setGuests] = useState(1);
  const [roomsCount, setRoomsCount] = useState(1);
  const [notes, setNotes] = useState("");

  const today = getLocalToday();

  async function loadHotel() {
    setLoading(true);
    setLoadError("");
    setHotel(null);

    try {
      if (!hotelId) {
        throw new Error("სასტუმროს ID არასწორია.");
      }

      const { data, error } = await supabase
        .from("hotels")
        .select(
          `
            id,
            user_id,
            name,
            location,
            price_per_night,
            description,
            image_url,
            rooms,
            phone,
            status,
            created_at
          `
        )
        .eq("id", hotelId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "სასტუმრო ვერ მოიძებნა ან ჯერ არ არის დამტკიცებული."
        );
      }

      setHotel(data as Hotel);
    } catch (error: unknown) {
      console.error("Hotel loading error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCurrentUser() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session loading error:", error);
        return;
      }

      const user = session?.user;

      if (!user) {
        return;
      }

      setGuestEmail(user.email ?? "");

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Profile loading error:",
          profileError
        );
        return;
      }

      if (profile?.full_name) {
        setGuestName(profile.full_name);
      } else if (user.user_metadata?.full_name) {
        setGuestName(
          String(user.user_metadata.full_name)
        );
      }

      if (profile?.phone) {
        setGuestPhone(profile.phone);
      }
    } catch (error) {
      console.error("User loading error:", error);
    }
  }

  useEffect(() => {
    void loadHotel();
  }, [hotelId]);

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) {
      return 0;
    }

    const checkIn = new Date(
      `${checkInDate}T00:00:00`
    );

    const checkOut = new Date(
      `${checkOutDate}T00:00:00`
    );

    const difference =
      checkOut.getTime() - checkIn.getTime();

    if (
      Number.isNaN(difference) ||
      difference <= 0
    ) {
      return 0;
    }

    return Math.round(
      difference / (1000 * 60 * 60 * 24)
    );
  }, [checkInDate, checkOutDate]);

  const totalPrice = useMemo(() => {
    if (
      hotel?.price_per_night === null ||
      hotel?.price_per_night === undefined ||
      nights < 1
    ) {
      return null;
    }

    return (
      Number(hotel.price_per_night) *
      nights *
      roomsCount
    );
  }, [
    hotel?.price_per_night,
    nights,
    roomsCount,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    if (!hotel) {
      setFormError(
        "სასტუმროს ინფორმაცია ვერ მოიძებნა."
      );
      return;
    }

    if (!guestName.trim()) {
      setFormError(
        "ჩაწერე სტუმრის სახელი და გვარი."
      );
      return;
    }

    if (!guestEmail.trim()) {
      setFormError("ჩაწერე ელფოსტა.");
      return;
    }

    if (!isValidEmail(guestEmail)) {
      setFormError(
        "ელფოსტის მისამართი არასწორია."
      );
      return;
    }

    if (!guestPhone.trim()) {
      setFormError(
        "ჩაწერე ტელეფონის ნომერი."
      );
      return;
    }

    if (!checkInDate) {
      setFormError(
        "აირჩიე სასტუმროში შესვლის თარიღი."
      );
      return;
    }

    if (!checkOutDate) {
      setFormError(
        "აირჩიე სასტუმროდან გასვლის თარიღი."
      );
      return;
    }

    if (checkInDate < today) {
      setFormError(
        "გასული თარიღის არჩევა შეუძლებელია."
      );
      return;
    }

    if (checkOutDate <= checkInDate) {
      setFormError(
        "გასვლის თარიღი შესვლის თარიღზე გვიანი უნდა იყოს."
      );
      return;
    }

    if (
      !Number.isInteger(guests) ||
      guests < 1
    ) {
      setFormError(
        "სტუმრების რაოდენობა უნდა იყოს მინიმუმ 1."
      );
      return;
    }

    if (
      !Number.isInteger(roomsCount) ||
      roomsCount < 1
    ) {
      setFormError(
        "ოთახების რაოდენობა უნდა იყოს მინიმუმ 1."
      );
      return;
    }

    if (
      hotel.rooms &&
      roomsCount > hotel.rooms
    ) {
      setFormError(
        `ამ სასტუმროში მითითებულია მაქსიმუმ ${hotel.rooms} ოთახი.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "Session loading error:",
          sessionError
        );
      }

      const { error } = await supabase
        .from("hotel_bookings")
        .insert({
          hotel_id: hotel.id,
          user_id: session?.user?.id ?? null,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
          guest_phone: guestPhone.trim(),
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          guests,
          rooms_count: roomsCount,
          nights,
          total_price: totalPrice,
          notes: notes.trim() || null,
          status: "pending",
        });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "დაჯავშნის მოთხოვნა წარმატებით გაიგზავნა. სასტუმროს წარმომადგენელი დაგიკავშირდება ტელეფონზე ან ელფოსტაზე."
      );

      setCheckInDate("");
      setCheckOutDate("");
      setGuests(1);
      setRoomsCount(1);
      setNotes("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error: unknown) {
      console.error(
        "Hotel booking error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setFormError(
        `დაჯავშნის მოთხოვნა ვერ გაიგზავნა: ${message}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />

          <h1 className="mt-6 text-2xl font-black">
            სასტუმრო იტვირთება
          </h1>

          <p className="mt-2 text-white/55">
            გთხოვთ, მოიცადოთ...
          </p>
        </div>
      </main>
    );
  }

  if (!hotel) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
          <div className="text-7xl">🏨</div>

          <h1 className="mt-5 text-2xl font-black">
            სასტუმრო ვერ მოიძებნა
          </h1>

          <p className="mt-3 leading-7 text-white/60">
            {loadError ||
              "სასტუმროს ინფორმაცია ვერ ჩაიტვირთა."}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadHotel}
              className="rounded-2xl bg-emerald-500 px-6 py-3 font-bold transition hover:bg-emerald-600"
            >
              ხელახლა ცდა
            </button>

            <Link
              href="/hotels"
              className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
            >
              ყველა სასტუმრო
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-2xl shadow-lg">
              🏨
            </div>

            <div className="min-w-0">
              <p className="truncate font-black">
                Georgia Gateway Hub
              </p>

              <p className="text-xs text-white/45">
                სასტუმროს დეტალები
              </p>
            </div>
          </Link>

          <Link
            href="/hotels"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20"
          >
            ← სასტუმროები
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {successMessage && (
          <div className="mb-8 rounded-3xl border border-emerald-400/30 bg-emerald-500/15 p-6 text-emerald-100 shadow-xl">
            <h2 className="text-xl font-black">
              ✅ მოთხოვნა წარმატებით გაიგზავნა
            </h2>

            <p className="mt-2 leading-7 text-emerald-100/75">
              {successMessage}
            </p>
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
              <div className="relative">
                {hotel.image_url ? (
                  <img
                    src={hotel.image_url}
                    alt={
                      hotel.name ||
                      "სასტუმრო"
                    }
                    className="h-[300px] w-full object-cover sm:h-[500px]"
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900 sm:h-[500px]">
                    <span className="text-9xl">
                      🏨
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <span className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-xs font-black shadow-lg">
                    ✓ ხელმისაწვდომია
                  </span>

                  <h1 className="mt-4 text-3xl font-black drop-shadow-xl sm:text-5xl">
                    {hotel.name ||
                      "უსახელო სასტუმრო"}
                  </h1>

                  <p className="mt-3 text-lg text-white/80">
                    📍{" "}
                    {hotel.location ||
                      "საქართველო"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoBox
                  icon="📍"
                  label="მდებარეობა"
                  value={
                    hotel.location ||
                    "არ არის მითითებული"
                  }
                />

                <InfoBox
                  icon="🛏️"
                  label="ოთახები"
                  value={
                    hotel.rooms
                      ? `${hotel.rooms} ოთახი`
                      : "არ არის მითითებული"
                  }
                />

                <InfoBox
                  icon="💰"
                  label="ფასი"
                  value={
                    hotel.price_per_night !==
                    null
                      ? `${Number(
                          hotel.price_per_night
                        ).toLocaleString(
                          "ka-GE"
                        )} ₾`
                      : "შეთანხმებით"
                  }
                />

                <InfoBox
                  icon="📞"
                  label="ტელეფონი"
                  value={
                    hotel.phone ||
                    "არ არის მითითებული"
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                Hotel description
              </p>

              <h2 className="mt-3 text-3xl font-black">
                სასტუმროს აღწერა
              </h2>

              <p className="mt-5 whitespace-pre-line leading-8 text-white/70">
                {hotel.description ||
                  "სასტუმროს სრული აღწერა ჯერ არ არის დამატებული."}
              </p>
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              <DetailCard
                icon="✅"
                title="დაჯავშნის ინფორმაცია"
                items={[
                  "მოთხოვნის გაგზავნა უფასოა",
                  "სასტუმრო დაგიკავშირდება დასადასტურებლად",
                  "ფასი ითვლება ოთახებისა და ღამეების მიხედვით",
                  "დაჯავშნა საბოლოოა მხოლოდ დადასტურების შემდეგ",
                ]}
              />

              <DetailCard
                icon="ℹ️"
                title="მნიშვნელოვანი პირობები"
                items={[
                  "შესვლისა და გასვლის დრო შეთანხმდება სასტუმროსთან",
                  "გაუქმების პირობები შეიძლება განსხვავდებოდეს",
                  "დამატებითი მომსახურება შეიძლება ფასიანი იყოს",
                  "ზუსტი პირობები გადაამოწმე სასტუმროსთან",
                ]}
              />
            </section>
          </div>

          <aside className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7 lg:sticky lg:top-24">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
              Booking
            </p>

            <h2 className="mt-2 text-3xl font-black">
              სასტუმროს დაჯავშნა
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              შეავსე მონაცემები და გააგზავნე
              დაჯავშნის მოთხოვნა.
            </p>

            {formError && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                ⚠️ {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <FormField label="სახელი და გვარი">
                <input
                  type="text"
                  value={guestName}
                  onChange={(event) =>
                    setGuestName(
                      event.target.value
                    )
                  }
                  placeholder="მაგალითად: Anna Brown"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </FormField>

              <FormField label="ელფოსტა">
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(event) =>
                    setGuestEmail(
                      event.target.value
                    )
                  }
                  placeholder="guest@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </FormField>

              <FormField label="ტელეფონის ნომერი">
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(event) =>
                    setGuestPhone(
                      event.target.value
                    )
                  }
                  placeholder="+995 5XX XX XX XX"
                  autoComplete="tel"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="შესვლის თარიღი">
                  <input
                    type="date"
                    value={checkInDate}
                    min={today}
                    onChange={(event) => {
                      const value =
                        event.target.value;

                      setCheckInDate(value);

                      if (
                        checkOutDate &&
                        checkOutDate <= value
                      ) {
                        setCheckOutDate("");
                      }
                    }}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </FormField>

                <FormField label="გასვლის თარიღი">
                  <input
                    type="date"
                    value={checkOutDate}
                    min={
                      checkInDate
                        ? getNextDate(
                            checkInDate
                          )
                        : today
                    }
                    onChange={(event) =>
                      setCheckOutDate(
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="სტუმრების რაოდენობა">
                  <input
                    type="number"
                    min={1}
                    value={guests}
                    onChange={(event) =>
                      setGuests(
                        normalizePositiveInteger(
                          event.target.value
                        )
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </FormField>

                <FormField label="ოთახების რაოდენობა">
                  <input
                    type="number"
                    min={1}
                    max={
                      hotel.rooms ||
                      undefined
                    }
                    value={roomsCount}
                    onChange={(event) =>
                      setRoomsCount(
                        normalizePositiveInteger(
                          event.target.value
                        )
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </FormField>
              </div>

              <FormField label="დამატებითი შეტყობინება">
                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="მაგალითად: გვჭირდება დამატებითი საწოლი..."
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />

                <span className="mt-2 block text-right text-xs text-slate-400">
                  {notes.length} / 1000
                </span>
              </FormField>

              <div className="rounded-2xl bg-slate-100 p-5">
                <PriceRow
                  label="ფასი ერთ ღამეზე"
                  value={
                    hotel.price_per_night !==
                    null
                      ? `${Number(
                          hotel.price_per_night
                        ).toLocaleString(
                          "ka-GE"
                        )} ₾`
                      : "შეთანხმებით"
                  }
                />

                <PriceRow
                  label="ღამეების რაოდენობა"
                  value={
                    nights > 0
                      ? String(nights)
                      : "—"
                  }
                />

                <PriceRow
                  label="ოთახების რაოდენობა"
                  value={String(roomsCount)}
                />

                <div className="mt-4 border-t border-slate-300 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-black">
                      ჯამური ფასი
                    </span>

                    <span className="text-2xl font-black text-emerald-700">
                      {totalPrice !== null
                        ? `${totalPrice.toLocaleString(
                            "ka-GE"
                          )} ₾`
                        : "შეთანხმებით"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "მოთხოვნა იგზავნება..."
                  : "დაჯავშნის მოთხოვნის გაგზავნა"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                მოთხოვნის გაგზავნა ავტომატურად
                დადასტურებულ ჯავშანს არ ნიშნავს.
              </p>
            </form>
          </aside>
        </div>
      </div>
    </main>
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

function InfoBox({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">
          {icon}
        </span>

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
}: {
  icon: string;
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <div className="text-4xl">{icon}</div>

      <h2 className="mt-4 text-2xl font-black">
        {title}
      </h2>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 text-white/70"
          >
            <span className="mt-1 text-emerald-300">
              •
            </span>

            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
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
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-right font-bold">
        {value}
      </span>
    </div>
  );
}

function getLocalToday() {
  const now = new Date();
  const timezoneOffset =
    now.getTimezoneOffset() * 60_000;

  return new Date(
    now.getTime() - timezoneOffset
  )
    .toISOString()
    .split("T")[0];
}

function getNextDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  date.setDate(date.getDate() + 1);

  const timezoneOffset =
    date.getTimezoneOffset() * 60_000;

  return new Date(
    date.getTime() - timezoneOffset
  )
    .toISOString()
    .split("T")[0];
}

function normalizePositiveInteger(
  value: string
) {
  const number = Number(value);

  if (
    Number.isNaN(number) ||
    number < 1
  ) {
    return 1;
  }

  return Math.floor(number);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}