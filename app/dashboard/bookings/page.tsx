"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Booking = {
  id: string;
  tour_id: number | string | null;
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
  id: number | string;
  title: string | null;
  user_id: string | null;
  image_url: string | null;
  location: string | null;
};

type PreparedBooking = Booking & {
  tour_title: string;
  tour_image: string | null;
  tour_location: string | null;
};

type ActiveTab = "my-bookings" | "received-bookings";

export default function DashboardBookingsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<ActiveTab>("my-bookings");

  const [myBookings, setMyBookings] = useState<PreparedBooking[]>([]);
  const [receivedBookings, setReceivedBookings] = useState<
    PreparedBooking[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setCurrentUserId(user.id);

    const { data: myBookingsData, error: myBookingsError } =
      await supabase
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (myBookingsError) {
      console.error("My bookings loading error:", myBookingsError);

      setErrorMessage(
        `ჩემი ჯავშნების ჩატვირთვა ვერ მოხერხდა: ${myBookingsError.message}`
      );

      setLoading(false);
      return;
    }

    const { data: ownerToursData, error: ownerToursError } =
      await supabase
        .from("tours")
        .select("id, title, user_id, image_url, location")
        .eq("user_id", user.id);

    if (ownerToursError) {
      console.error("Owner tours loading error:", ownerToursError);

      setErrorMessage(
        `თქვენი ტურების ჩატვირთვა ვერ მოხერხდა: ${ownerToursError.message}`
      );

      setLoading(false);
      return;
    }

    const ownerTours = (ownerToursData as Tour[] | null) ?? [];
    const ownerTourIds = ownerTours.map((tour) => tour.id);

    let receivedBookingsData: Booking[] = [];

    if (ownerTourIds.length > 0) {
      const { data, error } = await supabase
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
        .in("tour_id", ownerTourIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Received bookings loading error:", error);

        setErrorMessage(
          `მიღებული ჯავშნების ჩატვირთვა ვერ მოხერხდა: ${error.message}`
        );

        setLoading(false);
        return;
      }

      receivedBookingsData = (data as Booking[] | null) ?? [];
    }

    const myBookingRows =
      (myBookingsData as Booking[] | null) ?? [];

    const allTourIds = Array.from(
      new Set(
        [...myBookingRows, ...receivedBookingsData]
          .map((booking) => booking.tour_id)
          .filter(
            (tourId): tourId is number | string =>
              tourId !== null && tourId !== undefined
          )
      )
    );

    let allTours: Tour[] = [];

    if (allTourIds.length > 0) {
      const { data: toursData, error: toursError } = await supabase
        .from("tours")
        .select("id, title, user_id, image_url, location")
        .in("id", allTourIds);

      if (toursError) {
        console.error("Tours information error:", toursError);

        setErrorMessage(
          `ტურების ინფორმაციის ჩატვირთვა ვერ მოხერხდა: ${toursError.message}`
        );

        setLoading(false);
        return;
      }

      allTours = (toursData as Tour[] | null) ?? [];
    }

    const tourMap = new Map(
      allTours.map((tour) => [String(tour.id), tour])
    );

    const prepareBookings = (
      bookingRows: Booking[]
    ): PreparedBooking[] =>
      bookingRows.map((booking) => {
        const tour = booking.tour_id
          ? tourMap.get(String(booking.tour_id))
          : undefined;

        return {
          ...booking,
          tour_title: tour?.title || "უცნობი ტური",
          tour_image: tour?.image_url || null,
          tour_location: tour?.location || null,
        };
      });

    setMyBookings(prepareBookings(myBookingRows));
    setReceivedBookings(prepareBookings(receivedBookingsData));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function updateReceivedBookingStatus(
    bookingId: string,
    newStatus: "confirmed" | "rejected"
  ) {
    setUpdatingId(bookingId);
    setErrorMessage("");
    setSuccessMessage("");

    const booking = receivedBookings.find(
      (item) => item.id === bookingId
    );

    if (!booking?.tour_id) {
      setErrorMessage("ჯავშნის ტური ვერ მოიძებნა.");
      setUpdatingId(null);
      return;
    }

    const { data: ownerTour, error: ownerTourError } = await supabase
      .from("tours")
      .select("id")
      .eq("id", booking.tour_id)
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (ownerTourError || !ownerTour) {
      setErrorMessage(
        "ამ ჯავშნის სტატუსის შეცვლის უფლება არ გაქვს."
      );

      setUpdatingId(null);
      return;
    }

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      console.error("Booking update error:", error);

      setErrorMessage(
        `ჯავშნის სტატუსის შეცვლა ვერ მოხერხდა: ${error.message}`
      );

      setUpdatingId(null);
      return;
    }

    setReceivedBookings((currentBookings) =>
      currentBookings.map((item) =>
        item.id === bookingId
          ? { ...item, status: newStatus }
          : item
      )
    );

    setSuccessMessage(
      newStatus === "confirmed"
        ? "ჯავშანი წარმატებით დადასტურდა."
        : "ჯავშანი უარყოფილია."
    );

    setUpdatingId(null);
  }

  async function cancelMyBooking(booking: PreparedBooking) {
    if (booking.status !== "pending") {
      setErrorMessage(
        "შეგიძლია მხოლოდ მოლოდინში მყოფი ჯავშნის გაუქმება."
      );
      return;
    }

    const confirmed = window.confirm(
      `ნამდვილად გინდა ჯავშნის გაუქმება?\n\nტური: ${booking.tour_title}`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingId(booking.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id)
      .eq("user_id", currentUserId)
      .eq("status", "pending");

    if (error) {
      console.error("Booking cancellation error:", error);

      setErrorMessage(
        `ჯავშნის გაუქმება ვერ მოხერხდა: ${error.message}`
      );

      setUpdatingId(null);
      return;
    }

    setMyBookings((currentBookings) =>
      currentBookings.map((item) =>
        item.id === booking.id
          ? { ...item, status: "cancelled" }
          : item
      )
    );

    setSuccessMessage("ჯავშანი წარმატებით გაუქმდა.");
    setUpdatingId(null);
  }

  const visibleBookings = useMemo(
    () =>
      activeTab === "my-bookings"
        ? myBookings
        : receivedBookings,
    [activeTab, myBookings, receivedBookings]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">📅</div>

          <p className="mt-4 text-lg font-semibold">
            ჯავშნები იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              მომხმარებლის პანელი
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              📅 ჯავშნები
            </h1>

            <p className="mt-3 text-white/60">
              ნახე შენი ჯავშნები და შენს ტურებზე მიღებული მოთხოვნები.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tours"
              className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
            >
              ტურების ნახვა
            </Link>

            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("my-bookings")}
            className={`rounded-2xl px-5 py-4 text-left font-bold transition ${
              activeTab === "my-bookings"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-white/65 hover:bg-white/10"
            }`}
          >
            <span className="block text-lg">🎫 ჩემი ჯავშნები</span>

            <span className="mt-1 block text-sm opacity-70">
              რაოდენობა: {myBookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("received-bookings")}
            className={`rounded-2xl px-5 py-4 text-left font-bold transition ${
              activeTab === "received-bookings"
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-white/65 hover:bg-white/10"
            }`}
          >
            <span className="block text-lg">
              📥 მიღებული ჯავშნები
            </span>

            <span className="mt-1 block text-sm opacity-70">
              რაოდენობა: {receivedBookings.length}
            </span>
          </button>
        </section>

        {errorMessage && (
          <div className="mt-7 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 font-semibold text-red-200">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-7 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 font-semibold text-emerald-200">
            ✅ {successMessage}
          </div>
        )}

        {visibleBookings.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-12 text-center shadow-2xl">
            <div className="text-7xl">
              {activeTab === "my-bookings" ? "🎫" : "📭"}
            </div>

            <h2 className="mt-5 text-3xl font-black">
              {activeTab === "my-bookings"
                ? "ჯავშნები ჯერ არ გაქვს"
                : "მიღებული ჯავშნები ჯერ არ არის"}
            </h2>

            <p className="mt-3 text-white/60">
              {activeTab === "my-bookings"
                ? "ტურების გვერდიდან დაჯავშნე სასურველი ტური."
                : "როდესაც სტუმარი შენს ტურს დაჯავშნის, მოთხოვნა აქ გამოჩნდება."}
            </p>

            {activeTab === "my-bookings" && (
              <Link
                href="/tours"
                className="mt-7 inline-flex rounded-2xl bg-cyan-500 px-7 py-4 font-bold transition hover:bg-cyan-600"
              >
                ტურების ნახვა
              </Link>
            )}
          </section>
        ) : (
          <section className="mt-8 space-y-6">
            {visibleBookings.map((booking) => {
              const status = booking.status || "pending";
              const isPending = status === "pending";
              const isUpdating = updatingId === booking.id;

              return (
                <article
                  key={booking.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white text-slate-900 shadow-2xl"
                >
                  <div className="grid md:grid-cols-[240px_1fr]">
                    <div className="relative min-h-[220px] bg-slate-200">
                      {booking.tour_image ? (
                        <img
                          src={booking.tour_image}
                          alt={booking.tour_title}
                          className="h-full min-h-[220px] w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-[220px] items-center justify-center bg-slate-800 text-7xl">
                          🏔️
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide text-cyan-600">
                            {booking.tour_title}
                          </p>

                          <h2 className="mt-2 text-2xl font-black">
                            {activeTab === "my-bookings"
                              ? booking.tour_location ||
                                "მდებარეობა არ არის მითითებული"
                              : booking.guest_name || "სტუმარი"}
                          </h2>
                        </div>

                        <BookingStatus status={booking.status} />
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <InfoItem
                          label="ტურის თარიღი"
                          value={
                            booking.booking_date ||
                            "არ არის მითითებული"
                          }
                        />

                        <InfoItem
                          label="ადამიანების რაოდენობა"
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

                        {activeTab === "received-bookings" && (
                          <>
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
                          </>
                        )}

                        <InfoItem
                          label="მოთხოვნის თარიღი"
                          value={formatDate(booking.created_at)}
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

                      {activeTab === "my-bookings" &&
                        isPending && (
                          <div className="mt-6 border-t border-slate-200 pt-6">
                            <button
                              type="button"
                              onClick={() =>
                                cancelMyBooking(booking)
                              }
                              disabled={isUpdating}
                              className="rounded-2xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isUpdating
                                ? "მუშავდება..."
                                : "ჯავშნის გაუქმება"}
                            </button>
                          </div>
                        )}

                      {activeTab === "received-bookings" &&
                        isPending && (
                          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
                            <button
                              type="button"
                              onClick={() =>
                                updateReceivedBookingStatus(
                                  booking.id,
                                  "confirmed"
                                )
                              }
                              disabled={isUpdating}
                              className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isUpdating
                                ? "მუშავდება..."
                                : "✅ დადასტურება"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateReceivedBookingStatus(
                                  booking.id,
                                  "rejected"
                                )
                              }
                              disabled={isUpdating}
                              className="rounded-2xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isUpdating
                                ? "მუშავდება..."
                                : "❌ უარყოფა"}
                            </button>
                          </div>
                        )}
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

  if (normalizedStatus === "rejected") {
    return (
      <span className="w-fit rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
        უარყოფილი
      </span>
    );
  }

  if (normalizedStatus === "cancelled") {
    return (
      <span className="w-fit rounded-full bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
        გაუქმებული
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

function formatDate(value: string | null) {
  if (!value) {
    return "არ არის მითითებული";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}