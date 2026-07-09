"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold mb-2">
          👋 Welcome to your Dashboard
        </h1>

        <p className="text-gray-600 mb-10">
          Manage your profile, tours and bookings.
        </p>

        <div className="grid md:grid-cols-3 gap-6">

          <Link
            href="/profile"
            className="bg-white rounded-xl p-6 shadow hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold">👤 My Profile</h2>
            <p className="mt-2 text-gray-600">
              Edit your personal information.
            </p>
          </Link>

          <Link
            href="/dashboard/my-tours"
            className="bg-white rounded-xl p-6 shadow hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold">🏔️ My Tours</h2>
            <p className="mt-2 text-gray-600">
              View and manage your tours.
            </p>
          </Link>

          <Link
            href="/dashboard/add-tour"
            className="bg-white rounded-xl p-6 shadow hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold">➕ Add Tour</h2>
            <p className="mt-2 text-gray-600">
              Publish a new tour.
            </p>
          </Link>

          <Link
            href="/dashboard/bookings"
            className="bg-white rounded-xl p-6 shadow hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold">📅 My Bookings</h2>
            <p className="mt-2 text-gray-600">
              See all your bookings.
            </p>
          </Link>

          <Link
            href="/dashboard/favorites"
            className="bg-white rounded-xl p-6 shadow hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold">❤️ Favorites</h2>
            <p className="mt-2 text-gray-600">
              Saved tours and hotels.
            </p>
          </Link>

          <button
            onClick={logout}
            className="bg-red-500 text-white rounded-xl p-6 hover:bg-red-600"
          >
            <h2 className="text-2xl font-bold">🚪 Logout</h2>
            <p className="mt-2">
              Sign out of your account.
            </p>
          </button>

        </div>
      </div>
    </main>
  );
}