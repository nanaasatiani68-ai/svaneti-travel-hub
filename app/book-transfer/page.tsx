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

type Transfer = {
  id: string | number;
  user_id: string | null;
  from_location: string | null;
  to_location: string | null;
  price: number | null;
  vehicle: string | null;
  seats: number | null;
  description: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string | null;
};

export default function BookTransferPage() {
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
          "ტრანსფერის ID არასწორია."
        );
      }

      const { data, error } = await supabase
        .from("transfers")
        .select(
          `
            id,
            user_id,
            from_location,
            to_location,
            price,
            vehicle,
            seats,
            description,
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
          "ტრანსფერი ვერ მოიძებნა ან ჯერ არ არის დამტკიცებული."
        );
      }

      const loadedTransfer = data as Transfer;

      setTransfer(loadedTransfer);

      if (loadedTransfer.from_location) {
        setPickupAddress(
          loadedTransfer.from_location
        );
      }

      if (loadedTransfer.to_location) {
        setDropoffAddress(
          loadedTransfer.to_location
        );
      }
    } catch (error: unknown) {
      console.error(
        "Transfer loading error:",
        error
      );

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
  }, [transferId]);

  useEffect(() => {
    void loadCurrentUser();
  }, []);

  const totalPrice = useMemo(() => {
    if (
      transfer?.price === null ||
      transfer?.price === undefined
    ) {
      return null;
    }

    return Number(transfer.price);
  }, [transfer?.price]);

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
        "ტრანსფერის ინფორმაცია ვერ მოიძებნა."
      );
      return;
    }

    if (!guestName.trim()) {
      setFormError(
        "ჩაწერე მგზავრის სახელი და გვარი."
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

    if (!travelDate) {
      setFormError(
        "აირჩიე მგზავრობის თარიღი."
      );
      return;
    }

    if (travelDate < today) {
      setFormError(
        "გასული თარიღის არჩევა შეუძლებელია."
      );
      return;
    }

    if (!travelTime) {
      setFormError(
        "აირჩიე მგზავრობის დრო."
      );
      return;
    }

    if (
      !Number.isInteger(passengers) ||
      passengers < 1
    ) {
      setFormError(
        "მგზავრების რაოდენობა უნდა იყოს მინიმუმ 1."
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
        "ჩაწერე აყვანის ზუსტი მისამართი."
      );
      return;
    }

    if (!dropoffAddress.trim()) {
      setFormError(
        "ჩაწერე დანიშნულების ზუსტი მისამართი."
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
          notes: notes.trim() || null,
          status: "pending",
        });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "ტრანსფერის მოთხოვნა წარმატებით გაიგზავნა. მძღოლი ან ორგანიზატორი დაგიკავშირდება ტელეფონზე ან ელფოსტაზე."
      );

      setTravelDate("");
      setTravelTime("");
      setPassengers(1);
      setNotes("");

      if (transfer.from_location) {
        setPickupAddress(
          transfer.from_location
        );
      }

      if (transfer.to_location) {
        setDropoffAddress(
          transfer.to_location
        );
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
          : "უცნობი შეცდომა დაფიქსირდა.";

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
            ტრანსფერი იტვირთება
          </h1>

          <p className="mt-2 text-white/55">
            გთხოვთ, მოიცადოთ...
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
            ტრანსფერი ვერ მოიძებნა
          </h1>

          <p className="mt-3 leading-7 text-white/60">
            {loadError ||
              "ტრანსფერის ინფორმაცია ვერ ჩაიტვირთა."}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadTransfer}
              className="rounded-2xl bg-cyan-500 px-6 py-3 font-bold transition hover:bg-cyan-600"
            >
              ხელახლა ცდა
            </button>

            <Link
              href="/transfers"
              className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
            >
              ყველა ტრანსფერი
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
                ტრანსფერის დეტალები
              </p>
            </div>
          </Link>

          <Link
            href="/transfers"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20"
          >
            ← ტრანსფერები
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
                    ✓ ხელმისაწვდომია
                  </span>

                  <h1 className="mt-4 text-3xl font-black drop-shadow-xl sm:text-5xl">
                    {transfer.from_location ||
                      "საწყისი ადგილი"}

                    <span className="mx-3 text-cyan-300">
                      →
                    </span>

                    {transfer.to_location ||
                      "დანიშნულება"}
                  </h1>

                  <p className="mt-3 text-lg text-white/80">
                    🚘{" "}
                    {transfer.vehicle ||
                      "ავტომობილი არ არის მითითებული"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoBox
                  icon="📍"
                  label="საწყისი ადგილი"
                  value={
                    transfer.from_location ||
                    "არ არის მითითებული"
                  }
                />

                <InfoBox
                  icon="🏁"
                  label="დანიშნულება"
                  value={
                    transfer.to_location ||
                    "არ არის მითითებული"
                  }
                />

                <InfoBox
                  icon="🚘"
                  label="ავტომობილი"
                  value={
                    transfer.vehicle ||
                    "არ არის მითითებული"
                  }
                />

                <InfoBox
                  icon="👥"
                  label="ადგილები"
                  value={
                    transfer.seats
                      ? `${transfer.seats} მგზავრი`
                      : "არ არის მითითებული"
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                Transfer description
              </p>

              <h2 className="mt-3 text-3xl font-black">
                ტრანსფერის აღწერა
              </h2>

              <p className="mt-5 whitespace-pre-line leading-8 text-white/70">
                {transfer.description ||
                  "ტრანსფერის სრული აღწერა ჯერ არ არის დამატებული."}
              </p>
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              <DetailCard
                icon="✅"
                title="დაჯავშნის ინფორმაცია"
                items={[
                  "მოთხოვნის გაგზავნა უფასოა",
                  "მძღოლი დაგიკავშირდება დასადასტურებლად",
                  "შეგიძლია მიუთითო აყვანის ზუსტი მისამართი",
                  "დაჯავშნა საბოლოოა მხოლოდ დადასტურების შემდეგ",
                ]}
              />

              <DetailCard
                icon="ℹ️"
                title="მნიშვნელოვანი პირობები"
                items={[
                  "მგზავრების რაოდენობა არ უნდა აღემატებოდეს ადგილების რაოდენობას",
                  "დრო შეიძლება შეთანხმდეს მძღოლთან",
                  "დამატებითი გაჩერება შეიძლება ფასიანი იყოს",
                  "ზუსტი პირობები გადაამოწმე ორგანიზატორთან",
                ]}
              />
            </section>
          </div>

          <aside className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7 lg:sticky lg:top-24">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Booking
            </p>

            <h2 className="mt-2 text-3xl font-black">
              ტრანსფერის დაჯავშნა
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              შეავსე მონაცემები და გააგზავნე
              მოთხოვნა.
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="მგზავრობის თარიღი">
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

                <FormField label="მგზავრობის დრო">
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

              <FormField label="მგზავრების რაოდენობა">
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

              <FormField label="აყვანის ზუსტი მისამართი">
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(event) =>
                    setPickupAddress(
                      event.target.value
                    )
                  }
                  placeholder="მაგალითად: სასტუმრო ლაჰილი, მესტია"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label="დანიშნულების ზუსტი მისამართი">
                <input
                  type="text"
                  value={dropoffAddress}
                  onChange={(event) =>
                    setDropoffAddress(
                      event.target.value
                    )
                  }
                  placeholder="მაგალითად: ქუთაისის აეროპორტი"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label="დამატებითი შეტყობინება">
                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="მაგალითად: გვაქვს დიდი ბარგი..."
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
                  label="მარშრუტი"
                  value={`${
                    transfer.from_location ||
                    "საწყისი ადგილი"
                  } → ${
                    transfer.to_location ||
                    "დანიშნულება"
                  }`}
                />

                <PriceRow
                  label="მგზავრების რაოდენობა"
                  value={String(passengers)}
                />

                <div className="mt-4 border-t border-slate-300 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-black">
                      ტრანსფერის ფასი
                    </span>

                    <span className="text-2xl font-black text-cyan-700">
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
                className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
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