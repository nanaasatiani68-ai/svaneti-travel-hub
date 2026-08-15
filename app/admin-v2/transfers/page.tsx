"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Transfer = {
  id: string;
  from_location: string;
  to_location: string;
  vehicle: string | null;
  seats: number | null;
  price: number;
  status: string;
  image_url: string | null;
  contact_phone: string | null;
  has_whatsapp: boolean | null;
  has_viber: boolean | null;
  created_at: string | null;
};

export default function TransfersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("transfers")
      .select(
        `
          id,
          from_location,
          to_location,
          vehicle,
          seats,
          price,
          status,
          image_url,
          contact_phone,
          has_whatsapp,
          has_viber,
          created_at
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Transfers loading error:", error);
      setMessage(`ტრანსფერების ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
      setTransfers([]);
      setLoading(false);
      return;
    }

    setTransfers((data as Transfer[] | null) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadTransfers();
  }, [loadTransfers]);

  async function updateStatus(
    transferId: string,
    nextStatus: "approved" | "rejected"
  ) {
    if (updatingId) return;

    setUpdatingId(transferId);
    setMessage("");

    const { error } = await supabase
      .from("transfers")
      .update({ status: nextStatus })
      .eq("id", transferId);

    if (error) {
      console.error("Transfer status update error:", error);
      setMessage(
        `სტატუსის შეცვლა ვერ მოხერხდა: ${error.message}`
      );
      setUpdatingId(null);
      return;
    }

    setTransfers((currentTransfers) =>
      currentTransfers.map((transfer) =>
        transfer.id === transferId
          ? { ...transfer, status: nextStatus }
          : transfer
      )
    );

    setUpdatingId(null);
  }

  function normalizePhoneForLink(phone: string) {
    return phone.replace(/\D/g, "");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              🚐 Transfers Management
            </h1>

            <p className="mt-3 text-white/70">
              ყველა დამატებული ტრანსფერი
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTransfers()}
            disabled={loading}
            className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            🔄 განახლება
          </button>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {message}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl bg-white/10 p-8 text-center text-white">
            ტრანსფერები იტვირთება...
          </div>
        ) : transfers.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white/10 p-8 text-white">
            ტრანსფერები ჯერ არ არის.
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {transfers.map((transfer) => {
              const isUpdating = updatingId === transfer.id;
              const isPending =
                String(transfer.status).toLowerCase() === "pending";

              return (
                <article
                  key={transfer.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 text-white shadow-xl"
                >
                  <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                    <div className="min-h-[220px] bg-black/20">
                      {transfer.image_url ? (
                        <img
                          src={transfer.image_url}
                          alt={`${transfer.from_location} - ${transfer.to_location}`}
                          className="h-full min-h-[220px] w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-[220px] items-center justify-center text-7xl">
                          🚐
                        </div>
                      )}
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-2xl font-black">
                            🚐 {transfer.from_location} →{" "}
                            {transfer.to_location}
                          </h2>

                          <div className="mt-4 grid gap-2 text-white/80 sm:grid-cols-2">
                            <p>💰 {Number(transfer.price).toLocaleString("ka-GE")} ₾</p>

                            {transfer.vehicle && (
                              <p>🚙 {transfer.vehicle}</p>
                            )}

                            {transfer.seats && (
                              <p>👥 {transfer.seats} Seats</p>
                            )}

                            {transfer.contact_phone && (
                              <p>📞 {transfer.contact_phone}</p>
                            )}
                          </div>

                          {transfer.contact_phone && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <a
                                href={`tel:${transfer.contact_phone}`}
                                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
                              >
                                📞 Call
                              </a>

                              {transfer.has_whatsapp && (
                                <a
                                  href={`https://wa.me/${normalizePhoneForLink(
                                    transfer.contact_phone
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold hover:bg-emerald-600"
                                >
                                  WhatsApp
                                </a>
                              )}

                              {transfer.has_viber && (
                                <a
                                  href={`viber://chat?number=%2B${normalizePhoneForLink(
                                    transfer.contact_phone
                                  )}`}
                                  className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-bold hover:bg-violet-600"
                                >
                                  Viber
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <StatusBadge status={transfer.status} />
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(
                              transfer.id,
                              "approved"
                            )
                          }
                          disabled={
                            isUpdating ||
                            String(transfer.status).toLowerCase() ===
                              "approved"
                          }
                          className="rounded-2xl bg-emerald-500 px-6 py-3 font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isUpdating
                            ? "მუშავდება..."
                            : "✅ დამტკიცება"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(
                              transfer.id,
                              "rejected"
                            )
                          }
                          disabled={
                            isUpdating ||
                            String(transfer.status).toLowerCase() ===
                              "rejected"
                          }
                          className="rounded-2xl bg-red-500 px-6 py-3 font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isUpdating
                            ? "მუშავდება..."
                            : "❌ უარყოფა"}
                        </button>

                        {!isPending && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (updatingId) return;
                              setUpdatingId(transfer.id);

                              const { error } = await supabase
                                .from("transfers")
                                .update({ status: "pending" })
                                .eq("id", transfer.id);

                              if (!error) {
                                setTransfers((currentTransfers) =>
                                  currentTransfers.map((item) =>
                                    item.id === transfer.id
                                      ? {
                                          ...item,
                                          status: "pending",
                                        }
                                      : item
                                  )
                                );
                              } else {
                                setMessage(
                                  `სტატუსის შეცვლა ვერ მოხერხდა: ${error.message}`
                                );
                              }

                              setUpdatingId(null);
                            }}
                            disabled={isUpdating}
                            className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 font-black text-white transition hover:bg-white/20 disabled:opacity-40"
                          >
                            ↩️ მოლოდინში დაბრუნება
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "approved") {
    return (
      <span className="w-fit rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-black text-emerald-300">
        approved
      </span>
    );
  }

  if (normalized === "rejected") {
    return (
      <span className="w-fit rounded-full bg-red-500/20 px-4 py-2 text-sm font-black text-red-300">
        rejected
      </span>
    );
  }

  return (
    <span className="w-fit rounded-full bg-yellow-500/20 px-4 py-2 text-sm font-black text-yellow-300">
      pending
    </span>
  );
}