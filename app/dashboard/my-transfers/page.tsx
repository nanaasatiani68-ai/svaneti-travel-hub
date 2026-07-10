"use client";

import Link from "next/link";

export default function MyTransfersPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">

          <h1 className="text-4xl font-bold">
            🚐 My Transfers
          </h1>

          <Link
            href="/dashboard/add-transfer"
            className="rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white hover:bg-sky-600"
          >
            ➕ Add Transfer
          </Link>

        </div>

        <div className="rounded-2xl bg-white p-10 shadow">

          <h2 className="text-2xl font-bold">
            No transfers yet
          </h2>

          <p className="mt-3 text-gray-600">
            Your transfers will appear here after you add them.
          </p>

        </div>

      </div>
    </main>
  );
}