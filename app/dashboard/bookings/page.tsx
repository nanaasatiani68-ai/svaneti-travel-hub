"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Booking = {
  id: string;
  tour_id: number | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  booking_date: string | null;
  people: number | null;
  total_price: number | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
};

export default function DashboardBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage("ჯავშნების სანახავად საჭიროა ავტორიზაცია.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
            id,
            tour_id,
            guest_name,
            guest_email,
            guest_phone,
            booking_date,
            people,
            total_price,
            notes,
            status,
            created_at
          `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Bookings loading error:", error);
        setErrorMessage(`ჯავშნების ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
        setLoading(false);
        return;
      }

      setBookings((data as Booking[]) ?? []);
      setLoading(false);
    }

    loadBookings();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="mb-6 text-3xl font-bold">🗓️ დაჯავშნები</h1>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-slate-600">ჯავშნები იტვირთება...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">🗓️ დაჯავშნები</h1>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {errorMessage}
        </div>
      )}

      {!errorMessage && bookings.length === 0 && (
        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-slate-600">თქვენ ჯერ არ გაქვთ დაჯავშნები.</p>
        </div>
      )}

      <div className="space-y-5">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-2xl bg-white p-6 text-slate-900 shadow"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-xl font-bold">
                  {booking.guest_name || "სტუმარი"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  ტურის ID: {booking.tour_id ?? "არ არის მითითებული"}
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-sm font-bold ${
                  booking.status === "approved" ||
                  booking.status === "confirmed"
                    ? "bg-emerald-100 text-emerald-700"
                    : booking.status === "rejected" ||
                        booking.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {booking.status === "approved" ||
                booking.status === "confirmed"
                  ? "დადასტურებული"
                  : booking.status === "rejected" ||
                      booking.status === "cancelled"
                    ? "გაუქმებული"
                    : "მოლოდინში"}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                label="ტურის თარიღი"
                value={booking.booking_date || "არ არის მითითებული"}
              />

              <InfoItem
                label="სტუმრების რაოდენობა"
                value={
                  booking.people
                    ? `${booking.people} ადამიანი`
                    : "არ არის მითითებული"
                }
              />

              <InfoItem
                label="ჯამური ფასი"
                value={
                  booking.total_price !== null
                    ? `${Number(booking.total_price).toLocaleString()} ₾`
                    : "შეთანხმებით"
                }
              />

              <InfoItem
                label="ელფოსტა"
                value={booking.guest_email || "არ არის მითითებული"}
              />

              <InfoItem
                label="ტელეფონი"
                value={booking.guest_phone || "არ არის მითითებული"}
              />

              <InfoItem
                label="შექმნის თარიღი"
                value={
                  booking.created_at
                    ? new Date(booking.created_at).toLocaleDateString("ka-GE")
                    : "არ არის მითითებული"
                }
              />
            </div>

            {booking.notes && (
              <div className="mt-5 rounded-xl bg-slate-100 p-4">
                <p className="text-sm font-bold text-slate-500">
                  დამატებითი შეტყობინება
                </p>

                <p className="mt-2 whitespace-pre-line text-slate-700">
                  {booking.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}