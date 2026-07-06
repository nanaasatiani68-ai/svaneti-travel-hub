const stats = [
  {
    title: "დაჯავშნები",
    value: "128",
    note: "+12% ამ კვირაში",
    color: "from-sky-500 to-cyan-400",
    icon: "📋",
  },
  {
    title: "შემოსავალი",
    value: "₾42,850",
    note: "+18% ამ თვეში",
    color: "from-green-500 to-emerald-400",
    icon: "💰",
  },
  {
    title: "მომხმარებლები",
    value: "548",
    note: "24 ახალი",
    color: "from-purple-500 to-violet-400",
    icon: "👥",
  },
  {
    title: "ტურები",
    value: "18",
    note: "6 აქტიური",
    color: "from-orange-500 to-red-400",
    icon: "🏔️",
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
    <div className="space-y-8">
      <section className="rounded-3xl bg-white/10 border border-white/20 p-8 backdrop-blur-xl shadow-2xl">
        <span className="inline-block bg-cyan-500 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4 shadow-lg">
          🏔️ სვანეთის ტურისტული ცენტრი
        </span>

        <h1 className="text-5xl font-extrabold text-white">
          კეთილი იყოს შენი დაბრუნება, ნანა 👋
        </h1>

        <p className="text-white/80 mt-4 text-lg">
          მართე ჯავშნები, ტურები, მომხმარებლები და მთელი პლატფორმა ერთი ადგილიდან.
        </p>

        <p className="text-white/60 mt-2">
          დღეს ახალი თავგადასავლების დასაწყისია.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div
            key={item.title}
            className={`rounded-3xl p-6 text-white shadow-2xl bg-gradient-to-br ${item.color} hover:scale-105 transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80">{item.title}</p>
                <h2 className="text-4xl font-bold mt-3">{item.value}</h2>
                <p className="text-white/75 mt-2 text-sm">{item.note}</p>
              </div>

              <div className="text-5xl">{item.icon}</div>
            </div>
          </div>
        ))}
      </section>      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 rounded-3xl bg-white/10 border border-white/20 p-6 backdrop-blur-xl shadow-2xl">

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              📈 შემოსავლების მიმოხილვა
            </h2>

            <span className="text-cyan-300 font-semibold">
              ბოლო 6 თვე
            </span>
          </div>

          <div className="flex items-end justify-between h-72 gap-4">

            {revenueData.map((item) => (
              <div
                key={item.month}
                className="flex flex-col items-center flex-1"
              >
                <div
                  style={{
                    height: `${item.value * 2}px`,
                  }}
                  className="w-full rounded-t-3xl bg-gradient-to-t from-cyan-600 to-sky-400 shadow-xl hover:scale-105 transition"
                />

                <span className="text-white/70 mt-4">
                  {item.month}
                </span>
              </div>
            ))}

          </div>

        </div>

        <div className="rounded-3xl bg-white/10 border border-white/20 p-6 backdrop-blur-xl shadow-2xl">

          <h2 className="text-2xl font-bold text-white mb-6">
            📅 დღეს
          </h2>

          <div className="space-y-5">

            {todayItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between bg-white/5 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {item.icon}
                  </span>

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

      </section>      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <div className="rounded-3xl bg-white/10 border border-white/20 p-6 backdrop-blur-xl shadow-2xl">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              📋 ბოლო ჯავშნები
            </h2>

            <button className="text-cyan-300 hover:text-cyan-200 transition">
              ყველას ნახვა →
            </button>
          </div>

          <div className="space-y-4">

            {latestBookings.map((booking) => (
              <div
                key={booking.guest}
                className="flex items-center justify-between rounded-2xl bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <div>
                  <h3 className="text-white font-semibold">
                    {booking.guest}
                  </h3>

                  <p className="text-white/60 text-sm">
                    {booking.type}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-cyan-300 font-bold">
                    {booking.price}
                  </p>

                  <span
                    className={`inline-block mt-2 rounded-full px-3 py-1 text-xs font-semibold ${
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

        <div className="rounded-3xl bg-white/10 border border-white/20 p-6 backdrop-blur-xl shadow-2xl">

          <div className="flex items-center justify-between mb-6">
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
                className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></div>

                <span className="text-white/80">
                  {activity}
                </span>

              </div>
            ))}

          </div>

        </div>

      </section>      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <div className="rounded-3xl bg-white/10 border border-white/20 p-6 backdrop-blur-xl shadow-2xl">

          <h2 className="text-2xl font-bold text-white mb-6">
            ⚡ Quick Actions
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <button className="rounded-2xl bg-cyan-500 hover:bg-cyan-600 transition p-5 font-semibold">
              ➕ ახალი ჯავშანი
            </button>

            <button className="rounded-2xl bg-green-500 hover:bg-green-600 transition p-5 font-semibold">
              🏔️ ახალი ტური
            </button>

            <button className="rounded-2xl bg-purple-500 hover:bg-purple-600 transition p-5 font-semibold">
              👤 მომხმარებლის დამატება
            </button>

            <button className="rounded-2xl bg-orange-500 hover:bg-orange-600 transition p-5 font-semibold">
              📧 ელფოსტის გაგზავნა
            </button>

          </div>

        </div>

        <div className="rounded-3xl bg-white/10 border border-white/20 p-6 backdrop-blur-xl shadow-2xl">

          <h2 className="text-2xl font-bold text-white mb-6">
            🌤️ Mestia Weather
          </h2>

          <div className="flex items-center justify-between">

            <div>

              <h3 className="text-6xl font-bold text-white">
                18°
              </h3>

              <p className="text-white/70 mt-3">
                Sunny • Mestia
              </p>

              <p className="text-white/50 mt-2">
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

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-3xl font-bold text-white">
              🚀 Svaneti Travel Hub
            </h2>

            <p className="text-cyan-100 mt-2">
              Admin Dashboard v2 • Public Beta
            </p>

          </div>

          <div className="text-right">

            <p className="text-cyan-100">
              Built with ❤️ by Nana Asatiani
            </p>

            <p className="text-white font-bold mt-2">
              Version 2.0
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}
