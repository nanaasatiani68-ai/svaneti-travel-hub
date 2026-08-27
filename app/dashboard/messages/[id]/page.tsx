"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  customer_id: string;
  provider_id: string;
  tour_id: number | string | null;
  guide_id: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
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

export default function ConversationPage() {
  const params = useParams();
  const conversationId = String(params.id || "");

  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [currentRole, setCurrentRole] = useState("user");
  const [conversation, setConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<
    Message[]
  >([]);
  const [newMessage, setNewMessage] = useState("");

  const [otherName, setOtherName] =
    useState("მომხმარებელი");
  const [subjectName, setSubjectName] =
    useState("საუბარი");
  const [subjectType, setSubjectType] =
    useState<"tour" | "guide">("tour");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadChat() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "Chat session error:",
            sessionError
          );
        }

        let user =
          sessionData.session?.user ?? null;

        if (!user) {
          const {
            data: userData,
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            console.error(
              "Chat user error:",
              userError
            );
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
              "Chat refresh error:",
              refreshError
            );
          }

          user = refreshData.user ?? null;
        }

        if (!user) {
          window.location.replace(
            `/login?next=${encodeURIComponent(
              `/dashboard/messages/${conversationId}`
            )}`
          );
          return;
        }

        if (!mounted) return;

        setUserId(user.id);

        const {
          data: currentProfile,
          error: currentProfileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (currentProfileError) {
          throw currentProfileError;
        }

        const normalizedRole = String(
          currentProfile?.role ?? "user"
        ).toLowerCase();

        if (mounted) {
          setCurrentRole(normalizedRole);
        }

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
              guide_id
            `
          )
          .eq("id", conversationId)
          .maybeSingle();

        if (conversationError) {
          throw conversationError;
        }

        if (!conversationData) {
          throw new Error(
            "საუბარი ვერ მოიძებნა."
          );
        }

        const row =
          conversationData as Conversation;

        const isParticipant =
          row.customer_id === user.id ||
          row.provider_id === user.id;

        const isAdminViewer =
          normalizedRole === "admin" ||
          normalizedRole === "director";

        if (!isParticipant && !isAdminViewer) {
          throw new Error(
            "ამ საუბარზე წვდომა არ გაქვს."
          );
        }

        if (mounted) {
          setConversation(row);
        }

        const otherUserId =
          row.customer_id === user.id
            ? row.provider_id
            : row.customer_id;

        const profilePromise = isParticipant
          ? supabase
              .from("profiles")
              .select("id, full_name")
              .eq("id", otherUserId)
              .maybeSingle()
          : Promise.resolve({
              data: null,
              error: null,
            });

        const adminParticipantsPromise = !isParticipant
          ? supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", [
                row.customer_id,
                row.provider_id,
              ])
          : Promise.resolve({
              data: null,
              error: null,
            });

        const subjectPromise = row.guide_id
          ? supabase
              .from("guides")
              .select("id, full_name")
              .eq("id", row.guide_id)
              .maybeSingle()
          : row.tour_id !== null
            ? supabase
                .from("tours")
                .select("id, title")
                .eq("id", row.tour_id)
                .maybeSingle()
            : Promise.resolve({
                data: null,
                error: null,
              });

        const [
          profileResult,
          adminParticipantsResult,
          subjectResult,
          messagesResult,
        ] = await Promise.all([
          profilePromise,
          adminParticipantsPromise,
          subjectPromise,
          supabase
            .from("messages")
            .select(
              `
                id,
                conversation_id,
                sender_id,
                message,
                is_read,
                created_at
              `
            )
            .eq(
              "conversation_id",
              conversationId
            )
            .order("created_at", {
              ascending: true,
            }),
        ]);

        if (profileResult.data && mounted) {
          const profile =
            profileResult.data as Profile;

          setOtherName(
            profile.full_name || "მომხმარებელი"
          );
        }

        if (
          adminParticipantsResult.data &&
          mounted
        ) {
          const participants =
            adminParticipantsResult.data as Profile[];

          const customer =
            participants.find(
              (item) =>
                item.id === row.customer_id
            );

          const provider =
            participants.find(
              (item) =>
                item.id === row.provider_id
            );

          setOtherName(
            `${
              customer?.full_name || "მომხმარებელი"
            } ↔ ${
              provider?.full_name || "პროვაიდერი"
            }`
          );
        }

        if (row.guide_id) {
          if (subjectResult.data && mounted) {
            const guide =
              subjectResult.data as Guide;

            setSubjectName(
              guide.full_name || "გიდი"
            );
          }

          if (mounted) {
            setSubjectType("guide");
          }
        } else {
          if (subjectResult.data && mounted) {
            const tour =
              subjectResult.data as Tour;

            setSubjectName(
              tour.title || "ტური"
            );
          }

          if (mounted) {
            setSubjectType("tour");
          }
        }

        if (messagesResult.error) {
          throw messagesResult.error;
        }

        if (mounted) {
          setMessages(
            (messagesResult.data as Message[] | null) ??
              []
          );
        }

        if (isParticipant) {
          const { error: readError } =
            await supabase
              .from("messages")
              .update({ is_read: true })
              .eq(
                "conversation_id",
                conversationId
              )
              .neq("sender_id", user.id)
              .eq("is_read", false);

          if (readError) {
            console.error(
              "Mark messages read error:",
              readError
            );
          }
        }
      } catch (error) {
        console.error("Load chat error:", error);

        const message =
          error instanceof Error
            ? error.message
            : "უცნობი შეცდომა მოხდა.";

        if (mounted) {
          setErrorMessage(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadChat();

    return () => {
      mounted = false;
    };
  }, [conversationId, supabase]);

  useEffect(() => {
    if (!conversationId || !userId) {
      return;
    }

    const channel = supabase
      .channel(
        `conversation-messages-${conversationId}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const nextMessage =
            payload.new as Message;

          setMessages((current) => {
            if (
              current.some(
                (item) =>
                  item.id === nextMessage.id
              )
            ) {
              return current;
            }

            return [...current, nextMessage];
          });

          if (
            conversation &&
            (
              conversation.customer_id === userId ||
              conversation.provider_id === userId
            ) &&
            nextMessage.sender_id !== userId
          ) {
            void supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", nextMessage.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage =
            payload.new as Message;

          setMessages((current) =>
            current.map((message) =>
              message.id === updatedMessage.id
                ? updatedMessage
                : message
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, userId, conversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const isParticipant =
      conversation &&
      (
        conversation.customer_id === userId ||
        conversation.provider_id === userId
      );

    if (
      sending ||
      !userId ||
      !conversation ||
      !isParticipant
    ) {
      return;
    }

    const text = newMessage.trim();

    if (!text) {
      return;
    }

    setSending(true);
    setErrorMessage("");

    try {
      const {
        data: insertedMessage,
        error,
      } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: userId,
          message: text,
          is_read: false,
        })
        .select(
          `
            id,
            conversation_id,
            sender_id,
            message,
            is_read,
            created_at
          `
        )
        .single();

      if (error) {
        throw error;
      }

      const savedMessage =
        insertedMessage as Message;

      setMessages((current) => {
        if (
          current.some(
            (item) => item.id === savedMessage.id
          )
        ) {
          return current;
        }

        return [...current, savedMessage];
      });

      setNewMessage("");

      const { error: conversationUpdateError } =
        await supabase
          .from("conversations")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversation.id);

      if (conversationUpdateError) {
        console.error(
          "Conversation timestamp update error:",
          conversationUpdateError
        );
      }
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა მოხდა.";

      setErrorMessage(
        `შეტყობინება ვერ გაიგზავნა: ${message}`
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="text-5xl">💬</div>

          <p className="mt-4 font-semibold text-slate-600">
            საუბარი იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage && !conversation) {
    return (
      <main className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="text-6xl">⚠️</div>

          <h1 className="mt-4 text-2xl font-black text-red-800">
            საუბარი ვერ გაიხსნა
          </h1>

          <p className="mt-3 text-red-700">
            {errorMessage}
          </p>

          <Link
            href="/dashboard/messages"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
          >
            ← შეტყობინებებზე დაბრუნება
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
            Live Chat
          </p>

          <h1 className="mt-1 truncate text-2xl font-black text-slate-900 sm:text-3xl">
            💬 {subjectName}
          </h1>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {subjectType === "guide"
              ? "🧑‍💼 გიდი"
              : "🏔️ ტური"}{" "}
            • საუბარი: {otherName}
          </p>
        </div>

        <Link
          href="/dashboard/messages"
          className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
        >
          ← უკან
        </Link>
      </div>

      {errorMessage && conversation && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {messages.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-5xl">👋</div>

            <p className="mt-4 font-semibold text-slate-500">
              ჯერ შეტყობინებები არ არის.
              დაიწყე საუბარი.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const mine =
            message.sender_id === userId;

          return (
            <div
              key={message.id}
              className={`flex ${
                mine
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                  mine
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                {!mine && (
                  <p className="mb-1 text-[11px] font-black text-cyan-700">
                    {otherName}
                  </p>
                )}

                <p className="whitespace-pre-wrap break-words leading-6">
                  {message.message}
                </p>

                <p
                  className={`mt-2 text-[11px] ${
                    mine
                      ? "text-white/65"
                      : "text-slate-400"
                  }`}
                >
                  {formatTime(message.created_at)}
                  {mine
                    ? message.is_read
                      ? " • ✓✓ წაკითხულია"
                      : " • ✓ გაგზავნილია"
                    : ""}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {conversation &&
      (
        conversation.customer_id === userId ||
        conversation.provider_id === userId
      ) ? (
        <>
          <form
            onSubmit={sendMessage}
            className="mt-4 flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <textarea
              value={newMessage}
              onChange={(event) =>
                setNewMessage(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  event.currentTarget
                    .form?.requestSubmit();
                }
              }}
              placeholder="დაწერე შეტყობინება..."
              rows={2}
              maxLength={2000}
              className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              disabled={
                sending || !newMessage.trim()
              }
              className="self-end rounded-xl bg-cyan-600 px-5 py-3 font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "..." : "გაგზავნა"}
            </button>
          </form>

          <p className="mt-2 text-center text-xs text-slate-400">
            Enter — გაგზავნა • Shift + Enter — ახალი ხაზი
          </p>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold text-amber-800">
          👁️ {currentRole === "director"
            ? "Director"
            : "Admin"} რეჟიმი — საუბრის ნახვა შეგიძლიათ, მაგრამ შეტყობინების გაგზავნა მხოლოდ მონაწილეებს შეუძლიათ.
        </div>
      )}
    </main>
  );
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ka-GE", {
  month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
