import {
  Users,
  CalendarCheck,
  Mountain,
  Car,
  Wallet,
} from "lucide-react";

export default function TodaysSummary() {
  const items = [
    {
      icon: <Users className="text-sky-400" size={22} />,
      title: "Guests Today",
      value: "18",
    },
    {
      icon: <CalendarCheck className="text-green-400" size={22} />,
      title: "New Bookings",
      value: "6",
    },
    {
      icon: <Mountain className="text-orange-400" size={22} />,
      title: "Tours Today",
      value: "4",
    },
    {
      icon: <Car className="text-purple-400" size={22} />,
      title: "Transfers",
      value: "3",
    },
    {
      icon: <Wallet className="text-yellow-400" size={22} />,
      title: "Today's Revenue",
      value: "₾3,450",
    },
  ];

  return (
    <div className="bg-white/20 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        ⭐ Today's Summary
      </h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between bg-white/10 rounded-2xl px-5 py-4"
          >
            <div className="flex items-center gap-3">
              {item.icon}

              <span className="text-white font-medium">
                {item.title}
              </span>
            </div>

            <span className="text-white text-xl font-bold">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}