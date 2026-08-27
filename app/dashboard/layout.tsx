"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState("");

  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] =
    useState(true);

  const ensureSession = useCallback(async () => {
    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "Session loading error:",
          sessionError
        );
      }

      let user = sessionData.session?.user ?? null;

      if (!user) {
        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "User loading error:",
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
            "Session refresh error:",
            refreshError
          );
        }

        user = refreshData.user ?? null;
      }

      if (!user) {
        const nextPath = encodeURIComponent(
          window.location.pathname || "/dashboard"
        );

        window.location.replace(
          `/login?next=${nextPath}`
        );

        return;
      }

      setUserId(user.id);
      setAuthReady(true);
    } catch (error) {
      console.error(
        "Authentication error:",
        error
      );

      const nextPath = encodeURIComponent(
        window.location.pathname || "/dashboard"
      );

      window.location.replace(
        `/login?next=${nextPath}`
      );
    }
  }, [supabase]);

  const loadUnreadNotifications =
    useCallback(async () => {
      if (!userId) {
        setUnreadCount(0);
        setNotificationsLoading(false);
        return;
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) {
        console.error(
          "Unread notifications loading error:",
          error
        );

        setUnreadCount(0);
        setNotificationsLoading(false);
        return;
      }

      setUnreadCount(count ?? 0);
      setNotificationsLoading(false);
    }, [supabase, userId]);

  useEffect(() => {
    void ensureSession();
  }, [ensureSession]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user ?? null;

        if (user) {
          setUserId(user.id);
          setAuthReady(true);
          return;
        }

        if (event === "SIGNED_OUT") {
          setUserId("");
          setAuthReady(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!authReady || !userId) {
      return;
    }

    loadUnreadNotifications();
  }, [
    authReady,
    userId,
    pathname,
    loadUnreadNotifications,
  ]);

  useEffect(() => {
    if (!authReady || !userId) {
      return;
    }

    const channel = supabase
      .channel(`dashboard-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadUnreadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    authReady,
    userId,
    supabase,
    loadUnreadNotifications,
  ]);

  useEffect(() => {
    if (!authReady || !userId) {
      return;
    }

    function refreshNotifications() {
      loadUnreadNotifications();
    }

    window.addEventListener(
      "focus",
      refreshNotifications
    );

    window.addEventListener(
      "notifications-updated",
      refreshNotifications as EventListener
    );

    const interval = window.setInterval(() => {
      loadUnreadNotifications();
    }, 30000);

    return () => {
      window.removeEventListener(
        "focus",
        refreshNotifications
      );

      window.removeEventListener(
        "notifications-updated",
        refreshNotifications as EventListener
      );

      window.clearInterval(interval);
    };
  }, [
    authReady,
    userId,
    loadUnreadNotifications,
  ]);

  async function logout() {
    setUnreadCount(0);
    setUserId("");
    setAuthReady(false);

    await supabase.auth.signOut();

    window.location.replace("/login");
  }

  function isMenuActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  const menu = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "🏠",
    },
    {
      name: "Add Tour",
      href: "/dashboard/add-tour",
      icon: "➕",
    },
    {
      name: "Add Transfer",
      href: "/dashboard/add-transfer",
      icon: "🚐",
    },
    {
      name: "Add Hotel",
      href: "/dashboard/add-hotel",
      icon: "🏨",
    },
    {
      name: "Add Guide",
      href: "/dashboard/add-guide",
      icon: "🧑‍💼",
    },
    {
      name: "My Tours",
      href: "/dashboard/my-tours",
      icon: "🏔️",
    },
    {
      name: "Bookings",
      href: "/dashboard/bookings",
      icon: "📅",
    },
    {
      name: "Messages",
      href: "/dashboard/messages",
      icon: "💬",
    },
    {
      name: "Favorites",
      href: "/dashboard/favorites",
      icon: "❤️",
    },
    {
      name: "Profile",
      href: "/profile",
      icon: "👤",
    },
  ];

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">🔐</div>

          <p className="mt-4 text-lg font-semibold">
            ანგარიშის სესია მოწმდება...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-72 shrink-0 flex-col bg-slate-900 text-white md:flex">
        <div className="border-b border-slate-700 p-6">
          <h1 className="text-2xl font-bold leading-tight">
            Georgia Gateway Hub
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            User Dashboard
          </p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {menu.map((item) => {
            const active = isMenuActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                  active
                    ? "bg-sky-500 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-lg">
                  {item.icon}
                </span>

                <span className="font-medium">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 p-4">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl bg-red-500 py-3 font-semibold transition hover:bg-red-600"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                Dashboard
              </h2>

              <p className="hidden text-sm text-slate-500 sm:block">
                Welcome to Georgia Gateway Hub
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/dashboard/notifications"
                aria-label={
                  unreadCount > 0
                    ? `${unreadCount} წაუკითხავი შეტყობინება`
                    : "შეტყობინებები"
                }
                title="შეტყობინებები"
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl shadow-sm transition ${
                  pathname.startsWith(
                    "/dashboard/notifications"
                  )
                    ? "border-violet-500 bg-violet-500 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"
                }`}
              >
                <span aria-hidden="true">
                  🔔
                </span>

                {!notificationsLoading &&
                  unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1.5 text-xs font-black leading-none text-white shadow-lg">
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}
              </Link>

              <Link
                href="/dashboard"
                className="flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 md:hidden"
              >
                🏠
              </Link>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-3 md:hidden">
            {menu.map((item) => {
              const active = isMenuActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-sky-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
