"use client";


import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ProviderStatus = "none" | "pending" | "approved" | "suspended";

type Profile = {
  id: string;
  role: string | null;
  can_publish_services: boolean | null;
  provider_status: ProviderStatus | null;
};

type ProviderApplication = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
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

export default function ProviderRequestPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [application, setApplication] =
    useState<ProviderApplication | null>(null);

  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadPage() {
    setLoading(true);
    setNotice("");
    setErrorMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let user = session?.user ?? null;

      if (!user) {
        const { data: userData } = await supabase.auth.getUser();
        user = userData.user;
      }

      if (!user) {
        const { data: refreshData } =
          await supabase.auth.refreshSession();
        user = refreshData.user ?? null;
      }

      if (!user) {
        window.location.replace(
          `/login?next=${encodeURIComponent(
            "/dashboard/provider-request"
          )}`
        );
        return;
      }

      setUserId(user.id);

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          `
            id,
            role,
            can_publish_services,
            provider_status
          `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      setProfile((profileData as Profile | null) ?? null);

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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (applicationError) {
        throw applicationError;
      }

      setApplication(
        (applicationData as ProviderApplication | null) ?? null
      );
    } catch (error) {
      console.error("Provider request page error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "მონაცემების ჩატვირთვა ვერ მოხერხდა."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, []);

  async function submitApplication(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!userId) return;

    setSubmitting(true);
    setNotice("");
    setErrorMessage("");

    try {
      const {
        data: latestPending,
        error: pendingError,
      } = await supabase
        .from("provider_applications")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingError) {
        throw pendingError;
      }

      if (latestPending) {
        throw new Error(
          "უკვე გაქვს განხილვაში მყოფი მოთხოვნა."
        );
      }

      const { error } = await supabase
        .from("provider_applications")
        .insert({
          user_id: userId,
          status: "pending",
          message: message.trim() || null,
        });

      if (error) {
        throw error;
      }

      setMessage("");
      await loadPage();
      setNotice(
        "მოთხოვნა წარმატებით გაიგზავნა. ადმინისტრაცია მალე განიხილავს."
      );
    } catch (error) {
      console.error("Provider application submit error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "მოთხოვნის გაგზავნა ვერ მოხერხდა."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelApplication() {
    if (!application || application.status !== "pending") {
      return;
    }

    setCancelling(true);
    setNotice("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("provider_applications")
        .update({ status: "cancelled" })
        .eq("id", application.id)
        .eq("user_id", userId)
        .eq("status", "pending");

      if (error) {
        throw error;
      }

      await loadPage();
      setNotice("მოთხოვნა გაუქმდა.");
    } catch (error) {
      console.error("Cancel provider application error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "მოთხოვნის გაუქმება ვერ მოხერხდა."
      );
    } finally {
      setCancelling(false);
    }
  }

  const providerStatus = profile?.provider_status ?? "none";

  const isApproved =
    Boolean(profile?.can_publish_services) &&
    providerStatus === "approved";

  const hasPendingApplication =
    application?.status === "pending";

  const canSubmit =
    !isApproved && !hasPendingApplication;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
          <p className="mt-4 font-semibold text-slate-700">
            მონაცემები იტვირთება...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
            Georgia Gateway Hub
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
            Provider Request
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            მოითხოვე უფლება, რომ განათავსო ტურები,
            ტრანსფერები, სასტუმროები და სხვა სერვისები.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          ← Dashboard
        </Link>
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

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">
          შენი სტატუსი
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <InfoCard
            label="Account role"
            value={profile?.role ?? "user"}
          />

          <InfoCard
            label="Provider status"
            value={providerStatus}
          />

          <InfoCard
            label="Publishing access"
            value={isApproved ? "Enabled" : "Disabled"}
          />

          <InfoCard
            label="Latest request"
            value={application?.status ?? "No request yet"}
          />
        </div>
      </section>

      {isApproved ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="text-4xl">✅</div>

          <h2 className="mt-3 text-2xl font-black text-emerald-950">
            Provider უფლება დამტკიცებულია
          </h2>

          <p className="mt-2 text-emerald-900/80">
            უკვე შეგიძლია შენი სერვისების განთავსება და
            მართვა Dashboard-იდან.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/add-tour"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white transition hover:bg-emerald-700"
            >
              ➕ ტურის დამატება
            </Link>

            <Link
              href="/dashboard/add-transfer"
              className="rounded-xl bg-white px-4 py-2.5 font-bold text-emerald-800 ring-1 ring-emerald-300 transition hover:bg-emerald-100"
            >
              🚐 ტრანსფერის დამატება
            </Link>

            <Link
              href="/dashboard/add-hotel"
              className="rounded-xl bg-white px-4 py-2.5 font-bold text-emerald-800 ring-1 ring-emerald-300 transition hover:bg-emerald-100"
            >
              🏨 სასტუმროს დამატება
            </Link>
          </div>
        </section>
      ) : hasPendingApplication ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="text-4xl">⏳</div>

          <h2 className="mt-3 text-2xl font-black text-amber-950">
            მოთხოვნა განხილვაშია
          </h2>

          <p className="mt-2 text-amber-900/80">
            ადმინისტრაცია შეამოწმებს მოთხოვნას და
            გადაწყვეტილება შენს ანგარიშში აისახება.
          </p>

          <div className="mt-5 rounded-2xl bg-white/80 p-4">
            <p className="text-sm font-bold text-slate-500">
              გაგზავნილია
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {formatDate(application?.created_at ?? null)}
            </p>

            {application?.message && (
              <>
                <p className="mt-4 text-sm font-bold text-slate-500">
                  შენი შეტყობინება
                </p>

                <p className="mt-1 whitespace-pre-wrap text-slate-800">
                  {application.message}
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={cancelApplication}
            disabled={cancelling}
            className="mt-5 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelling
              ? "მუშავდება..."
              : "მოთხოვნის გაუქმება"}
          </button>
        </section>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">
            Provider უფლების მოთხოვნა
          </h2>

          {application?.status === "rejected" && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
              წინა მოთხოვნა უარყოფილია. შეგიძლია ახალი
              მოთხოვნა გააგზავნო.
            </div>
          )}

          {application?.status === "cancelled" && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              წინა მოთხოვნა გაუქმებულია. შეგიძლია ახალი
              მოთხოვნა გააგზავნო.
            </div>
          )}

          <form
            onSubmit={submitApplication}
            className="mt-5 space-y-4"
          >
            <div>
              <label
                htmlFor="provider-message"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                მოკლედ აღწერე რას აპირებ განათავსო
              </label>

              <textarea
                id="provider-message"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                rows={6}
                maxLength={1000}
                placeholder="მაგალითად: ვაწყობ ტურებს სვანეთში და მინდა ჩემი ტურების განთავსება..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {message.length}/1000
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="rounded-xl bg-sky-600 px-5 py-3 font-black text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "იგზავნება..."
                : "Provider უფლების მოთხოვნა"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}
