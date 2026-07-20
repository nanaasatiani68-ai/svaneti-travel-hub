import Link from "next/link";

const stats = [
  {
    title: "დაჯავშნები",
    value: "128",
    note: "+12% ამ კვირაში",
    color: "from-sky-500 to-cyan-400",
    icon: "📋",
    href: "/admin-v2/bookings",
  },
  {
    title: "შემოსავალი",
    value: "₾42,850",
    note: "+18% ამ თვეში",
    color: "from-green-500 to-emerald-400",
    icon: "💰",
    href: "/admin-v2/payments",
  },
  {
    title: "მომხმარებლები",
    value: "548",
    note: "24 ახალი",
    color: "from-purple-500 to-violet-400",
    icon: "👥",
    href: "/admin-v2/users",
  },
  {
    title: "ტურები",
    value: "18",
    note: "6 აქტიური",
    color: "from-orange-500 to-red-400",
    icon: "🏔️",
    href: "/admin-v2/tours",
  },
];

const revenueData = [
  { month: "იან", value: 35 },
  { month: "თებ", value: 55 },
  { month: "მარ", value: 42 },
  { month: "აპრ", value: 75 },
  { month: "მაი", value: 68 },
  { month: "ივნ", value: 90 },
];

const todayItems = [
  {
    icon: "✅",
    label: "დადასტურებულია",
    value: "4",
  },
  {
    icon: "🟡",
    label: "გასაგზავნია",
    value: "2",
  },
  {
    icon: "📋",
    label: "დაჯავშნის მოთხოვნა",
    value: "7",
  },
  {
    icon: "💰",
    label: "შემოსავალი",
    value: "₾3,450",
  },
];

const latestBookings = [
  {
    guest: "Anna Brown",
    type: "Ushguli Tour",
    price: "₾450",
    status: "Confirmed",
  },
  {
    guest: "John Smith",
    type: "Hotel Booking",
    price: "₾620",
    status: "Pending",
  },
  {
    guest: "Maria Lopez",
    type: "Airport Transfer",
    price: "₾180",
    status: "Confirmed",
  },
];

const activities = [
  "ახალი ჯავშანი დაემატა",
  "ტურის სტატუსი განახლდა",
  "მომხმარებელი დარეგისტრირდა",
  "გადახდა წარმატებით დასრულდა",
];

export default function AdminV2Page() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <span className="mb-4 inline-block rounded-full bg-cyan-500 px-4 py-1 text-sm font-semibold text-white shadow-lg">
          🏔️ სვანეთის ტურისტული ცენტრი
        </span>

        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
          კეთილი იყოს შენი დაბრუნება, ნანა 👋
        </h1>

        <p className="mt-4 text-lg text-white/80">
          მართე ჯავშნები, ტურები, მომხმარებლები და მთელი პლატფორმა ერთი
          ადგილიდან.
        </p>

        <p className="mt-2 text-white/60">
          დღეს ახალი თავგადასავლების დასაწყისია.
        </p>
      </section>

      {/* დიდი ფერადი ბარათები */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`block cursor-pointer rounded-3xl bg-gradient-to-br p-6 text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] ${item.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80">{item.title}</p>

                <h2 className="mt-3 text-4xl font-bold">
                  {item.value}
                </h2>

                <p className="mt-2 text-sm text-white/75">
                  {item.note}
                </p>
              </div>

              <div className="text-5xl">{item.icon}</div>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl xl:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              📈 შემოსავლების მიმოხილვა
            </h2>

            <span className="font-semibold text-cyan-300">
              ბოლო 6 თვე
            </span>
          </div>

          <div className="flex h-72 items-end justify-between gap-4">
            {revenueData.map((item) => (
              <div
                key={item.month}
                className="flex flex-1 flex-col items-center"
              >
                <div
                  style={{
                    height: `${item.value * 2}px`,
                  }}
                  className="w-full rounded-t-3xl bg-gradient-to-t from-cyan-600 to-sky-400 shadow-xl transition hover:scale-105"
                />

                <span className="mt-4 text-white/70">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="mb-6 text-2xl font-bold text-white">
            📅 დღეს
          </h2>

          <div className="space-y-5">
            {todayItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl bg-white/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>

                  <span className="text-white">
                    {item.label}
                  </span>
                </div>

                <span className="font-bold text-cyan-300">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              📋 ბოლო ჯავშნები
            </h2>

            <Link
              href="/admin-v2/bookings"
              className="text-cyan-300 transition hover:text-cyan-200"
            >
              ყველას ნახვა →
            </Link>
          </div>

          <div className="space-y-4">
            {latestBookings.map((booking) => (
              <div
                key={booking.guest}
                className="flex items-center justify-between rounded-2xl bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div>
                  <h3 className="font-semibold text-white">
                    {booking.guest}
                  </h3>

                  <p className="text-sm text-white/60">
                    {booking.type}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-cyan-300">
                    {booking.price}
                  </p>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      booking.status === "Confirmed"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              🔔 ბოლო აქტივობა
            </h2>

            <span className="text-cyan-300">
              Live
            </span>
          </div>

          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity}
                className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />

                <span className="text-white/80">
                  {activity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="mb-6 text-2xl font-bold text-white">
            ⚡ Quick Actions
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/admin-v2/bookings"
              className="rounded-2xl bg-cyan-500 p-5 text-center font-semibold transition hover:bg-cyan-600"
            >
              ➕ ახალი ჯავშანი
            </Link>

            <Link
              href="/admin-v2/tours"
              className="rounded-2xl bg-green-500 p-5 text-center font-semibold transition hover:bg-green-600"
            >
              🏔️ ტურების მართვა
            </Link>

            <Link
              href="/admin-v2/users"
              className="rounded-2xl bg-purple-500 p-5 text-center font-semibold transition hover:bg-purple-600"
            >
              👤 მომხმარებლების მართვა
            </Link>

            <Link
              href="/admin-v2/emails"
              className="rounded-2xl bg-orange-500 p-5 text-center font-semibold transition hover:bg-orange-600"
            >
              📧 ელფოსტის გაგზავნა
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="mb-6 text-2xl font-bold text-white">
            🌤️ Mestia Weather
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-6xl font-bold text-white">
                18°
              </h3>

              <p className="mt-3 text-white/70">
                Sunny • Mestia
              </p>

              <p className="mt-2 text-white/50">
                Perfect day for hiking.
              </p>
            </div>

            <div className="text-8xl">
              ☀️
            </div>
          </div>
        </div>
      </section>

      <footer className="rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-600 p-8 shadow-2xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">
              🚀 Georgia Travel Hub
            </h2>

            <p className="mt-2 text-cyan-100">
              Admin Dashboard v2 • Public Beta
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-cyan-100">
              Built with ❤️ by Nana Asatiani
            </p>

            <p className="mt-2 font-bold text-white">
              Version 2.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}