"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Tour = {
  id: number | string;
  title: string | null;
  description: string | null;
  location: string | null;
  price: number | null;
  image_url: string | null;
  duration: string | null;
  max_people: number | null;
  category: string | null;
  status: string | null;
};

type FavoriteRow = {
  id: string;
  tour_id: number | string;
  created_at: string | null;
  tours: Tour | Tour[] | null;
};

type FavoriteTour = {
  favoriteId: string;
  tour: Tour;
};

export default function FavoritesPage() {
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select(
        `
          id,
          tour_id,
          created_at,
          tours (
            id,
            title,
            description,
            location,
            price,
            image_url,
            duration,
            max_people,
            category,
            status
          )
        `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Favorites loading error:", error);
      setErrorMessage(
        `ფავორიტების ჩატვირთვა ვერ მოხერხდა: ${error.message}`
      );
      setFavorites([]);
      setLoading(false);
      return;
    }

    const rows = (data as FavoriteRow[] | null) ?? [];

    const preparedFavorites: FavoriteTour[] = rows
      .map((row) => {
        const relatedTour = Array.isArray(row.tours)
          ? row.tours[0]
          : row.tours;

        if (!relatedTour) {
          return null;
        }

        return {
          favoriteId: row.id,
          tour: relatedTour,
        };
      })
      .filter(
        (item): item is FavoriteTour =>
          item !== null && item.tour.status === "approved"
      );

    setFavorites(preparedFavorites);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  async function removeFavorite(item: FavoriteTour) {
    setRemovingId(item.favoriteId);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", item.favoriteId);

    if (error) {
      console.error("Favorite delete error:", error);
      setErrorMessage(
        `ფავორიტებიდან წაშლა ვერ მოხერხდა: ${error.message}`
      );
      setRemovingId(null);
      return;
    }

    setFavorites((currentFavorites) =>
      currentFavorites.filter(
        (favorite) => favorite.favoriteId !== item.favoriteId
      )
    );

    setSuccessMessage("ტური ფავორიტებიდან წაიშალა.");
    setRemovingId(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">❤️</div>

          <p className="mt-4 text-lg font-semibold">
            ფავორიტები იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-300">
              მომხმარებლის პანელი
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              ❤️ ფავორიტები
            </h1>

            <p className="mt-3 text-white/60">
              აქ ჩანს შენ მიერ შენახული ტურები.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
            >
              ← Dashboard
            </Link>

            <Link
              href="/tours"
              className="rounded-2xl bg-rose-500 px-5 py-3 font-bold transition hover:bg-rose-600"
            >
              🏔️ ტურების ნახვა
            </Link>
          </div>
        </header>

        {successMessage && (
          <div className="mt-7 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 font-semibold text-emerald-200">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-7 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 font-semibold text-red-200">
            {errorMessage}
          </div>
        )}

        {favorites.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl sm:p-14">
            <div className="text-7xl">❤️</div>

            <h2 className="mt-5 text-3xl font-black">
              ფავორიტები ჯერ ცარიელია
            </h2>

            <p className="mt-3 text-white/60">
              ტურების გვერდზე დააჭირე გულის ღილაკს და სასურველი ტური აქ
              გამოჩნდება.
            </p>

            <Link
              href="/tours"
              className="mt-7 inline-flex rounded-2xl bg-rose-500 px-7 py-4 font-bold transition hover:bg-rose-600"
            >
              ტურების ნახვა
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((item) => {
              const tour = item.tour;

              return (
                <article
                  key={item.favoriteId}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl transition hover:-translate-y-1 hover:bg-white/10"
                >
                  <div className="relative h-64 overflow-hidden">
                    {tour.image_url ? (
                      <img
                        src={tour.image_url}
                        alt={tour.title || "Tour"}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-950 to-slate-900 text-8xl">
                        🏔️
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />

                    <button
                      type="button"
                      onClick={() => removeFavorite(item)}
                      disabled={removingId === item.favoriteId}
                      className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-rose-500 shadow-xl transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="ფავორიტებიდან წაშლა"
                    >
                      {removingId === item.favoriteId ? "⏳" : "❤️"}
                    </button>

                    <div className="absolute bottom-4 left-4 right-4">
                      {tour.category && (
                        <span className="inline-flex rounded-full bg-rose-500 px-3 py-1 text-xs font-bold">
                          {tour.category}
                        </span>
                      )}

                      <h2 className="mt-3 text-2xl font-black drop-shadow-lg">
                        {tour.title || "უსახელო ტური"}
                      </h2>

                      <p className="mt-2 text-sm text-white/80">
                        📍 {tour.location || "მდებარეობა უცნობია"}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <InfoBox
                        icon="⏱️"
                        value={tour.duration || "უცნობია"}
                      />

                      <InfoBox
                        icon="👥"
                        value={
                          tour.max_people
                            ? `${tour.max_people} ადამიანი`
                            : "უცნობია"
                        }
                      />
                    </div>

                    {tour.description && (
                      <p className="mt-5 line-clamp-3 leading-7 text-white/60">
                        {tour.description}
                      </p>
                    )}

                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                          ფასი
                        </p>

                        <p className="mt-1 text-2xl font-black text-rose-300">
                          {tour.price !== null
                            ? `${Number(tour.price).toLocaleString()} ₾`
                            : "შეთანხმებით"}
                        </p>
                      </div>

                      <Link
                        href={`/book-tour/${tour.id}`}
                        className="rounded-2xl bg-rose-500 px-5 py-3 font-bold transition hover:bg-rose-600"
                      >
                        ნახვა
                      </Link>
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