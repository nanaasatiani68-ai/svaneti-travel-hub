import Link from "next/link";

const menuItems = [
  {
    title: "საინფორმაციო დაფა",
    icon: "🏠",
    href: "/admin",
  },
  {
    title: "დაჯავშნა",
    icon: "📋",
    href: "/admin/bookings",
  },
  {
    title: "ტურები",
    icon: "🏔️",
    href: "/admin/tours",
  },
  {
    title: "მომხმარებლები",
    icon: "👥",
    href: "/admin/users",
  },
  {
    title: "გადახდები",
    icon: "💳",
    href: "/admin/payments",
  },
  {
    title: "კალენდარი",
    icon: "🗓️",
    href: "/admin/calendar",
  },
  {
    title: "ელფოსტები",
    icon: "✉️",
    href: "/admin/emails",
  },
  {
    title: "პერსონალი",
    icon: "👨‍💼",
    href: "/admin/staff",
  },
  {
    title: "პარამეტრები",
    icon: "⚙️",
    href: "/admin/settings",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 min-h-screen bg-slate-950 text-white p-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">
          🏔️ სვანეთი
        </h1>

        <p className="text-slate-400 mt-2">
          მოგზაურობის ცენტრის CMS
        </p>
      </div>

      <nav className="space-y-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              px-4
              py-3
              text-slate-200
              hover:bg-white/10
              hover:text-white
              transition
            "
          >
            <span>{item.icon}</span>
            <span className="font-medium">{item.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}