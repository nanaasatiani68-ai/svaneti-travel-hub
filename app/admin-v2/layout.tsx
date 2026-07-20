"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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

  const isActive = (href: string) => {
    if (href === "/admin-v2") {
      return pathname === "/admin-v2";
    }

    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#08121f] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[285px] flex-col border-r border-white/10 bg-[#07101b] lg:flex">
          {/* Logo */}
          <div className="border-b border-white/10 px-7 py-7">
            <Link href="/admin-v2" className="block">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-2xl shadow-lg shadow-cyan-500/20">
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
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-cyan-500/25 to-emerald-500/15 text-cyan-300 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-400/20"
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

          {/* Sidebar footer */}
          <div className="border-t border-white/10 p-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <span className="text-lg">🌐</span>
              <span>მთავარ საიტზე დაბრუნება</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-h-screen w-full lg:ml-[285px]">
          {/* Top header */}
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a1726]/90 backdrop-blur-xl">
            <div className="flex min-h-[86px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
              <div>
                <Link
                  href="/admin-v2"
                  className="text-xl font-bold text-white sm:text-2xl"
                >
                  Georgia Travel Hub
                </Link>

                <p className="mt-1 text-sm text-slate-400">
                  Admin Panel V2
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin-v2/settings"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
                  aria-label="Settings"
                >
                  ⚙️
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
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

            {/* Mobile navigation */}
            <div className="overflow-x-auto border-t border-white/10 px-4 py-3 lg:hidden">
              <nav className="flex min-w-max gap-2">
                {menuItems.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </header>

          {/* Page content */}
          <main className="min-h-[calc(100vh-86px)] bg-gradient-to-br from-[#0b1929] via-[#081522] to-[#07111d]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}