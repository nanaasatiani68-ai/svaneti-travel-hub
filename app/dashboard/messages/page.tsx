"use client";

import {
  useCallback,
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

type MessagePreview = {
  conversation_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type ConversationView = Conversation & {
  other_name: string;
  subject_name: string;
  subject_type: "tour" | "guide";
  unread_count: number;
  last_message: string;
  last_message_at: string | null;
};

export default function MessagesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [conversations, setConversations] = useState<
    ConversationView[]
  >([]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Messages session error:", sessionError);
      }

      let user = sessionData.session?.user ?? null;

      if (!user) {
        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Messages user error:", userError);
        }

        user = userData.user;
      }

      if (!user) {
        const {
          data: refreshData,
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error(
            "Messages session refresh error:",
            refreshError
          );
        }

        user = refreshData.user ?? null;
      }

      if (!user) {
        window.location.replace(
          `/login?next=${encodeURIComponent(
            "/dashboard/messages"
          )}`
        );
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

      if (rows.length === 0) {
        setConversations([]);
        return;
      }

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

      const conversationIds = rows.map(
        (row) => row.id
      );

      const [
        profilesResult,
        toursResult,
        guidesResult,
        messagesResult,
      ] = await Promise.all([
        participantIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", participantIds)
          : Promise.resolve({
              data: [],
              error: null,
            }),

        tourIds.length > 0
          ? supabase
              .from("tours")
              .select("id, title")
              .in("id", tourIds)
          : Promise.resolve({
              data: [],
              error: null,
            }),

        guideIds.length > 0
          ? supabase
              .from("guides")
              .select("id, full_name")
              .in("id", guideIds)
          : Promise.resolve({
              data: [],
              error: null,
            }),

        supabase
          .from("messages")
          .select(
            `
              conversation_id,
              sender_id,
              message,
              is_read,
              created_at
            `
          )
          .in("conversation_id", conversationIds)
          .order("created_at", {
            ascending: true,
          }),
      ]);

      if (profilesResult.error) {
        console.error(
          "Conversation profiles error:",
          profilesResult.error
        );
      }

      if (toursResult.error) {
        console.error(
          "Conversation tours error:",
          toursResult.error
        );
      }

      if (guidesResult.error) {
        console.error(
          "Conversation guides error:",
          guidesResult.error
        );
      }

      if (messagesResult.error) {
        throw messagesResult.error;
      }

      const profileMap = new Map<string, string>();
      const tourMap = new Map<string, string>();
      const guideMap = new Map<string, string>();

      (
        (profilesResult.data as Profile[] | null) ?? []
      ).forEach((profile) => {
        profileMap.set(
          profile.id,
          profile.full_name || "მომხმარებელი"
        );
      });

      (
        (toursResult.data as Tour[] | null) ?? []
      ).forEach((tour) => {
        tourMap.set(
          String(tour.id),
          tour.title || "ტური"
        );
      });

      (
        (guidesResult.data as Guide[] | null) ?? []
      ).forEach((guide) => {
        guideMap.set(
          guide.id,
          guide.full_name || "გიდი"
        );
      });

      const messageRows =
        (messagesResult.data as MessagePreview[] | null) ??
        [];

      const unreadMap = new Map<string, number>();
      const lastMessageMap = new Map<
        string,
        MessagePreview
      >();

      messageRows.forEach((message) => {
        lastMessageMap.set(
          message.conversation_id,
          message
        );

        if (
          message.sender_id !== user.id &&
          !message.is_read
        ) {
          unreadMap.set(
            message.conversation_id,
            (unreadMap.get(
              message.conversation_id
            ) || 0) + 1
          );
        }
      });

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

        const lastMessage =
          lastMessageMap.get(row.id);

        return {
          ...row,
          other_name:
            profileMap.get(otherUserId) ||
            "მომხმარებელი",
          subject_name: subjectName,
          subject_type: isGuideConversation
            ? "guide"
            : "tour",
          unread_count:
            unreadMap.get(row.id) || 0,
          last_message:
            lastMessage?.message || "",
          last_message_at:
            lastMessage?.created_at || null,
        } satisfies ConversationView;
      });

      prepared.sort((a, b) => {
        const aTime = new Date(
          a.last_message_at || a.updated_at
        ).getTime();

        const bTime = new Date(
          b.last_message_at || b.updated_at
        ).getTime();

        return bTime - aTime;
      });

      setConversations(prepared);
    } catch (error) {
      console.error(
        "Load conversations error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა მოხდა.";

      setErrorMessage(
        `საუბრების ჩატვირთვა ვერ მოხერხდა: ${message}`
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel = supabase
      .channel(`messages-list-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          void loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations, supabase, userId]);

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (sum, conversation) =>
          sum + conversation.unread_count,
        0
      ),
    [conversations]
  );

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

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
              💬 შეტყობინებები
            </h1>

            {totalUnread > 0 && (
              <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-black text-white shadow">
                {totalUnread} ახალი
              </span>
            )}
          </div>

          <p className="mt-2 text-slate-500">
            აქ ნახავ შენს საუბრებს ტურების ავტორებთან
            და გიდებთან.
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
        {conversations.map((conversation) => {
          const lastDate =
            conversation.last_message_at ||
            conversation.updated_at;

          return (
            <Link
              key={conversation.id}
              href={`/dashboard/messages/${conversation.id}`}
              className={`block rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                conversation.unread_count > 0
                  ? "border-cyan-300 ring-2 ring-cyan-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-cyan-600">
                      {conversation.subject_type ===
                      "guide"
                        ? "🧑‍💼 გიდი"
                        : "🏔️ ტური"}
                    </p>

                    {conversation.unread_count > 0 && (
                      <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-black text-white">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-1 truncate text-xl font-black text-slate-900">
                    {conversation.subject_name}
                  </h2>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                    საუბარი: {conversation.other_name}
                  </p>

                  {conversation.last_message && (
                    <p
                      className={`mt-3 truncate text-sm ${
                        conversation.unread_count > 0
                          ? "font-bold text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {conversation.last_message}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-400">
                    {formatDate(lastDate)}
                  </p>

                  <span className="mt-3 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                    გახსნა →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
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