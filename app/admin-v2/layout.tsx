"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

type AdminLayoutProps = {
  children: ReactNode;
};

const menuItems = [
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
  },
  {
    name: "Staff",
    href: "/admin-v2/staff",
    icon: "👤",
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
  },
];

export default function AdminV2Layout({
  children,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin-v2") {
      return pathname === "/admin-v2";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#07111d] text-white">
      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-[9999] hidden w-[285px] flex-col border-r border-white/10 bg-[#07101b] pointer-events-auto lg:flex">
        {/* Logo */}
        <div className="shrink-0 border-b border-white/10 px-6 py-6">
          <Link
            href="/admin-v2"
            className="relative z-[10000] flex cursor-pointer items-center gap-3 pointer-events-auto"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-2xl shadow-lg">
              🏔️
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">
                საქართველო
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                მოგზაურობის ცენტრის CMS
              </p>
            </div>
          </Link>
        </div>

        {/* Menu */}
        <nav className="relative z-[10000] flex-1 overflow-y-auto px-4 py-5 pointer-events-auto">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative z-[10001] flex w-full cursor-pointer items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold pointer-events-auto transition-all duration-200 ${
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

        {/* Footer */}
        <div className="relative z-[10000] shrink-0 border-t border-white/10 p-4 pointer-events-auto">
          <Link
            href="/"
            className="relative z-[10001] flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 pointer-events-auto transition hover:bg-white/10 hover:text-white"
          >
            <span className="text-lg">🌐</span>
            <span>მთავარ საიტზე დაბრუნება</span>
          </Link>
        </div>
      </aside>

      {/* Mobile dark overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close mobile menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-[9997] bg-black/70 lg:hidden"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-[9999] flex w-[285px] flex-col border-r border-white/10 bg-[#07101b] pointer-events-auto transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-5">
          <Link
            href="/admin-v2"
            onClick={closeMobileMenu}
            className="flex cursor-pointer items-center gap-3 pointer-events-auto"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-xl">
              🏔️
            </div>

            <div>
              <h2 className="font-bold text-white">
                Georgia Travel Hub
              </h2>

              <p className="text-xs text-slate-400">
                Admin Panel V2
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-xl pointer-events-auto hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <nav className="relative z-[10000] flex-1 overflow-y-auto px-4 py-5 pointer-events-auto">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`relative z-[10001] flex w-full cursor-pointer items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold pointer-events-auto transition ${
                    active
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-lg">
                    {item.icon}
                  </span>

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 pointer-events-auto hover:bg-white/10 hover:text-white"
          >
            <span>🌐</span>
            <span>მთავარ საიტზე დაბრუნება</span>
          </Link>
        </div>
      </aside>

      {/* Main page */}
      <div className="relative z-0 min-h-screen w-full lg:ml-[285px] lg:w-[calc(100%-285px)]">
        {/* Header */}
        <header className="sticky top-0 z-[100] border-b border-white/10 bg-[#0a1726]/95 backdrop-blur-xl">
          <div className="flex min-h-[86px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl pointer-events-auto hover:bg-white/10 lg:hidden"
                aria-label="Open mobile menu"
              >
                ☰
              </button>

              <div>
                <Link
                  href="/admin-v2"
                  className="relative z-[101] cursor-pointer text-xl font-bold text-white pointer-events-auto sm:text-2xl"
                >
                  Georgia Travel Hub
                </Link>

                <p className="mt-1 text-sm text-slate-400">
                  Admin Panel V2
                </p>
              </div>
            </div>

            <div className="relative z-[101] flex items-center gap-3 pointer-events-auto">
              <Link
                href="/admin-v2/settings"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg pointer-events-auto transition hover:bg-white/10"
                aria-label="Settings"
              >
                ⚙️
              </Link>

              <Link
                href="/profile"
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 pointer-events-auto transition hover:bg-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 font-bold text-slate-950">
                  A
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-sm font-bold text-white">
                    Administrator
                  </p>

                  <p className="text-xs text-slate-400">
                    Director
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative z-0 min-h-[calc(100vh-86px)] bg-gradient-to-br from-[#0b1929] via-[#081522] to-[#07111d]">
          {children}
        </main>
      </div>
    </div>
  );
}