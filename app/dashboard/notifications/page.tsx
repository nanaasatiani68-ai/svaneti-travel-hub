"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const getAuthenticatedUser = useCallback(async () => {
    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        "Notifications session error:",
        sessionError
      );
    }

    let user = sessionData.session?.user ?? null;

    if (!user) {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Notifications user error:",
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
          "Notifications refresh error:",
          refreshError
        );
      }

      user = refreshData.user ?? null;
    }

    return user;
  }, [supabase]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const user = await getAuthenticatedUser();

    if (!user) {
      window.location.replace(
        `/login?next=${encodeURIComponent(
          "/dashboard/notifications"
        )}`
      );
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
          id,
          user_id,
          title,
          message,
          type,
          is_read,
          created_at
        `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notifications loading error:", error);
      setMessage(
        `შეტყობინებების ჩატვირთვა ვერ მოხერხდა: ${error.message}`
      );
      setMessageType("error");
      setNotifications([]);
      setLoading(false);
      return;
    }

    setNotifications((data as Notification[] | null) ?? []);
    setLoading(false);
  }, [getAuthenticatedUser, supabase]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(notification: Notification) {
    if (notification.is_read) {
      return true;
    }

    setUpdatingId(notification.id);
    setMessage("");

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id)
      .eq("user_id", notification.user_id);

    if (error) {
      console.error("Notification update error:", error);
      setMessage(
        `შეტყობინების განახლება ვერ მოხერხდა: ${error.message}`
      );
      setMessageType("error");
      setUpdatingId(null);
      return false;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true }
          : item
      )
    );

    window.dispatchEvent(new Event("notifications-updated"));
    setUpdatingId(null);
    return true;
  }

  async function openNotification(notification: Notification) {
    const marked = await markAsRead(notification);

    if (!marked) {
      return;
    }

    if (notification.type === "new_booking") {
      router.push("/dashboard/bookings?tab=received-bookings");
      return;
    }

    if (
      notification.type === "tour_approved" ||
      notification.type === "tour_rejected"
    ) {
      router.push("/dashboard/my-tours");
      return;
    }

    if (
      notification.type === "transfer_approved" ||
      notification.type === "transfer_rejected"
    ) {
      router.push("/dashboard/my-transfers");
      return;
    }

    router.push("/dashboard");
  }

  async function markAllAsRead() {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.is_read
    );

    if (unreadNotifications.length === 0) {
      setMessage("ყველა შეტყობინება უკვე წაკითხულია.");
      setMessageType("info");
      return;
    }

    setMarkingAll(true);
    setMessage("");

    const user = await getAuthenticatedUser();

    if (!user) {
      window.location.replace(
        `/login?next=${encodeURIComponent(
          "/dashboard/notifications"
        )}`
      );
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Mark all notifications error:", error);
      setMessage(
        `შეტყობინებების განახლება ვერ მოხერხდა: ${error.message}`
      );
      setMessageType("error");
      setMarkingAll(false);
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );

    window.dispatchEvent(new Event("notifications-updated"));
    setMessage("ყველა შეტყობინება მონიშნულია წაკითხულად.");
    setMessageType("success");
    setMarkingAll(false);
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">🔔</div>
          <p className="mt-4 text-lg font-semibold">
            შეტყობინებები იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-300">
              მომხმარებლის პანელი
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              🔔 შეტყობინებები
            </h1>

            <p className="mt-3 text-white/60">
              წაუკითხავია:{" "}
              <span className="font-black text-violet-300">
                {unreadCount}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll || unreadCount === 0}
              className="rounded-2xl bg-violet-500 px-5 py-3 font-bold transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll
                ? "ინიშნება..."
                : "ყველას წაკითხულად მონიშვნა"}
            </button>

            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        {message && (
          <div
            className={`mt-7 rounded-2xl border p-4 font-semibold ${
              messageType === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : messageType === "error"
                  ? "border-red-400/30 bg-red-500/10 text-red-200"
                  : "border-violet-400/30 bg-violet-500/10 text-violet-200"
            }`}
          >
            {message}
          </div>
        )}

        {notifications.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-12 text-center shadow-2xl">
            <div className="text-7xl">🔕</div>

            <h2 className="mt-5 text-3xl font-black">
              შეტყობინებები ჯერ არ არის
            </h2>

            <p className="mt-3 text-white/60">
              აქ გამოჩნდება ტურის, ტრანსფერის, სასტუმროს და
              ჯავშნების შესახებ ინფორმაცია.
            </p>

            <Link
              href="/dashboard"
              className="mt-7 inline-flex rounded-2xl bg-violet-500 px-7 py-4 font-bold transition hover:bg-violet-600"
            >
              Dashboard-ზე დაბრუნება
            </Link>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            {notifications.map((notification) => {
              const isUpdating = updatingId === notification.id;

              return (
                <article
                  key={notification.id}
                  className={`rounded-3xl border p-5 shadow-xl transition ${
                    notification.is_read
                      ? "border-white/10 bg-white/5"
                      : "border-violet-400/40 bg-violet-500/15"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      disabled={isUpdating}
                      className="flex min-w-0 flex-1 items-start gap-4 text-left disabled:cursor-wait disabled:opacity-60"
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                          notification.is_read
                            ? "bg-white/10"
                            : "bg-violet-500"
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-black">
                            {notification.title}
                          </h2>

                          {!notification.is_read && (
                            <span className="rounded-full bg-violet-400 px-3 py-1 text-xs font-black text-slate-950">
                              ახალი
                            </span>
                          )}
                        </div>

                        {notification.message && (
                          <p className="mt-2 whitespace-pre-line leading-7 text-white/65">
                            {notification.message}
                          </p>
                        )}

                        <p className="mt-3 text-xs text-white/35">
                          {formatNotificationDate(
                            notification.created_at
                          )}
                        </p>

                        <p className="mt-3 text-sm font-black text-violet-300">
                          {isUpdating
                            ? "იხსნება..."
                            : getOpenLabel(notification.type)}
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openNotification(notification)}
                        disabled={isUpdating}
                        className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-bold transition hover:bg-violet-600 disabled:cursor-wait disabled:opacity-50"
                      >
                        {isUpdating ? "იხსნება..." : "გახსნა"}
                      </button>

                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification)}
                          disabled={isUpdating}
                          className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          წაკითხულად მონიშვნა
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function getNotificationIcon(type: string | null) {
  if (type === "tour_approved") {
    return "✅";
  }

  if (type === "tour_rejected") {
    return "❌";
  }

  if (type === "transfer_approved") {
    return "🚐";
  }

  if (type === "transfer_rejected") {
    return "⛔";
  }

  if (type === "hotel_approved") {
    return "🏨";
  }

  if (type === "hotel_rejected") {
    return "🚫";
  }

  if (type === "new_booking") {
    return "📅";
  }

  return "🔔";
}

function getOpenLabel(type: string | null) {
  if (type === "new_booking") {
    return "ჯავშნის ნახვა →";
  }

  if (
    type === "tour_approved" ||
    type === "tour_rejected"
  ) {
    return "ჩემი ტურების ნახვა →";
  }

  if (
    type === "transfer_approved" ||
    type === "transfer_rejected"
  ) {
    return "ჩემი ტრანსფერების ნახვა →";
  }

  return "Dashboard-ის გახსნა →";
}

function formatNotificationDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
