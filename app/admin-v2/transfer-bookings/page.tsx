"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      window.location.replace(`/login?next=${encodeURIComponent("/admin-v2/transfer-bookings")}`);
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
        id,transfer_id,guest_name,guest_email,guest_phone,travel_date,travel_time,
        passengers,pickup_address,dropoff_address,total_price,price_type,listed_price,
        notes,status,created_at,completed_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const rows = (bookingData as Booking[] | null) ?? [];
    const ids = Array.from(new Set(rows.map((row) => row.transfer_id).filter(Boolean)));

    const transferMap = new Map<string, Transfer>();
    if (ids.length) {
      const { data } = await supabase
        .from("transfers")
        .select("id,title,from_location,to_location")
        .in("id", ids);

      ((data as Transfer[] | null) ?? []).forEach((transfer) => transferMap.set(transfer.id, transfer));
    }

    setBookings(
      rows.map((row) => {
        const transfer = transferMap.get(row.transfer_id);
        return {
          ...row,
          transfer_title: transfer?.title || "უცნობი ტრანსფერი",
          route: `${transfer?.from_location || "—"} → ${transfer?.to_location || "—"}`,
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
        completed_at: status === "completed" ? new Date().toISOString() : null,
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
          ? { ...booking, status: data.status, completed_at: data.completed_at }
          : booking
      )
    );
    setMessage("✅ ჯავშნის სტატუსი განახლდა.");
    setUpdatingId(null);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === "all" || String(booking.status || "pending") === statusFilter;
      const matchesSearch =
        !q ||
        [
          booking.guest_name,
          booking.guest_email,
          booking.guest_phone,
          booking.transfer_title,
          booking.route,
        ].some((value) => String(value || "").toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-2xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Transfer Bookings</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">ტრანსფერის ჯავშნების მართვა</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/admin-v2/transfers" className="rounded-xl bg-white/10 px-4 py-3 font-bold">← Transfers</Link>
            <button onClick={() => void load()} className="rounded-xl bg-cyan-500 px-4 py-3 font-black">Refresh</button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="სტუმარი, ელფოსტა, მარშრუტი..."
            className="rounded-xl bg-white px-4 py-3 text-slate-900"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl bg-white px-4 py-3 text-slate-900">
            <option value="all">ყველა სტატუსი</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="completed">completed</option>
            <option value="rejected">rejected</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>

        {message && <div className="mt-5 rounded-xl bg-white/10 p-4">{message}</div>}

        {loading ? (
          <div className="mt-8">იტვირთება...</div>
        ) : (
          <div className="mt-8 space-y-5">
            {visible.map((booking) => (
              <article key={booking.id} className="rounded-3xl border border-white/10 bg-black/15 p-5">
                <div className="flex flex-col justify-between gap-5 lg:flex-row">
                  <div>
                    <h2 className="text-xl font-black">{booking.transfer_title}</h2>
                    <p className="mt-1 text-white/55">{booking.route}</p>
                    <div className="mt-4 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
                      <p>👤 {booking.guest_name || "—"}</p>
                      <p>📧 {booking.guest_email || "—"}</p>
                      <p>📞 {booking.guest_phone || "—"}</p>
                      <p>👥 {booking.passengers || 1} მგზავრი</p>
                      <p>📅 {booking.travel_date || "—"} {booking.travel_time || ""}</p>
                      <p>💰 {booking.total_price != null ? `${Number(booking.total_price).toLocaleString("ka-GE")} ₾` : "საბოლოო ფასი შეთანხმებით"}</p>
                      <p>📍 {booking.pickup_address || "—"}</p>
                      <p>🏁 {booking.dropoff_address || "—"}</p>
                    </div>
                    {booking.notes && <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-white/65">{booking.notes}</p>}
                  </div>

                  <div className="min-w-[180px]">
                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black">{booking.status || "pending"}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(["confirmed", "completed", "pending", "rejected", "cancelled"] as BookingStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => void updateStatus(booking.id, status)}
                      disabled={updatingId === booking.id || booking.status === status}
                      className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black hover:bg-white/20 disabled:opacity-35"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}

            {visible.length === 0 && <div className="rounded-2xl bg-white/5 p-8 text-center">ჯავშნები ვერ მოიძებნა.</div>}
          </div>
        )}
      </div>
    </main>
  );
}