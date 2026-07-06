import Link from "next/link";

export default function AdminV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { label: "🏠 Dashboard", href: "/admin-v2" },
    { label: "📋 Bookings", href: "/admin-v2/bookings" },
    { label: "🏔️ Tours", href: "/admin-v2/tours" },
    { label: "🚐 Transfers", href: "/admin-v2/transfers" },
    { label: "🏨 Hotels", href: "/admin-v2/hotels" },
    { label: "👨‍💼 Guides", href: "/admin-v2/guides" },
    { label: "👥 Users", href: "/admin-v2/users" },
    { label: "👨🏻‍💻 Staff", href: "/admin-v2/staff" },
    { label: "📧 Emails", href: "/admin-v2/emails" },
    { label: "💳 Payments", href: "/admin-v2/payments" },
    { label: "🗓️ Calendar", href: "/admin-v2/calendar" },
    { label: "⚙️ Settings", href: "/admin-v2/settings" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      <aside className="w-72 min-h-screen bg-slate-950/95 border-r border-white/10 p-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">🏔️ სვანეთი</h1>
          <p className="text-slate-400 mt-2 text-sm">
            მოგზაურობის ცენტრის CMS
          </p>
        </div>

        <nav className="space-y-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center rounded-2xl px-4 py-3 text-slate-300 transition-all duration-300 hover:bg-cyan-500 hover:text-white hover:translate-x-1"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-h-screen">
        <header className="h-20 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-8">
          <div>
            <h2 className="text-xl font-bold">Svaneti Travel Hub</h2>
            <p className="text-sm text-slate-400">Admin Panel v2</p>
          </div>

          <div className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-4 py-2 rounded-full text-sm font-semibold">
            🚀 Public Beta
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}