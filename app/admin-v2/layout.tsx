"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminLayoutProps = {
  children: ReactNode;
};

type UserRole = "Director" | "Admin";

type AdminProfile = {
  full_name: string | null;
  role: string | null;
};

type MenuItem = {
  name: string;
  href: string;
  icon: string;
  directorOnly?: boolean;
};

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/admin-v2",
    icon: "🏠",
  },
  {
    name: "Bookings",
    href: "/admin-v2/bookings",
    icon: "📋",
  },
  {
    name: "Tours",
    href: "/admin-v2/tours",
    icon: "🏔️",
  },
  {
    name: "ტურები და მფლობელები",
    href: "/admin-v2/tour-owners",
    icon: "📊",
  },
  {
    name: "Transfers",
    href: "/admin-v2/transfers",
    icon: "🚐",
  },
  {
    name: "Hotels",
    href: "/admin-v2/hotels",
    icon: "🏨",
  },
  {
    name: "Guides",
    href: "/admin-v2/guides",
    icon: "🧑‍💼",
  },
  {
    name: "Users",
    href: "/admin-v2/users",
    icon: "👥",
    directorOnly: true,
  },
  {
    name: "Staff",
    href: "/admin-v2/staff",
    icon: "👤",
    directorOnly: true,
  },
  {
    name: "Emails",
    href: "/admin-v2/emails",
    icon: "✉️",
  },
  {
    name: "Payments",
    href: "/admin-v2/payments",
    icon: "💳",
    directorOnly: true,
  },
  {
    name: "Calendar",
    href: "/admin-v2/calendar",
    icon: "📅",
  },
  {
    name: "Settings",
    href: "/admin-v2/settings",
    icon: "⚙️",
    directorOnly: true,
  },
];

const directorOnlyPaths = [
  "/admin-v2/users",
  "/admin-v2/staff",
  "/admin-v2/payments",
  "/admin-v2/settings",
];

export default function AdminV2Layout({
  children,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [role, setRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const loadAdmin = useCallback(async () => {
    setCheckingAccess(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setEmail(user.email || "");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Admin profile loading error:", profileError);
      await supabase.auth.signOut();
      router.replace("/login");
      return;
    }

    const typedProfile = profile as AdminProfile | null;

    const normalizedRole = String(typedProfile?.role || "")
      .trim()
      .toLowerCase();

    let resolvedRole: UserRole | null = null;

    if (normalizedRole === "director") {
      resolvedRole = "Director";
    }

    if (normalizedRole === "admin") {
      resolvedRole = "Admin";
    }

    if (!resolvedRole) {
      router.replace("/dashboard");
      return;
    }

    setRole(resolvedRole);

    setFullName(
      typedProfile?.full_name ||
        user.user_metadata?.full_name ||
        (resolvedRole === "Director" ? "Director" : "Administrator")
    );

    const currentPathIsDirectorOnly = directorOnlyPaths.some(
      (protectedPath) =>
        pathname === protectedPath ||
        pathname.startsWith(`${protectedPath}/`)
    );

    if (resolvedRole === "Admin" && currentPathIsDirectorOnly) {
      router.replace("/admin-v2");
      return;
    }

    setCheckingAccess(false);
  }, [pathname, router]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const visibleMenuItems = useMemo(() => {
    if (role === "Director") {
      return menuItems;
    }

    return menuItems.filter((item) => !item.directorOnly);
  }, [role]);

  function isActive(href: string) {
    if (href === "/admin-v2") {
      return pathname === "/admin-v2";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      alert(`ანგარიშიდან გამოსვლა ვერ მოხერხდა: ${error.message}`);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111d] px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">🔐</div>

          <h1 className="mt-5 text-2xl font-extrabold">
            წვდომა მოწმდება
          </h1>

          <p className="mt-3 text-slate-400">
            გთხოვ დაელოდე...
          </p>

          <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111d] text-white">
      {/* Desktop sidebar */}
      <aside className="pointer-events-auto fixed bottom-0 left-0 top-0 z-[9999] hidden w-[285px] flex-col border-r border-white/10 bg-[#07101b] lg:flex">
        <div className="shrink-0 border-b border-white/10 px-6 py-6">
          <Link
            href="/admin-v2"
            className="relative z-[10000] flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-2xl shadow-lg">
              🏔️
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">
                Georgia Travel Hub
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                {role === "Director"
                  ? "Director Panel"
                  : "Administrator Panel"}
              </p>
            </div>
          </Link>
        </div>

        <nav className="relative z-[10000] flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-2">
            {visibleMenuItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative z-[10001] flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-cyan-500/25 to-emerald-500/15 text-cyan-300 ring-1 ring-cyan-400/20"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg">
                    {item.icon}
                  </span>

                  <span>{item.name}</span>

                  {active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-cyan-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="relative z-[10000] shrink-0 border-t border-white/10 p-4">
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="truncate text-sm font-bold text-white">
              {fullName}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {email}
            </p>

            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                role === "Director"
                  ? "bg-violet-500/15 text-violet-300"
                  : "bg-cyan-500/15 text-cyan-300"
              }`}
            >
              {role === "Director" ? "👑 Director" : "🛡️ Admin"}
            </span>
          </div>

          <div className="space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <span className="text-lg">🌐</span>
              <span>მთავარ საიტზე დაბრუნება</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-lg">🚪</span>

              <span>
                {loggingOut
                  ? "გამოსვლა მიმდინარეობს..."
                  : "ანგარიშიდან გამოსვლა"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="მენიუს დახურვა"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-[9997] bg-black/70 lg:hidden"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-[9999] flex w-[285px] flex-col border-r border-white/10 bg-[#07101b] transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-5">
          <Link
            href="/admin-v2"
            onClick={closeMobileMenu}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-xl">
              🏔️
            </div>

            <div>
              <h2 className="font-bold text-white">
                Georgia Travel Hub
              </h2>

              <p className="text-xs text-slate-400">
                {role === "Director" ? "Director" : "Admin"}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl hover:bg-white/20"
            aria-label="მენიუს დახურვა"
          >
            ✕
          </button>
        </div>

        <nav className="relative z-[10000] flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-2">
            {visibleMenuItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`relative z-[10001] flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                    active
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-lg">
                    {item.icon}
                  </span>

                  <span>{item.name}</span>

                  {active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-cyan-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="truncate text-sm font-bold text-white">
              {fullName}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {email}
            </p>

            <p className="mt-2 text-xs font-bold text-cyan-300">
              {role === "Director" ? "👑 Director" : "🛡️ Admin"}
            </p>
          </div>

          <div className="space-y-2">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <span>🌐</span>
              <span>მთავარ საიტზე დაბრუნება</span>
            </Link>

            <button
              type="button"
              onClick={async () => {
                closeMobileMenu();
                await logout();
              }}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>🚪</span>

              <span>
                {loggingOut
                  ? "გამოსვლა მიმდინარეობს..."
                  : "ანგარიშიდან გამოსვლა"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="relative z-0 min-h-screen w-full lg:ml-[285px] lg:w-[calc(100%-285px)]">
        <header className="sticky top-0 z-[100] border-b border-white/10 bg-[#0a1726]/95 backdrop-blur-xl">
          <div className="flex min-h-[86px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl hover:bg-white/10 lg:hidden"
                aria-label="მენიუს გახსნა"
              >
                ☰
              </button>

              <div>
                <Link
                  href="/admin-v2"
                  className="text-xl font-bold text-white sm:text-2xl"
                >
                  Georgia Travel Hub
                </Link>

                <p className="mt-1 text-sm text-slate-400">
                  {role === "Director"
                    ? "Director Panel — სრული წვდომა"
                    : "Admin Panel — შეზღუდული წვდომა"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {role === "Director" && (
                <Link
                  href="/admin-v2/settings"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
                  aria-label="პარამეტრები"
                >
                  ⚙️
                </Link>
              )}

              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 font-bold text-slate-950">
                  {fullName.trim().charAt(0).toUpperCase() || "A"}
                </div>

                <div className="hidden max-w-[180px] text-left sm:block">
                  <p className="truncate text-sm font-bold text-white">
                    {fullName}
                  </p>

                  <p className="text-xs text-slate-400">
                    {role}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="hidden items-center gap-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
              >
                <span>🚪</span>

                <span>{loggingOut ? "გამოდის..." : "გამოსვლა"}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-0 min-h-[calc(100vh-86px)] bg-gradient-to-br from-[#0b1929] via-[#081522] to-[#07111d]">
          {children}
        </main>
      </div>
    </div>
  );
}