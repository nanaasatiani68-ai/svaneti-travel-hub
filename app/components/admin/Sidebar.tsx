export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>

      <nav className="space-y-4">
        <a href="/admin" className="block hover:text-cyan-400">
          📊 Dashboard
        </a>

        <a href="/admin/tours" className="block hover:text-cyan-400">
          🏔️ Tours
        </a>

        <a href="/admin/bookings" className="block hover:text-cyan-400">
          📅 Bookings
        </a>

        <a href="/admin/users" className="block hover:text-cyan-400">
          👤 Users
        </a>

        <a href="/" className="block hover:text-red-400">
          ⬅️ Back to Website
        </a>
      </nav>
    </aside>
  );
}