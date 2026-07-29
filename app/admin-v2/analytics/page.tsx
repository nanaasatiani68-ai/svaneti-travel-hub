"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TopItem = {
  label: string;
  count: number;
};

type AnalyticsStats = {
  todayUniqueVisitors: number;
  todayPageViews: number;
  sevenDayUniqueVisitors: number;
  sevenDayPageViews: number;
  thirtyDayUniqueVisitors: number;
  thirtyDayPageViews: number;
  topPages: TopItem[];
  topCountries: TopItem[];
};

type AnalyticsResponse = {
  success?: boolean;
  stats?: AnalyticsStats;
  error?: string;
};

const initialStats: AnalyticsStats = {
  todayUniqueVisitors: 0,
  todayPageViews: 0,
  sevenDayUniqueVisitors: 0,
  sevenDayPageViews: 0,
  thirtyDayUniqueVisitors: 0,
  thirtyDayPageViews: 0,
  topPages: [],
  topCountries: [],
};

export default function DirectorAnalyticsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadAnalytics = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (!session?.access_token) {
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/director/analytics", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const result = (await response.json()) as AnalyticsResponse;

        if (!response.ok || !result.success || !result.stats) {
          throw new Error(
            result.error || "სტატისტიკის ჩატვირთვა ვერ მოხერხდა."
          );
        }

        setStats(result.stats);
      } catch (error: unknown) {
        console.error("Analytics page error:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "უცნობი შეცდომა დაფიქსირდა."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, supabase]
  );

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-86px)] items-center justify-center bg-[#07111d] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />
          <p className="mt-5 text-lg font-bold">
            ვიზიტორების სტატისტიკა იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-86px)] bg-[#07111d] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              Director Analytics
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              📊 საიტის ვიზიტორები
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-white/60">
              უნიკალური ვიზიტორები, გვერდების ნახვები,
              პოპულარული გვერდები და ქვეყნები.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadAnalytics(true)}
              disabled={refreshing}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20 disabled:opacity-60"
            >
              {refreshing ? "ახლდება..." : "🔄 განახლება"}
            </button>

            <Link
              href="/admin-v2"
              className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
            >
              ← Director Dashboard
            </Link>
          </div>
        </header>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 font-semibold text-red-200">
            ❌ {errorMessage}
          </div>
        )}

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon="👤"
            title="დღეს ვიზიტორები"
            value={stats.todayUniqueVisitors}
            note={`${stats.todayPageViews} გვერდის ნახვა`}
          />

          <StatCard
            icon="📅"
            title="ბოლო 7 დღე"
            value={stats.sevenDayUniqueVisitors}
            note={`${stats.sevenDayPageViews} გვერდის ნახვა`}
          />

          <StatCard
            icon="📈"
            title="ბოლო 30 დღე"
            value={stats.thirtyDayUniqueVisitors}
            note={`${stats.thirtyDayPageViews} გვერდის ნახვა`}
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <RankingCard
            title="🔥 პოპულარული გვერდები"
            items={stats.topPages}
            emptyText="გვერდების მონაცემები ჯერ არ არის."
          />

          <RankingCard
            title="🌍 ვიზიტორების ქვეყნები"
            items={stats.topCountries}
            emptyText="ქვეყნების მონაცემები ჯერ არ არის."
          />
        </section>

        <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6 text-sm leading-7 text-cyan-100">
          ℹ️ უნიკალური ვიზიტორი ითვლება ბრაუზერში შენახული
          ანონიმური ID-ით. Admin V2 გვერდების ვიზიტები არ ითვლება.
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
  note,
}: {
  icon: string;
  title: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="text-4xl">{icon}</div>
      <p className="mt-5 text-sm font-bold text-white/50">{title}</p>
      <p className="mt-2 text-4xl font-black text-white">
        {value.toLocaleString("ka-GE")}
      </p>
      <p className="mt-3 text-sm font-semibold text-cyan-300">
        {note}
      </p>
    </div>
  );
}

function RankingCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: TopItem[];
  emptyText: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <h2 className="text-2xl font-black">{title}</h2>

      {items.length === 0 ? (
        <p className="mt-6 text-white/45">{emptyText}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="flex items-center justify-between gap-4 rounded-2xl bg-black/20 p-4"
            >
              <p className="min-w-0 truncate font-bold">
                {index + 1}. {item.label}
              </p>

              <span className="shrink-0 rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-black text-cyan-300">
                {item.count.toLocaleString("ka-GE")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}