"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

type ProviderApplication = {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  can_publish_services: boolean | null;
  provider_status: string | null;
};

type Row = ProviderApplication & {
  profile: Profile | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("ka-GE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function badgeClass(status: ApplicationStatus) {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-800";
  }

  if (status === "cancelled") {
    return "bg-slate-200 text-slate-700";
  }

  return "bg-amber-100 text-amber-800";
}

export default function ProviderApplicationsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] =
    useState<"all" | ApplicationStatus>("pending");

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function getCurrentUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let user = session?.user ?? null;

    if (!user) {
      const { data: userData } =
        await supabase.auth.getUser();

      user = userData.user;
    }

    if (!user) {
      const { data: refreshData } =
        await supabase.auth.refreshSession();

      user = refreshData.user ?? null;
    }

    return user;
  }

  async function loadApplications() {
    setLoading(true);
    setErrorMessage("");

    try {
      const user = await getCurrentUser();

      if (!user) {
        window.location.replace(
          `/login?next=${encodeURIComponent(
            "/dashboard/provider-applications"
          )}`
        );
        return;
      }

      const {
        data: currentProfile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const role = String(
        currentProfile?.role ?? ""
      ).toLowerCase();

      if (!["director", "admin"].includes(role)) {
        setAuthorized(false);
        setErrorMessage(
          "ამ გვერდზე წვდომა მხოლოდ Director-ს და Admin-ს აქვს."
        );
        return;
      }

      setAuthorized(true);

      const {
        data: applicationData,
        error: applicationError,
      } = await supabase
        .from("provider_applications")
        .select(
          `
            id,
            user_id,
            status,
            message,
            reviewed_by,
            reviewed_at,
            created_at,
            updated_at
          `
        )
        .order("created_at", {
          ascending: false,
        });

      if (applicationError) {
        throw applicationError;
      }

      const applications =
        (applicationData as ProviderApplication[] | null) ?? [];

      if (applications.length === 0) {
        setRows([]);
        return;
      }

      const userIds = Array.from(
        new Set(applications.map((item) => item.user_id))
      );

      const {
        data: profileData,
        error: usersError,
      } = await supabase
        .from("profiles")
        .select(
          `
            id,
            full_name,
            email,
            phone,
            role,
            can_publish_services,
            provider_status
          `
        )
        .in("id", userIds);

      if (usersError) {
        throw usersError;
      }

      const profiles =
        (profileData as Profile[] | null) ?? [];

      const profileMap = new Map(
        profiles.map((profile) => [
          profile.id,
          profile,
        ])
      );

      setRows(
        applications.map((application) => ({
          ...application,
          profile:
            profileMap.get(application.user_id) ?? null,
        }))
      );
    } catch (error) {
      console.error(
        "Provider applications loading error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "მოთხოვნების ჩატვირთვა ვერ მოხერხდა."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  async function approveApplication(id: string) {
    setProcessingId(id);
    setNotice("");
    setErrorMessage("");

    try {
      const { error } = await supabase.rpc(
        "approve_provider_application",
        {
          application_id: id,
        }
      );

      if (error) {
        throw error;
      }

      setNotice(
        "Provider მოთხოვნა დამტკიცებულია."
      );

      await loadApplications();
    } catch (error) {
      console.error(
        "Provider approval error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "მოთხოვნის დამტკიცება ვერ მოხერხდა."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectApplication(id: string) {
    setProcessingId(id);
    setNotice("");
    setErrorMessage("");

    try {
      const { error } = await supabase.rpc(
        "reject_provider_application",
        {
          application_id: id,
        }
      );

      if (error) {
        throw error;
      }

      setNotice(
        "Provider მოთხოვნა უარყოფილია."
      );

      await loadApplications();
    } catch (error) {
      console.error(
        "Provider rejection error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "მოთხოვნის უარყოფა ვერ მოხერხდა."
      );
    } finally {
      setProcessingId(null);
    }
  }

  const filteredRows =
    filter === "all"
      ? rows
      : rows.filter((row) => row.status === filter);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
          <p className="mt-4 font-semibold text-slate-700">
            მოთხოვნები იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <div className="text-4xl">⛔</div>

          <h1 className="mt-3 text-2xl font-black text-red-900">
            წვდომა შეზღუდულია
          </h1>

          <p className="mt-2 text-red-800">
            {errorMessage ||
              "ამ გვერდზე წვდომა არ გაქვს."}
          </p>

          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white"
          >
            ← Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
            Georgia Gateway Hub
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
            Provider Applications
          </h1>

          <p className="mt-2 text-slate-600">
            დაამტკიცე ან უარყავი მომხმარებლების
            Provider მოთხოვნები.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin-v2"
            className="rounded-xl bg-violet-600 px-4 py-2.5 font-bold text-white"
          >
            🛡️ Admin Panel
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {notice && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800">
          {notice}
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
            ["cancelled", "Cancelled"],
            ["all", "All"],
          ] as const
        ).map(([value, label]) => {
          const active = filter === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-violet-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">📭</div>
          <h2 className="mt-3 text-xl font-black text-slate-900">
            მოთხოვნები არ არის
          </h2>
          <p className="mt-2 text-slate-500">
            ამ სტატუსით Provider მოთხოვნა ჯერ არ არსებობს.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRows.map((row) => {
            const profile = row.profile;
            const processing = processingId === row.id;

            return (
              <article
                key={row.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-slate-900">
                        {profile?.full_name ||
                          profile?.email ||
                          "Unknown user"}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase ${badgeClass(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <strong>User ID:</strong>{" "}
                        <span className="break-all">
                          {row.user_id}
                        </span>
                      </p>

                      <p>
                        <strong>Role:</strong>{" "}
                        {profile?.role ?? "user"}
                      </p>

                      <p>
                        <strong>Email:</strong>{" "}
                        {profile?.email ?? "—"}
                      </p>

                      <p>
                        <strong>Phone:</strong>{" "}
                        {profile?.phone ?? "—"}
                      </p>

                      <p>
                        <strong>Provider status:</strong>{" "}
                        {profile?.provider_status ?? "none"}
                      </p>

                      <p>
                        <strong>Publishing:</strong>{" "}
                        {profile?.can_publish_services
                          ? "Enabled"
                          : "Disabled"}
                      </p>
                    </div>

                    {row.message && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                          მომხმარებლის შეტყობინება
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-slate-800">
                          {row.message}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-slate-500">
                      <p>
                        <strong>Created:</strong>{" "}
                        {formatDate(row.created_at)}
                      </p>

                      {row.reviewed_at && (
                        <p className="mt-1">
                          <strong>Reviewed:</strong>{" "}
                          {formatDate(row.reviewed_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  {row.status === "pending" && (
                    <div className="flex shrink-0 flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          void approveApplication(row.id)
                        }
                        disabled={processing}
                        className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processing
                          ? "მუშავდება..."
                          : "✅ Approve"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void rejectApplication(row.id)
                        }
                        disabled={processing}
                        className="rounded-xl bg-red-600 px-5 py-3 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processing
                          ? "მუშავდება..."
                          : "❌ Reject"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
