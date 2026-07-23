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
  duration: string | null;
  start_date: string | null;
  max_people: number | null;
  category: string | null;
  status: string | null;
  created_at: string | null;
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
          duration,
          start_date,
          max_people,
          category,
          status,
          created_at
        `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Tours loading error:", error);

      setMessage(
        `ტურების ჩატვირთვა ვერ მოხერხდა: ${error.message}`
      );

      setMessageType("error");
      setLoading(false);
      return;
    }

    const ownTours = (data as Tour[] | null) ?? [];

    setTours(ownTours);

    if (ownTours.length === 0) {
      setMessage("შენ ჯერ არცერთი ტური არ დაგიმატებია.");
      setMessageType("info");
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  async function deleteTour(tour: Tour) {
    if (!currentUserId || tour.user_id !== currentUserId) {
      setMessage("ამ ტურის წაშლის უფლება არ გაქვს.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      `ნამდვილად გინდა ტურის „${
        tour.title || "უსახელო ტური"
      }“ წაშლა?\n\nწაშლის შემდეგ მისი აღდგენა შეუძლებელი იქნება.`
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
        `ტურის წაშლა ვერ მოხერხდა: ${error.message}`
      );

      setMessageType("error");
      setDeletingId(null);
      return;
    }

    if (!data || data.length === 0) {
      setMessage(
        "ტური არ წაიშალა. გადაამოწმე Supabase-ის DELETE პოლიტიკა."
      );

      setMessageType("error");
      setDeletingId(null);
      return;
    }

    const imagePath = getStoragePathFromPublicUrl(
      tour.image_url || "",
      "tour-images"
    );

    if (imagePath) {
      const { error: imageDeleteError } =
        await supabase.storage
          .from("tour-images")
          .remove([imagePath]);

      if (imageDeleteError) {
        console.error(
          "Tour image delete error:",
          imageDeleteError
        );
      }
    }

    setTours((currentTours) =>
      currentTours.filter((item) => item.id !== tour.id)
    );

    setMessage("ტური წარმატებით წაიშალა.");
    setMessageType("success");
    setDeletingId(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">⏳</div>

          <p className="mt-4 text-lg font-semibold">
            ტურები იტვირთება...
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
              მომხმარებლის პანელი
            </p>

            <h1 className="mt-3 text-4xl font-black">
              🏔️ ჩემი ტურები
            </h1>

            <p className="mt-3 text-white/60">
              აქ შეგიძლია ნახო, შეცვალო ან წაშალო შენ მიერ
              დამატებული ტურები.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold transition hover:bg-white/10"
            >
              ← Dashboard
            </Link>

            <Link
              href="/dashboard/add-tour"
              className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
            >
              ➕ ტურის დამატება
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
            <div className="text-7xl">🏔️</div>

            <h2 className="mt-5 text-3xl font-bold">
              ჯერ ტური არ გაქვს დამატებული
            </h2>

            <p className="mt-3 text-white/55">
              დაამატე შენი პირველი ტური და გაუგზავნე
              ადმინისტრატორს დასამტკიცებლად.
            </p>

            <Link
              href="/dashboard/add-tour"
              className="mt-7 inline-flex rounded-2xl bg-cyan-500 px-7 py-4 font-bold transition hover:bg-cyan-600"
            >
              ➕ ტურის დამატება
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
                      🏔️
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
                    {tour.title || "უსახელო ტური"}
                  </h2>

                  <p className="mt-3 text-white/60">
                    📍{" "}
                    {tour.location ||
                      "მდებარეობა არ არის მითითებული"}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <InfoBox
                      icon="💰"
                      value={
                        tour.price !== null
                          ? `${Number(
                              tour.price
                            ).toLocaleString()} ₾`
                          : "შეთანხმებით"
                      }
                    />

                    <InfoBox
                      icon="⏱️"
                      value={
                        tour.duration ||
                        "ხანგრძლივობა უცნობია"
                      }
                    />

                    <InfoBox
                      icon="👥"
                      value={
                        tour.max_people
                          ? `${tour.max_people} ადამიანი`
                          : "რაოდენობა უცნობია"
                      }
                    />

                    <InfoBox
                      icon="🚙"
                      value={
                        tour.category ||
                        "კატეგორია უცნობია"
                      }
                    />
                  </div>

                  {tour.start_date && (
                    <div className="mt-4 rounded-xl bg-black/20 p-3 text-sm text-white/70">
                      📅 დაწყება: {tour.start_date}
                    </div>
                  )}

                  {tour.description && (
                    <p className="mt-5 line-clamp-3 leading-7 text-white/55">
                      {tour.description}
                    </p>
                  )}

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <Link
                      href={`/book-tour/${tour.id}`}
                      className="flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-center font-bold transition hover:bg-cyan-600"
                    >
                      👁️ ნახვა
                    </Link>

                    <Link
                      href={`/dashboard/edit-tour/${tour.id}`}
                      className="flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-center font-bold text-white transition hover:bg-amber-600"
                    >
                      ✏️ შეცვლა
                    </Link>

                    <button
                      type="button"
                      onClick={() => deleteTour(tour)}
                      disabled={deletingId === tour.id}
                      className="rounded-2xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === tour.id
                        ? "იშლება..."
                        : "🗑️ წაშლა"}
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
        ✅ დამტკიცებული
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white shadow-lg">
        ❌ უარყოფილი
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-white shadow-lg">
      ⏳ დასამტკიცებელი
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