"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  role: string | null;
};

type DashboardStats = {
  myBookings: number;
  completedBookings: number;
  myTours: number;
  pendingTours: number;
  myTransfers: number;
};

const initialStats: DashboardStats = {
  myBookings: 0,
  completedBookings: 0,
  myTours: 0,
  pendingTours: 0,
  myTransfers: 0,
};

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [stats, setStats] =
    useState<DashboardStats>(initialStats);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const loadDashboard = useCallback(
    async (manualRefresh = false) => {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "Dashboard session error:",
            sessionError
          );
        }

        let user =
          sessionData.session?.user ?? null;

        if (!user) {
          const {
            data: userData,
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            console.error(
              "Dashboard user error:",
              userError
            );
          }

          user = userData.user;
        }

        if (!user) {
          const {
            data: refreshData,
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error(
              "Dashboard refresh error:",
              refreshError
            );
          }

          user = refreshData.user ?? null;
        }

        if (!user) {
          window.location.replace(
            `/login?next=${encodeURIComponent(
              "/dashboard"
            )}`
          );
          return;
        }

        setEmail(user.email || "");

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Profile loading error:",
            profileError
          );
        }

        const typedProfile =
          profile as Profile | null;

        setFullName(
          typedProfile?.full_name ||
            user.user_metadata?.full_name ||
            "მომხმარებელი"
        );

        setRole(
          typedProfile?.role || "user"
        );

        const [
          myBookingsResult,
          completedBookingsResult,
          myToursResult,
          pendingToursResult,
          myTransfersResult,
        ] = await Promise.all([
          supabase
            .from("bookings")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id),

          supabase
            .from("bookings")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id)
            .eq("status", "completed"),

          supabase
            .from("tours")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id),

          supabase
            .from("tours")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id)
            .eq("status", "pending"),

          supabase
            .from("transfers")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id),
        ]);

        setStats({
          myBookings:
            myBookingsResult.count ?? 0,
          completedBookings:
            completedBookingsResult.count ?? 0,
          myTours:
            myToursResult.count ?? 0,
          pendingTours:
            pendingToursResult.count ?? 0,
          myTransfers:
            myTransfersResult.count ?? 0,
        });
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );

        setErrorMessage(
          "Dashboard-ის მონაცემების ჩატვირთვა ვერ მოხერხდა."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  const firstName = useMemo(() => {
    const name = fullName.trim();

    if (!name) {
      return "მომხმარებელო";
    }

    return name.split(/\s+/)[0];
  }, [fullName]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">⏳</div>

          <p className="mt-4 font-semibold">
            Dashboard იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
          <div
            className="relative bg-cover bg-center p-6 sm:p-8 lg:p-10"
            style={{
              backgroundImage:
                "linear-gradient(120deg, rgba(2,6,23,.92), rgba(8,47,73,.70), rgba(2,6,23,.82)), url('/dashboard/all-tours.jpg')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent" />

            <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200 backdrop-blur-md">
                  ✈️ Georgia Gateway Hub
                </div>

                <h1 className="mt-5 text-3xl font-black sm:text-4xl lg:text-5xl">
                  გამარჯობა, {firstName} 👋
                </h1>

                <p className="mt-3 max-w-2xl text-base leading-7 text-white/65">
                  მართე შენი ჯავშნები, ტურები,
                  ტრანსფერები და სწრაფად იპოვე
                  შემდეგი მოგზაურობა.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {email && (
                    <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/70">
                      ✉️ {email}
                    </span>
                  )}

                  <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/70">
                    👤 {formatRole(role)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/profile"
                  className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold backdrop-blur-md transition hover:bg-white/20"
                >
                  👤 პროფილი
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    void loadDashboard(true)
                  }
                  disabled={refreshing}
                  className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold backdrop-blur-md transition hover:bg-white/20 disabled:opacity-50"
                >
                  {refreshing
                    ? "იტვირთება..."
                    : "🔄 განახლება"}
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="rounded-2xl bg-red-500 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-red-600"
                >
                  🚪 გამოსვლა
                </button>
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 font-semibold text-red-200">
            {errorMessage}
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MiniStatCard icon="📅" label="ჩემი ჯავშნები" value={stats.myBookings} href="/dashboard/bookings" />
          <MiniStatCard icon="🏁" label="შესრულებული" value={stats.completedBookings} href="/dashboard/bookings" />
          <MiniStatCard icon="🏔️" label="ჩემი ტურები" value={stats.myTours} href="/dashboard/my-tours" />
          <MiniStatCard icon="⏳" label="დასამტკიცებელი" value={stats.pendingTours} href="/dashboard/my-tours" />
          <MiniStatCard icon="🚐" label="ტრანსფერები" value={stats.myTransfers} href="/dashboard/my-transfers" />
        </section>

        <section className="mt-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                Explore
              </p>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                იმოგზაურე საქართველოში
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-6 text-white/45">
              ნახე დამტკიცებული სერვისები და
              დაჯავშნე შენთვის სასურველი ვარიანტი.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <DashboardCard
              href="/tours"
              image="/dashboard/all-tours.jpg"
              icon="🌍"
              title="ყველა ტური"
              description="აღმოაჩინე საუკეთესო ტურები საქართველოს სხვადასხვა რეგიონში."
              badge="პოპულარული"
              large
            />

            <DashboardCard
              href="/transfers"
              image="/dashboard/transfers.jpg"
              icon="🚐"
              title="ტრანსფერები"
              description="იპოვე მოსახერხებელი ტრანსფერი ქალაქებსა და ტურისტულ ადგილებს შორის."
              badge="ტრანსპორტი"
              large
            />

            <DashboardCard
              href="/hotels"
              image="/dashboard/hotel.jpg"
              icon="🏨"
              title="სასტუმროები"
              description="ნახე დამტკიცებული სასტუმროები და განთავსების ვარიანტები."
              badge="დასვენება"
              large
            />
          </div>
        </section>

        <section className="mt-9">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
              My Account
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              ჩემი ანგარიში
            </h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <DashboardCard
              href="/dashboard/bookings"
              image="/dashboard/bookings.jpg"
              icon="📅"
              title="ჩემი ჯავშნები"
              description="ნახე შენი ჯავშნები, სტატუსები და დასრულებული ტურები."
              badge={
                stats.myBookings > 0
                  ? String(stats.myBookings)
                  : undefined
              }
            />

            <DashboardCard
              href="/dashboard/messages"
              image="/dashboard/bookings.jpg"
              icon="💬"
              title="ჩატი"
              description="მიწერე ტურის ორგანიზატორს ან მომხმარებელს."
            />

            <DashboardCard
              href="/dashboard/notifications"
              image="/dashboard/bookings.jpg"
              icon="🔔"
              title="შეტყობინებები"
              description="ნახე დამტკიცებები, უარყოფები და ახალი მოთხოვნები."
            />

            <DashboardCard
              href="/dashboard/favorites"
              image="/dashboard/favorites.jpg"
              icon="❤️"
              title="ფავორიტები"
              description="შენახული ტურები და სასტუმროები."
            />

            <DashboardCard
              href="/profile"
              image="/dashboard/profile.jpg"
              icon="👤"
              title="ჩემი პროფილი"
              description="ნახე და შეცვალე პირადი ინფორმაცია."
            />
          </div>
        </section>

        <section className="mt-9">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
              Become a Provider
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              დაამატე შენი სერვისი
            </h2>

            <p className="mt-2 max-w-2xl text-white/45">
              თუ ტურებს, ტრანსფერებს, სასტუმროს
              ან გიდის მომსახურებას სთავაზობ,
              დაამატე ინფორმაცია და გამოგზავნე
              დასამტკიცებლად.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              href="/dashboard/add-tour"
              image="/dashboard/add-tour.jpg"
              icon="➕"
              title="ტურის დამატება"
              description="დაამატე ახალი ტური დასამტკიცებლად."
            />

            <DashboardCard
              href="/dashboard/add-transfer"
              image="/dashboard/add-transfer.jpg"
              icon="🚐"
              title="ტრანსფერის დამატება"
              description="დაამატე ახალი ტრანსფერი დასამტკიცებლად."
            />

            <DashboardCard
              href="/dashboard/add-hotel"
              image="/dashboard/hotel.jpg"
              icon="🏨"
              title="სასტუმროს დამატება"
              description="დაამატე სასტუმრო დასამტკიცებლად."
            />

            <DashboardCard
              href="/dashboard/add-guide"
              image="/dashboard/profile.jpg"
              icon="🧑‍💼"
              title="გიდის დამატება"
              description="დაამატე გიდის მომსახურება დასამტკიცებლად."
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              href="/dashboard/my-tours"
              image="/dashboard/my-tours.jpg"
              icon="🏔️"
              title="ჩემი ტურები"
              description="მართე შენ მიერ დამატებული ტურები."
              badge={
                stats.myTours > 0
                  ? String(stats.myTours)
                  : undefined
              }
            />

            <DashboardCard
              href="/dashboard/my-transfers"
              image="/dashboard/transfers.jpg"
              icon="🚐"
              title="ჩემი ტრანსფერები"
              description="მართე შენ მიერ დამატებული ტრანსფერები."
              badge={
                stats.myTransfers > 0
                  ? String(stats.myTransfers)
                  : undefined
              }
            />

            <DashboardCard
              href="/"
              image="/dashboard/home.jpg"
              icon="🏠"
              title="მთავარ გვერდზე"
              description="დაბრუნდი Georgia Gateway Hub-ის მთავარ გვერდზე."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniStatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-3xl">
          {icon}
        </div>

        <span className="text-xs font-bold text-white/30 transition group-hover:text-cyan-300">
          გახსნა →
        </span>
      </div>

      <p className="mt-5 text-3xl font-black">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold text-white/50">
        {label}
      </p>
    </Link>
  );
}

function DashboardCard({
  href,
  image,
  icon,
  title,
  description,
  badge,
  large = false,
}: {
  href: string;
  image: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 ${
        large
          ? "min-h-[260px]"
          : "min-h-[200px]"
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
        style={{
          backgroundImage: `url('${image}')`,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/20" />

      {badge && (
        <div className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-cyan-400 px-3 py-1 text-[10px] font-black text-slate-950 shadow-lg">
          {badge}
        </div>
      )}

      <div
        className={`relative z-10 flex flex-col justify-end ${
          large
            ? "min-h-[260px] p-6"
            : "min-h-[200px] p-5"
        }`}
      >
        <div className="text-3xl drop-shadow-lg">
          {icon}
        </div>

        <h3
          className={`mt-3 font-black leading-tight text-white drop-shadow-lg ${
            large
              ? "text-2xl"
              : "text-xl"
          }`}
        >
          {title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/65">
          {description}
        </p>

        <div className="mt-4 inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition group-hover:bg-cyan-500">
          გახსნა →
        </div>
      </div>
    </Link>
  );
}

function formatRole(role: string) {
  const normalized = role
    .trim()
    .toLowerCase();

  if (normalized === "director") {
    return "Director";
  }

  if (normalized === "admin") {
    return "Admin";
  }

  if (normalized === "staff") {
    return "Staff";
  }

  return "მომხმარებელი";
}