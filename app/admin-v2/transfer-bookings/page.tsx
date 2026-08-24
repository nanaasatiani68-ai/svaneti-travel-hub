"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

type Booking = {
  id: string;
  transfer_id: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  travel_date: string | null;
  travel_time: string | null;
  passengers: number | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  total_price: number | null;
  price_type: string | null;
  listed_price: number | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
  completed_at: string | null;

  is_return_transfer: boolean | null;
  return_date: string | null;
  flight_number: string | null;
  child_seat: boolean | null;

  driver_name: string | null;
  driver_phone: string | null;
  assigned_vehicle: string | null;
  vehicle_plate: string | null;

  transfer_title?: string;
  route?: string;
};

type Transfer = {
  id: string;
  title: string | null;
  from_location: string | null;
  to_location: string | null;
};

export default function TransferBookingsManagementPage() {
  const supabase = useMemo(() => createClient(), []);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [savingAssignmentId, setSavingAssignmentId] = useState<string | null>(
    null
  );

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      window.location.replace(
        `/login?next=${encodeURIComponent(
          "/admin-v2/transfer-bookings"
        )}`
      );
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = String(profile?.role || "").toLowerCase();

    if (role !== "director" && role !== "admin") {
      window.location.replace("/dashboard");
      return;
    }

    const { data: bookingData, error } = await supabase
      .from("transfer_bookings")
      .select(`
        id,
        transfer_id,
        guest_name,
        guest_email,
        guest_phone,
        travel_date,
        travel_time,
        passengers,
        pickup_address,
        dropoff_address,
        total_price,
        price_type,
        listed_price,
        notes,
        status,
        created_at,
        completed_at,
        is_return_transfer,
        return_date,
        flight_number,
        child_seat,
        driver_name,
        driver_phone,
        assigned_vehicle,
        vehicle_plate
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const rows = (bookingData as Booking[] | null) ?? [];
    const ids = Array.from(
      new Set(rows.map((row) => row.transfer_id).filter(Boolean))
    );

    const transferMap = new Map<string, Transfer>();

    if (ids.length) {
      const { data, error: transferError } = await supabase
        .from("transfers")
        .select("id,title,from_location,to_location")
        .in("id", ids);

      if (transferError) {
        setMessage(transferError.message);
      }

      ((data as Transfer[] | null) ?? []).forEach((transfer) =>
        transferMap.set(transfer.id, transfer)
      );
    }

    setBookings(
      rows.map((row) => {
        const transfer = transferMap.get(row.transfer_id);

        return {
          ...row,
          transfer_title: transfer?.title || "უცნობი ტრანსფერი",
          route: `${transfer?.from_location || "—"} → ${
            transfer?.to_location || "—"
          }`,
        };
      })
    );

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: BookingStatus) {
    setUpdatingId(id);
    setMessage("");

    const { data, error } = await supabase
      .from("transfer_bookings")
      .update({
        status,
        completed_at:
          status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select("id,status,completed_at")
      .maybeSingle();

    if (error || !data) {
      setMessage(error?.message || "სტატუსი ვერ შეიცვალა.");
      setUpdatingId(null);
      return;
    }

    setBookings((current) =>
      current.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              status: data.status,
              completed_at: data.completed_at,
            }
          : booking
      )
    );

    setMessage("✅ ჯავშნის სტატუსი განახლდა.");
    setUpdatingId(null);
  }

  function updateLocalField(
    id: string,
    field:
      | "driver_name"
      | "driver_phone"
      | "assigned_vehicle"
      | "vehicle_plate",
    value: string
  ) {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              [field]: value,
            }
          : booking
      )
    );
  }

  async function saveAssignment(booking: Booking) {
    setSavingAssignmentId(booking.id);
    setMessage("");

    const payload = {
      driver_name: booking.driver_name?.trim() || null,
      driver_phone: booking.driver_phone?.trim() || null,
      assigned_vehicle: booking.assigned_vehicle?.trim() || null,
      vehicle_plate: booking.vehicle_plate?.trim().toUpperCase() || null,
    };

    const { data, error } = await supabase
      .from("transfer_bookings")
      .update(payload)
      .eq("id", booking.id)
      .select(
        "id,driver_name,driver_phone,assigned_vehicle,vehicle_plate"
      )
      .maybeSingle();

    if (error || !data) {
      setMessage(
        error?.message || "მძღოლისა და მანქანის მონაცემები ვერ შეინახა."
      );
      setSavingAssignmentId(null);
      return;
    }

    setBookings((current) =>
      current.map((item) =>
        item.id === booking.id
          ? {
              ...item,
              driver_name: data.driver_name,
              driver_phone: data.driver_phone,
              assigned_vehicle: data.assigned_vehicle,
              vehicle_plate: data.vehicle_plate,
            }
          : item
      )
    );

    setMessage("✅ მძღოლი და მანქანა წარმატებით შეინახა.");
    setSavingAssignmentId(null);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "all" ||
        String(booking.status || "pending") === statusFilter;

      const matchesSearch =
        !q ||
        [
          booking.guest_name,
          booking.guest_email,
          booking.guest_phone,
          booking.transfer_title,
          booking.route,
          booking.flight_number,
          booking.driver_name,
          booking.driver_phone,
          booking.assigned_vehicle,
          booking.vehicle_plate,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(q)
        );

      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-2xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              Transfer Bookings
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              ტრანსფერის ჯავშნების მართვა
            </h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin-v2/transfers"
              className="rounded-xl bg-white/10 px-4 py-3 font-bold transition hover:bg-white/20"
            >
              ← Transfers
            </Link>

            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl bg-cyan-500 px-4 py-3 font-black transition hover:bg-cyan-400"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="სტუმარი, ელფოსტა, მარშრუტი, მძღოლი, მანქანა..."
            className="rounded-xl bg-white px-4 py-3 text-slate-900 outline-none"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-xl bg-white px-4 py-3 text-slate-900 outline-none"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="completed">completed</option>
            <option value="rejected">rejected</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>

        {message && (
          <div className="mt-5 rounded-xl bg-white/10 p-4">
            {message}
          </div>
        )}

        {loading ? (
          <div className="mt-8">იტვირთება...</div>
        ) : (
          <div className="mt-8 space-y-5">
            {visible.map((booking) => (
              <article
                key={booking.id}
                className="rounded-3xl border border-white/10 bg-black/15 p-5"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-black">
                      {booking.transfer_title}
                    </h2>

                    <p className="mt-1 text-white/55">
                      {booking.route}
                    </p>

                    <div className="mt-4 grid gap-2 text-sm text-white/75 sm:grid-cols-2 xl:grid-cols-3">
                      <p>👤 {booking.guest_name || "—"}</p>
                      <p>📧 {booking.guest_email || "—"}</p>
                      <p>📞 {booking.guest_phone || "—"}</p>

                      <p>
                        👥 {booking.passengers || 1} მგზავრი
                      </p>

                      <p>
                        📅 {booking.travel_date || "—"}{" "}
                        {booking.travel_time || ""}
                      </p>

                      <p>
                        💰{" "}
                        {booking.total_price != null
                          ? `${Number(
                              booking.total_price
                            ).toLocaleString("ka-GE")} ₾`
                          : "საბოლოო ფასი შეთანხმებით"}
                      </p>

                      <p className="break-words">
                        📍 {booking.pickup_address || "—"}
                      </p>

                      <p className="break-words">
                        🏁 {booking.dropoff_address || "—"}
                      </p>

                      <p>
                        🔁{" "}
                        {booking.is_return_transfer
                          ? "ორმხრივი ტრანსფერი"
                          : "ერთი მიმართულება"}
                      </p>

                      <p>
                        ↩️ დაბრუნება:{" "}
                        {booking.is_return_transfer &&
                        booking.return_date
                          ? formatDateTime(booking.return_date)
                          : "—"}
                      </p>

                      <p>
                        ✈️ ფრენა:{" "}
                        {booking.flight_number || "—"}
                      </p>

                      <p>
                        👶 ბავშვის სავარძელი:{" "}
                        {booking.child_seat ? "კი" : "არა"}
                      </p>
                    </div>

                    {booking.notes && (
                      <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-white/65">
                        📝 {booking.notes}
                      </p>
                    )}
                  </div>

                  <div className="min-w-[180px]">
                    <span
                      className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${statusClass(
                        booking.status
                      )}`}
                    >
                      {booking.status || "pending"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.15em] text-cyan-300">
                        Driver & Vehicle Assignment
                      </p>
                      <h3 className="mt-1 text-lg font-black">
                        მძღოლისა და მანქანის მინიჭება
                      </h3>
                    </div>

                    {booking.driver_name &&
                      booking.assigned_vehicle && (
                        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-200">
                          ✓ Assigned
                        </span>
                      )}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-white/60">
                        Driver Name
                      </span>

                      <input
                        type="text"
                        value={booking.driver_name || ""}
                        onChange={(event) =>
                          updateLocalField(
                            booking.id,
                            "driver_name",
                            event.target.value
                          )
                        }
                        placeholder="მაგ: Giorgi"
                        className="w-full rounded-xl bg-white px-4 py-3 text-slate-900 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-white/60">
                        Driver Phone
                      </span>

                      <input
                        type="tel"
                        value={booking.driver_phone || ""}
                        onChange={(event) =>
                          updateLocalField(
                            booking.id,
                            "driver_phone",
                            event.target.value
                          )
                        }
                        placeholder="+995 5XX XX XX XX"
                        className="w-full rounded-xl bg-white px-4 py-3 text-slate-900 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-white/60">
                        Vehicle
                      </span>

                      <input
                        type="text"
                        value={booking.assigned_vehicle || ""}
                        onChange={(event) =>
                          updateLocalField(
                            booking.id,
                            "assigned_vehicle",
                            event.target.value
                          )
                        }
                        placeholder="მაგ: Mercedes Vito"
                        className="w-full rounded-xl bg-white px-4 py-3 text-slate-900 outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-white/60">
                        Plate Number
                      </span>

                      <input
                        type="text"
                        value={booking.vehicle_plate || ""}
                        onChange={(event) =>
                          updateLocalField(
                            booking.id,
                            "vehicle_plate",
                            event.target.value
                          )
                        }
                        placeholder="AA-123-BB"
                        className="w-full rounded-xl bg-white px-4 py-3 uppercase text-slate-900 outline-none"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void saveAssignment(booking)
                    }
                    disabled={
                      savingAssignmentId === booking.id
                    }
                    className="mt-4 rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingAssignmentId === booking.id
                      ? "Saving..."
                      : "💾 Save Assignment"}
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(
                    [
                      "confirmed",
                      "completed",
                      "pending",
                      "rejected",
                      "cancelled",
                    ] as BookingStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        void updateStatus(
                          booking.id,
                          status
                        )
                      }
                      disabled={
                        updatingId === booking.id ||
                        booking.status === status
                      }
                      className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black transition hover:bg-white/20 disabled:opacity-35"
                    >
                      {updatingId === booking.id
                        ? "..."
                        : status}
                    </button>
                  ))}
                </div>
              </article>
            ))}

            {visible.length === 0 && (
              <div className="rounded-2xl bg-white/5 p-8 text-center">
                ჯავშნები ვერ მოიძებნა.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClass(status: string | null) {
  switch (status) {
    case "confirmed":
      return "bg-cyan-500/20 text-cyan-200";
    case "completed":
      return "bg-emerald-500/20 text-emerald-200";
    case "rejected":
      return "bg-red-500/20 text-red-200";
    case "cancelled":
      return "bg-slate-500/30 text-slate-200";
    default:
      return "bg-amber-500/20 text-amber-200";
  }
}