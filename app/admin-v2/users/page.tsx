"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserRole = "director" | "admin" | "user";
type UserFilter = "all" | "active" | "blocked";

type ManagedUser = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
};

type UsersApiResponse = {
  success?: boolean;
  users?: ManagedUser[];
  currentUserId?: string;
  error?: string;
  message?: string;
};

export default function UsersPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadUsers = useCallback(async () => {
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

      const response = await fetch("/api/director/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const result = (await response.json()) as UsersApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "მომხმარებლების ჩატვირთვა ვერ მოხერხდა."
        );
      }

      setUsers(result.users || []);
      setCurrentUserId(result.currentUserId || "");
    } catch (error: unknown) {
      console.error("Users loading error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა."
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const blocked = isBlocked(user.banned_until);

      const matchesFilter =
        filter === "all" ||
        (filter === "blocked" && blocked) ||
        (filter === "active" && !blocked);

      const matchesSearch =
        !normalizedSearch ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        String(user.full_name || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(user.phone || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        normalizeRole(user.role).includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [users, search, filter]);

  const activeCount = users.filter(
    (user) => !isBlocked(user.banned_until)
  ).length;

  const blockedCount = users.filter(
    (user) => isBlocked(user.banned_until)
  ).length;

  const adminCount = users.filter(
    (user) => normalizeRole(user.role) === "admin"
  ).length;

  async function changeBlockedState(user: ManagedUser) {
    const blocked = isBlocked(user.banned_until);
    const nextAction = blocked ? "unblock" : "block";

    if (isProtectedUser(user, currentUserId)) {
      setErrorMessage(
        "Director-ის ან საკუთარი ანგარიშის დაბლოკვა შეუძლებელია."
      );
      return;
    }

    const confirmed = window.confirm(
      blocked
        ? `ნამდვილად გინდა ${user.full_name || user.email}-ს ბლოკის მოხსნა?`
        : `ნამდვილად გინდა ${user.full_name || user.email}-ის ანგარიშის დაბლოკვა?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingUserId(user.id);
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

      const response = await fetch("/api/director/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          action: nextAction,
        }),
      });

      const result = (await response.json()) as UsersApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "მომხმარებლის სტატუსის შეცვლა ვერ მოხერხდა."
        );
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                banned_until:
                  nextAction === "block"
                    ? new Date(
                        Date.now() + 100 * 365 * 24 * 60 * 60 * 1000
                      ).toISOString()
                    : null,
              }
            : currentUser
        )
      );

      setSuccessMessage(
        nextAction === "block"
          ? "მომხმარებლის ანგარიში დაიბლოკა."
          : "მომხმარებლის ანგარიშს ბლოკი მოეხსნა."
      );
    } catch (error: unknown) {
      console.error("User block update error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა."
      );
    } finally {
      setProcessingUserId(null);
    }
  }

  async function deleteUser(user: ManagedUser) {
    if (isProtectedUser(user, currentUserId)) {
      setErrorMessage(
        "Director-ის ან საკუთარი ანგარიშის წაშლა შეუძლებელია."
      );
      return;
    }

    const firstConfirmation = window.confirm(
      `ნამდვილად გინდა მომხმარებლის „${
        user.full_name || user.email
      }“ სამუდამოდ წაშლა?`
    );

    if (!firstConfirmation) {
      return;
    }

    const typedConfirmation = window.prompt(
      "დასადასტურებლად ჩაწერე სიტყვა DELETE"
    );

    if (typedConfirmation !== "DELETE") {
      setErrorMessage("წაშლა გაუქმდა — სიტყვა DELETE სწორად არ ჩაიწერა.");
      return;
    }

    setProcessingUserId(user.id);
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

      const response = await fetch(
        `/api/director/users?userId=${encodeURIComponent(user.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = (await response.json()) as UsersApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "მომხმარებლის წაშლა ვერ მოხერხდა."
        );
      }

      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== user.id)
      );

      setSuccessMessage("მომხმარებელი წარმატებით წაიშალა.");
    } catch (error: unknown) {
      console.error("User deletion error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა."
      );
    } finally {
      setProcessingUserId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-86px)] items-center justify-center bg-[#07111d] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />
          <p className="mt-5 text-lg font-bold">
            მომხმარებლები იტვირთება...
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
              Director Control
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              👥 მომხმარებლების მართვა
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-white/60">
              აქ შეგიძლია ნახო ყველა მომხმარებელი, დაბლოკო ანგარიში,
              მოხსნა ბლოკი ან უსაფრთხოდ წაშალო მომხმარებელი.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
            >
              🔄 განახლება
            </button>

            <Link
              href="/admin-v2"
              className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
            >
              ← Director Dashboard
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon="👥" label="ყველა" value={users.length} />
          <StatCard icon="✅" label="აქტიური" value={activeCount} />
          <StatCard icon="🚫" label="დაბლოკილი" value={blockedCount} />
          <StatCard icon="🛡️" label="Admin" value={adminCount} />
        </section>

        <section className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 md:grid-cols-[1fr_250px]">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="მოძებნე სახელით, ელფოსტით, ტელეფონით ან როლით..."
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-400"
          />

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as UserFilter)
            }
            className="rounded-2xl border border-white/10 bg-slate-950 px-5 py-3 text-white outline-none focus:border-cyan-400"
          >
            <option value="all">ყველა მომხმარებელი</option>
            <option value="active">აქტიური</option>
            <option value="blocked">დაბლოკილი</option>
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
          </section>
        ) : (
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => {
              const blocked = isBlocked(user.banned_until);
              const protectedUser = isProtectedUser(user, currentUserId);
              const isProcessing = processingUserId === user.id;

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
                      <div className="flex flex-wrap gap-2">
                        <RoleBadge role={normalizeRole(user.role)} />
                        <StatusBadge blocked={blocked} />

                        {user.id === currentUserId && (
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
                    <InfoLine
                      label="ტელეფონი"
                      value={user.phone || "არ არის მითითებული"}
                    />
                    <InfoLine
                      label="რეგისტრაცია"
                      value={formatDate(user.created_at)}
                    />
                    <InfoLine
                      label="ბოლო შესვლა"
                      value={formatDate(user.last_sign_in_at)}
                    />
                    <InfoLine
                      label="ელფოსტა"
                      value={
                        user.email_confirmed_at
                          ? "დადასტურებულია"
                          : "დაუდასტურებელია"
                      }
                    />
                  </div>

                  {protectedUser ? (
                    <div className="mt-5 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4 text-sm font-semibold text-violet-200">
                      👑 ეს ანგარიში დაცულია.
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void changeBlockedState(user)}
                        className={`rounded-2xl px-4 py-3 font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          blocked
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-amber-600 hover:bg-amber-700"
                        }`}
                      >
                        {isProcessing
                          ? "მუშავდება..."
                          : blocked
                            ? "✅ ბლოკის მოხსნა"
                            : "🚫 დაბლოკვა"}
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void deleteUser(user)}
                        className="rounded-2xl bg-red-600 px-4 py-3 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isProcessing ? "მუშავდება..." : "🗑️ წაშლა"}
                      </button>
                    </div>
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

function normalizeRole(role: string | null): UserRole {
  const normalizedRole = String(role || "").trim().toLowerCase();

  if (normalizedRole === "director") {
    return "director";
  }

  if (normalizedRole === "admin") {
    return "admin";
  }

  return "user";
}

function isBlocked(bannedUntil: string | null) {
  if (!bannedUntil) {
    return false;
  }

  const date = new Date(bannedUntil);

  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function isProtectedUser(user: ManagedUser, currentUserId: string) {
  return (
    user.id === currentUserId || normalizeRole(user.role) === "director"
  );
}

function RoleBadge({ role }: { role: UserRole }) {
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

function StatusBadge({ blocked }: { blocked: boolean }) {
  return blocked ? (
    <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black">
      🚫 დაბლოკილი
    </span>
  ) : (
    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black">
      ✅ აქტიური
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
      <p className="mt-4 text-sm font-bold text-white/50">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p className="break-words">
      <span className="text-white/40">{label}:</span>{" "}
      <span className="font-semibold">{value}</span>
    </p>
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
