"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Transfer = {
  id: string;
  from_location: string;
  to_location: string;
  price: number;
  vehicle: string | null;
  seats: number | null;
  description: string | null;
  status: string;
};

export default function MyTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransfers();
  }, []);

  async function loadTransfers() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("transfers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTransfers(data);
    }

    setLoading(false);
  }

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

        {loading ? (
          <div className="rounded-2xl bg-white p-10 shadow">
            იტვირთება...
          </div>
        ) : transfers.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 shadow">

            <h2 className="text-2xl font-bold">
              No transfers yet
            </h2>

            <p className="mt-3 text-gray-600">
              Your transfers will appear here after you add them.
            </p>

          </div>
        ) : (
          <div className="grid gap-6">

            {transfers.map((transfer) => (

              <div
                key={transfer.id}
                className="rounded-2xl bg-white p-6 shadow"
              >

                <h2 className="text-2xl font-bold">
                  🚐 {transfer.from_location} → {transfer.to_location}
                </h2>

                <p className="mt-3">
                  💰 {transfer.price} ₾
                </p>

                {transfer.vehicle && (
                  <p>🚙 {transfer.vehicle}</p>
                )}

                {transfer.seats && (
                  <p>👥 {transfer.seats} Seats</p>
                )}

                {transfer.description && (
                  <p className="mt-3 text-gray-600">
                    {transfer.description}
                  </p>
                )}

                <div className="mt-4 inline-block rounded-full bg-yellow-100 px-4 py-2 text-yellow-700 font-semibold">
                  {transfer.status}
                </div>

              </div>

            ))}

          </div>
        )}

      </div>
    </main>
  );
}