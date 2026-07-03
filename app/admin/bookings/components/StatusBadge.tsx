type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  switch (status) {
    case "Confirmed":
      return (
        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-400/30 text-sm font-medium">
          🟢 Confirmed
        </span>
      );

    case "Pending":
      return (
        <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 text-sm font-medium">
          🟡 Pending
        </span>
      );

    case "Cancelled":
      return (
        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/30 text-sm font-medium">
          🔴 Cancelled
        </span>
      );

    case "Paid":
      return (
        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-sm font-medium">
          💳 Paid
        </span>
      );

    case "Unpaid":
      return (
        <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30 text-sm font-medium">
          💰 Unpaid
        </span>
      );

    default:
      return (
        <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-400/30 text-sm font-medium">
          {status}
        </span>
      );
  }
}