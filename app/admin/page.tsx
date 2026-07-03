import DashboardCard from "../components/admin/DashboardCard";

export default function AdminPage() {
  return (
    <div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="text-slate-500 mt-2">
          Welcome back, Nana 👋
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">

        <DashboardCard
          title="Bookings"
          value="25"
          icon="📋"
          color="bg-blue-600"
        />

        <DashboardCard
          title="Revenue"
          value="₾4,820"
          icon="💰"
          color="bg-green-600"
        />

        <DashboardCard
          title="Tours"
          value="12"
          icon="🏔️"
          color="bg-orange-500"
        />

        <DashboardCard
          title="Customers"
          value="148"
          icon="👥"
          color="bg-purple-600"
        />

      </div>

    </div>
  );
}