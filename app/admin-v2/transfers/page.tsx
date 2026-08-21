"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type Transfer = {
  id: string;
  title: string | null;
  transfer_type: string | null;
  from_location: string;
  to_location: string;
  vehicle: string | null;
  seats: number | null;
  price: number;
  status: string;
  image_url: string | null;
  contact_phone: string | null;
  created_at: string | null;
};

type TransferBooking = {
  id: string;
  transfer_id: string | number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  contact_whatsapp: boolean | null;
  travel_date: string;
  travel_time: string | null;
  passengers: number;
  vehicle_type: string | null;
  luggage_count: number | null;
  pickup_address: string;
  dropoff_address: string;
  flight_number: string | null;
  total_price: number | null;
  notes: string | null;
  status: string;
  created_at: string | null;
  transfers:
    | {
        title: string | null;
        from_location: string | null;
        to_location: string | null;
      }
    | null;
};

export default function TransfersAdminPage() {
  const supabase = useMemo(() => createClient(), []);

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [bookings, setBookings] = useState<TransferBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const [transferResult, bookingResult] = await Promise.all([
      supabase
        .from("transfers")
        .select(`
          id,
          title,
          transfer_type,
          from_location,
          to_location,
          vehicle,
          seats,
          price,
          status,
          image_url,
          contact_phone,
          created_at
        `)
        .order("created_at", { ascending: false }),

      supabase
        .from("transfer_bookings")
        .select(`
          id,
          transfer_id,
          guest_name,
          guest_email,
          guest_phone,
          contact_whatsapp,
          travel_date,
          travel_time,
          passengers,
          vehicle_type,
          luggage_count,
          pickup_address,
          dropoff_address,
          flight_number,
          total_price,
          notes,
          status,
          created_at,
          transfers (
            title,
            from_location,
            to_location
          )
        `)
        .order("created_at", { ascending: false }),
    ]);

    if (transferResult.error) {
      setMessage(
        `ტრანსფერების ჩატვირთვა ვერ მოხერხდა: ${transferResult.error.message}`
      );
      setTransfers([]);
    } else {
      setTransfers((transferResult.data as Transfer[] | null) ?? []);
    }

    if (bookingResult.error) {
      setMessage((current) =>
        current
          ? `${current} | ჯავშნები: ${bookingResult.error?.message}`
          : `ჯავშნების ჩატვირთვა ვერ მოხერხდა: ${bookingResult.error?.message}`
      );
      setBookings([]);
    } else {
      setBookings(
        (bookingResult.data as unknown as TransferBooking[] | null) ?? []
      );
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function updateStatus(
    table: "transfers" | "transfer_bookings",
    id: string,
    status: string
  ) {
    if (updatingId) return;

    setUpdatingId(id);
    setMessage("");

    const { error } = await supabase
      .from(table)
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(`სტატუსის შეცვლა ვერ მოხერხდა: ${error.message}`);
      setUpdatingId(null);
      return;
    }

    if (table === "transfers") {
      setTransfers((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status } : item
        )
      );
    } else {
      setBookings((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status } : item
        )
      );
    }

    setMessage("✅ სტატუსი განახლდა.");
    setUpdatingId(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              🚐 Transfers Management
            </h1>
            <p className="mt-2 text-white/65">
              ტრანსფერები და კლიენტების ჯავშნები
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold text-white"
          >
            🔄 განახლება
          </button>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl bg-cyan-500/10 p-4 text-cyan-100">
            {message}
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-2xl font-black text-white">ტრანსფერები</h2>

          {loading ? (
            <div className="mt-5 rounded-2xl bg-white/10 p-8 text-white">
              იტვირთება...
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {transfers.map((transfer) => (
                <article
                  key={transfer.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 text-white"
                >
                  <div className="grid lg:grid-cols-[240px_1fr]">
                    <div className="min-h-[200px] bg-black/20">
                      {transfer.image_url ? (
                        <img
                          src={transfer.image_url}
                          alt={transfer.title || "Transfer"}
                          className="h-full min-h-[200px] w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-[200px] items-center justify-center text-7xl">
                          🚐
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-black">
                            {transfer.title ||
                              `${transfer.from_location} → ${transfer.to_location}`}
                          </h3>

                          <p className="mt-2 text-cyan-200">
                            {transfer.transfer_type || "Transfer"}
                          </p>

                          <div className="mt-4 grid gap-2 text-white/75 sm:grid-cols-2">
                            <p>
                              📍 {transfer.from_location} →{" "}
                              {transfer.to_location}
                            </p>
                            <p>
                              💰{" "}
                              {Number(transfer.price).toLocaleString(
                                "ka-GE"
                              )}{" "}
                              ₾
                            </p>
                            {transfer.vehicle && (
                              <p>🚙 {transfer.vehicle}</p>
                            )}
                            {transfer.seats && (
                              <p>👥 {transfer.seats} Seats</p>
                            )}
                          </div>
                        </div>

                        <Badge status={transfer.status} />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <Action
                          text="✅ Approve"
                          disabled={updatingId === transfer.id}
                          onClick={() =>
                            void updateStatus(
                              "transfers",
                              transfer.id,
                              "approved"
                            )
                          }
                        />
                        <Action
                          text="❌ Reject"
                          disabled={updatingId === transfer.id}
                          onClick={() =>
                            void updateStatus(
                              "transfers",
                              transfer.id,
                              "rejected"
                            )
                          }
                        />
                        <Action
                          text="↩️ Pending"
                          disabled={updatingId === transfer.id}
                          onClick={() =>
                            void updateStatus(
                              "transfers",
                              transfer.id,
                              "pending"
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 border-t border-white/10 pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">
                📋 Transfer Bookings
              </h2>
              <p className="mt-2 text-white/60">
                სრული ინფორმაცია თითოეულ მოთხოვნაზე
              </p>
            </div>

            <span className="rounded-full bg-cyan-500/20 px-4 py-2 font-black text-cyan-200">
              {bookings.length} booking
            </span>
          </div>

          <div className="mt-5 space-y-5">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-3xl border border-white/10 bg-slate-950/35 p-5 text-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
                      {booking.transfers?.title ||
                        `${booking.transfers?.from_location || "Transfer"} → ${
                          booking.transfers?.to_location || ""
                        }`}
                    </p>

                    <h3 className="mt-2 text-2xl font-black">
                      {booking.guest_name}
                    </h3>
                  </div>

                  <Badge status={booking.status} />
                </div>

                <div className="mt-5 grid gap-3 text-white/75 sm:grid-cols-2 xl:grid-cols-3">
                  <p>
                    📅 {booking.travel_date} {booking.travel_time || ""}
                  </p>
                  <p>👥 {booking.passengers} მგზავრი</p>
                  <p>🧳 {booking.luggage_count ?? 0} ბარგი</p>
                  <p>🚗 {booking.vehicle_type || "No preference"}</p>
                  <p>📍 {booking.pickup_address}</p>
                  <p>🏁 {booking.dropoff_address}</p>
                  {booking.flight_number && (
                    <p>✈️ {booking.flight_number}</p>
                  )}
                  <p>
                    📞 {booking.guest_phone}
                    {booking.contact_whatsapp ? " • WhatsApp" : ""}
                  </p>
                  <p>✉️ {booking.guest_email}</p>
                  <p>
                    💰{" "}
                    {booking.total_price !== null
                      ? `${Number(booking.total_price).toLocaleString(
                          "ka-GE"
                        )} ₾`
                      : "შეთანხმებით"}
                  </p>
                </div>

                {booking.notes && (
                  <div className="mt-4 rounded-2xl bg-white/5 p-4 text-white/70">
                    📝 {booking.notes}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Action
                    text="✅ Confirm"
                    disabled={updatingId === booking.id}
                    onClick={() =>
                      void updateStatus(
                        "transfer_bookings",
                        booking.id,
                        "confirmed"
                      )
                    }
                  />
                  <Action
                    text="✔️ Completed"
                    disabled={updatingId === booking.id}
                    onClick={() =>
                      void updateStatus(
                        "transfer_bookings",
                        booking.id,
                        "completed"
                      )
                    }
                  />
                  <Action
                    text="❌ Cancel"
                    disabled={updatingId === booking.id}
                    onClick={() =>
                      void updateStatus(
                        "transfer_bookings",
                        booking.id,
                        "cancelled"
                      )
                    }
                  />
                  <Action
                    text="↩️ Pending"
                    disabled={updatingId === booking.id}
                    onClick={() =>
                      void updateStatus(
                        "transfer_bookings",
                        booking.id,
                        "pending"
                      )
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Action({
  text,
  onClick,
  disabled,
}: {
  text: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 font-bold text-white disabled:opacity-40"
    >
      {text}
    </button>
  );
}

function Badge({ status }: { status: string }) {
  const normalized = String(status || "pending").toLowerCase();

  const className =
    normalized === "approved" ||
    normalized === "confirmed" ||
    normalized === "completed"
      ? "bg-emerald-500/20 text-emerald-300"
      : normalized === "rejected" || normalized === "cancelled"
      ? "bg-red-500/20 text-red-300"
      : "bg-yellow-500/20 text-yellow-300";

  return (
    <span
      className={`rounded-full px-4 py-2 text-sm font-black ${className}`}
    >
      {normalized}
    </span>
  );
}
