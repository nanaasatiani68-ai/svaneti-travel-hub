"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Tour = {
  id: number;
  title: string | null;
};

type Booking = {
  id: string;
  tour_id: number;
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

type BookingWithTour = Booking & {
  tour_title: string;
};

export default function DashboardBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadOwnerBookings() {
      setLoading(true);
      setErrorMessage("");

      // შესული მომხმარებლის მიღება
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage(
          "ჯავშნების სანახავად საჭიროა ავტორიზაცია."
        );
        setLoading(false);
        return;
      }

      // ჯერ ვპოულობთ ამ მომხმარებლის ტურებს
      const { data: toursData, error: toursError } =
        await supabase
          .from("tours")
          .select("id, title")
          .eq("user_id", user.id);

      if (toursError) {
        console.error("Tours loading error:", toursError);
        setErrorMessage(
          `თქვენი ტურების ჩატვირთვა ვერ მოხერხდა: ${toursError.message}`
        );
        setLoading(false);
        return;
      }

      const ownerTours = (toursData ?? []) as Tour[];

      if (ownerTours.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const tourIds = ownerTours.map((tour) => tour.id);

      // შემდეგ ვიღებთ მხოლოდ ამ ტურებზე შემოსულ ჯავშნებს
      const { data: bookingsData, error: bookingsError } =
        await supabase
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
          .in("tour_id", tourIds)
          .order("created_at", { ascending: false });

      if (bookingsError) {
        console.error(
          "Bookings loading error:",
          bookingsError
        );

        setErrorMessage(
          `ჯავშნების ჩატვირთვა ვერ მოხერხდა: ${bookingsError.message}`
        );

        setLoading(false);
        return;
      }

      const tourTitleMap = new Map(
        ownerTours.map((tour) => [
          tour.id,
          tour.title || "უსახელო ტური",
        ])
      );

      const preparedBookings: BookingWithTour[] = (
        (bookingsData ?? []) as Booking[]
      ).map((booking) => ({
        ...booking,
        tour_title:
          tourTitleMap.get(booking.tour_id) ||
          "უცნობი ტური",
      }));

      setBookings(preparedBookings);
      setLoading(false);
    }

    loadOwnerBookings();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="mb-6 text-3xl font-bold">
          🗓️ მიღებული ჯავშნები
        </h1>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-slate-600">
            ჯავშნები იტვირთება...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          🗓️ მიღებული ჯავშნები
        </h1>

        <p className="mt-2 text-slate-500">
          აქ ჩანს მხოლოდ თქვენს ტურებზე შემოსული
          მოთხოვნები.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {errorMessage}
        </div>
      )}

      {!errorMessage && bookings.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center shadow">
          <div className="mb-4 text-6xl">📭</div>

          <h2 className="text-2xl font-bold text-slate-900">
            მიღებული ჯავშნები ჯერ არ გაქვთ
          </h2>

          <p className="mt-3 text-slate-500">
            როდესაც სტუმარი თქვენს ტურს დაჯავშნის,
            მოთხოვნა აქ გამოჩნდება.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {bookings.map((booking) => (
          <article
            key={booking.id}
            className="rounded-3xl bg-white p-6 text-slate-900 shadow-lg"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-cyan-600">
                  {booking.tour_title}
                </p>

                <h2 className="mt-2 text-2xl font-extrabold">
                  {booking.guest_name || "სტუმარი"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  ტურის ID: {booking.tour_id}
                </p>
              </div>

              <BookingStatus status={booking.status} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                label="ტურის თარიღი"
                value={
                  booking.booking_date ||
                  "არ არის მითითებული"
                }
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
                    ? `${Number(
                        booking.total_price
                      ).toLocaleString()} ₾`
                    : "შეთანხმებით"
                }
              />

              <InfoItem
                label="ელფოსტა"
                value={
                  booking.guest_email ||
                  "არ არის მითითებული"
                }
              />

              <InfoItem
                label="ტელეფონი"
                value={
                  booking.guest_phone ||
                  "არ არის მითითებული"
                }
              />

              <InfoItem
                label="მოთხოვნის თარიღი"
                value={
                  booking.created_at
                    ? new Date(
                        booking.created_at
                      ).toLocaleDateString("ka-GE")
                    : "არ არის მითითებული"
                }
              />
            </div>

            {booking.notes && (
              <div className="mt-6 rounded-2xl bg-slate-100 p-5">
                <p className="text-sm font-bold text-slate-500">
                  დამატებითი შეტყობინება
                </p>

                <p className="mt-2 whitespace-pre-line text-slate-700">
                  {booking.notes}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function BookingStatus({
  status,
}: {
  status: string | null;
}) {
  const normalizedStatus = status || "pending";

  if (
    normalizedStatus === "approved" ||
    normalizedStatus === "confirmed"
  ) {
    return (
      <span className="w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
        დადასტურებული
      </span>
    );
  }

  if (
    normalizedStatus === "rejected" ||
    normalizedStatus === "cancelled"
  ) {
    return (
      <span className="w-fit rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
        უარყოფილი
      </span>
    );
  }

  return (
    <span className="w-fit rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
      მოლოდინში
    </span>
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
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}