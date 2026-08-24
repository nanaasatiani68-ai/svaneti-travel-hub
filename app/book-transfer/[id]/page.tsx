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
import { useLanguage } from "@/app/providers/LanguageProvider";
import { localizedValue } from "@/app/lib/i18n/localizedValue";

type Transfer = {
  id: string | number;
  user_id: string | null;
  from_location: string | null;
  from_location_ka: string | null;
  from_location_en: string | null;
  to_location: string | null;
  to_location_ka: string | null;
  to_location_en: string | null;
  price: number | null;
  price_type: "fixed" | "negotiable" | "from" | null;
  vehicle: string | null;
  seats: number | null;
  description: string | null;
  description_ka: string | null;
  description_en: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string | null;
};

export default function BookTransferPage() {
  const { language } = useLanguage();
  const c = transferBookingCopy[language];
  const params = useParams<{ id: string }>();
  const transferId = params?.id;

  const [transfer, setTransfer] =
    useState<Transfer | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] =
    useState("");
  const [guestPhone, setGuestPhone] =
    useState("");

  const [travelDate, setTravelDate] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [isReturnTransfer, setIsReturnTransfer] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [childSeat, setChildSeat] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [pickupAddress, setPickupAddress] =
    useState("");
  const [dropoffAddress, setDropoffAddress] =
    useState("");
  const [notes, setNotes] = useState("");

  const today = getLocalToday();

  async function loadTransfer() {
    setLoading(true);
    setLoadError("");
    setTransfer(null);

    try {
      if (!transferId) {
        throw new Error(
          c.invalidTransferId
        );
      }

      const { data, error } = await supabase
        .from("transfers")
        .select(
          `
            id,
            user_id,
            from_location,
            from_location_ka,
            from_location_en,
            to_location,
            to_location_ka,
            to_location_en,
            price,
            price_type,
            vehicle,
            seats,
            description,
            description_ka,
            description_en,
            image_url,
            status,
            created_at
          `
        )
        .eq("id", transferId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          c.transferNotFound
        );
      }

      const loadedTransfer = data as Transfer;

      setTransfer(loadedTransfer);

      const fromValue = localizedValue(
        language,
        loadedTransfer.from_location_ka,
        loadedTransfer.from_location_en,
        loadedTransfer.from_location
      );

      const toValue = localizedValue(
        language,
        loadedTransfer.to_location_ka,
        loadedTransfer.to_location_en,
        loadedTransfer.to_location
      );

      if (fromValue) {
        setPickupAddress(fromValue);
      }

      if (toValue) {
        setDropoffAddress(toValue);
      }
    } catch (error: unknown) {
      console.error(
        "Transfer loading error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : c.unknownError;

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
        console.error(
          "Session loading error:",
          error
        );
        return;
      }

      const user = session?.user;

      if (!user) {
        return;
      }

      setGuestEmail(user.email ?? "");

      const {
        data: profile,
        error: profileError,
      } = await supabase
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
      } else if (
        user.user_metadata?.full_name
      ) {
        setGuestName(
          String(user.user_metadata.full_name)
        );
      }

      if (profile?.phone) {
        setGuestPhone(profile.phone);
      }
    } catch (error) {
      console.error(
        "User loading error:",
        error
      );
    }
  }

  useEffect(() => {
    void loadTransfer();
  }, [transferId, language]);

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  const totalPrice = useMemo(() => {
    if (!transfer) {
      return null;
    }

    const priceType =
      transfer.price_type || "fixed";

    if (
      priceType !== "fixed" ||
      transfer.price === null ||
      transfer.price === undefined
    ) {
      return null;
    }

    const basePrice = Number(transfer.price);

    return isReturnTransfer ? basePrice * 2 : basePrice;
  }, [transfer, isReturnTransfer]);

  const localizedFrom = transfer
    ? localizedValue(
        language,
        transfer.from_location_ka,
        transfer.from_location_en,
        transfer.from_location
      )
    : "";

  const localizedTo = transfer
    ? localizedValue(
        language,
        transfer.to_location_ka,
        transfer.to_location_en,
        transfer.to_location
      )
    : "";

  const localizedDescription = transfer
    ? localizedValue(
        language,
        transfer.description_ka,
        transfer.description_en,
        transfer.description
      )
    : "";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    if (!transfer) {
      setFormError(
        c.transferInfoMissing
      );
      return;
    }

    if (!guestName.trim()) {
      setFormError(
        c.nameRequired
      );
      return;
    }

    if (!guestEmail.trim()) {
      setFormError(c.emailRequired);
      return;
    }

    if (!isValidEmail(guestEmail)) {
      setFormError(
        c.emailInvalid
      );
      return;
    }

    if (!guestPhone.trim()) {
      setFormError(
        c.phoneRequired
      );
      return;
    }

    if (!travelDate) {
      setFormError(
        c.dateRequired
      );
      return;
    }

    if (travelDate < today) {
      setFormError(
        c.pastDate
      );
      return;
    }

    if (!travelTime) {
      setFormError(
        c.timeRequired
      );
      return;
    }

    if (isReturnTransfer) {
      if (!returnDate) {
        setFormError(c.returnDateRequired);
        return;
      }

      if (!returnTime) {
        setFormError(c.returnTimeRequired);
        return;
      }

      if (returnDate < travelDate) {
        setFormError(c.returnBeforeDeparture);
        return;
      }

      if (
        returnDate === travelDate &&
        returnTime <= travelTime
      ) {
        setFormError(c.returnTimeBeforeDeparture);
        return;
      }
    }

    if (
      !Number.isInteger(passengers) ||
      passengers < 1
    ) {
      setFormError(
        c.passengersMin
      );
      return;
    }

    if (
      transfer.seats &&
      passengers > transfer.seats
    ) {
      setFormError(
        `ამ ტრანსფერზე მაქსიმალური რაოდენობაა ${transfer.seats} მგზავრი.`
      );
      return;
    }

    if (!pickupAddress.trim()) {
      setFormError(
        c.pickupRequired
      );
      return;
    }

    if (!dropoffAddress.trim()) {
      setFormError(
        c.dropoffRequired
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
        .from("transfer_bookings")
        .insert({
          transfer_id: transfer.id,
          user_id: session?.user?.id ?? null,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
          guest_phone: guestPhone.trim(),
          travel_date: travelDate,
          travel_time: travelTime,
          passengers,
          pickup_address:
            pickupAddress.trim(),
          dropoff_address:
            dropoffAddress.trim(),
          total_price: totalPrice,
          price_type:
            transfer.price_type || "fixed",
          listed_price:
            transfer.price === null ||
            transfer.price === undefined
              ? null
              : Number(transfer.price),
          is_return_transfer: isReturnTransfer,
          return_date:
            isReturnTransfer && returnDate && returnTime
              ? new Date(
                  `${returnDate}T${returnTime}:00`
                ).toISOString()
              : null,
          flight_number: flightNumber.trim() || null,
          child_seat: childSeat,
          notes: notes.trim() || null,
          status: "pending",
        });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        c.successMessage
      );

      setTravelDate("");
      setTravelTime("");
      setIsReturnTransfer(false);
      setReturnDate("");
      setReturnTime("");
      setFlightNumber("");
      setChildSeat(false);
      setPassengers(1);
      setNotes("");

      if (localizedFrom) {
        setPickupAddress(localizedFrom);
      }

      if (localizedTo) {
        setDropoffAddress(localizedTo);
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error: unknown) {
      console.error(
        "Transfer booking error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : c.unknownError;

      setFormError(
        `ტრანსფერის მოთხოვნა ვერ გაიგზავნა: ${message}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />

          <h1 className="mt-6 text-2xl font-black">
            {language === "ka" ? "ტრანსფერი იტვირთება" : "Loading transfer"}
          </h1>

          <p className="mt-2 text-white/55">
            {language === "ka" ? "გთხოვთ, მოიცადოთ..." : "Please wait..."}
          </p>
        </div>
      </main>
    );
  }

  if (!transfer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
          <div className="text-7xl">🚐</div>

          <h1 className="mt-5 text-2xl font-black">
            {language === "ka" ? "ტრანსფერი ვერ მოიძებნა" : "Transfer not found"}
          </h1>

          <p className="mt-3 leading-7 text-white/60">
            {loadError ||
              c.transferLoadFailed}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadTransfer}
              className="rounded-2xl bg-cyan-500 px-6 py-3 font-bold transition hover:bg-cyan-600"
            >
              {language === "ka" ? "ხელახლა ცდა" : "Try again"}
            </button>

            <Link
              href="/transfers"
              className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
            >
              {language === "ka" ? "ყველა ტრანსფერი" : "All transfers"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500 text-2xl shadow-lg">
              🚐
            </div>

            <div className="min-w-0">
              <p className="truncate font-black">
                Georgia Gateway Hub
              </p>

              <p className="text-xs text-white/45">
                {language === "ka" ? "ტრანსფერის დეტალები" : "Transfer details"}
              </p>
            </div>
          </Link>

          <Link
            href="/transfers"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20"
          >
            {language === "ka" ? "← ტრანსფერები" : "← Transfers"}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {successMessage && (
          <div className="mb-8 rounded-3xl border border-emerald-400/30 bg-emerald-500/15 p-6 text-emerald-100 shadow-xl">
            <h2 className="text-xl font-black">
              {language === "ka" ? "✅ მოთხოვნა წარმატებით გაიგზავნა" : "✅ Request sent successfully"}
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
                {transfer.image_url ? (
                  <img
                    src={transfer.image_url}
                    alt="ტრანსფერი"
                    className="h-[300px] w-full object-cover sm:h-[500px]"
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center bg-gradient-to-br from-cyan-950 to-slate-900 sm:h-[500px]">
                    <span className="text-9xl">
                      🚐
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <span className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-xs font-black shadow-lg">
                    {language === "ka" ? "✓ ხელმისაწვდომია" : "✓ Available"}
                  </span>

                  <h1 className="mt-4 text-3xl font-black drop-shadow-xl sm:text-5xl">
                    {localizedFrom || c.startLocation}

                    <span className="mx-3 text-cyan-300">
                      →
                    </span>

                    {localizedTo || c.destination}
                  </h1>

                  <p className="mt-3 text-lg text-white/80">
                    🚘{" "}
                    {transfer.vehicle ||
                      c.vehicleNotSpecified}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoBox
                  icon="📍"
                  label={c.startLocation}
                  value={localizedFrom || c.notSpecified}
                />

                <InfoBox
                  icon="🏁"
                  label={c.destination}
                  value={localizedTo || c.notSpecified}
                />

                <InfoBox
                  icon="🚘"
                  label={c.vehicle}
                  value={
                    transfer.vehicle ||
                    c.notSpecified
                  }
                />

                <InfoBox
                  icon="👥"
                  label={c.seats}
                  value={
                    transfer.seats
                      ? language === "ka" ? `${transfer.seats} მგზავრი` : `${transfer.seats} passenger${transfer.seats === 1 ? "" : "s"}`
                      : c.notSpecified
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                {language === "ka" ? "ტრანსფერის აღწერა" : "Transfer description"}
              </p>

              <h2 className="mt-3 text-3xl font-black">
                {language === "ka" ? "ტრანსფერის აღწერა" : "Transfer description"}
              </h2>

              <p className="mt-5 whitespace-pre-line leading-8 text-white/70">
                {localizedDescription || c.noDescription}
              </p>
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              <DetailCard
                icon="✅"
                title={c.bookingInfo}
                items={c.bookingInfoItems}
              />

              <DetailCard
                icon="ℹ️"
                title={c.importantTerms}
                items={c.importantTermsItems}
              />
            </section>
          </div>

          <aside className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7 lg:sticky lg:top-24">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Booking
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {language === "ka" ? "ტრანსფერის დაჯავშნა" : "Book Transfer"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {language === "ka" ? "შეავსე მონაცემები და გააგზავნე მოთხოვნა." : "Fill in your details and send a booking request."}
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
              <FormField label={c.fullName}>
                <input
                  type="text"
                  value={guestName}
                  onChange={(event) =>
                    setGuestName(
                      event.target.value
                    )
                  }
                  placeholder={c.namePlaceholder}
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label={c.email}>
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label={c.phone}>
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={c.travelDate}>
                  <input
                    type="date"
                    value={travelDate}
                    min={today}
                    onChange={(event) =>
                      setTravelDate(
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </FormField>

                <FormField label={c.travelTime}>
                  <input
                    type="time"
                    value={travelTime}
                    onChange={(event) =>
                      setTravelTime(
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </FormField>
              </div>

              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isReturnTransfer}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setIsReturnTransfer(checked);

                      if (!checked) {
                        setReturnDate("");
                        setReturnTime("");
                      }
                    }}
                    className="h-5 w-5 accent-cyan-600"
                  />

                  <div>
                    <p className="font-black text-slate-900">
                      🔁 {c.returnTransfer}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {c.returnTransferHint}
                    </p>
                  </div>
                </label>

                {isReturnTransfer && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <FormField label={c.returnDate}>
                      <input
                        type="date"
                        value={returnDate}
                        min={travelDate || today}
                        onChange={(event) =>
                          setReturnDate(event.target.value)
                        }
                        required={isReturnTransfer}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </FormField>

                    <FormField label={c.returnTime}>
                      <input
                        type="time"
                        value={returnTime}
                        onChange={(event) =>
                          setReturnTime(event.target.value)
                        }
                        required={isReturnTransfer}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      />
                    </FormField>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={c.flightNumber}>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(event) =>
                      setFlightNumber(event.target.value)
                    }
                    placeholder={c.flightNumberPlaceholder}
                    maxLength={30}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </FormField>

                <div className="flex items-end">
                  <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 transition hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={childSeat}
                      onChange={(event) =>
                        setChildSeat(event.target.checked)
                      }
                      className="h-5 w-5 accent-cyan-600"
                    />
                    <span className="font-bold text-slate-700">
                      👶 {c.childSeat}
                    </span>
                  </label>
                </div>
              </div>

              <FormField label={c.passengers}>
                <input
                  type="number"
                  min={1}
                  max={
                    transfer.seats || undefined
                  }
                  value={passengers}
                  onChange={(event) =>
                    setPassengers(
                      normalizePositiveInteger(
                        event.target.value
                      )
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label={c.pickupAddress}>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(event) =>
                    setPickupAddress(
                      event.target.value
                    )
                  }
                  placeholder={c.pickupPlaceholder}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label={c.dropoffAddress}>
                <input
                  type="text"
                  value={dropoffAddress}
                  onChange={(event) =>
                    setDropoffAddress(
                      event.target.value
                    )
                  }
                  placeholder={c.dropoffPlaceholder}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label={c.specialRequests}>
                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder={c.notesPlaceholder}
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />

                <span className="mt-2 block text-right text-xs text-slate-400">
                  {notes.length} / 1000
                </span>
              </FormField>

              <div className="rounded-2xl bg-slate-100 p-5">
                <PriceRow
                  label={c.route}
                  value={`${
                    localizedFrom || c.startLocation
                  } → ${
                    localizedTo || c.destination
                  }`}
                />

                <PriceRow
                  label={c.passengers}
                  value={String(passengers)}
                />

                <PriceRow
                  label={c.transferType}
                  value={isReturnTransfer ? c.roundTrip : c.oneWay}
                />

                {isReturnTransfer && returnDate && returnTime && (
                  <PriceRow
                    label={c.returnDateTime}
                    value={`${returnDate} ${returnTime}`}
                  />
                )}

                {flightNumber.trim() && (
                  <PriceRow
                    label={c.flightNumber}
                    value={flightNumber.trim().toUpperCase()}
                  />
                )}

                <PriceRow
                  label={c.childSeat}
                  value={childSeat ? c.yes : c.no}
                />

                <div className="mt-4 border-t border-slate-300 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-black">
                      {language === "ka" ? "ტრანსფერის ფასი" : "Transfer price"}
                    </span>

                    <span className="text-2xl font-black text-cyan-700">
                      {totalPrice !== null
                        ? language === "ka"
                          ? `${totalPrice.toLocaleString("ka-GE")} ₾`
                          : `${totalPrice.toLocaleString("en-US")} GEL`
                        : formatTransferPrice(transfer, language)}
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
                  ? c.submitting
                  : c.submitButton}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                {language === "ka" ? "მოთხოვნის გაგზავნა ავტომატურად დადასტურებულ ჯავშანს არ ნიშნავს." : "Sending a request does not automatically confirm the booking."}
              </p>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}

const transferBookingCopy = {
  ka: {
    invalidTransferId: "ტრანსფერის ID არასწორია.",
    transferNotFound: "ტრანსფერი ვერ მოიძებნა ან ჯერ არ არის დამტკიცებული.",
    unknownError: "უცნობი შეცდომა დაფიქსირდა.",
    transferInfoMissing: "ტრანსფერის ინფორმაცია ვერ მოიძებნა.",
    nameRequired: "ჩაწერე მგზავრის სახელი და გვარი.",
    emailRequired: "ჩაწერე ელფოსტა.",
    emailInvalid: "ელფოსტის მისამართი არასწორია.",
    phoneRequired: "ჩაწერე ტელეფონის ნომერი.",
    dateRequired: "აირჩიე მგზავრობის თარიღი.",
    pastDate: "გასული თარიღის არჩევა შეუძლებელია.",
    timeRequired: "აირჩიე მგზავრობის დრო.",
    passengersMin: "მგზავრების რაოდენობა უნდა იყოს მინიმუმ 1.",
    pickupRequired: "ჩაწერე აყვანის ზუსტი მისამართი.",
    dropoffRequired: "ჩაწერე დანიშნულების ზუსტი მისამართი.",
    returnDateRequired: "აირჩიე დაბრუნების თარიღი.",
    returnTimeRequired: "აირჩიე დაბრუნების დრო.",
    returnBeforeDeparture: "დაბრუნების თარიღი ვერ იქნება გამგზავრებამდე.",
    returnTimeBeforeDeparture: "დაბრუნების დრო უნდა იყოს გამგზავრების დროზე გვიან.",
    successMessage: "ტრანსფერის მოთხოვნა წარმატებით გაიგზავნა. მძღოლი ან ორგანიზატორი დაგიკავშირდება ტელეფონზე ან ელფოსტაზე.",
    transferLoadFailed: "ტრანსფერის ინფორმაცია ვერ ჩაიტვირთა.",
    startLocation: "საწყისი ადგილი",
    destination: "დანიშნულება",
    vehicle: "ავტომობილი",
    vehicleNotSpecified: "ავტომობილი არ არის მითითებული",
    seats: "ადგილები",
    notSpecified: "არ არის მითითებული",
    noDescription: "ტრანსფერის სრული აღწერა ჯერ არ არის დამატებული.",
    bookingInfo: "დაჯავშნის ინფორმაცია",
    importantTerms: "მნიშვნელოვანი პირობები",
    bookingInfoItems: [
      "მოთხოვნის გაგზავნა უფასოა",
      "მძღოლი დაგიკავშირდება დასადასტურებლად",
      "შეგიძლია მიუთითო აყვანის ზუსტი მისამართი",
      "დაჯავშნა საბოლოოა მხოლოდ დადასტურების შემდეგ",
    ],
    importantTermsItems: [
      "მგზავრების რაოდენობა არ უნდა აღემატებოდეს ადგილების რაოდენობას",
      "დრო შეიძლება შეთანხმდეს მძღოლთან",
      "დამატებითი გაჩერება შეიძლება ფასიანი იყოს",
      "ზუსტი პირობები გადაამოწმე ორგანიზატორთან",
    ],
    fullName: "სახელი და გვარი",
    email: "ელფოსტა",
    phone: "ტელეფონის ნომერი",
    travelDate: "მგზავრობის თარიღი",
    travelTime: "მგზავრობის დრო",
    passengers: "მგზავრების რაოდენობა",
    pickupAddress: "აყვანის ზუსტი მისამართი",
    dropoffAddress: "დანიშნულების ზუსტი მისამართი",
    returnTransfer: "ორმხრივი ტრანსფერი",
    returnTransferHint: "მონიშნე, თუ დაბრუნების ტრანსფერიც გჭირდება.",
    returnDate: "დაბრუნების თარიღი",
    returnTime: "დაბრუნების დრო",
    flightNumber: "ფრენის ნომერი",
    flightNumberPlaceholder: "მაგალითად: W67920",
    childSeat: "ბავშვის სავარძელი",
    transferType: "ტრანსფერის ტიპი",
    oneWay: "ერთი მიმართულება",
    roundTrip: "ორმხრივი",
    returnDateTime: "დაბრუნება",
    yes: "კი",
    no: "არა",
    specialRequests: "დამატებითი შეტყობინება",
    route: "მარშრუტი",
    namePlaceholder: "მაგალითად: Anna Brown",
    pickupPlaceholder: "მაგალითად: სასტუმრო ლაჰილი, მესტია",
    dropoffPlaceholder: "მაგალითად: ქუთაისის აეროპორტი",
    notesPlaceholder: "მაგალითად: გვაქვს დიდი ბარგი...",
    submitting: "მოთხოვნა იგზავნება...",
    submitButton: "დაჯავშნის მოთხოვნის გაგზავნა",
  },
  en: {
    invalidTransferId: "Invalid transfer ID.",
    transferNotFound: "Transfer was not found or is not approved yet.",
    unknownError: "An unknown error occurred.",
    transferInfoMissing: "Transfer information could not be found.",
    nameRequired: "Enter the passenger's full name.",
    emailRequired: "Enter your email address.",
    emailInvalid: "The email address is invalid.",
    phoneRequired: "Enter your phone number.",
    dateRequired: "Choose a travel date.",
    pastDate: "You cannot choose a past date.",
    timeRequired: "Choose a travel time.",
    passengersMin: "Number of passengers must be at least 1.",
    pickupRequired: "Enter the exact pickup address.",
    dropoffRequired: "Enter the exact destination address.",
    returnDateRequired: "Choose a return date.",
    returnTimeRequired: "Choose a return time.",
    returnBeforeDeparture: "The return date cannot be before the departure date.",
    returnTimeBeforeDeparture: "Return time must be later than departure time.",
    successMessage: "Your transfer request was sent successfully. The driver or organizer will contact you by phone or email.",
    transferLoadFailed: "Transfer information could not be loaded.",
    startLocation: "Starting point",
    destination: "Destination",
    vehicle: "Vehicle",
    vehicleNotSpecified: "Vehicle not specified",
    seats: "Seats",
    notSpecified: "Not specified",
    noDescription: "A full transfer description has not been added yet.",
    bookingInfo: "Booking information",
    importantTerms: "Important terms",
    bookingInfoItems: [
      "Sending a booking request is free",
      "The driver will contact you to confirm",
      "You can enter an exact pickup address",
      "The booking is final only after confirmation",
    ],
    importantTermsItems: [
      "The number of passengers cannot exceed the available seats",
      "Travel time can be agreed with the driver",
      "Additional stops may cost extra",
      "Confirm exact terms with the organizer",
    ],
    fullName: "Full name",
    email: "Email",
    phone: "Phone / WhatsApp",
    travelDate: "Travel date",
    travelTime: "Travel time",
    passengers: "Number of passengers",
    pickupAddress: "Exact pickup address",
    dropoffAddress: "Exact destination address",
    returnTransfer: "Return transfer",
    returnTransferHint: "Select this if you also need a return transfer.",
    returnDate: "Return date",
    returnTime: "Return time",
    flightNumber: "Flight number",
    flightNumberPlaceholder: "For example: W67920",
    childSeat: "Child seat",
    transferType: "Transfer type",
    oneWay: "One way",
    roundTrip: "Round trip",
    returnDateTime: "Return",
    yes: "Yes",
    no: "No",
    specialRequests: "Special requests",
    route: "Route",
    namePlaceholder: "For example: Anna Brown",
    pickupPlaceholder: "For example: Hotel Lahili, Mestia",
    dropoffPlaceholder: "For example: Kutaisi Airport",
    notesPlaceholder: "For example: We have large luggage...",
    submitting: "Sending request...",
    submitButton: "Send booking request",
  },
} as const;

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
            <span className="mt-1 text-cyan-300">
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

function formatTransferPrice(
  transfer: Transfer,
  language: "ka" | "en"
) {
  const priceType =
    transfer.price_type || "fixed";

  if (
    priceType === "negotiable" ||
    transfer.price === null ||
    transfer.price === undefined
  ) {
    return language === "ka" ? "ფასი შეთანხმებით" : "Contact for price";
  }

  const formattedPrice =
    Number(transfer.price).toLocaleString(
      "ka-GE"
    );

  if (priceType === "from") {
    return language === "ka" ? `${formattedPrice} ₾-დან` : `From ${formattedPrice} GEL`;
  }

  return language === "ka" ? `${formattedPrice} ₾ მანქანაზე` : `${formattedPrice} GEL per vehicle`;
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