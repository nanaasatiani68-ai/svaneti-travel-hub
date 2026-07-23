"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UserRole = "Director" | "Admin";

type NormalizedStatus =
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "pending";

type AdminProfile = {
  full_name: string | null;
  role: string | null;
};

type Booking = {
  id: string;
  tour_id: number | string | null;
  guest_name: string | null;
  guest_email: string | null;
  booking_date: string | null;
  people: number | null;
  total_price: number | null;
  status: string | null;
  created_at: string | null;
};

type Tour = {
  id: number | string;
  title: string | null;
  location: string | null;
  price: number | null;
  status: string | null;
  created_at: string | null;
};

type LatestBooking = Booking & {
  tour_title: string;
};

type MonthlyRevenue = {
  key: string;
  label: string;
  revenue: number;
  bookings: number;
};

type DashboardStats = {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  rejectedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;

  totalUsers: number;

  totalTours: number;
  pendingTours: number;
  approvedTours: number;
  rejectedTours: number;

  totalTransfers: number;
  pendingTransfers: number;
  approvedTransfers: number;

  totalHotels: number;
  pendingHotels: number;
  approvedHotels: number;

  todayBookings: number;
  todayConfirmedBookings: number;
  todayPendingBookings: number;
  todayRevenue: number;
};

const initialStats: DashboardStats = {
  totalBookings: 0,
  pendingBookings: 0,
  confirmedBookings: 0,
  rejectedBookings: 0,
  cancelledBookings: 0,
  totalRevenue: 0,

  totalUsers: 0,

  totalTours: 0,
  pendingTours: 0,
  approvedTours: 0,
  rejectedTours: 0,

  totalTransfers: 0,
  pendingTransfers: 0,
  approvedTransfers: 0,

  totalHotels: 0,
  pendingHotels: 0,
  approvedHotels: 0,

  todayBookings: 0,
  todayConfirmedBookings: 0,
  todayPendingBookings: 0,
  todayRevenue: 0,
};

export default function AdminV2Page() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);

  const [stats, setStats] =
    useState<DashboardStats>(initialStats);

  const [latestBookings, setLatestBookings] = useState<
    LatestBooking[]
  >([]);

  const [latestTours, setLatestTours] = useState<Tour[]>([]);

  const [monthlyRevenue, setMonthlyRevenue] = useState<
    MonthlyRevenue[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    null
  );

  const loadDashboard = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Admin profile loading error:",
          profileError
        );

        setErrorMessage(
          `ადმინისტრატორის პროფილი ვერ ჩაიტვირთა: ${profileError.message}`
        );

        setLoading(false);
        setRefreshing(false);
        return;
      }

      const profile = profileData as AdminProfile | null;

      const normalizedRole = String(profile?.role || "")
        .trim()
        .toLowerCase();

      let resolvedRole: UserRole | null = null;

      if (normalizedRole === "director") {
        resolvedRole = "Director";
      } else if (normalizedRole === "admin") {
        resolvedRole = "Admin";
      }

      if (!resolvedRole) {
        setErrorMessage(
          "ამ გვერდზე წვდომა მხოლოდ Director-ს ან Admin-ს აქვს."
        );

        setLoading(false);
        setRefreshing(false);
        return;
      }

      setRole(resolvedRole);

      setFullName(
        profile?.full_name ||
          user.user_metadata?.full_name ||
          "ადმინისტრატორი"
      );

      const [
        bookingsResult,
        toursResult,
        usersCountResult,
        transfersCountResult,
        pendingTransfersCountResult,
        approvedTransfersCountResult,
        hotelsCountResult,
        pendingHotelsCountResult,
        approvedHotelsCountResult,
      ] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            `
              id,
              tour_id,
              guest_name,
              guest_email,
              booking_date,
              people,
              total_price,
              status,
              created_at
            `
          )
          .order("created_at", { ascending: false })
          .limit(1000),

        supabase
          .from("tours")
          .select(
            `
              id,
              title,
              location,
              price,
              status,
              created_at
            `
          )
          .order("created_at", { ascending: false })
          .limit(1000),

        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("transfers")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("transfers")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("status", "pending"),

        supabase
          .from("transfers")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("status", "approved"),

        supabase
          .from("hotels")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("hotels")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("status", "pending"),

        supabase
          .from("hotels")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("status", "approved"),
      ]);

      if (bookingsResult.error) {
        console.error(
          "Bookings statistics error:",
          bookingsResult.error
        );
      }

      if (toursResult.error) {
        console.error(
          "Tours statistics error:",
          toursResult.error
        );
      }

      if (usersCountResult.error) {
        console.error(
          "Users count error:",
          usersCountResult.error
        );
      }

      if (transfersCountResult.error) {
        console.error(
          "Transfers count error:",
          transfersCountResult.error
        );
      }

      if (hotelsCountResult.error) {
        console.error(
          "Hotels count error:",
          hotelsCountResult.error
        );
      }

      const bookings =
        (bookingsResult.data as Booking[] | null) ?? [];

      const tours =
        (toursResult.data as Tour[] | null) ?? [];

      const pendingBookings = bookings.filter(
        (booking) =>
          normalizeStatus(booking.status) === "pending"
      );

      const confirmedBookings = bookings.filter(
        (booking) =>
          normalizeStatus(booking.status) === "confirmed"
      );

      const rejectedBookings = bookings.filter(
        (booking) =>
          normalizeStatus(booking.status) === "rejected"
      );

      const cancelledBookings = bookings.filter(
        (booking) =>
          normalizeStatus(booking.status) === "cancelled"
      );

      const totalRevenue = confirmedBookings.reduce(
        (sum, booking) =>
          sum + safeNumber(booking.total_price),
        0
      );

      const todayKey = getLocalDateKey(new Date());

      const todayBookings = bookings.filter(
        (booking) =>
          getDateKeyFromValue(booking.created_at) === todayKey
      );

      const todayConfirmedBookings = todayBookings.filter(
        (booking) =>
          normalizeStatus(booking.status) === "confirmed"
      );

      const todayPendingBookings = todayBookings.filter(
        (booking) =>
          normalizeStatus(booking.status) === "pending"
      );

      const todayRevenue = todayConfirmedBookings.reduce(
        (sum, booking) =>
          sum + safeNumber(booking.total_price),
        0
      );

      const pendingTours = tours.filter(
        (tour) =>
          normalizeStatus(tour.status) === "pending"
      );

      const approvedTours = tours.filter(
        (tour) =>
          normalizeStatus(tour.status) === "confirmed"
      );

      const rejectedTours = tours.filter(
        (tour) =>
          normalizeStatus(tour.status) === "rejected"
      );

      const latestBookingRows = bookings.slice(0, 6);

      const latestTourIds = Array.from(
        new Set(
          latestBookingRows
            .map((booking) => booking.tour_id)
            .filter(
              (
                tourId
              ): tourId is number | string =>
                tourId !== null && tourId !== undefined
            )
        )
      );

      const tourTitleMap = new Map<string, string>();

      tours.forEach((tour) => {
        tourTitleMap.set(
          String(tour.id),
          tour.title || "უსახელო ტური"
        );
      });

      if (latestTourIds.length > 0) {
        const missingTourIds = latestTourIds.filter(
          (tourId) =>
            !tourTitleMap.has(String(tourId))
        );

        if (missingTourIds.length > 0) {
          const { data: missingTours } = await supabase
            .from("tours")
            .select("id, title")
            .in("id", missingTourIds);

          const missingTourRows =
            (missingTours as
              | Array<{
                  id: number | string;
                  title: string | null;
                }>
              | null) ?? [];

          missingTourRows.forEach((tour) => {
            tourTitleMap.set(
              String(tour.id),
              tour.title || "უსახელო ტური"
            );
          });
        }
      }

      const preparedLatestBookings: LatestBooking[] =
        latestBookingRows.map((booking) => ({
          ...booking,
          tour_title: booking.tour_id
            ? tourTitleMap.get(String(booking.tour_id)) ||
              "უცნობი ტური"
            : "უცნობი ტური",
        }));

      setLatestBookings(preparedLatestBookings);
      setLatestTours(tours.slice(0, 5));

      setMonthlyRevenue(
        createMonthlyRevenueData(bookings)
      );

      setStats({
        totalBookings: bookings.length,
        pendingBookings: pendingBookings.length,
        confirmedBookings: confirmedBookings.length,
        rejectedBookings: rejectedBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalRevenue,

        totalUsers: usersCountResult.count ?? 0,

        totalTours: tours.length,
        pendingTours: pendingTours.length,
        approvedTours: approvedTours.length,
        rejectedTours: rejectedTours.length,

        totalTransfers:
          transfersCountResult.count ?? 0,
        pendingTransfers:
          pendingTransfersCountResult.count ?? 0,
        approvedTransfers:
          approvedTransfersCountResult.count ?? 0,

        totalHotels: hotelsCountResult.count ?? 0,
        pendingHotels:
          pendingHotelsCountResult.count ?? 0,
        approvedHotels:
          approvedHotelsCountResult.count ?? 0,

        todayBookings: todayBookings.length,
        todayConfirmedBookings:
          todayConfirmedBookings.length,
        todayPendingBookings:
          todayPendingBookings.length,
        todayRevenue,
      });

      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    },
    [router]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const firstName = useMemo(() => {
    const name = fullName.trim();

    if (!name) {
      return "ადმინისტრატორო";
    }

    return name.split(/\s+/)[0];
  }, [fullName]);

  const statCards = useMemo(
    () => [
      {
        title: "სულ ჯავშნები",
        value: formatNumber(stats.totalBookings),
        note: `${stats.pendingBookings} მოლოდინში`,
        icon: "📋",
        href: "/admin-v2/bookings",
        color: "from-sky-500 to-cyan-500",
        directorOnly: false,
      },
      {
        title: "დადასტურებული შემოსავალი",
        value: formatCurrency(stats.totalRevenue),
        note: `${stats.confirmedBookings} დადასტურებული ჯავშანი`,
        icon: "💰",
        href: "/admin-v2/payments",
        color: "from-emerald-500 to-green-500",
        directorOnly: true,
      },
      {
        title: "მომხმარებლები",
        value: formatNumber(stats.totalUsers),
        note: "რეგისტრირებული პროფილები",
        icon: "👥",
        href: "/admin-v2/users",
        color: "from-purple-500 to-violet-500",
        directorOnly: true,
      },
      {
        title: "სულ ტურები",
        value: formatNumber(stats.totalTours),
        note: `${stats.pendingTours} დასამტკიცებელი`,
        icon: "🏔️",
        href: "/admin-v2/tours",
        color: "from-orange-500 to-red-500",
        directorOnly: false,
      },
      {
        title: "ტრანსფერები",
        value: formatNumber(stats.totalTransfers),
        note: `${stats.pendingTransfers} დასამტკიცებელი`,
        icon: "🚐",
        href: "/admin-v2/transfers",
        color: "from-blue-500 to-indigo-500",
        directorOnly: false,
      },
      {
        title: "სასტუმროები",
        value: formatNumber(stats.totalHotels),
        note: `${stats.pendingHotels} დასამტკიცებელი`,
        icon: "🏨",
        href: "/admin-v2/hotels",
        color: "from-teal-500 to-emerald-500",
        directorOnly: false,
      },
    ],
    [stats]
  );

  const visibleStatCards = useMemo(() => {
    if (role === "Director") {
      return statCards;
    }

    return statCards.filter(
      (card) => !card.directorOnly
    );
  }, [role, statCards]);

  const maximumMonthlyRevenue = useMemo(() => {
    return Math.max(
      ...monthlyRevenue.map((item) => item.revenue),
      1
    );
  }, [monthlyRevenue]);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-86px)] items-center justify-center bg-[#07111d] px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">📊</div>

          <p className="mt-4 text-lg font-semibold">
            რეალური სტატისტიკა იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  if (!role) {
    return (
      <main className="flex min-h-[calc(100vh-86px)] items-center justify-center bg-[#07111d] px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center">
          <div className="text-7xl">⛔</div>

          <h1 className="mt-5 text-3xl font-black">
            წვდომა შეზღუდულია
          </h1>

          <p className="mt-3 text-white/65">
            {errorMessage}
          </p>

          <Link
            href="/dashboard"
            className="mt-7 inline-flex rounded-2xl bg-cyan-500 px-6 py-3 font-bold"
          >
            Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111d]">
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div>
              <span className="inline-flex rounded-full bg-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                🏔️ Georgia Travel Hub
              </span>

              <h1 className="mt-5 text-4xl font-black text-white sm:text-5xl">
                კეთილი იყოს შენი დაბრუნება, {firstName} 👋
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    role === "Director"
                      ? "bg-violet-500/20 text-violet-200"
                      : "bg-cyan-500/20 text-cyan-200"
                  }`}
                >
                  {role === "Director"
                    ? "👑 Director"
                    : "🛡️ Admin"}
                </span>

                <span className="text-sm text-white/55">
                  მონაცემები პირდაპირ Supabase-იდან
                </span>
              </div>

              {lastUpdated && (
                <p className="mt-4 text-sm text-white/40">
                  ბოლო განახლება:{" "}
                  {lastUpdated.toLocaleString("ka-GE")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="w-fit rounded-2xl bg-cyan-500 px-6 py-3 font-black text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing
                ? "ახლდება..."
                : "🔄 სტატისტიკის განახლება"}
            </button>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 font-semibold text-red-200">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleStatCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group rounded-3xl bg-gradient-to-br p-6 text-white shadow-2xl transition duration-300 hover:-translate-y-1 ${card.color}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-white/80">
                    {card.title}
                  </p>

                  <h2 className="mt-3 text-4xl font-black">
                    {card.value}
                  </h2>

                  <p className="mt-3 text-sm text-white/75">
                    {card.note}
                  </p>
                </div>

                <div className="text-5xl transition group-hover:scale-110">
                  {card.icon}
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black text-white">
                  📈 ბოლო 6 თვის შემოსავალი
                </h2>

                <p className="mt-2 text-sm text-white/50">
                  ითვლება მხოლოდ დადასტურებული ჯავშნებიდან
                </p>
              </div>

              <p className="text-xl font-black text-emerald-300">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>

            <div className="mt-8 flex h-80 items-end gap-3">
              {monthlyRevenue.map((item) => {
                const heightPercentage =
                  item.revenue > 0
                    ? Math.max(
                        8,
                        (item.revenue /
                          maximumMonthlyRevenue) *
                          100
                      )
                    : 3;

                return (
                  <div
                    key={item.key}
                    className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  >
                    <div className="mb-3 text-center">
                      <p className="truncate text-xs font-bold text-cyan-200 sm:text-sm">
                        {formatCompactCurrency(item.revenue)}
                      </p>

                      <p className="mt-1 text-[10px] text-white/35">
                        {item.bookings} ჯავშანი
                      </p>
                    </div>

                    <div className="flex h-[220px] items-end">
                      <div
                        style={{
                          height: `${heightPercentage}%`,
                        }}
                        className="w-full rounded-t-2xl bg-gradient-to-t from-cyan-600 to-sky-400 shadow-xl transition hover:opacity-80"
                      />
                    </div>

                    <p className="mt-3 truncate text-center text-xs font-bold text-white/60 sm:text-sm">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="text-2xl font-black text-white">
              📅 დღევანდელი შედეგები
            </h2>

            <div className="mt-6 space-y-4">
              <TodayItem
                icon="📋"
                label="ახალი ჯავშნები"
                value={formatNumber(stats.todayBookings)}
              />

              <TodayItem
                icon="✅"
                label="დადასტურებული"
                value={formatNumber(
                  stats.todayConfirmedBookings
                )}
              />

              <TodayItem
                icon="⏳"
                label="მოლოდინში"
                value={formatNumber(
                  stats.todayPendingBookings
                )}
              />

              {role === "Director" && (
                <TodayItem
                  icon="💰"
                  label="შემოსავალი"
                  value={formatCurrency(
                    stats.todayRevenue
                  )}
                />
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="ტურები"
            icon="🏔️"
            total={stats.totalTours}
            approved={stats.approvedTours}
            pending={stats.pendingTours}
            rejected={stats.rejectedTours}
            href="/admin-v2/tours"
          />

          <StatusCard
            title="ჯავშნები"
            icon="📋"
            total={stats.totalBookings}
            approved={stats.confirmedBookings}
            pending={stats.pendingBookings}
            rejected={stats.rejectedBookings}
            href="/admin-v2/bookings"
          />

          <StatusCard
            title="ტრანსფერები"
            icon="🚐"
            total={stats.totalTransfers}
            approved={stats.approvedTransfers}
            pending={stats.pendingTransfers}
            rejected={Math.max(
              stats.totalTransfers -
                stats.approvedTransfers -
                stats.pendingTransfers,
              0
            )}
            href="/admin-v2/transfers"
          />

          <StatusCard
            title="სასტუმროები"
            icon="🏨"
            total={stats.totalHotels}
            approved={stats.approvedHotels}
            pending={stats.pendingHotels}
            rejected={Math.max(
              stats.totalHotels -
                stats.approvedHotels -
                stats.pendingHotels,
              0
            )}
            href="/admin-v2/hotels"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-white">
                📋 ბოლო ჯავშნები
              </h2>

              <Link
                href="/admin-v2/bookings"
                className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
              >
                ყველას ნახვა →
              </Link>
            </div>

            {latestBookings.length === 0 ? (
              <EmptyBox
                icon="📭"
                text="ჯავშნები ჯერ არ არის"
              />
            ) : (
              <div className="mt-6 space-y-4">
                {latestBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <h3 className="truncate font-black text-white">
                          {booking.guest_name || "სტუმარი"}
                        </h3>

                        <p className="mt-1 truncate text-sm text-white/55">
                          {booking.tour_title}
                        </p>

                        <p className="mt-2 text-xs text-white/35">
                          {formatDate(booking.created_at)}
                        </p>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <p className="font-black text-cyan-300">
                          {formatCurrency(
                            safeNumber(booking.total_price)
                          )}
                        </p>

                        <div className="mt-2">
                          <BookingStatus
                            status={booking.status}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-white">
                🏔️ ბოლო დამატებული ტურები
              </h2>

              <Link
                href="/admin-v2/tours"
                className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
              >
                ყველას ნახვა →
              </Link>
            </div>

            {latestTours.length === 0 ? (
              <EmptyBox
                icon="🏔️"
                text="ტურები ჯერ არ არის"
              />
            ) : (
              <div className="mt-6 space-y-4">
                {latestTours.map((tour) => (
                  <div
                    key={tour.id}
                    className="rounded-2xl bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <h3 className="truncate font-black text-white">
                          {tour.title || "უსახელო ტური"}
                        </h3>

                        <p className="mt-1 truncate text-sm text-white/55">
                          📍{" "}
                          {tour.location ||
                            "მდებარეობა უცნობია"}
                        </p>

                        <p className="mt-2 text-xs text-white/35">
                          {formatDate(tour.created_at)}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <TourStatus status={tour.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-black text-white">
            ⚡ სწრაფი მოქმედებები
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <QuickLink
              href="/admin-v2/bookings"
              icon="📋"
              title="ჯავშნები"
            />

            <QuickLink
              href="/admin-v2/tours"
              icon="🏔️"
              title="ტურები"
            />

            <QuickLink
              href="/admin-v2/transfers"
              icon="🚐"
              title="ტრანსფერები"
            />

            <QuickLink
              href="/admin-v2/hotels"
              icon="🏨"
              title="სასტუმროები"
            />

            <QuickLink
              href="/admin-v2/guides"
              icon="🧑‍💼"
              title="გიდები"
            />

            <QuickLink
              href="/admin-v2/emails"
              icon="📧"
              title="ელფოსტა"
            />

            {role === "Director" && (
              <>
                <QuickLink
                  href="/admin-v2/users"
                  icon="👥"
                  title="მომხმარებლები"
                />

                <QuickLink
                  href="/admin-v2/payments"
                  icon="💳"
                  title="გადახდები"
                />
              </>
            )}
          </div>
        </section>

        <footer className="rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-600 p-8 shadow-2xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-3xl font-black text-white">
                🚀 Georgia Travel Hub
              </h2>

              <p className="mt-2 text-cyan-100">
                {role === "Director"
                  ? "Director Dashboard"
                  : "Administrator Dashboard"}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-cyan-100">
                Built with ❤️ by Nana Asatiani
              </p>

              <p className="mt-2 font-bold text-white">
                Version 2.1
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function StatusCard({
  title,
  icon,
  total,
  approved,
  pending,
  rejected,
  href,
}: {
  title: string;
  icon: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  href: string;
}) {
  const approvedPercent =
    total > 0 ? (approved / total) * 100 : 0;

  const pendingPercent =
    total > 0 ? (pending / total) * 100 : 0;

  const rejectedPercent =
    total > 0 ? (rejected / total) * 100 : 0;

  return (
    <Link
      href={href}
      className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/15"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white/55">
            {title}
          </p>

          <p className="mt-2 text-4xl font-black text-white">
            {formatNumber(total)}
          </p>
        </div>

        <div className="text-5xl">{icon}</div>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="flex h-full">
          <div
            style={{ width: `${approvedPercent}%` }}
            className="bg-emerald-500"
          />

          <div
            style={{ width: `${pendingPercent}%` }}
            className="bg-amber-500"
          />

          <div
            style={{ width: `${rejectedPercent}%` }}
            className="bg-red-500"
          />
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <StatusRow
          label="დამტკიცებული"
          value={approved}
          dotClass="bg-emerald-500"
        />

        <StatusRow
          label="მოლოდინში"
          value={pending}
          dotClass="bg-amber-500"
        />

        <StatusRow
          label="უარყოფილი"
          value={rejected}
          dotClass="bg-red-500"
        />
      </div>
    </Link>
  );
}

function StatusRow({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: number;
  dotClass: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-white/60">
        <span
          className={`h-2.5 w-2.5 rounded-full ${dotClass}`}
        />

        <span>{label}</span>
      </div>

      <span className="font-black text-white">
        {formatNumber(value)}
      </span>
    </div>
  );
}

function TodayItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>

        <span className="text-white/75">{label}</span>
      </div>

      <span className="font-black text-cyan-300">
        {value}
      </span>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
}: {
  href: string;
  icon: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white/5 p-5 text-center font-bold text-white transition hover:-translate-y-1 hover:bg-cyan-500"
    >
      <div className="text-4xl">{icon}</div>

      <p className="mt-3">{title}</p>
    </Link>
  );
}

function BookingStatus({
  status,
}: {
  status: string | null;
}) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "confirmed") {
    return (
      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
        დადასტურებული
      </span>
    );
  }

  if (normalizedStatus === "rejected") {
    return (
      <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-black text-red-300">
        უარყოფილი
      </span>
    );
  }

  if (normalizedStatus === "cancelled") {
    return (
      <span className="rounded-full bg-slate-500/20 px-3 py-1 text-xs font-black text-slate-300">
        გაუქმებული
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-300">
      მოლოდინში
    </span>
  );
}

function TourStatus({
  status,
}: {
  status: string | null;
}) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "confirmed") {
    return (
      <span className="rounded-full bg-emerald-500/20 px-3 py-2 text-xs font-black text-emerald-300">
        ✅ დამტკიცებული
      </span>
    );
  }

  if (normalizedStatus === "rejected") {
    return (
      <span className="rounded-full bg-red-500/20 px-3 py-2 text-xs font-black text-red-300">
        ❌ უარყოფილი
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-500/20 px-3 py-2 text-xs font-black text-amber-300">
      ⏳ დასამტკიცებელი
    </span>
  );
}

function EmptyBox({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="mt-6 rounded-2xl bg-white/5 p-10 text-center">
      <div className="text-5xl">{icon}</div>

      <p className="mt-4 font-bold text-white/55">
        {text}
      </p>
    </div>
  );
}

function normalizeStatus(
  status: string | null
): NormalizedStatus {
  const normalized = String(status || "pending")
    .trim()
    .toLowerCase();

  if (
    normalized === "approved" ||
    normalized === "confirmed"
  ) {
    return "confirmed";
  }

  if (normalized === "rejected") {
    return "rejected";
  }

  if (normalized === "cancelled") {
    return "cancelled";
  }

  return "pending";
}

function safeNumber(
  value: number | null | undefined
) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ka-GE").format(value);
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ka-GE", {
    maximumFractionDigits: 2,
  }).format(value)} ₾`;
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}მ ₾`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}კ ₾`;
  }

  return `${Math.round(value)} ₾`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "თარიღი უცნობია";
  }

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

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateKeyFromValue(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return getLocalDateKey(date);
}

function createMonthlyRevenueData(
  bookings: Booking[]
): MonthlyRevenue[] {
  const monthFormatter = new Intl.DateTimeFormat(
    "ka-GE",
    {
      month: "short",
    }
  );

  const months: MonthlyRevenue[] = [];
  const today = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - offset,
      1
    );

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    months.push({
      key,
      label: monthFormatter.format(date),
      revenue: 0,
      bookings: 0,
    });
  }

  const monthMap = new Map(
    months.map((month) => [month.key, month])
  );

  bookings.forEach((booking) => {
    if (
      normalizeStatus(booking.status) !== "confirmed" ||
      !booking.created_at
    ) {
      return;
    }

    const date = new Date(booking.created_at);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    const month = monthMap.get(key);

    if (!month) {
      return;
    }

    month.revenue += safeNumber(
      booking.total_price
    );

    month.bookings += 1;
  });

  return months;
}