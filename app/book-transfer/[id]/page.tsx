"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Transfer = {
  id: string | number;
  user_id: string | null;
  title: string | null;
  transfer_type: string | null;
  from_location: string | null;
  to_location: string | null;
  price: number | null;
  vehicle: string | null;
  seats: number | null;
  description: string | null;
  image_url: string | null;
  status: string | null;
};

const VEHICLE_CHOICES = [
  "No preference",
  "Sedan",
  "SUV / 4x4",
  "Minivan",
  "Premium vehicle",
];

export default function BookTransferPage() {
  const params = useParams<{ id: string }>();
  const transferId = params?.id;

  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState(true);

  const [travelDate, setTravelDate] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [vehicleType, setVehicleType] = useState("No preference");
  const [luggageCount, setLuggageCount] = useState(0);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [notes, setNotes] = useState("");

  const today = getLocalToday();

  async function loadTransfer() {
    setLoading(true);
    setLoadError("");

    try {
      if (!transferId) throw new Error("ტრანსფერის ID არასწორია.");

      const { data, error } = await supabase
        .from("transfers")
        .select(`
          id,
          user_id,
          title,
          transfer_type,
          from_location,
          to_location,
          price,
          vehicle,
          seats,
          description,
          image_url,
          status
        `)
        .eq("id", transferId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "ტრანსფერი ვერ მოიძებნა ან ჯერ არ არის დამტკიცებული."
        );
      }

      const loadedTransfer = data as Transfer;
      setTransfer(loadedTransfer);

      if (loadedTransfer.from_location) {
        setPickupAddress(loadedTransfer.from_location);
      }

      if (loadedTransfer.to_location) {
        setDropoffAddress(loadedTransfer.to_location);
      }
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error ? error.message : "უცნობი შეცდომა დაფიქსირდა."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCurrentUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user) return;

    setGuestEmail(user.email ?? "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.full_name) setGuestName(profile.full_name);
    if (profile?.phone) setGuestPhone(profile.phone);
  }

  useEffect(() => {
    void loadTransfer();
  }, [transferId]);

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  const totalPrice = useMemo(() => {
    if (transfer?.price === null || transfer?.price === undefined) {
      return null;
    }

    return Number(transfer.price);
  }, [transfer?.price]);

  const isAirportTransfer = useMemo(() => {
    const text = [
      transfer?.title,
      transfer?.transfer_type,
      transfer?.from_location,
      transfer?.to_location,
    ]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");

    return text.includes("airport") || text.includes("აეროპორტ");
  }, [transfer]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !transfer) return;

    setFormError("");
    setSuccessMessage("");

    if (!guestName.trim()) return setFormError("ჩაწერე სახელი და გვარი.");
    if (!isValidEmail(guestEmail)) return setFormError("ჩაწერე სწორი ელფოსტა.");
    if (!guestPhone.trim()) return setFormError("ჩაწერე ტელეფონის ნომერი.");
    if (!travelDate) return setFormError("აირჩიე მგზავრობის თარიღი.");
    if (travelDate < today) return setFormError("გასული თარიღი შეუძლებელია.");
    if (!travelTime) return setFormError("აირჩიე მგზავრობის დრო.");
    if (!pickupAddress.trim()) return setFormError("ჩაწერე აყვანის ზუსტი ადგილი.");
    if (!dropoffAddress.trim()) return setFormError("ჩაწერე ჩამოსმის ზუსტი ადგილი.");

    if (transfer.seats && passengers > transfer.seats) {
      return setFormError(
        `ამ ტრანსფერზე მაქსიმალური რაოდენობაა ${transfer.seats} მგზავრი.`
      );
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error } = await supabase
        .from("transfer_bookings")
        .insert({
          transfer_id: transfer.id,
          user_id: session?.user?.id ?? null,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
          guest_phone: guestPhone.trim(),
          contact_whatsapp: contactWhatsapp,
          travel_date: travelDate,
          travel_time: travelTime,
          passengers,
          vehicle_type: vehicleType,
          luggage_count: luggageCount,
          pickup_address: pickupAddress.trim(),
          dropoff_address: dropoffAddress.trim(),
          flight_number: flightNumber.trim() || null,
          total_price: totalPrice,
          notes: notes.trim() || null,
          status: "pending",
        });

      if (error) throw error;

      setSuccessMessage(
        "ტრანსფერის მოთხოვნა წარმატებით გაიგზავნა. ჩვენ დაგიკავშირდებით დასადასტურებლად."
      );

      setTravelDate("");
      setTravelTime("");
      setPassengers(1);
      setVehicleType("No preference");
      setLuggageCount(0);
      setFlightNumber("");
      setNotes("");
    } catch (error: unknown) {
      setFormError(
        `მოთხოვნა ვერ გაიგზავნა: ${
          error instanceof Error ? error.message : "უცნობი შეცდომა"
        }`
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        ტრანსფერი იტვირთება...
      </main>
    );
  }

  if (!transfer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-7xl">🚐</div>
          <h1 className="mt-5 text-2xl font-black">
            ტრანსფერი ვერ მოიძებნა
          </h1>
          <p className="mt-3 text-white/60">{loadError}</p>
          <Link
            href="/transfers"
            className="mt-6 inline-flex rounded-2xl bg-cyan-500 px-6 py-3 font-bold"
          >
            ყველა ტრანსფერი
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-black">
            Georgia Gateway Hub
          </Link>
          <Link
            href="/transfers"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold"
          >
            ← ტრანსფერები
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {successMessage && (
          <div className="mb-8 rounded-3xl border border-emerald-400/30 bg-emerald-500/15 p-6 text-emerald-100">
            ✅ {successMessage}
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div className="relative">
                {transfer.image_url ? (
                  <img
                    src={transfer.image_url}
                    alt={transfer.title || "ტრანსფერი"}
                    className="h-[320px] w-full object-cover sm:h-[520px]"
                  />
                ) : (
                  <div className="flex h-[320px] items-center justify-center bg-slate-900 text-9xl">
                    🚐
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  {transfer.transfer_type && (
                    <span className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-black">
                      {transfer.transfer_type}
                    </span>
                  )}

                  <h1 className="mt-4 text-3xl font-black sm:text-5xl">
                    {transfer.title ||
                      `${transfer.from_location || "საწყისი"} → ${
                        transfer.to_location || "დანიშნულება"
                      }`}
                  </h1>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InfoBox icon="📍" label="საიდან" value={transfer.from_location || "—"} />
              <InfoBox icon="🏁" label="სადამდე" value={transfer.to_location || "—"} />
              <InfoBox icon="🚘" label="მანქანა" value={transfer.vehicle || "—"} />
              <InfoBox
                icon="👥"
                label="ადგილები"
                value={transfer.seats ? `${transfer.seats} მგზავრი` : "—"}
              />
            </section>

            {transfer.description && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-black">ტრანსფერის აღწერა</h2>
                <p className="mt-4 whitespace-pre-line text-white/70">
                  {transfer.description}
                </p>
              </section>
            )}
          </div>

          <aside className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Booking
            </p>
            <h2 className="mt-2 text-3xl font-black">
              ტრანსფერის დაჯავშნა
            </h2>

            {formError && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <FormField label="სახელი და გვარი">
                <input
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="ელფოსტა">
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(event) => setGuestEmail(event.target.value)}
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="ტელეფონის ნომერი">
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(event) => setGuestPhone(event.target.value)}
                  placeholder="+995..."
                  required
                  className={inputClass}
                />
              </FormField>

              <label className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                <input
                  type="checkbox"
                  checked={contactWhatsapp}
                  onChange={(event) =>
                    setContactWhatsapp(event.target.checked)
                  }
                />
                ამ ნომერზე WhatsApp მაქვს
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="თარიღი">
                  <input
                    type="date"
                    min={today}
                    value={travelDate}
                    onChange={(event) => setTravelDate(event.target.value)}
                    required
                    className={inputClass}
                  />
                </FormField>

                <FormField label="დრო">
                  <input
                    type="time"
                    value={travelTime}
                    onChange={(event) => setTravelTime(event.target.value)}
                    required
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="👤 მგზავრები">
                  <input
                    type="number"
                    min={1}
                    max={transfer.seats || undefined}
                    value={passengers}
                    onChange={(event) =>
                      setPassengers(
                        Math.max(1, Math.floor(Number(event.target.value) || 1))
                      )
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="🧳 ბარგი">
                  <input
                    type="number"
                    min={0}
                    value={luggageCount}
                    onChange={(event) =>
                      setLuggageCount(
                        Math.max(0, Math.floor(Number(event.target.value) || 0))
                      )
                    }
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="🚗 მანქანის ტიპი">
                <select
                  value={vehicleType}
                  onChange={(event) => setVehicleType(event.target.value)}
                  className={inputClass}
                >
                  {VEHICLE_CHOICES.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="📍 ზუსტი Pickup">
                <input
                  value={pickupAddress}
                  onChange={(event) => setPickupAddress(event.target.value)}
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="📍 ზუსტი Drop-off">
                <input
                  value={dropoffAddress}
                  onChange={(event) => setDropoffAddress(event.target.value)}
                  required
                  className={inputClass}
                />
              </FormField>

              {isAirportTransfer && (
                <FormField label="✈️ Flight number">
                  <input
                    value={flightNumber}
                    onChange={(event) => setFlightNumber(event.target.value)}
                    placeholder="W6 1234"
                    className={inputClass}
                  />
                </FormField>
              )}

              <FormField label="📝 Special requests">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  maxLength={1000}
                  className={inputClass}
                />
              </FormField>

              <div className="rounded-2xl bg-slate-100 p-5">
                <p className="text-sm text-slate-500">ტრანსფერის ფასი</p>
                <p className="mt-1 text-2xl font-black text-cyan-700">
                  {totalPrice !== null
                    ? `${totalPrice.toLocaleString("ka-GE")} ₾`
                    : "შეთანხმებით"}
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-lg font-black text-white disabled:opacity-60"
              >
                {submitting
                  ? "მოთხოვნა იგზავნება..."
                  : "დაჯავშნის მოთხოვნის გაგზავნა"}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500";

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
      <p className="text-xs text-white/40">
        {icon} {label}
      </p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function getLocalToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - offset)
    .toISOString()
    .split("T")[0];
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
