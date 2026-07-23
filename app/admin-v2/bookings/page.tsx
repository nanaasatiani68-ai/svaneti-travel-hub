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
};

type Profile = {
  id: string;
  full_name: string | null;
};

type AdminBooking = Booking & {
  tour_title: string;
  owner_name: string;
};

type StatusFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled";

export default function AdminBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadAllBookings = useCallback(async () => {
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

    const { data: currentProfile, error: profileError } =
      await supabase
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

    const role = String(
      currentProfile?.role || ""
    ).toLowerCase();

    if (role !== "director" && role !== "admin") {
      setErrorMessage(
        "ამ გვერდზე წვდომა მხოლოდ ადმინისტრატორს აქვს."
      );

      setLoading(false);
      return;
    }

    const { data: bookingsData, error: bookingsError } =
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
        .order("created_at", { ascending: false });

    if (bookingsError) {
      console.error("Bookings loading error:", bookingsError);

      setErrorMessage(
        `ჯავშნების ჩატვირთვა ვერ მოხერხდა: ${bookingsError.message}`
      );

      setLoading(false);
      return;
    }

    const bookingRows =
      (bookingsData as Booking[] | null) ?? [];

    const tourIds = Array.from(
      new Set(
        bookingRows
          .map((booking) => booking.tour_id)
          .filter(
            (tourId): tourId is number | string =>
              tourId !== null && tourId !== undefined
          )
      )
    );

    let tours: Tour[] = [];

    if (tourIds.length > 0) {
      const { data: toursData, error: toursError } =
        await supabase
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

      tours = (toursData as Tour[] | null) ?? [];
    }

    const ownerIds = Array.from(
      new Set(
        tours
          .map((tour) => tour.user_id)
          .filter((ownerId): ownerId is string =>
            Boolean(ownerId)
          )
      )
    );

    let profiles: Profile[] = [];

    if (ownerIds.length > 0) {
      const { data: profilesData, error: profilesError } =
        await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ownerIds);

      if (profilesError) {
        console.error("Owners loading error:", profilesError);
      } else {
        profiles =
          (profilesData as Profile[] | null) ?? [];
      }
    }

    const tourMap = new Map(
      tours.map((tour) => [String(tour.id), tour])
    );

    const ownerMap = new Map(
      profiles.map((profile) => [
        profile.id,
        profile.full_name || "უცნობი მფლობელი",
      ])
    );

    const preparedBookings: AdminBooking[] =
      bookingRows.map((booking) => {
        const tour = booking.tour_id
          ? tourMap.get(String(booking.tour_id))
          : undefined;

        return {
          ...booking,
          tour_title: tour?.title || "უცნობი ტური",
          owner_name: tour?.user_id
            ? ownerMap.get(tour.user_id) ||
              "უცნობი მფლობელი"
            : "მფლობელი არ არის მითითებული",
        };
      });

    setBookings(preparedBookings);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadAllBookings();
  }, [loadAllBookings]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const status = booking.status || "pending";

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        booking.tour_title
          .toLowerCase()
          .includes(normalizedSearch) ||
        booking.owner_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(booking.guest_name || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(booking.guest_email || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(booking.guest_phone || "")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  async function updateBookingStatus(
    bookingId: string,
    newStatus:
      | "confirmed"
      | "rejected"
      | "pending"
      | "cancelled"
  ) {
    setUpdatingId(bookingId);
    setErrorMessage("");
    setSuccessMessage("");

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

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status: newStatus }
          : booking
      )
    );

    if (newStatus === "confirmed") {
      setSuccessMessage("ჯავშანი დადასტურდა.");
    } else if (newStatus === "rejected") {
      setSuccessMessage("ჯავშანი უარყოფილია.");
    } else if (newStatus === "cancelled") {
      setSuccessMessage("ჯავშანი გაუქმდა.");
    } else {
      setSuccessMessage(
        "ჯავშანი დაბრუნდა მოლოდინის სტატუსზე."
      );
    }

    setUpdatingId(null);
  }

  const pendingCount = bookings.filter(
    (booking) => (booking.status || "pending") === "pending"
  ).length;

  const confirmedCount = bookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;

  const rejectedCount = bookings.filter(
    (booking) => booking.status === "rejected"
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="text-6xl">📅</div>

          <p className="mt-4 text-lg font-semibold text-slate-600">
            ჯავშნები იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Admin V2
            </p>

            <h1 className="mt-2 text-4xl font-black text-slate-900">
              📅 ყველა ჯავშანი
            </h1>

            <p className="mt-3 text-slate-500">
              მართე საიტზე მიღებული ყველა ტურის ჯავშანი.
            </p>
          </div>

          <Link
            href="/admin-v2"
            className="w-fit rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-800"
          >
            ← Admin Dashboard
          </Link>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="სულ ჯავშანი"
            value={bookings.length}
            icon="📋"
          />

          <StatsCard
            title="მოლოდინში"
            value={pendingCount}
            icon="⏳"
          />

          <StatsCard
            title="დადასტურებული"
            value={confirmedCount}
            icon="✅"
          />

          <StatsCard
            title="უარყოფილი"
            value={rejectedCount}
            icon="❌"
          />
        </section>

        <section className="mt-6 grid gap-4 rounded-3xl bg-white p-5 shadow-lg md:grid-cols-[1fr_260px]">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="მოძებნე სტუმარი, ტური, მფლობელი..."
            className="rounded-2xl border border-slate-200 px-5 py-3 text-slate-900 outline-none focus:border-cyan-500"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as StatusFilter
              )
            }
            className="rounded-2xl border border-slate-200 px-5 py-3 text-slate-900 outline-none focus:border-cyan-500"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="pending">მოლოდინში</option>
            <option value="confirmed">დადასტურებული</option>
            <option value="rejected">უარყოფილი</option>
            <option value="cancelled">გაუქმებული</option>
          </select>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 font-semibold text-emerald-700">
            ✅ {successMessage}
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <section className="mt-8 rounded-3xl bg-white p-12 text-center shadow-lg">
            <div className="text-7xl">📭</div>

            <h2 className="mt-5 text-3xl font-black text-slate-900">
              ჯავშანი ვერ მოიძებნა
            </h2>

            <p className="mt-3 text-slate-500">
              შეცვალე ძიება ან სტატუსის ფილტრი.
            </p>
          </section>
        ) : (
          <section className="mt-8 space-y-6">
            {filteredBookings.map((booking) => {
              const isUpdating =
                updatingId === booking.id;

              return (
                <article
                  key={booking.id}
                  className="rounded-3xl bg-white p-6 text-slate-900 shadow-lg"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-cyan-600">
                        {booking.tour_title}
                      </p>

                      <h2 className="mt-2 text-2xl font-black">
                        {booking.guest_name || "სტუმარი"}
                      </h2>

                      <div className="mt-3 space-y-1 text-sm text-slate-500">
                        <p>
                          ტურის მფლობელი:{" "}
                          <strong className="text-slate-700">
                            {booking.owner_name}
                          </strong>
                        </p>

                        <p>
                          ტურის ID:{" "}
                          {booking.tour_id ?? "არ არის"}
                        </p>
                      </div>
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

                  <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateBookingStatus(
                          booking.id,
                          "confirmed"
                        )
                      }
                      className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ✅ დადასტურება
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateBookingStatus(
                          booking.id,
                          "rejected"
                        )
                      }
                      className="rounded-2xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ❌ უარყოფა
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateBookingStatus(
                          booking.id,
                          "pending"
                        )
                      }
                      className="rounded-2xl bg-amber-500 px-6 py-3 font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ⏳ მოლოდინში დაბრუნება
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateBookingStatus(
                          booking.id,
                          "cancelled"
                        )
                      }
                      className="rounded-2xl bg-slate-600 px-6 py-3 font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      🚫 გაუქმება
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
          </section>
        )}
      </div>
    </main>
  );
}

function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-lg">
      <div className="text-3xl">{icon}</div>

      <p className="mt-4 text-sm font-bold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black text-slate-900">
        {value}
      </p>
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