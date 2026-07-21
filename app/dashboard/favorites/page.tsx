"use client";

import Link from "next/link";

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">❤️ ფავორიტები</h1>

      <div className="rounded-2xl bg-white p-8 text-center shadow">
        <div className="mb-4 text-6xl">❤️</div>

        <h2 className="text-2xl font-bold text-slate-900">
          ფავორიტები ჯერ ცარიელია
        </h2>

        <p className="mt-3 text-slate-600">
          აქ გამოჩნდება თქვენ მიერ შენახული ტურები.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-cyan-600 px-6 py-3 font-bold text-white transition hover:bg-cyan-700"
        >
          ტურების ნახვა
        </Link>
      </div>
    </div>
  );
}