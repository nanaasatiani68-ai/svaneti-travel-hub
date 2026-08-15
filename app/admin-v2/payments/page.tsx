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
  user_id: string | null;
  organizer_name: string | null;
  commission_rate: number | null;
};

type OwnerProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type PaymentRow = Booking & {
  tour_title: string;
  owner_id: string | null;
  owner_name: string;
  owner_phone: string | null;
  commission_rate: number;
  commission_amount: number;
};

type RevenueFilter =
  | "all"
  | "confirmed"
  | "completed";

type OwnerSummary = {
  owner_id: string;
  owner_name: string;
  owner_phone: string | null;
  bookings_count: number;
  gross_revenue: number;
  commission_due: number;
};

const DEFAULT_COMMISSION_RATE = 10;

export default function PaymentsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<RevenueFilter>("all");

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonthKey());

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
        Tour
      >();

      if (tourIds.length > 0) {
        const {
          data: toursData,
          error: toursError,
        } = await supabase
          .from("tours")
          .select(
            "id, title, user_id, organizer_name, commission_rate"
          )
          .in("id", tourIds);

        if (toursError) {
          throw toursError;
        }

        (
          (toursData as Tour[] | null) ?? []
        ).forEach((tour) => {
          tourMap.set(String(tour.id), tour);
        });
      }

      const ownerIds = Array.from(
        new Set(
          Array.from(tourMap.values())
            .map((tour) => tour.user_id)
            .filter(
              (value): value is string =>
                Boolean(value)
            )
        )
      );

      const ownerMap = new Map<
        string,
        OwnerProfile
      >();

      if (ownerIds.length > 0) {
        const {
          data: profilesData,
          error: profilesError,
        } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", ownerIds);

        if (profilesError) {
          console.error(
            "Owner profiles loading error:",
            profilesError
          );
        } else {
          (
            (profilesData as OwnerProfile[] | null) ??
            []
          ).forEach((owner) => {
            ownerMap.set(owner.id, owner);
          });
        }
      }

      const prepared = bookings.map(
        (booking): PaymentRow => {
          const tour =
            booking.tour_id !== null
              ? tourMap.get(
                  String(booking.tour_id)
                ) ?? null
              : null;

          const owner =
            tour?.user_id
              ? ownerMap.get(tour.user_id) ?? null
              : null;

          const commissionRate =
            safeNumber(tour?.commission_rate) > 0
              ? safeNumber(tour?.commission_rate)
              : DEFAULT_COMMISSION_RATE;

          const gross =
            safeNumber(booking.total_price);

          const normalizedStatus =
            normalizeStatus(booking.status);

          const commissionAmount =
            normalizedStatus === "completed"
              ? roundMoney(
                  (gross * commissionRate) / 100
                )
              : 0;

          return {
            ...booking,
            tour_title:
              tour?.title || "უცნობი ტური",
            owner_id: tour?.user_id ?? null,
            owner_name:
              tour?.organizer_name ||
              owner?.full_name ||
              "უცნობი მფლობელი",
            owner_phone: owner?.phone ?? null,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
          };
        }
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
        row.owner_name
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

  const completedRows = useMemo(
    () =>
      normalizedRows.filter(
        (row) =>
          row.normalized_status === "completed"
      ),
    [normalizedRows]
  );

  const completedRevenue = useMemo(
    () =>
      completedRows.reduce(
        (sum, row) =>
          sum + safeNumber(row.total_price),
        0
      ),
    [completedRows]
  );

  const totalCommission = useMemo(
    () =>
      completedRows.reduce(
        (sum, row) =>
          sum + row.commission_amount,
        0
      ),
    [completedRows]
  );

  const monthlyCompletedRows = useMemo(
    () =>
      completedRows.filter(
        (row) =>
          getMonthKey(
            row.completed_at ||
              row.booking_date ||
              row.created_at
          ) === selectedMonth
      ),
    [completedRows, selectedMonth]
  );

  const monthlyOwnerSummaries =
    useMemo(() => {
      const map = new Map<
        string,
        OwnerSummary
      >();

      monthlyCompletedRows.forEach((row) => {
        const ownerKey =
          row.owner_id ||
          `unknown:${row.owner_name}`;

        const current =
          map.get(ownerKey) ?? {
            owner_id: ownerKey,
            owner_name: row.owner_name,
            owner_phone: row.owner_phone,
            bookings_count: 0,
            gross_revenue: 0,
            commission_due: 0,
          };

        current.bookings_count += 1;
        current.gross_revenue =
          roundMoney(
            current.gross_revenue +
              safeNumber(row.total_price)
          );
        current.commission_due =
          roundMoney(
            current.commission_due +
              row.commission_amount
          );

        map.set(ownerKey, current);
      });

      return Array.from(map.values()).sort(
        (a, b) =>
          b.commission_due -
          a.commission_due
      );
    }, [monthlyCompletedRows]);

  const monthlyGross = useMemo(
    () =>
      monthlyOwnerSummaries.reduce(
        (sum, owner) =>
          sum + owner.gross_revenue,
        0
      ),
    [monthlyOwnerSummaries]
  );

  const monthlyCommission = useMemo(
    () =>
      monthlyOwnerSummaries.reduce(
        (sum, owner) =>
          sum + owner.commission_due,
        0
      ),
    [monthlyOwnerSummaries]
  );

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
              💳 Payments & Commission
            </h1>

            <p className="mt-3 max-w-3xl text-white/60">
              Georgia Gateway Hub-ის საკომისიო ითვლება
              მხოლოდ შესრულებულ ტურებზე. სტანდარტული
              განაკვეთი არის 10%.
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
            title="სულ ჯავშნების თანხა"
            value={formatCurrency(totalRevenue)}
            note={`${normalizedRows.length} ჯავშანი`}
            icon="💰"
          />

          <StatCard
            title="შესრულებული ტურები"
            value={formatCurrency(
              completedRevenue
            )}
            note={`${completedRows.length} შესრულებული`}
            icon="🏁"
          />

          <StatCard
            title="სულ 10% საკომისიო"
            value={formatCurrency(
              totalCommission
            )}
            note="მხოლოდ შესრულებულ ტურებზე"
            icon="🧾"
          />

          <StatCard
            title="ამ თვის საკომისიო"
            value={formatCurrency(
              monthlyCommission
            )}
            note={`${monthlyCompletedRows.length} შესრულებული`}
            icon="📅"
          />
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5 shadow-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                Monthly invoices
              </p>

              <h2 className="mt-2 text-2xl font-black">
                🧾 თვის ბოლოს დასაინვოისებელი თანხები
              </h2>

              <p className="mt-2 text-white/60">
                არჩეულ თვეში შესრულებული ტურები
                დაჯგუფებულია ტურის მფლობელის მიხედვით.
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-white/60">
                აირჩიე თვე
              </span>

              <input
                type="month"
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(
                    event.target.value
                  )
                }
                className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 font-bold text-white outline-none focus:border-cyan-400"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MiniStat
              label="მფლობელები"
              value={String(
                monthlyOwnerSummaries.length
              )}
            />
            <MiniStat
              label="ტურების სრული თანხა"
              value={formatCurrency(
                monthlyGross
              )}
            />
            <MiniStat
              label="Georgia Gateway Hub 10%"
              value={formatCurrency(
                monthlyCommission
              )}
            />
          </div>

          {monthlyOwnerSummaries.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-7 text-center text-white/55">
              ამ თვეში შესრულებული ტურები ჯერ არ არის.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-black/20 text-left text-xs uppercase tracking-wider text-white/50">
                    <tr>
                      <th className="px-5 py-4">
                        ტურის მფლობელი
                      </th>
                      <th className="px-5 py-4">
                        დასრულებული ჯავშნები
                      </th>
                      <th className="px-5 py-4 text-right">
                        ჯამური გაყიდვები
                      </th>
                      <th className="px-5 py-4 text-right">
                        საკომისიო 10%
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {monthlyOwnerSummaries.map(
                      (owner) => (
                        <tr
                          key={owner.owner_id}
                          className="border-t border-white/10"
                        >
                          <td className="px-5 py-5">
                            <p className="font-black">
                              {owner.owner_name}
                            </p>

                            {owner.owner_phone && (
                              <p className="mt-1 text-sm text-white/45">
                                📞 {owner.owner_phone}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-5 text-white/70">
                            {owner.bookings_count}
                          </td>

                          <td className="px-5 py-5 text-right font-bold">
                            {formatCurrency(
                              owner.gross_revenue
                            )}
                          </td>

                          <td className="px-5 py-5 text-right text-lg font-black text-cyan-300">
                            {formatCurrency(
                              owner.commission_due
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="mt-7 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl md:grid-cols-[1fr_240px]">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="მოძებნე ტური, მფლობელი, სტუმარი ან ელფოსტა..."
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
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-white/10 text-left text-xs uppercase tracking-wider text-white/50">
                  <tr>
                    <th className="px-5 py-4">
                      ტური
                    </th>
                    <th className="px-5 py-4">
                      მფლობელი
                    </th>
                    <th className="px-5 py-4">
                      სტუმარი
                    </th>
                    <th className="px-5 py-4">
                      სტატუსი
                    </th>
                    <th className="px-5 py-4 text-right">
                      თანხა
                    </th>
                    <th className="px-5 py-4 text-right">
                      საკომისიო
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
                          <p className="font-black">
                            {row.tour_title}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            {formatDate(
                              row.completed_at ||
                                row.booking_date ||
                                row.created_at
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-semibold">
                            {row.owner_name}
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

                        <td className="px-5 py-5 text-right">
                          {row.normalized_status ===
                          "completed" ? (
                            <>
                              <p className="font-black text-cyan-300">
                                {formatCurrency(
                                  row.commission_amount
                                )}
                              </p>
                              <p className="mt-1 text-xs text-white/40">
                                {row.commission_rate}%
                              </p>
                            </>
                          ) : (
                            <span className="text-sm text-white/35">
                              დასრულების შემდეგ
                            </span>
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

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>
      <p className="mt-2 text-xl font-black">
        {value}
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

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
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
    }
  ).format(date);
}

function getMonthKey(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}

function getCurrentMonthKey() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}