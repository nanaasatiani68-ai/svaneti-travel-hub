"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

type HotelBooking = {
  id: string;
  hotel_id: string;
  user_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  rooms_count: number;
  nights: number;
  total_price: number | null;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
  hotels:
    | {
        id: string;
        name: string | null;
        location: string | null;
        image_url: string | null;
      }
    | {
        id: string;
        name: string | null;
        location: string | null;
        image_url: string | null;
      }[]
    | null;
};

type StatusFilter = "all" | BookingStatus;

export default function AdminHotelBookingsPage() {
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        throw new Error(
          "ადმინისტრატორის ავტორიზაცია ვერ მოიძებნა."
        );
      }

      const { data, error } = await supabase
        .from("hotel_bookings")
        .select(
          `
            id,
            hotel_id,
            user_id,
            guest_name,
            guest_email,
            guest_phone,
            check_in_date,
            check_out_date,
            guests,
            rooms_count,
            nights,
            total_price,
            notes,
            status,
            created_at,
            hotels (
              id,
              name,
              location,
              image_url
            )
          `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setBookings((data as HotelBooking[] | null) ?? []);
    } catch (error: unknown) {
      console.error("Hotel bookings loading error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setBookings([]);
      setErrorMessage(
        `სასტუმროს ჯავშნების ჩატვირთვა ვერ მოხერხდა: ${message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const hotel = getHotel(booking.hotels);

      const matchesStatus =
        statusFilter === "all" ||
        booking.status === statusFilter;

      const searchableText = [
        booking.guest_name,
        booking.guest_email,
        booking.guest_phone,
        hotel?.name,
        hotel?.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchValue === "" ||
        searchableText.includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  const statistics = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter(
        (booking) => booking.status === "pending"
      ).length,
      approved: bookings.filter(
        (booking) => booking.status === "approved"
      ).length,
      rejected: bookings.filter(
        (booking) => booking.status === "rejected"
      ).length,
      completed: bookings.filter(
        (booking) => booking.status === "completed"
      ).length,
    };
  }, [bookings]);

  async function updateBookingStatus(
    bookingId: string,
    status: BookingStatus
  ) {
    if (updatingId) {
      return;
    }

    setUpdatingId(bookingId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("hotel_bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) {
        throw error;
      }

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status,
              }
            : booking
        )
      );

      setSuccessMessage(
        `ჯავშნის სტატუსი შეიცვალა: ${getStatusLabel(status)}`
      );
    } catch (error: unknown) {
      console.error("Booking status update error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setErrorMessage(
        `სტატუსის შეცვლა ვერ მოხერხდა: ${message}`
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />

          <h1 className="mt-6 text-2xl font-black">
            სასტუმროს ჯავშნები იტვირთება
          </h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
              Admin Panel
            </p>

            <h1 className="mt-2 text-4xl font-black">
              🏨 სასტუმროს ჯავშნები
            </h1>

            <p className="mt-3 text-white/60">
              ნახე მოთხოვნები და შეცვალე მათი სტატუსი.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadBookings()}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
            >
              🔄 განახლება
            </button>

            <Link
              href="/admin-v2"
              className="rounded-2xl bg-emerald-500 px-5 py-3 font-bold transition hover:bg-emerald-600"
            >
              ← ადმინი
            </Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="ყველა"
            value={statistics.all}
            icon="📋"
          />

          <StatCard
            label="მოლოდინში"
            value={statistics.pending}
            icon="⏳"
          />

          <StatCard
            label="დამტკიცებული"
            value={statistics.approved}
            icon="✅"
          />

          <StatCard
            label="უარყოფილი"
            value={statistics.rejected}
            icon="❌"
          />

          <StatCard
            label="დასრულებული"
            value={statistics.completed}
            icon="🏁"
          />
        </section>

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-4 font-semibold text-emerald-100">
            ✅ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/15 p-4 text-red-100">
            <p className="font-bold">
              ⚠️ მოქმედება ვერ შესრულდა
            </p>

            <p className="mt-2 text-sm text-red-100/75">
              {errorMessage}
            </p>
          </div>
        )}

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-[1fr_260px_auto]">
            <label>
              <span className="mb-2 block text-sm font-bold text-white/70">
                ძიება
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="სტუმარი, სასტუმრო, ტელეფონი..."
                className="w-full rounded-xl bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-white/70">
                სტატუსი
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as StatusFilter
                  )
                }
                className="w-full rounded-xl bg-white px-4 py-3 font-medium text-slate-900 outline-none"
              >
                <option value="all">
                  ყველა სტატუსი
                </option>

                <option value="pending">
                  მოლოდინში
                </option>

                <option value="approved">
                  დამტკიცებული
                </option>

                <option value="rejected">
                  უარყოფილი
                </option>

                <option value="cancelled">
                  გაუქმებული
                </option>

                <option value="completed">
                  დასრულებული
                </option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
              >
                გასუფთავება
              </button>
            </div>
          </div>

          <p className="mt-5 border-t border-white/10 pt-5 text-sm text-white/60">
            ნაპოვნია{" "}
            <span className="font-black text-emerald-300">
              {filteredBookings.length}
            </span>{" "}
            ჯავშანი
          </p>
        </section>

        {filteredBookings.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="text-7xl">🏨</div>

            <h2 className="mt-5 text-2xl font-black">
              ჯავშნები ვერ მოიძებნა
            </h2>

            <p className="mt-3 text-white/55">
              სასტუმროს ახალი მოთხოვნები აქ გამოჩნდება.
            </p>
          </div>
        ) : (
          <section className="space-y-5">
            {filteredBookings.map((booking) => {
              const hotel = getHotel(booking.hotels);
              const isUpdating =
                updatingId === booking.id;

              return (
                <article
                  key={booking.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl"
                >
                  <div className="grid lg:grid-cols-[220px_1fr]">
                    <div className="h-56 lg:h-full">
                      {hotel?.image_url ? (
                        <img
                          src={hotel.image_url}
                          alt={hotel.name || "სასტუმრო"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-56 items-center justify-center bg-emerald-950 text-7xl">
                          🏨
                        </div>
                      )}
                    </div>

                    <div className="p-5 sm:p-7">
                      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                        <div>
                          <StatusBadge
                            status={booking.status}
                          />

                          <h2 className="mt-4 text-2xl font-black">
                            {hotel?.name ||
                              "უცნობი სასტუმრო"}
                          </h2>

                          <p className="mt-2 text-white/55">
                            📍{" "}
                            {hotel?.location ||
                              "მდებარეობა უცნობია"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/10 px-5 py-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                            ჯამური ფასი
                          </p>

                          <p className="mt-1 text-2xl font-black text-emerald-300">
                            {booking.total_price !== null
                              ? `${Number(
                                  booking.total_price
                                ).toLocaleString(
                                  "ka-GE"
                                )} ₾`
                              : "შეთანხმებით"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoBox
                          label="შესვლა"
                          value={formatDate(
                            booking.check_in_date
                          )}
                        />

                        <InfoBox
                          label="გასვლა"
                          value={formatDate(
                            booking.check_out_date
                          )}
                        />

                        <InfoBox
                          label="ღამეები"
                          value={String(booking.nights)}
                        />

                        <InfoBox
                          label="ოთახები / სტუმრები"
                          value={`${booking.rooms_count} / ${booking.guests}`}
                        />
                      </div>

                      <div className="mt-6 rounded-2xl bg-black/20 p-5">
                        <h3 className="font-black">
                          👤 სტუმრის ინფორმაცია
                        </h3>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <p className="text-sm text-white/65">
                            <span className="block text-xs text-white/35">
                              სახელი
                            </span>

                            {booking.guest_name}
                          </p>

                          <a
                            href={`mailto:${booking.guest_email}`}
                            className="text-sm text-cyan-300"
                          >
                            <span className="block text-xs text-white/35">
                              ელფოსტა
                            </span>

                            {booking.guest_email}
                          </a>

                          <a
                            href={`tel:${booking.guest_phone}`}
                            className="text-sm text-emerald-300"
                          >
                            <span className="block text-xs text-white/35">
                              ტელეფონი
                            </span>

                            {booking.guest_phone}
                          </a>
                        </div>

                        {booking.notes && (
                          <div className="mt-5 border-t border-white/10 pt-4">
                            <p className="text-xs font-bold text-white/35">
                              დამატებითი შეტყობინება
                            </p>

                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/65">
                              {booking.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <ActionButton
                          label="✅ დამტკიცება"
                          disabled={
                            isUpdating ||
                            booking.status === "approved"
                          }
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "approved"
                            )
                          }
                          className="bg-emerald-600 hover:bg-emerald-700"
                        />

                        <ActionButton
                          label="❌ უარყოფა"
                          disabled={
                            isUpdating ||
                            booking.status === "rejected"
                          }
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "rejected"
                            )
                          }
                          className="bg-red-600 hover:bg-red-700"
                        />

                        <ActionButton
                          label="🏁 დასრულებული"
                          disabled={
                            isUpdating ||
                            booking.status === "completed"
                          }
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "completed"
                            )
                          }
                          className="bg-blue-600 hover:bg-blue-700"
                        />

                        <ActionButton
                          label="🚫 გაუქმება"
                          disabled={
                            isUpdating ||
                            booking.status === "cancelled"
                          }
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              "cancelled"
                            )
                          }
                          className="bg-slate-600 hover:bg-slate-700"
                        />

                        {isUpdating && (
                          <span className="flex items-center px-3 text-sm font-bold text-amber-300">
                            ⏳ ინახება...
                          </span>
                        )}
                      </div>

                      <p className="mt-5 text-xs text-white/35">
                        მოთხოვნა მიღებულია:{" "}
                        {formatDateTime(booking.created_at)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function getHotel(hotels: HotelBooking["hotels"]) {
  if (Array.isArray(hotels)) {
    return hotels[0] ?? null;
  }

  return hotels;
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
      <div className="text-3xl">{icon}</div>

      <p className="mt-4 text-sm font-bold text-white/50">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: BookingStatus;
}) {
  const styles: Record<BookingStatus, string> = {
    pending:
      "bg-amber-500/15 text-amber-300 border-amber-400/20",
    approved:
      "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    rejected:
      "bg-red-500/15 text-red-300 border-red-400/20",
    cancelled:
      "bg-slate-500/15 text-slate-300 border-slate-400/20",
    completed:
      "bg-blue-500/15 text-blue-300 border-blue-400/20",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${styles[status]}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function getStatusLabel(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    pending: "მოლოდინში",
    approved: "დამტკიცებული",
    rejected: "უარყოფილი",
    cancelled: "გაუქმებული",
    completed: "დასრულებული",
  };

  return labels[status];
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-bold text-white/35">
        {label}
      </p>

      <p className="mt-1 font-black">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  label,
  disabled,
  onClick,
  className,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {label}
    </button>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}