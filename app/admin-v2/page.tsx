import TodaysSummary from "@/components/admin-v2/TodaysSummary";
export default function AdminV2Page() {
  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15,23,42,.55), rgba(15,23,42,.55)), url('/mestia-bg.jpg')",
      }}
    >
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="w-72 bg-slate-950/80 backdrop-blur-xl text-white p-8 border-r border-white/10">

          <h1 className="text-3xl font-bold">
            🏔️ SVANETI
          </h1>

          <p className="text-slate-400 mb-10">
            Travel Hub CMS
          </p>

          <nav className="space-y-3">

            <MenuItem text="🏠 Dashboard" />
            <MenuItem text="📋 Bookings" />
            <MenuItem text="🏔️ Tours" />
            <MenuItem text="👥 Customers" />
            <MenuItem text="💳 Payments" />
            <MenuItem text="📅 Calendar" />
            <MenuItem text="📧 Emails" />
            <MenuItem text="👨‍💼 Staff" />
            <MenuItem text="⚙️ Settings" />

          </nav>

        </aside>

        {/* Content */}

        <section className="flex-1 p-10">

          {/* Top */}

          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 mb-8">

            <span className="inline-block bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
              🏔️ SVANETI TRAVEL HUB
            </span>

            <h1 className="text-5xl font-extrabold text-white">
              Welcome back, Nana 👋
            </h1>

            <p className="text-white/90 text-xl mt-3">
              Every booking is the beginning of a new adventure.
            </p>

            <p className="text-white/70 mt-2">
              Manage your hotel, tours and guests from one beautiful place.
            </p>

          </div>

          {/* Cards */}

          <div className="grid grid-cols-4 gap-6 mb-8">

            <Card
              title="Bookings"
              value="128"
              color="from-blue-500 to-blue-700"
            />

            <Card
              title="Revenue"
              value="₾42,850"
              color="from-green-500 to-green-700"
            />

            <Card
              title="Customers"
              value="548"
              color="from-purple-500 to-purple-700"
            />

            <Card
              title="Tours"
              value="18"
              color="from-orange-500 to-orange-700"
            />

          </div>

          {/* Second Row */}

          <div className="grid grid-cols-3 gap-6">

            <div className="col-span-2 bg-white/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">

              <h2 className="text-white text-2xl font-bold mb-6">
                📈 Revenue Overview
              </h2>

              <div className="h-72 rounded-2xl bg-white/10 flex items-center justify-center text-white/70">
                Revenue Chart
              </div>

            </div>

            <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">

              <h2 className="text-white text-2xl font-bold mb-6">
                📅 Today
              </h2>

              <div className="space-y-4 text-white">

                <div>✅ Check-ins: 4</div>

                <div>🚪 Check-outs: 2</div>

                <div>📋 Pending Bookings: 7</div>

                <div>💰 Revenue: ₾3,450</div>

              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

function MenuItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl px-4 py-3 hover:bg-white/10 cursor-pointer transition-all duration-300">
      {text}
    </div>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${color} rounded-3xl p-6 shadow-2xl text-white hover:scale-105 transition-all duration-300`}
    >
      <p className="text-white/80">
        {title}
      </p>

      <h2 className="text-5xl font-bold mt-3">
        {value}
      </h2>
    </div>
  );
}