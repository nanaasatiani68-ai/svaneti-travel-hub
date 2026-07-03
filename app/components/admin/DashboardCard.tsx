type DashboardCardProps = {
  title: string;
  value: string;
  color: string;
  icon: string;
};

export default function DashboardCard({
  title,
  value,
  color,
  icon,
}: DashboardCardProps) {
  return (
    <div
      className={`rounded-2xl shadow-lg p-6 text-white ${color}`}
    >
      <div className="flex justify-between items-center">

        <div>
          <p className="text-white/80 text-sm">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {value}
          </h2>
        </div>

        <div className="text-5xl">
          {icon}
        </div>

      </div>
    </div>
  );
}