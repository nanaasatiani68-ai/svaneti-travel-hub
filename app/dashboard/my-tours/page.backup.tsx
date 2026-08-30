"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Tour = {
  id: number | string;
  user_id: string | null;
  title: string | null;
  description: string | null;
  location: string | null;
  price: number | null;
  image_url: string | null;
  image_urls: string[] | null;
  duration: string | null;
  start_date: string | null;
  max_people: number | null;
  category: string | null;
  status: string | null;
  rejection_reason: string | null;
  created_at: string | null;

  organizer_name: string | null;
  contact_phone: string | null;
  whatsapp_phone: string | null;
  viber_phone: string | null;
  has_whatsapp: boolean | null;
  has_viber: boolean | null;
};

export default function MyToursPage() {
  const router = useRouter();

  const [tours, setTours] = useState<Tour[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState<
    string | number | null
  >(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  const loadTours = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("tours")
      .select(
        `
          id,
          user_id,
          title,
          description,
          location,
          price,
          image_url,
          image_urls,
          duration,
          start_date,
          max_people,
          category,
          status,
          rejection_reason,
          created_at,
          organizer_name,
          contact_phone,
          whatsapp_phone,
          viber_phone,
          has_whatsapp,
          has_viber
        `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Tours loading error:", error);

      setMessage(
        `áƒ¢áƒ£áƒ áƒ”áƒ‘áƒ˜áƒ¡ áƒ©áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ•áƒ áƒ•áƒ”áƒ  áƒ›áƒáƒ®áƒ”áƒ áƒ®áƒ“áƒ: ${error.message}`
      );

      setMessageType("error");
      setLoading(false);
      return;
    }

    const ownTours = (data as Tour[] | null) ?? [];

    setTours(ownTours);

    if (ownTours.length === 0) {
      setMessage("áƒ¨áƒ”áƒœ áƒ¯áƒ”áƒ  áƒáƒ áƒªáƒ”áƒ áƒ—áƒ˜ áƒ¢áƒ£áƒ áƒ˜ áƒáƒ  áƒ“áƒáƒ’áƒ˜áƒ›áƒáƒ¢áƒ”áƒ‘áƒ˜áƒ.");
      setMessageType("info");
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  async function deleteTour(tour: Tour) {
    if (!currentUserId || tour.user_id !== currentUserId) {
      setMessage("áƒáƒ› áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ¬áƒáƒ¨áƒšáƒ˜áƒ¡ áƒ£áƒ¤áƒšáƒ”áƒ‘áƒ áƒáƒ  áƒ’áƒáƒ¥áƒ•áƒ¡.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      `áƒœáƒáƒ›áƒ“áƒ•áƒ˜áƒšáƒáƒ“ áƒ’áƒ˜áƒœáƒ“áƒ áƒ¢áƒ£áƒ áƒ˜áƒ¡ â€ž${
        tour.title || "áƒ£áƒ¡áƒáƒ®áƒ”áƒšáƒ áƒ¢áƒ£áƒ áƒ˜"
      }â€œ áƒ¬áƒáƒ¨áƒšáƒ?\n\náƒ¬áƒáƒ¨áƒšáƒ˜áƒ¡ áƒ¨áƒ”áƒ›áƒ“áƒ”áƒ’ áƒ›áƒ˜áƒ¡áƒ˜ áƒáƒ¦áƒ“áƒ’áƒ”áƒœáƒ áƒ¨áƒ”áƒ£áƒ«áƒšáƒ”áƒ‘áƒ”áƒšáƒ˜ áƒ˜áƒ¥áƒœáƒ”áƒ‘áƒ.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(tour.id);
    setMessage("");

    const { data, error } = await supabase
      .from("tours")
      .delete()
      .eq("id", tour.id)
      .eq("user_id", currentUserId)
      .select("id");

    if (error) {
      console.error("Tour delete error:", error);

      setMessage(
        `áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ¬áƒáƒ¨áƒšáƒ áƒ•áƒ”áƒ  áƒ›áƒáƒ®áƒ”áƒ áƒ®áƒ“áƒ: ${error.message}`
      );

      setMessageType("error");
      setDeletingId(null);
      return;
    }

    if (!data || data.length === 0) {
      setMessage(
        "áƒ¢áƒ£áƒ áƒ˜ áƒáƒ  áƒ¬áƒáƒ˜áƒ¨áƒáƒšáƒ. áƒ’áƒáƒ“áƒáƒáƒ›áƒáƒ¬áƒ›áƒ” Supabase-áƒ˜áƒ¡ DELETE áƒžáƒáƒšáƒ˜áƒ¢áƒ˜áƒ™áƒ."
      );

      setMessageType("error");
      setDeletingId(null);
      return;
    }

    const imageUrls =
      Array.isArray(tour.image_urls) &&
      tour.image_urls.length > 0
        ? tour.image_urls
        : tour.image_url
          ? [tour.image_url]
          : [];

    const imagePaths = Array.from(
      new Set(
        imageUrls
          .map((url) =>
            getStoragePathFromPublicUrl(
              url,
              "tour-images"
            )
          )
          .filter(
            (path): path is string =>
              Boolean(path)
          )
      )
    );

    if (imagePaths.length > 0) {
      const { error: imageDeleteError } =
        await supabase.storage
          .from("tour-images")
          .remove(imagePaths);

      if (imageDeleteError) {
        console.error(
          "Tour images delete error:",
          imageDeleteError
        );
      }
    }

    setTours((currentTours) =>
      currentTours.filter((item) => item.id !== tour.id)
    );

    setMessage("áƒ¢áƒ£áƒ áƒ˜ áƒ¬áƒáƒ áƒ›áƒáƒ¢áƒ”áƒ‘áƒ˜áƒ— áƒ¬áƒáƒ˜áƒ¨áƒáƒšáƒ.");
    setMessageType("success");
    setDeletingId(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">â³</div>

          <p className="mt-4 text-lg font-semibold">
            áƒ¢áƒ£áƒ áƒ”áƒ‘áƒ˜ áƒ˜áƒ¢áƒ•áƒ˜áƒ áƒ—áƒ”áƒ‘áƒ...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
              áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ˜áƒ¡ áƒžáƒáƒœáƒ”áƒšáƒ˜
            </p>

            <h1 className="mt-3 text-4xl font-black">
              ðŸ”ï¸ áƒ©áƒ”áƒ›áƒ˜ áƒ¢áƒ£áƒ áƒ”áƒ‘áƒ˜
            </h1>

            <p className="mt-3 max-w-3xl text-white/60">
              áƒáƒ¥ áƒ¨áƒ”áƒ’áƒ˜áƒ«áƒšáƒ˜áƒ áƒœáƒáƒ®áƒ, áƒ¨áƒ”áƒªáƒ•áƒáƒšáƒ áƒáƒœ áƒ¬áƒáƒ¨áƒáƒšáƒ áƒ¨áƒ”áƒœ áƒ›áƒ˜áƒ”áƒ 
              áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ£áƒšáƒ˜ áƒ¢áƒ£áƒ áƒ”áƒ‘áƒ˜. áƒ—áƒ˜áƒ—áƒáƒ”áƒ£áƒš áƒ¢áƒ£áƒ áƒ¡ áƒ¨áƒ”áƒ˜áƒ«áƒšáƒ”áƒ‘áƒ áƒ°áƒ¥áƒáƒœáƒ“áƒ”áƒ¡
              áƒ’áƒáƒœáƒ¡áƒ®áƒ•áƒáƒ•áƒ”áƒ‘áƒ£áƒšáƒ˜ áƒáƒ áƒ’áƒáƒœáƒ˜áƒ–áƒáƒ¢áƒáƒ áƒ˜áƒ¡ áƒ¡áƒáƒ®áƒ”áƒšáƒ˜ áƒ“áƒ áƒ¢áƒ”áƒšáƒ”áƒ¤áƒáƒœáƒ˜áƒ¡
              áƒœáƒáƒ›áƒ”áƒ áƒ˜.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold transition hover:bg-white/10"
            >
              â† Dashboard
            </Link>

            <Link
              href="/dashboard/add-tour"
              className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
            >
              âž• áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ
            </Link>
          </div>
        </header>

        {message && (
          <div
            className={`mt-7 rounded-2xl border p-4 text-sm font-semibold ${
              messageType === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : messageType === "error"
                  ? "border-red-400/30 bg-red-500/10 text-red-200"
                  : "border-amber-400/30 bg-amber-500/10 text-amber-200"
            }`}
          >
            {message}
          </div>
        )}

        {tours.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-12 text-center shadow-2xl">
            <div className="text-7xl">ðŸ”ï¸</div>

            <h2 className="mt-5 text-3xl font-bold">
              áƒ¯áƒ”áƒ  áƒ¢áƒ£áƒ áƒ˜ áƒáƒ  áƒ’áƒáƒ¥áƒ•áƒ¡ áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ£áƒšáƒ˜
            </h2>

            <p className="mt-3 text-white/55">
              áƒ“áƒáƒáƒ›áƒáƒ¢áƒ” áƒ¨áƒ”áƒœáƒ˜ áƒžáƒ˜áƒ áƒ•áƒ”áƒšáƒ˜ áƒ¢áƒ£áƒ áƒ˜. áƒ§áƒáƒ•áƒ”áƒš áƒáƒ®áƒáƒš áƒ¢áƒ£áƒ áƒ–áƒ”
              áƒ’áƒáƒœáƒ¡áƒ®áƒ•áƒáƒ•áƒ”áƒ‘áƒ£áƒšáƒ˜ áƒáƒ áƒ’áƒáƒœáƒ˜áƒ–áƒáƒ¢áƒáƒ áƒ˜áƒ¡ áƒ¡áƒáƒ®áƒ”áƒšáƒ˜áƒ¡áƒ áƒ“áƒ áƒœáƒáƒ›áƒ áƒ”áƒ‘áƒ˜áƒ¡
              áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒáƒ¡ áƒ¨áƒ”áƒ«áƒšáƒ”áƒ‘.
            </p>

            <Link
              href="/dashboard/add-tour"
              className="mt-7 inline-flex rounded-2xl bg-cyan-500 px-7 py-4 font-bold transition hover:bg-cyan-600"
            >
              âž• áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {tours.map((tour) => (
              <article
                key={tour.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl transition hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="relative">
                  {tour.image_url ? (
                    <img
                      src={tour.image_url}
                      alt={tour.title || "Tour"}
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-white/5 text-8xl">
                      ðŸ”ï¸
                    </div>
                  )}

                  <div className="absolute left-4 top-4">
                    <StatusBadge status={tour.status} />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-white/35">
                      Tour #{tour.id}
                    </span>

                    {tour.created_at && (
                      <span className="text-xs text-white/35">
                        {formatDate(tour.created_at)}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-5 text-2xl font-extrabold">
                    {tour.title || "áƒ£áƒ¡áƒáƒ®áƒ”áƒšáƒ áƒ¢áƒ£áƒ áƒ˜"}
                  </h2>

                  <p className="mt-3 text-white/60">
                    ðŸ“{" "}
                    {tour.location ||
                      "áƒ›áƒ“áƒ”áƒ‘áƒáƒ áƒ”áƒáƒ‘áƒ áƒáƒ  áƒáƒ áƒ˜áƒ¡ áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ£áƒšáƒ˜"}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <InfoBox
                      icon="ðŸ’°"
                      value={
                        tour.price !== null
                          ? `${Number(
                              tour.price
                            ).toLocaleString()} â‚¾`
                          : "áƒ¨áƒ”áƒ—áƒáƒœáƒ®áƒ›áƒ”áƒ‘áƒ˜áƒ—"
                      }
                    />

                    <InfoBox
                      icon="â±ï¸"
                      value={
                        tour.duration ||
                        "áƒ®áƒáƒœáƒ’áƒ áƒ«áƒšáƒ˜áƒ•áƒáƒ‘áƒ áƒ£áƒªáƒœáƒáƒ‘áƒ˜áƒ"
                      }
                    />

                    <InfoBox
                      icon="ðŸ‘¥"
                      value={
                        tour.max_people
                          ? `${tour.max_people} áƒáƒ“áƒáƒ›áƒ˜áƒáƒœáƒ˜`
                          : "áƒ áƒáƒáƒ“áƒ”áƒœáƒáƒ‘áƒ áƒ£áƒªáƒœáƒáƒ‘áƒ˜áƒ"
                      }
                    />

                    <InfoBox
                      icon="ðŸš™"
                      value={
                        tour.category ||
                        "áƒ™áƒáƒ¢áƒ”áƒ’áƒáƒ áƒ˜áƒ áƒ£áƒªáƒœáƒáƒ‘áƒ˜áƒ"
                      }
                    />
                  </div>

                  {tour.start_date && (
                    <div className="mt-4 rounded-xl bg-black/20 p-3 text-sm text-white/70">
                      ðŸ“… áƒ“áƒáƒ¬áƒ§áƒ”áƒ‘áƒ: {formatDate(tour.start_date)}
                    </div>
                  )}

                  {tour.description && (
                    <p className="mt-5 line-clamp-3 leading-7 text-white/55">
                      {tour.description}
                    </p>
                  )}

                  <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-300">
                      áƒ¡áƒáƒ¯áƒáƒ áƒ áƒ¡áƒáƒ™áƒáƒœáƒ¢áƒáƒ¥áƒ¢áƒ áƒ˜áƒœáƒ¤áƒáƒ áƒ›áƒáƒªáƒ˜áƒ
                    </p>

                    <div className="mt-3 space-y-2 text-sm">
                      <ContactRow
                        icon="ðŸ‘¤"
                        label="áƒáƒ áƒ’áƒáƒœáƒ˜áƒ–áƒáƒ¢áƒáƒ áƒ˜"
                        value={
                          tour.organizer_name ||
                          "áƒáƒ áƒ’áƒáƒœáƒ˜áƒ–áƒáƒ¢áƒáƒ áƒ˜ áƒáƒ  áƒáƒ áƒ˜áƒ¡ áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ£áƒšáƒ˜"
                        }
                      />

                      <ContactRow
                        icon="ðŸ“ž"
                        label="áƒ¢áƒ”áƒšáƒ”áƒ¤áƒáƒœáƒ˜"
                        value={
                          tour.contact_phone ||
                          "áƒœáƒáƒ›áƒ”áƒ áƒ˜ áƒáƒ  áƒáƒ áƒ˜áƒ¡ áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ£áƒšáƒ˜"
                        }
                      />

                      <ContactRow
                        icon="ðŸŸ¢"
                        label="WhatsApp"
                        value={
                          tour.has_whatsapp
                            ? tour.contact_phone ||
                              tour.whatsapp_phone ||
                              "áƒœáƒáƒ›áƒ”áƒ áƒ˜ áƒáƒ  áƒáƒ áƒ˜áƒ¡ áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ£áƒšáƒ˜"
                            : tour.whatsapp_phone ||
                              "áƒœáƒáƒ›áƒ”áƒ áƒ˜ áƒáƒ  áƒáƒ áƒ˜áƒ¡ áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ£áƒšáƒ˜"
                        }
                      />

                      <ContactRow
                        icon="ðŸŸ£"
                        label="Viber"
                        value={
                          tour.has_viber
                            ? tour.contact_phone ||
                              tour.viber_phone ||
                              "áƒœáƒáƒ›áƒ”áƒ áƒ˜ áƒáƒ  áƒáƒ áƒ˜áƒ¡ áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ£áƒšáƒ˜"
                            : tour.viber_phone ||
                              "áƒœáƒáƒ›áƒ”áƒ áƒ˜ áƒáƒ  áƒáƒ áƒ˜áƒ¡ áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ£áƒšáƒ˜"
                        }
                      />
                    </div>

                    <p className="mt-3 text-xs leading-5 text-white/45">
                      áƒ”áƒ¡ áƒ˜áƒœáƒ¤áƒáƒ áƒ›áƒáƒªáƒ˜áƒ áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ¡áƒáƒ¯áƒáƒ áƒ áƒ’áƒ•áƒ”áƒ áƒ“áƒ–áƒ” áƒ’áƒáƒ›áƒáƒ©áƒœáƒ“áƒ”áƒ‘áƒ.
                      áƒ¨áƒ”áƒœáƒ˜ áƒáƒœáƒ’áƒáƒ áƒ˜áƒ¨áƒ˜áƒ¡ áƒ¡áƒáƒ®áƒ”áƒšáƒ˜ áƒ“áƒ áƒ”áƒšáƒ¤áƒáƒ¡áƒ¢áƒ áƒ¡áƒáƒ¯áƒáƒ áƒáƒ“ áƒáƒ 
                      áƒ’áƒáƒ›áƒáƒ©áƒœáƒ“áƒ”áƒ‘áƒ.
                    </p>
                  </div>

                  {tour.status === "rejected" && (
                    <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                      <p className="font-black text-red-200">
                        âŒ áƒ£áƒáƒ áƒ§áƒáƒ¤áƒ˜áƒ¡ áƒ›áƒ˜áƒ–áƒ”áƒ–áƒ˜
                      </p>

                      <p className="mt-2 whitespace-pre-wrap break-words leading-7 text-red-100/90">
                        {tour.rejection_reason ||
                          "áƒáƒ“áƒ›áƒ˜áƒœáƒ˜áƒ¡áƒ¢áƒ áƒáƒ¢áƒáƒ áƒ¡ áƒ£áƒáƒ áƒ§áƒáƒ¤áƒ˜áƒ¡ áƒ›áƒ˜áƒ–áƒ”áƒ–áƒ˜ áƒáƒ  áƒ›áƒ˜áƒ£áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ˜áƒ."}
                      </p>

                      <p className="mt-3 text-sm text-red-200/70">
                        áƒ¨áƒ”áƒªáƒ•áƒáƒšáƒ” áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ˜áƒœáƒ¤áƒáƒ áƒ›áƒáƒªáƒ˜áƒ áƒ“áƒ áƒ®áƒ”áƒšáƒáƒ®áƒšáƒ
                        áƒ’áƒáƒ’áƒ–áƒáƒ•áƒœáƒ” áƒ“áƒáƒ¡áƒáƒ›áƒ¢áƒ™áƒ˜áƒªáƒ”áƒ‘áƒšáƒáƒ“.
                      </p>
                    </div>
                  )}

                  {tour.status === "pending" && (
                    <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                      â³ áƒ¢áƒ£áƒ áƒ˜ áƒ’áƒáƒ’áƒ–áƒáƒ•áƒœáƒ˜áƒšáƒ˜áƒ áƒáƒ“áƒ›áƒ˜áƒœáƒ˜áƒ¡áƒ¢áƒ áƒáƒ¢áƒáƒ áƒ—áƒáƒœ áƒ“áƒ
                      áƒ”áƒšáƒáƒ“áƒ”áƒ‘áƒ áƒ“áƒáƒ›áƒ¢áƒ™áƒ˜áƒªáƒ”áƒ‘áƒáƒ¡.
                    </div>
                  )}

                  {tour.status === "approved" && (
                    <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                      âœ… áƒ¢áƒ£áƒ áƒ˜ áƒ“áƒáƒ›áƒ¢áƒ™áƒ˜áƒªáƒ”áƒ‘áƒ£áƒšáƒ˜áƒ áƒ“áƒ áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ”áƒ‘áƒ˜áƒ¡áƒ—áƒ•áƒ˜áƒ¡
                      áƒ¡áƒáƒ¯áƒáƒ áƒáƒ“ áƒ©áƒáƒœáƒ¡.
                    </div>
                  )}

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <Link
                      href={`/book-tour/${tour.id}`}
                      className="flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-center font-bold transition hover:bg-cyan-600"
                    >
                      ðŸ‘ï¸ áƒœáƒáƒ®áƒ•áƒ
                    </Link>

                    <Link
                      href={`/dashboard/edit-tour/${tour.id}`}
                      className="flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-center font-bold text-white transition hover:bg-amber-600"
                    >
                      âœï¸ áƒ¨áƒ”áƒªáƒ•áƒšáƒ
                    </Link>

                    <button
                      type="button"
                      onClick={() => deleteTour(tour)}
                      disabled={deletingId === tour.id}
                      className="rounded-2xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === tour.id
                        ? "áƒ˜áƒ¨áƒšáƒ”áƒ‘áƒ..."
                        : "ðŸ—‘ï¸ áƒ¬áƒáƒ¨áƒšáƒ"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: string | null;
}) {
  if (status === "approved") {
    return (
      <span className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-black text-white shadow-lg">
        âœ… áƒ“áƒáƒ›áƒ¢áƒ™áƒ˜áƒªáƒ”áƒ‘áƒ£áƒšáƒ˜
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white shadow-lg">
        âŒ áƒ£áƒáƒ áƒ§áƒáƒ¤áƒ˜áƒšáƒ˜
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-white shadow-lg">
      â³ áƒ“áƒáƒ¡áƒáƒ›áƒ¢áƒ™áƒ˜áƒªáƒ”áƒ‘áƒ”áƒšáƒ˜
    </span>
  );
}

function InfoBox({
  icon,
  value,
}: {
  icon: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-black/20 p-3 text-white/70">
      <span className="mr-2">{icon}</span>
      <span>{value}</span>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const isMissing =
    !value ||
    value.includes("áƒáƒ  áƒáƒ áƒ˜áƒ¡ áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ£áƒšáƒ˜");

  const normalizedPhone = value.replace(/[^0-9]/g, "");

  const whatsappHref =
    label === "WhatsApp" &&
    !isMissing &&
    normalizedPhone
      ? `https://wa.me/${normalizedPhone}`
      : null;

  const viberHref =
    label === "Viber" &&
    !isMissing &&
    normalizedPhone
      ? `viber://chat?number=%2B${normalizedPhone}`
      : null;

  const href = whatsappHref || viberHref;

  return (
    <div className="flex items-start gap-2 rounded-xl bg-black/20 px-3 py-2">
      <span>{icon}</span>

      <div className="min-w-0">
        <p className="text-xs text-white/40">
          {label}
        </p>

        {href ? (
          <a
            href={href}
            target={
              label === "WhatsApp"
                ? "_blank"
                : undefined
            }
            rel={
              label === "WhatsApp"
                ? "noopener noreferrer"
                : undefined
            }
            className="mt-0.5 inline-flex break-words font-semibold text-cyan-300 underline decoration-cyan-400/40 underline-offset-4 transition hover:text-cyan-200"
          >
            {value}
          </a>
        ) : (
          <p className="mt-0.5 break-words font-semibold text-white/80">
            {value}
          </p>
        )}
      </div>
    </div>
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
  }).format(date);
}

function getStoragePathFromPublicUrl(
  publicUrl: string,
  bucketName: string
) {
  if (!publicUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${bucketName}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const encodedPath = publicUrl.slice(
    markerIndex + marker.length
  );

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
}
