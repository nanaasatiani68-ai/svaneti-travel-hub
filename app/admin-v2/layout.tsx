"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  { name: "Dashboard", href: "/admin-v2", icon: "🏠" },
  { name: "Tour Bookings", href: "/admin-v2/bookings", icon: "📋" },
  { name: "Hotel Bookings", href: "/admin-v2/hotel-bookings", icon: "🛎️" },
  { name: "Tours", href: "/admin-v2/tours", icon: "🏔️" },
  {
    name: "ტურები და მფლობელები",
    href: "/admin-v2/tour-owners",
    icon: "📊",
  },
  { name: "Transfers", href: "/admin-v2/transfers", icon: "🚐" },
  { name: "Hotels", href: "/admin-v2/hotels", icon: "🏨" },
  { name: "Guides", href: "/admin-v2/guides", icon: "🧑‍💼" },
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
  { name: "Emails", href: "/admin-v2/emails", icon: "✉️" },
  {
    name: "Payments",
    href: "/admin-v2/payments",
    icon: "💳",
    directorOnly: true,
  },
  { name: "Calendar", href: "/admin-v2/calendar", icon: "📅" },
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
  const supabase = useMemo(() => createClient(), []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const loadAdmin = useCallback(async () => {
    setCheckingAccess(true);
    setAccessError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User loading error:", userError);
      }

      if (!user) {
        window.location.replace("/login");
        return;
      }

      setEmail(user.email || "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          `პროფილის ჩატვირთვა ვერ მოხერხდა: ${profileError.message}`
        );
      }

      const typedProfile = profile as AdminProfile | null;
      const normalizedRole = String(typedProfile?.role || "")
        .trim()
        .toLowerCase();

      let resolvedRole: UserRole | null = null;

      if (normalizedRole === "director") {
        resolvedRole = "Director";
      } else if (normalizedRole === "admin") {
        resolvedRole = "Admin";
      }

      if (!resolvedRole) {
        window.location.replace("/dashboard");
        return;
      }

      const currentPathIsDirectorOnly = directorOnlyPaths.some(
        (protectedPath) =>
          pathname === protectedPath ||
          pathname.startsWith(`${protectedPath}/`)
      );

      if (resolvedRole === "Admin" && currentPathIsDirectorOnly) {
        window.location.replace("/admin-v2");
        return;
      }

      setRole(resolvedRole);
      setFullName(
        typedProfile?.full_name ||
          user.user_metadata?.full_name ||
          (resolvedRole === "Director" ? "Director" : "Administrator")
      );
      setCheckingAccess(false);
    } catch (error: unknown) {
      console.error("Admin access loading error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "ადმინისტრატორის მონაცემების ჩატვირთვა ვერ მოხერხდა.";

      setAccessError(message);
      setCheckingAccess(false);
    }
  }, [pathname, supabase]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      window.location.replace("/login");
    } catch (error: unknown) {
      console.error("Logout error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      alert(`ანგარიშიდან გამოსვლა ვერ მოხერხდა: ${message}`);
      setLoggingOut(false);
    }
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111d] px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">🔐</div>
          <h1 className="mt-5 text-2xl font-extrabold">წვდომა მოწმდება</h1>
          <p className="mt-3 text-slate-400">გთხოვ დაელოდე...</p>
          <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />
        </div>
      </main>
    );
  }

  if (accessError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111d] px-4 text-white">
        <section className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-white/5 p-7 text-center shadow-2xl">
          <div className="text-6xl">⚠️</div>
          <h1 className="mt-5 text-2xl font-extrabold">
            ადმინისტრატორის გვერდი ვერ ჩაიტვირთა
          </h1>
          <p className="mt-4 break-words leading-7 text-red-200">
            {accessError}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => void loadAdmin()}
              className="rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-white hover:bg-cyan-600"
            >
              თავიდან ცდა
            </button>

            <Link
              href="/"
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-bold text-white hover:bg-white/10"
            >
              მთავარ გვერდზე
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111d] text-white">
      <aside className="fixed bottom-0 left-0 top-0 z-[9999] hidden w-[285px] flex-col border-r border-white/10 bg-[#07101b] lg:flex">
        <SidebarContent
          role={role}
          fullName={fullName}
          email={email}
          pathname={pathname}
          menuItems={visibleMenuItems}
          loggingOut={loggingOut}
          isActive={isActive}
          onClose={() => undefined}
          onLogout={logout}
        />
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="მენიუს დახურვა"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-[9997] bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-[9999] flex w-[285px] flex-col border-r border-white/10 bg-[#07101b] transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          role={role}
          fullName={fullName}
          email={email}
          pathname={pathname}
          menuItems={visibleMenuItems}
          loggingOut={loggingOut}
          isActive={isActive}
          onClose={() => setMobileMenuOpen(false)}
          onLogout={logout}
          mobile
        />
      </aside>

      <div className="min-h-screen w-full lg:ml-[285px] lg:w-[calc(100%-285px)]">
        <header className="sticky top-0 z-[100] border-b border-white/10 bg-[#0a1726]/95 backdrop-blur-xl">
          <div className="flex min-h-[86px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl hover:bg-white/10 lg:hidden"
                aria-label="მენიუს გახსნა"
              >
                ☰
              </button>

              <div className="min-w-0">
                <Link
                  href="/admin-v2"
                  className="block truncate text-xl font-bold text-white sm:text-2xl"
                >
                  Georgia Gateway Hub
                </Link>

                <p className="mt-1 hidden text-sm text-slate-400 sm:block">
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
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg hover:bg-white/10"
                  aria-label="პარამეტრები"
                >
                  ⚙️
                </Link>
              )}

              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 font-bold text-slate-950">
                  {fullName.trim().charAt(0).toUpperCase() || "A"}
                </div>

                <div className="hidden max-w-[180px] text-left sm:block">
                  <p className="truncate text-sm font-bold text-white">
                    {fullName}
                  </p>
                  <p className="text-xs text-slate-400">{role}</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => void logout()}
                disabled={loggingOut}
                className="hidden items-center gap-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-60 sm:flex"
              >
                <span>🚪</span>
                <span>{loggingOut ? "გამოდის..." : "გამოსვლა"}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-86px)] bg-gradient-to-br from-[#0b1929] via-[#081522] to-[#07111d]">
          {children}
        </main>
      </div>
    </div>
  );
}

type SidebarContentProps = {
  role: UserRole | null;
  fullName: string;
  email: string;
  pathname: string;
  menuItems: MenuItem[];
  loggingOut: boolean;
  isActive: (href: string) => boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
  mobile?: boolean;
};

function SidebarContent({
  role,
  fullName,
  email,
  menuItems,
  loggingOut,
  isActive,
  onClose,
  onLogout,
  mobile = false,
}: SidebarContentProps) {
  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-5">
        <Link href="/admin-v2" onClick={onClose} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-xl">
            🏔️
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-white">Georgia Gateway Hub</h2>
            <p className="text-xs text-slate-400">
              {role === "Director" ? "Director Panel" : "Administrator Panel"}
            </p>
          </div>
        </Link>

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl hover:bg-white/20"
            aria-label="მენიუს დახურვა"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                  active
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/20"
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

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="truncate text-sm font-bold text-white">{fullName}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{email}</p>
          <p className="mt-2 text-xs font-bold text-cyan-300">
            {role === "Director" ? "👑 Director" : "🛡️ Admin"}
          </p>
        </div>

        <div className="space-y-2">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <span>🌐</span>
            <span>მთავარ საიტზე დაბრუნება</span>
          </Link>

          <button
            type="button"
            onClick={() => void onLogout()}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-60"
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
    </>
  );
}