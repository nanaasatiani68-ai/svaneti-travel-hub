"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Booking = {
  id: string;
  tour_id: number | string | null;
  guest_name: string | null;
  guest_email: string | null;
  booking_date: string | null;
  people: number | null;
  total_price: number | null;
  status: string | null;
  created_at: string | null;
  completed_at: string | null;
};

type Tour = {
  id: number | string;
  title: string | null;
};

type PaymentRow = Booking & {
  tour_title: string;
};

type RevenueFilter =
  | "all"
  | "confirmed"
  | "completed";

export default function PaymentsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<RevenueFilter>("all");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "Payments session error:",
          sessionError
        );
      }

      let user =
        sessionData.session?.user ?? null;

      if (!user) {
        const {
          data: refreshData,
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error(
            "Payments session refresh error:",
            refreshError
          );
        }

        user = refreshData.user ?? null;
      }

      if (!user) {
        window.location.replace(
          `/login?next=${encodeURIComponent(
            "/admin-v2/payments"
          )}`
        );
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const role = String(
        profile?.role || ""
      )
        .trim()
        .toLowerCase();

      if (
        role !== "director" &&
        role !== "admin"
      ) {
        window.location.replace("/dashboard");
        return;
      }

      const {
        data: bookingsData,
        error: bookingsError,
      } = await supabase
        .from("bookings")
        .select(
          `
            id,
            tour_id,
            guest_name,
            guest_email,
            booking_date,
            people,
            total_price,
            status,
            created_at,
            completed_at
          `
        )
        .in("status", [
          "confirmed",
          "approved",
          "completed",
        ])
        .order("created_at", {
          ascending: false,
        });

      if (bookingsError) {
        throw bookingsError;
      }

      const bookings =
        (bookingsData as Booking[] | null) ?? [];

      const tourIds = Array.from(
        new Set(
          bookings
            .map((booking) => booking.tour_id)
            .filter(
              (
                value
              ): value is number | string =>
                value !== null &&
                value !== undefined
            )
        )
      );

      const tourMap = new Map<
        string,
        string
      >();

      if (tourIds.length > 0) {
        const {
          data: toursData,
          error: toursError,
        } = await supabase
          .from("tours")
          .select("id, title")
          .in("id", tourIds);

        if (toursError) {
          console.error(
            "Payments tours error:",
            toursError
          );
        } else {
          (
            (toursData as Tour[] | null) ?? []
          ).forEach((tour) => {
            tourMap.set(
              String(tour.id),
              tour.title || "უცნობი ტური"
            );
          });
        }
      }

      const prepared = bookings.map(
        (booking) => ({
          ...booking,
          tour_title:
            booking.tour_id !== null
              ? tourMap.get(
                  String(booking.tour_id)
                ) || "უცნობი ტური"
              : "უცნობი ტური",
        })
      );

      setRows(prepared);
    } catch (error) {
      console.error(
        "Payments loading error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "შემოსავლების ჩატვირთვა ვერ მოხერხდა."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const normalizedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        normalized_status:
          normalizeStatus(row.status),
      })),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return normalizedRows.filter((row) => {
      const matchesFilter =
        filter === "all" ||
        row.normalized_status === filter;

      const matchesSearch =
        !normalizedSearch ||
        row.tour_title
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.guest_name || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.guest_email || "")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [normalizedRows, filter, search]);

  const totalRevenue = useMemo(
    () =>
      normalizedRows.reduce(
        (sum, row) =>
          sum + safeNumber(row.total_price),
        0
      ),
    [normalizedRows]
  );

  const confirmedRevenue = useMemo(
    () =>
      normalizedRows
        .filter(
          (row) =>
            row.normalized_status ===
            "confirmed"
        )
        .reduce(
          (sum, row) =>
            sum +
            safeNumber(row.total_price),
          0
        ),
    [normalizedRows]
  );

  const completedRevenue = useMemo(
    () =>
      normalizedRows
        .filter(
          (row) =>
            row.normalized_status ===
            "completed"
        )
        .reduce(
          (sum, row) =>
            sum +
            safeNumber(row.total_price),
          0
        ),
    [normalizedRows]
  );

  const completedCount =
    normalizedRows.filter(
      (row) =>
        row.normalized_status === "completed"
    ).length;

  const confirmedCount =
    normalizedRows.filter(
      (row) =>
        row.normalized_status === "confirmed"
    ).length;

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#07111d] px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">💳</div>

          <p className="mt-4 font-bold text-white/70">
            შემოსავლები იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0b1929] via-[#081522] to-[#07111d] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              Finance
            </p>

            <h1 className="mt-2 text-4xl font-black">
              💳 Payments & Revenue
            </h1>

            <p className="mt-3 text-white/60">
              დადასტურებული და შესრულებული
              ტურების შემოსავლები.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void loadPayments()
              }
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
            >
              🔄 განახლება
            </button>

            <Link
              href="/admin-v2"
              className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        {errorMessage && (
          <div className="mt-7 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 font-semibold text-red-200">
            {errorMessage}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="სულ შემოსავალი"
            value={formatCurrency(totalRevenue)}
            note={`${normalizedRows.length} ჯავშანი`}
            icon="💰"
          />

          <StatCard
            title="დადასტურებული"
            value={formatCurrency(
              confirmedRevenue
            )}
            note={`${confirmedCount} ჯავშანი`}
            icon="✅"
          />

          <StatCard
            title="შესრულებული ტურები"
            value={formatCurrency(
              completedRevenue
            )}
            note={`${completedCount} შესრულებული`}
            icon="🏁"
          />

          <StatCard
            title="საშუალო ჯავშანი"
            value={formatCurrency(
              normalizedRows.length > 0
                ? totalRevenue /
                    normalizedRows.length
                : 0
            )}
            note="საშუალო ღირებულება"
            icon="📊"
          />
        </section>

        <section className="mt-7 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl md:grid-cols-[1fr_240px]">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="მოძებნე ტური, სტუმარი ან ელფოსტა..."
            className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-400"
          />

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target
                  .value as RevenueFilter
              )
            }
            className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 text-white outline-none focus:border-cyan-400"
          >
            <option value="all">
              ყველა შემოსავალი
            </option>

            <option value="confirmed">
              დადასტურებული
            </option>

            <option value="completed">
              შესრულებული
            </option>
          </select>
        </section>

        {filteredRows.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="text-7xl">
              💸
            </div>

            <h2 className="mt-5 text-2xl font-black">
              შემოსავალი ვერ მოიძებნა
            </h2>

            <p className="mt-3 text-white/50">
              დადასტურებული ან შესრულებული
              ჯავშნები აქ გამოჩნდება.
            </p>
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-white/10 text-left text-xs uppercase tracking-wider text-white/50">
                  <tr>
                    <th className="px-5 py-4">
                      ტური
                    </th>

                    <th className="px-5 py-4">
                      სტუმარი
                    </th>

                    <th className="px-5 py-4">
                      თარიღი
                    </th>

                    <th className="px-5 py-4">
                      სტატუსი
                    </th>

                    <th className="px-5 py-4 text-right">
                      თანხა
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map(
                    (row) => (
                      <tr
                        key={row.id}
                        className="border-t border-white/10 transition hover:bg-white/5"
                      >
                        <td className="px-5 py-5">
                          <p className="font-black text-white">
                            {row.tour_title}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            Booking #{row.id}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-semibold">
                            {row.guest_name ||
                              "სტუმარი"}
                          </p>

                          <p className="mt-1 text-sm text-white/45">
                            {row.guest_email ||
                              "ელფოსტა არ არის"}
                          </p>
                        </td>

                        <td className="px-5 py-5 text-sm text-white/70">
                          <p>
                            ტური:{" "}
                            {row.booking_date ||
                              "არ არის"}
                          </p>

                          {row.completed_at && (
                            <p className="mt-1 text-indigo-300">
                              დასრულდა:{" "}
                              {formatDate(
                                row.completed_at
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <StatusBadge
                            status={
                              row.normalized_status
                            }
                          />
                        </td>

                        <td className="px-5 py-5 text-right text-lg font-black text-emerald-300">
                          {formatCurrency(
                            safeNumber(
                              row.total_price
                            )
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <div className="text-3xl">
        {icon}
      </div>

      <p className="mt-4 text-sm font-bold text-white/50">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-white">
        {value}
      </p>

      <p className="mt-2 text-sm text-white/40">
        {note}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "confirmed" | "completed";
}) {
  if (status === "completed") {
    return (
      <span className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1.5 text-xs font-black text-indigo-300">
        🏁 შესრულებული
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-black text-emerald-300">
      ✅ დადასტურებული
    </span>
  );
}

function normalizeStatus(
  status: string | null
): "confirmed" | "completed" {
  const normalized = String(
    status || ""
  )
    .trim()
    .toLowerCase();

  if (normalized === "completed") {
    return "completed";
  }

  return "confirmed";
}

function safeNumber(
  value: number | null | undefined
) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat(
    "ka-GE",
    {
      maximumFractionDigits: 2,
    }
  ).format(value)} ₾`;
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "არ არის";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "ka-GE",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}