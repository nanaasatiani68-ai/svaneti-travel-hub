"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
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

  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* Sidebar */}

      <aside className="w-72 bg-slate-900 text-white flex flex-col">

        <div className="p-6 border-b border-slate-700">

          <h1 className="text-2xl font-bold">
            Georgia Travel Hub
          </h1>

          <p className="text-slate-400 text-sm mt-1">
            User Dashboard
          </p>

        </div>

        <nav className="flex-1 p-4 space-y-2">

          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                pathname === item.href
                  ? "bg-sky-500 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}

        </nav>

        <div className="p-4 border-t border-slate-700">

          <button
            onClick={logout}
            className="w-full rounded-xl bg-red-500 py-3 hover:bg-red-600 transition"
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* Content */}

      <div className="flex-1">

        <header className="bg-white shadow px-8 py-5 flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold">
              Dashboard
            </h2>

            <p className="text-gray-500 text-sm">
              Welcome to Georgia Travel Hub
            </p>

          </div>

        </header>

        <main className="p-8">
          {children}
        </main>

      </div>

    </div>
  );
}