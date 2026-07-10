"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Transfer = {
  id: string;
  from_location: string;
  to_location: string;
  vehicle: string | null;
  seats: number | null;
  price: number;
  status: string;
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    loadTransfers();
  }, []);

  async function loadTransfers() {
    const { data, error } = await supabase
      .from("transfers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTransfers(data);
    }
  }

  return (
    <div>
      <div className="rounded-3xl bg-white/10 border border-white/20 p-8 backdrop-blur-xl shadow-2xl">

        <h1 className="text-4xl font-bold text-white">
          🚐 Transfers Management
        </h1>

        <p className="text-white/70 mt-3 mb-8">
          ყველა დამატებული ტრანსფერი
        </p>

        <div className="space-y-4">

          {transfers.length === 0 ? (

            <div className="rounded-xl bg-white/10 p-6 text-white">
              ტრანსფერები ჯერ არ არის.
            </div>

          ) : (

            transfers.map((transfer) => (

              <div
                key={transfer.id}
                className="rounded-xl bg-white/10 p-6 text-white"
              >

                <h2 className="text-2xl font-bold">
                  🚐 {transfer.from_location} → {transfer.to_location}
                </h2>

                <p className="mt-2">
                  💰 {transfer.price} ₾
                </p>

                {transfer.vehicle && (
                  <p>🚙 {transfer.vehicle}</p>
                )}

                {transfer.seats && (
                  <p>👥 {transfer.seats} Seats</p>
                )}

                <div className="mt-4 inline-block rounded-full bg-yellow-500/20 px-4 py-2">
                  {transfer.status}
                </div>

              </div>

            ))

          )}

        </div>

      </div>
    </div>
  );
}