"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type StaffRole = "director" | "admin" | "user";

type StaffUser = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
};

type StaffApiResponse = {
  success?: boolean;
  users?: StaffUser[];
  currentUserId?: string;
  error?: string;
  message?: string;
};

export default function StaffPage() {
  const router = useRouter();

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | StaffRole
  >("all");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

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

      const response = await fetch("/api/director/staff", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const result =
        (await response.json()) as StaffApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "თანამშრომლების ჩატვირთვა ვერ მოხერხდა."
        );
      }

      setUsers(result.users || []);
      setCurrentUserId(result.currentUserId || "");
    } catch (error: unknown) {
      console.error("Staff loading error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const normalizedRole = normalizeRole(user.role);

      const matchesRole =
        roleFilter === "all" || normalizedRole === roleFilter;

      const matchesSearch =
        !normalizedSearch ||
        String(user.full_name || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        String(user.phone || "")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const directorCount = users.filter(
    (user) => normalizeRole(user.role) === "director"
  ).length;

  const adminCount = users.filter(
    (user) => normalizeRole(user.role) === "admin"
  ).length;

  const regularUserCount = users.filter(
    (user) => normalizeRole(user.role) === "user"
  ).length;

  async function changeRole(
    user: StaffUser,
    nextRole: StaffRole
  ) {
    const currentRole = normalizeRole(user.role);

    if (user.id === currentUserId) {
      setErrorMessage(
        "საკუთარი Director როლის შეცვლა ამ გვერდიდან შეუძლებელია."
      );
      return;
    }

    if (currentRole === "director") {
      setErrorMessage(
        "სხვა Director-ის როლის შეცვლა ამ გვერდიდან შეუძლებელია."
      );
      return;
    }

    if (currentRole === nextRole) {
      return;
    }

    const actionText =
      nextRole === "admin"
        ? "Admin-ის უფლება მიეცეს"
        : "Admin-ის უფლება მოეხსნას";

    const confirmed = window.confirm(
      `ნამდვილად გინდა, რომ მომხმარებელს ${
        user.full_name || user.email
      } ${actionText}?`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingUserId(user.id);
    setErrorMessage("");
    setSuccessMessage("");

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

      const response = await fetch("/api/director/staff", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          role: nextRole,
        }),
      });

      const result =
        (await response.json()) as StaffApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "როლის შეცვლა ვერ მოხერხდა."
        );
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                role: nextRole,
              }
            : currentUser
        )
      );

      setSuccessMessage(
        nextRole === "admin"
          ? `${user.full_name || user.email} გახდა Admin.`
          : `${
              user.full_name || user.email
            }-ს Admin-ის უფლება მოეხსნა.`
      );
    } catch (error: unknown) {
      console.error("Role update error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setErrorMessage(message);
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />

          <p className="mt-5 text-lg font-bold">
            თანამშრომლები იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              Director Control
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              👨‍💼 თანამშრომლების მართვა
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-white/60">
              მხოლოდ Director-ს შეუძლია Admin-ის დამატება,
              უფლებების მოხსნა და თანამშრომლების როლების მართვა.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadStaff()}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
            >
              🔄 განახლება
            </button>

            <Link
              href="/admin-v2"
              className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
            >
              ← Admin Dashboard
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="👥"
            label="ყველა მომხმარებელი"
            value={users.length}
          />

          <StatCard
            icon="👑"
            label="Director"
            value={directorCount}
          />

          <StatCard
            icon="🛡️"
            label="Admin"
            value={adminCount}
          />

          <StatCard
            icon="👤"
            label="User"
            value={regularUserCount}
          />
        </section>

        <section className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl md:grid-cols-[1fr_250px]">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="მოძებნე სახელით, ელფოსტით ან ტელეფონით..."
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-400"
          />

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value as "all" | StaffRole
              )
            }
            className="rounded-2xl border border-white/10 bg-slate-950 px-5 py-3 text-white outline-none focus:border-cyan-400"
          >
            <option value="all">ყველა როლი</option>
            <option value="director">Director</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 font-semibold text-red-200">
            ❌ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 font-semibold text-emerald-200">
            ✅ {successMessage}
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="text-7xl">📭</div>

            <h2 className="mt-5 text-3xl font-black">
              მომხმარებელი ვერ მოიძებნა
            </h2>

            <p className="mt-3 text-white/50">
              შეცვალე ძიების ტექსტი ან როლის ფილტრი.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => {
              const role = normalizeRole(user.role);
              const isCurrentUser = user.id === currentUserId;
              const isUpdating = updatingUserId === user.id;
              const isProtectedDirector = role === "director";

              return (
                <article
                  key={user.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl"
                >
                  <div className="flex items-start gap-4">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || user.email}
                        className="h-20 w-20 shrink-0 rounded-3xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-cyan-500 text-3xl">
                        👤
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <RoleBadge role={role} />

                        {isCurrentUser && (
                          <span className="rounded-full bg-violet-500 px-3 py-1 text-xs font-black">
                            შენ
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 break-words text-xl font-black">
                        {user.full_name || "სახელი არ არის მითითებული"}
                      </h2>

                      <p className="mt-2 break-all text-sm text-white/60">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 rounded-2xl bg-black/20 p-4 text-sm">
                    <p>
                      <span className="text-white/40">
                        ტელეფონი:
                      </span>{" "}
                      <span className="font-semibold">
                        {user.phone || "არ არის მითითებული"}
                      </span>
                    </p>

                    <p>
                      <span className="text-white/40">
                        რეგისტრაცია:
                      </span>{" "}
                      <span className="font-semibold">
                        {formatDate(user.created_at)}
                      </span>
                    </p>
                  </div>

                  {isProtectedDirector ? (
                    <div className="mt-5 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4 text-sm font-semibold text-violet-200">
                      👑 Director-ის როლი დაცულია და ამ გვერდიდან
                      ვერ შეიცვლება.
                    </div>
                  ) : role === "admin" ? (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        void changeRole(user, "user")
                      }
                      className="mt-5 w-full rounded-2xl bg-red-600 px-5 py-3 font-black transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdating
                        ? "მუშავდება..."
                        : "🚫 Admin-ის უფლების მოხსნა"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        void changeRole(user, "admin")
                      }
                      className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-3 font-black transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdating
                        ? "მუშავდება..."
                        : "🛡️ Admin-ად დანიშვნა"}
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function normalizeRole(role: string | null): StaffRole {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();

  if (normalizedRole === "director") {
    return "director";
  }

  if (normalizedRole === "admin") {
    return "admin";
  }

  return "user";
}

function RoleBadge({ role }: { role: StaffRole }) {
  if (role === "director") {
    return (
      <span className="rounded-full bg-violet-500 px-3 py-1 text-xs font-black">
        👑 Director
      </span>
    );
  }

  if (role === "admin") {
    return (
      <span className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-black">
        🛡️ Admin
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-600 px-3 py-1 text-xs font-black">
      👤 User
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <div className="text-3xl">{icon}</div>

      <p className="mt-4 text-sm font-bold text-white/50">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "უცნობია";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}