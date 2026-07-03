type RoleBadgeProps = {
  role: string;
};

export default function RoleBadge({
  role,
}: RoleBadgeProps) {
  switch (role) {
    case "Super Admin":
      return (
        <span className="rounded-full bg-purple-500/20 border border-purple-400/30 px-3 py-1 text-sm font-semibold text-purple-300">
          👑 Super Admin
        </span>
      );

    case "Admin":
      return (
        <span className="rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-sm font-semibold text-blue-300">
          🛠 Admin
        </span>
      );

    case "Guide":
      return (
        <span className="rounded-full bg-green-500/20 border border-green-400/30 px-3 py-1 text-sm font-semibold text-green-300">
          🏔 Guide
        </span>
      );

    case "Driver":
      return (
        <span className="rounded-full bg-orange-500/20 border border-orange-400/30 px-3 py-1 text-sm font-semibold text-orange-300">
          🚐 Driver
        </span>
      );

    case "Hotel":
      return (
        <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 text-sm font-semibold text-cyan-300">
          🏨 Hotel
        </span>
      );

    default:
      return (
        <span className="rounded-full bg-slate-500/20 border border-slate-400/30 px-3 py-1 text-sm text-slate-300">
          {role}
        </span>
      );
  }
}