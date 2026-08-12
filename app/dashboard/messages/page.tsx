"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  customer_id: string;
  provider_id: string;
  tour_id: number | string | null;
  guide_id: string | null;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
};

type Tour = {
  id: number | string;
  title: string | null;
};

type Guide = {
  id: string;
  full_name: string | null;
};

type ConversationView = Conversation & {
  other_name: string;
  subject_name: string;
  subject_type: "tour" | "guide";
};

export default function MessagesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [conversations, setConversations] = useState<
    ConversationView[]
  >([]);

  useEffect(() => {
    let mounted = true;

    async function loadConversations() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          window.location.replace(
            `/login?next=${encodeURIComponent(
              "/dashboard/messages"
            )}`
          );
          return;
        }

        if (!mounted) {
          return;
        }

        setUserId(user.id);

        const {
          data: conversationData,
          error: conversationError,
        } = await supabase
          .from("conversations")
          .select(
            `
              id,
              customer_id,
              provider_id,
              tour_id,
              guide_id,
              created_at,
              updated_at
            `
          )
          .order("updated_at", {
            ascending: false,
          });

        if (conversationError) {
          throw conversationError;
        }

        const rows =
          (conversationData as Conversation[] | null) ?? [];

        const participantIds = Array.from(
          new Set(
            rows
              .map((row) =>
                row.customer_id === user.id
                  ? row.provider_id
                  : row.customer_id
              )
              .filter(Boolean)
          )
        );

        const tourIds = Array.from(
          new Set(
            rows
              .map((row) => row.tour_id)
              .filter(
                (
                  value
                ): value is number | string =>
                  value !== null &&
                  value !== undefined
              )
          )
        );

        const guideIds = Array.from(
          new Set(
            rows
              .map((row) => row.guide_id)
              .filter(
                (value): value is string =>
                  Boolean(value)
              )
          )
        );

        const profileMap = new Map<string, string>();
        const tourMap = new Map<string, string>();
        const guideMap = new Map<string, string>();

        if (participantIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", participantIds);

          (
            (profiles as Profile[] | null) ?? []
          ).forEach((profile) => {
            profileMap.set(
              profile.id,
              profile.full_name || "მომხმარებელი"
            );
          });
        }

        if (tourIds.length > 0) {
          const { data: tours } = await supabase
            .from("tours")
            .select("id, title")
            .in("id", tourIds);

          ((tours as Tour[] | null) ?? []).forEach(
            (tour) => {
              tourMap.set(
                String(tour.id),
                tour.title || "ტური"
              );
            }
          );
        }

        if (guideIds.length > 0) {
          const { data: guides } = await supabase
            .from("guides")
            .select("id, full_name")
            .in("id", guideIds);

          ((guides as Guide[] | null) ?? []).forEach(
            (guide) => {
              guideMap.set(
                guide.id,
                guide.full_name || "გიდი"
              );
            }
          );
        }

        const prepared = rows.map((row) => {
          const otherUserId =
            row.customer_id === user.id
              ? row.provider_id
              : row.customer_id;

          const isGuideConversation =
            Boolean(row.guide_id);

          const subjectName =
            isGuideConversation && row.guide_id
              ? guideMap.get(row.guide_id) || "გიდი"
              : row.tour_id !== null
              ? tourMap.get(String(row.tour_id)) ||
                "ტური"
              : "საუბარი";

          return {
            ...row,
            other_name:
              profileMap.get(otherUserId) ||
              "მომხმარებელი",
            subject_name: subjectName,
            subject_type: isGuideConversation
              ? "guide"
              : "tour",
          } satisfies ConversationView;
        });

        if (mounted) {
          setConversations(prepared);
        }
      } catch (error) {
        console.error(
          "Load conversations error:",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "უცნობი შეცდომა მოხდა.";

        if (mounted) {
          setErrorMessage(
            `საუბრების ჩატვირთვა ვერ მოხერხდა: ${message}`
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadConversations();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="text-5xl">💬</div>
          <p className="mt-4 font-semibold text-slate-600">
            შეტყობინებები იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
            Messages
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
            💬 შეტყობინებები
          </h1>

          <p className="mt-2 text-slate-500">
            აქ ნახავ შენს საუბრებს ტურების ავტორებთან და გიდებთან.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="w-fit rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
        >
          ← Dashboard
        </Link>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {!errorMessage &&
        conversations.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-6xl">📭</div>

            <h2 className="mt-4 text-2xl font-black text-slate-900">
              ჯერ საუბრები არ გაქვს
            </h2>

            <p className="mt-2 text-slate-500">
              როცა ტურის ავტორს ან გიდს მისწერ,
              საუბარი აქ გამოჩნდება.
            </p>
          </div>
        )}

      <div className="mt-8 space-y-4">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/dashboard/messages/${conversation.id}`}
            className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-cyan-600">
                  {conversation.subject_type ===
                  "guide"
                    ? "🧑‍💼 გიდი"
                    : "🏔️ ტური"}
                </p>

                <h2 className="mt-1 truncate text-xl font-black text-slate-900">
                  {conversation.subject_name}
                </h2>

                <p className="mt-2 truncate text-sm text-slate-500">
                  საუბარი: {conversation.other_name}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-400">
                  {formatDate(
                    conversation.updated_at
                  )}
                </p>

                <span className="mt-3 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                  გახსნა →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {userId && (
        <p className="mt-8 text-center text-xs text-slate-400">
          შეტყობინებები ხელმისაწვდომია მხოლოდ
          ავტორიზებული მომხმარებლებისთვის.
        </p>
      )}
    </main>
  );
}

function formatDate(value: string) {
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