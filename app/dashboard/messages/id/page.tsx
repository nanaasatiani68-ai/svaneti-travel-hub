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

export default function ConversationPage() {
  const params = useParams();
  const conversationId = String(params.id || "");

  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [conversation, setConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<
    Message[]
  >([]);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const bottomRef = useRef<HTMLDivElement | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    async function loadChat() {
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
              `/dashboard/messages/${conversationId}`
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

        if (
          row.customer_id !== user.id &&
          row.provider_id !== user.id
        ) {
          throw new Error(
            "ამ საუბარზე წვდომა არ გაქვს."
          );
        }

        if (mounted) {
          setConversation(row);
        }

        const {
          data: messageData,
          error: messagesError,
        } = await supabase
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
          .eq("conversation_id", conversationId)
          .order("created_at", {
            ascending: true,
          });

        if (messagesError) {
          throw messagesError;
        }

        if (mounted) {
          setMessages(
            (messageData as Message[] | null) ?? []
          );
        }

        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .eq("is_read", false);
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

    loadChat();

    return () => {
      mounted = false;
    };
  }, [conversationId, supabase]);

  useEffect(() => {
    if (!conversationId) {
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
            userId &&
            nextMessage.sender_id !== userId
          ) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", nextMessage.id)
              .then(() => undefined);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      sending ||
      !userId ||
      !conversation
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
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: userId,
          message: text,
          is_read: false,
        });

      if (error) {
        throw error;
      }

      setNewMessage("");
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
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
            Live Chat
          </p>

          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            💬 საუბარი
          </h1>
        </div>

        <Link
          href="/dashboard/messages"
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
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
                  {mine && message.is_read
                    ? " • წაკითხულია"
                    : ""}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="mt-4 flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <textarea
          value={newMessage}
          onChange={(event) =>
            setNewMessage(event.target.value)
          }
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