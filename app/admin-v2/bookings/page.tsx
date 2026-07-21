"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Booking = {
  id: string;
  tour_id: number | null;
  user_id: string | null;
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

type Tour = {
  id: number;
  title: string | null;
  user_id: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email?: string | null;
};

type AdminBooking = Booking & {
  tour_title: string;
  owner_name: string;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadAllBookings() {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage("ადმინისტრატორის ავტორიზაცია საჭიროა.");
      setLoading(false);
      return;
    }

    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile loading error:", profileError);
      setErrorMessage(
        `ადმინისტრატორის პროფილის შემოწმება ვერ მოხერხდა: ${profileError.message}`
      );
      setLoading(false);
      return;
    }

    const role = String(currentProfile?.role || "").toLowerCase();

    if (role !== "director" && role !== "admin") {
      setErrorMessage("ამ გვერდზე წვდომა მხოლოდ ადმინისტრატორს აქვს.");
      setLoading(false);
      return;
    }

    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
          id,
          tour_id,
          user_id,
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
      .order("created_at", { ascending: false });

    if (bookingsError) {
      console.error("Bookings loading error:", bookingsError);
      setErrorMessage(
        `ჯავშნების ჩატვირთვა ვერ მოხერხდა: ${bookingsError.message}`
      );
      setLoading(false);
      return;
    }

    const bookingsList = (bookingsData ?? []) as Booking[];

    if (bookingsList.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const tourIds = Array.from(
      new Set(
        bookingsList
          .map((booking) => booking.tour_id)
          .filter((id): id is number => id !== null)
      )
    );

    let toursList: Tour[] = [];

    if (tourIds.length > 0) {
      const { data: toursData, error: toursError } = await supabase
        .from("tours")
        .select("id, title, user_id")
        .in("id", tourIds);

      if (toursError) {
        console.error("Tours loading error:", toursError);
        setErrorMessage(
          `ტურების ინფორმაციის ჩატვირთვა ვერ მოხერხდა: ${toursError.message}`
        );
        setLoading(false);
        return;
      }

      toursList = (toursData ?? []) as Tour[];
    }

    const ownerIds = Array.from(
      new Set(
        toursList
          .map((tour) => tour.user_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    let profilesList: Profile[] = [];

    if (ownerIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds);

      if (profilesError) {
        console.error("Owners loading error:", profilesError);
      } else {
        profilesList = (profilesData ?? []) as Profile[];
      }
    }

    const tourMap = new Map(
      toursList.map((tour) => [
        tour.id,
        {
          title: tour.title || "უსახელო ტური",
          ownerId: tour.user_id,
        },
      ])
    );

    const ownerMap = new Map(
      profilesList.map((profile) => [
        profile.id,
        profile.full_name || "უცნობი მფლობელი",
      ])
    );

    const preparedBookings: AdminBooking[] = bookingsList.map((booking) => {
      const tour = booking.tour_id
        ? tourMap.get(booking.tour_id)
        : undefined;

      return {
        ...booking,
        tour_title: tour?.title || "უცნობი ტური",
        owner_name: tour?.ownerId
          ? ownerMap.get(tour.ownerId) || "უცნობი მფლობელი"
          : "მფლობელი არ არის მითითებული",
      };
    });

    setBookings(preparedBookings);
    setLoading(false);
  }

  useEffect(() => {
    loadAllBookings();
  }, []);

  async function updateBookingStatus(
    bookingId: string,
    newStatus: "confirmed" | "rejected" | "pending"
  ) {
    setUpdatingId(bookingId);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("bookings")
      .update({
        status: newStatus,
      })
      .eq("id", bookingId);

    if (error) {
      console.error("Booking update error:", error);
      setErrorMessage(
        `ჯავშნის სტატუსის შეცვლა ვერ მოხერხდა: ${error.message}`
      );
      setUpdatingId(null);
      return;
    }

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              status: newStatus,
            }
          : booking
      )
    );

    if (newStatus === "confirmed") {
      setSuccessMessage("ჯავშანი დადასტურდა.");
    } else if (newStatus === "rejected") {
      setSuccessMessage("ჯავშანი უარყოფილია.");
    } else {
      setSuccessMessage("ჯავშანი დაბრუნდა მოლოდინის სტატუსზე.");
    }

    setUpdatingId(null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="mb-6 text-3xl font-bold">
          🗓️ ყველა ჯავშანი
        </h1>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-slate-600">ჯავშნები იტვირთება...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">
          Admin V2
        </p>

        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
          🗓️ ყველა ჯავშანი
        </h1>

        <p className="mt-2 text-slate-500">
          აქ ჩანს საიტზე მიღებული ყველა ტურის ჯავშანი.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 font-semibold text-emerald-700">
          ✅ {successMessage}
        </div>
      )}

      {!errorMessage && bookings.length === 0 && (
        <div className="rounded-3xl bg-white p-10 text-center shadow">
          <div className="mb-4 text-6xl">📭</div>

          <h2 className="text-2xl font-bold text-slate-900">
            ჯავშნები ჯერ არ არის
          </h2>

          <p className="mt-3 text-slate-500">
            ახალი ჯავშნები აქ ავტომატურად გამოჩნდება.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {bookings.map((booking) => {
          const isUpdating = updatingId === booking.id;

          return (
            <article
              key={booking.id}
              className="rounded-3xl bg-white p-6 text-slate-900 shadow-lg"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-cyan-600">
                    {booking.tour_title}
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold">
                    {booking.guest_name || "სტუმარი"}
                  </h2>

                  <div className="mt-3 space-y-1 text-sm text-slate-500">
                    <p>
                      ტურის მფლობელი:{" "}
                      <strong className="text-slate-700">
                        {booking.owner_name}
                      </strong>
                    </p>

                    <p>ტურის ID: {booking.tour_id ?? "არ არის"}</p>
                  </div>
                </div>

                <BookingStatus status={booking.status} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                      ? `${Number(
                          booking.total_price
                        ).toLocaleString()} ₾`
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
                  label="მოთხოვნის თარიღი"
                  value={
                    booking.created_at
                      ? new Date(booking.created_at).toLocaleString("ka-GE")
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

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    updateBookingStatus(booking.id, "confirmed")
                  }
                  className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ✅ დადასტურება
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    updateBookingStatus(booking.id, "rejected")
                  }
                  className="rounded-2xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ❌ უარყოფა
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    updateBookingStatus(booking.id, "pending")
                  }
                  className="rounded-2xl bg-amber-500 px-6 py-3 font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ⏳ მოლოდინში დაბრუნება
                </button>

                {isUpdating && (
                  <p className="self-center text-sm font-semibold text-slate-500">
                    მუშავდება...
                  </p>
                )}
              </div>
            </article>
          );
        })}
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
    normalizedStatus === "confirmed" ||
    normalizedStatus === "approved"
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