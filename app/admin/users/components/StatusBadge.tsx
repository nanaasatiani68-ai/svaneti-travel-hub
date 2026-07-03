type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  switch (status) {
    case "Active":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-green-500/20 border border-green-400/30 px-3 py-1 text-sm font-medium text-green-300">
          <span className="h-2 w-2 rounded-full bg-green-400"></span>
          Active
        </span>
      );

    case "Away":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 border border-yellow-400/30 px-3 py-1 text-sm font-medium text-yellow-300">
          <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
          Away
        </span>
      );

    case "Disabled":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 border border-red-400/30 px-3 py-1 text-sm font-medium text-red-300">
          <span className="h-2 w-2 rounded-full bg-red-400"></span>
          Disabled
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-500/20 border border-slate-400/30 px-3 py-1 text-sm text-slate-300">
          {status}
        </span>
      );
  }
}