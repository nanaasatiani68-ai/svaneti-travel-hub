"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Tour = {
  id: string | number;
  user_id: string | null;
  title: string | null;
  description: string | null;
  location: string | null;
  price: number | null;
  image_url: string | null;
  duration: string | null;
  max_people: number | null;
  category: string | null;
  status: string | null;
  created_at: string | null;
};

type FavoriteRow = {
  tour_id: string | number;
};

type Profile = {
  id: string;
  full_name: string | null;
};

type SortOption =
  | "newest"
  | "price-low"
  | "price-high"
  | "title";

export default function PublicToursPage() {
  const router = useRouter();

  const [tours, setTours] = useState<Tour[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [favoriteTourIds, setFavoriteTourIds] = useState<Set<string>>(
    new Set()
  );

  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<
    string | null
  >(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [favoriteMessageType, setFavoriteMessageType] = useState<
    "success" | "error"
  >("success");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [people, setPeople] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  async function loadTours() {
    setLoading(true);
    setErrorMessage("");

    try {
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
            max_people,
            category,
            status,
            created_at
          `
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const loadedTours = (data as Tour[] | null) ?? [];
      setTours(loadedTours);

      const ownerIds = Array.from(
        new Set(
          loadedTours
            .map((tour) => tour.user_id)
            .filter((userId): userId is string => Boolean(userId))
        )
      );

      if (ownerIds.length === 0) {
        setAuthorNames({});
        return;
      }

      const { data: profilesData, error: profilesError } =
        await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ownerIds);

      if (profilesError) {
        console.error("Tour authors loading error:", profilesError);
        setAuthorNames({});
        return;
      }

      const profiles = (profilesData as Profile[] | null) ?? [];

      setAuthorNames(
        Object.fromEntries(
          profiles.map((profile) => [
            profile.id,
            profile.full_name?.trim() || "ტურის ორგანიზატორი",
          ])
        )
      );
    } catch (error: unknown) {
      console.error("Tours loading error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setTours([]);
      setErrorMessage(
        `ტურების ჩატვირთვა ვერ მოხერხდა. ${message}`
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadUserAndFavorites() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session loading error:", sessionError);
        return;
      }

      const user = session?.user;

      if (!user) {
        setCurrentUserId("");
        setFavoriteTourIds(new Set());
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("favorites")
        .select("tour_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Favorites loading error:", error);
        return;
      }

      const favoriteRows = (data as FavoriteRow[] | null) ?? [];

      setFavoriteTourIds(
        new Set(
          favoriteRows.map((favorite) =>
            String(favorite.tour_id)
          )
        )
      );
    } catch (error) {
      console.error("User or favorites loading error:", error);
    }
  }

  useEffect(() => {
    void loadTours();
    void loadUserAndFavorites();
  }, []);

  const categories = useMemo(() => {
    const values = new Set<string>();

    tours.forEach((tour) => {
      const category = tour.category?.trim();

      if (category) {
        values.add(category);
      }
    });

    return Array.from(values).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [tours]);

  const filteredTours = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const minimumPrice =
      minPrice.trim() === "" ? null : Number(minPrice);

    const maximumPrice =
      maxPrice.trim() === "" ? null : Number(maxPrice);

    const requestedPeople =
      people.trim() === "" ? null : Number(people);

    const result = tours.filter((tour) => {
      const title = String(tour.title ?? "").toLowerCase();
      const location = String(
        tour.location ?? ""
      ).toLowerCase();
      const description = String(
        tour.description ?? ""
      ).toLowerCase();
      const category = String(
        tour.category ?? ""
      ).toLowerCase();
      const authorName = String(
        tour.user_id ? authorNames[tour.user_id] ?? "" : ""
      ).toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        title.includes(normalizedSearch) ||
        location.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        category.includes(normalizedSearch) ||
        authorName.includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === "all" ||
        tour.category === selectedCategory;

      const numericPrice =
        tour.price === null ? null : Number(tour.price);

      const matchesMinPrice =
        minimumPrice === null ||
        (numericPrice !== null &&
          numericPrice >= minimumPrice);

      const matchesMaxPrice =
        maximumPrice === null ||
        (numericPrice !== null &&
          numericPrice <= maximumPrice);

      const matchesPeople =
        requestedPeople === null ||
        tour.max_people === null ||
        Number(tour.max_people) >= requestedPeople;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesPeople
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price-low") {
        const priceA =
          a.price === null
            ? Number.POSITIVE_INFINITY
            : Number(a.price);

        const priceB =
          b.price === null
            ? Number.POSITIVE_INFINITY
            : Number(b.price);

        return priceA - priceB;
      }

      if (sortBy === "price-high") {
        const priceA =
          a.price === null
            ? Number.NEGATIVE_INFINITY
            : Number(a.price);

        const priceB =
          b.price === null
            ? Number.NEGATIVE_INFINITY
            : Number(b.price);

        return priceB - priceA;
      }

      if (sortBy === "title") {
        return String(a.title ?? "").localeCompare(
          String(b.title ?? "")
        );
      }

      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : 0;

      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [
    tours,
    search,
    selectedCategory,
    minPrice,
    maxPrice,
    people,
    sortBy,
    authorNames,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "all" ||
    minPrice.trim() !== "" ||
    maxPrice.trim() !== "" ||
    people.trim() !== "" ||
    sortBy !== "newest";

  function clearFilters() {
    setSearch("");
    setSelectedCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setPeople("");
    setSortBy("newest");
  }

  async function toggleFavorite(tour: Tour) {
    setFavoriteMessage("");

    if (!currentUserId) {
      router.push("/login");
      return;
    }

    const tourKey = String(tour.id);
    const isFavorite = favoriteTourIds.has(tourKey);

    setFavoriteLoadingId(tourKey);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", currentUserId)
          .eq("tour_id", tour.id);

        if (error) {
          throw error;
        }

        setFavoriteTourIds((current) => {
          const updated = new Set(current);
          updated.delete(tourKey);
          return updated;
        });

        setFavoriteMessage(
          "ტური ფავორიტებიდან ამოიღე."
        );
        setFavoriteMessageType("success");
        return;
      }

      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: currentUserId,
          tour_id: tour.id,
        });

      if (error && error.code !== "23505") {
        throw error;
      }

      setFavoriteTourIds((current) => {
        const updated = new Set(current);
        updated.add(tourKey);
        return updated;
      });

      setFavoriteMessage(
        error?.code === "23505"
          ? "ეს ტური უკვე ფავორიტებშია."
          : "ტური ფავორიტებში დაემატა."
      );
      setFavoriteMessageType("success");
    } catch (error: unknown) {
      console.error("Favorite action error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა.";

      setFavoriteMessage(
        `მოქმედება ვერ შესრულდა: ${message}`
      );
      setFavoriteMessageType("error");
    } finally {
      setFavoriteLoadingId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />

          <h1 className="text-2xl font-black">
            ტურები იტვირთება
          </h1>

          <p className="mt-2 text-white/60">
            გთხოვთ, მოიცადოთ...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
              Georgia Gateway Hub
            </p>

            <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
              🏔️ ყველა ტური
            </h1>

            <p className="mt-3 max-w-2xl text-white/60">
              მოძებნე საქართველოს საუკეთესო ტურები
              მდებარეობის, კატეგორიის, ფასისა და ადამიანების
              რაოდენობის მიხედვით.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {currentUserId && (
              <Link
                href="/dashboard/favorites"
                className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-5 py-3 font-bold transition hover:bg-rose-600"
              >
                ❤️ ფავორიტები
              </Link>
            )}

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
            >
              მთავარი
            </Link>
          </div>
        </header>

        {favoriteMessage && (
          <div
            className={`mb-7 rounded-2xl border p-4 font-semibold ${
              favoriteMessageType === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-400/30 bg-red-500/10 text-red-200"
            }`}
          >
            {favoriteMessage}
          </div>
        )}

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="ძიება">
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="ტური, ადგილი, აღწერა..."
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500"
              />
            </FilterField>

            <FilterField label="კატეგორია">
              <select
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-cyan-500"
              >
                <option value="all">
                  ყველა კატეგორია
                </option>

                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="ადამიანების რაოდენობა">
              <input
                type="number"
                min={1}
                value={people}
                onChange={(event) =>
                  setPeople(event.target.value)
                }
                placeholder="მაგალითად: 4"
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500"
              />
            </FilterField>

            <FilterField label="დალაგება">
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as SortOption
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-cyan-500"
              >
                <option value="newest">ჯერ ახალი</option>
                <option value="price-low">
                  ფასი: დაბლიდან მაღლა
                </option>
                <option value="price-high">
                  ფასი: მაღლიდან დაბლა
                </option>
                <option value="title">
                  სახელის მიხედვით
                </option>
              </select>
            </FilterField>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
            <FilterField label="მინიმალური ფასი">
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(event) =>
                  setMinPrice(event.target.value)
                }
                placeholder="მაგალითად: 50"
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500"
              />
            </FilterField>

            <FilterField label="მაქსიმალური ფასი">
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(event.target.value)
                }
                placeholder="მაგალითად: 500"
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500"
              />
            </FilterField>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 xl:w-auto"
              >
                ფილტრების გასუფთავება
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <p className="text-sm text-white/60">
              ნაპოვნია{" "}
              <span className="font-black text-cyan-300">
                {filteredTours.length}
              </span>{" "}
              ტური
            </p>

            {currentUserId && (
              <p className="text-sm text-white/50">
                ფავორიტებშია:{" "}
                <span className="font-bold text-rose-300">
                  {favoriteTourIds.size}
                </span>
              </p>
            )}
          </div>
        </section>

        {errorMessage && (
          <ErrorState
            message={errorMessage}
            onRetry={loadTours}
          />
        )}

        {!errorMessage && tours.length === 0 && (
          <EmptyState
            title="დამტკიცებული ტურები ჯერ არ არის"
            description="ახალი ტურები აქ გამოჩნდება ადმინისტრატორის მიერ დამტკიცების შემდეგ."
            showClearButton={false}
            onClear={clearFilters}
          />
        )}

        {!errorMessage &&
          tours.length > 0 &&
          filteredTours.length === 0 && (
            <EmptyState
              title="შესაბამისი ტური ვერ მოიძებნა"
              description="შეცვალე საძიებო სიტყვა ან გაასუფთავე ფილტრები."
              showClearButton
              onClear={clearFilters}
            />
          )}

        {!errorMessage && filteredTours.length > 0 && (
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTours.map((tour) => {
              const tourKey = String(tour.id);
              const isFavorite =
                favoriteTourIds.has(tourKey);
              const isFavoriteLoading =
                favoriteLoadingId === tourKey;

              return (
                <article
                  key={tour.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/15"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Link
                      href={`/book-tour/${tour.id}#tour-description`}
                      aria-label="ტურის დეტალების ნახვა"
                      className="absolute inset-0 z-10 block"
                    >
                      {tour.image_url ? (
                        <img
                          src={tour.image_url}
                          alt={tour.title || "ტური"}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-950 to-slate-900">
                          <span className="text-7xl">
                            🏔️
                          </span>
                        </div>
                      )}
                    </Link>

                    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent" />

                    <button
                      type="button"
                      onClick={() => toggleFavorite(tour)}
                      disabled={isFavoriteLoading}
                      aria-label={
                        isFavorite
                          ? "ფავორიტებიდან ამოღება"
                          : "ფავორიტებში დამატება"
                      }
                      className={`absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full text-xl shadow-xl transition hover:scale-110 disabled:opacity-60 ${
                        isFavorite
                          ? "bg-rose-500 text-white"
                          : "bg-white text-rose-500"
                      }`}
                    >
                      {isFavoriteLoading
                        ? "⏳"
                        : isFavorite
                          ? "❤️"
                          : "♡"}
                    </button>

                    <div className="pointer-events-none absolute left-4 top-4 z-20 flex max-w-[calc(100%-80px)] flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                        ხელმისაწვდომია
                      </span>

                      {tour.category && (
                        <span className="rounded-full border border-white/20 bg-slate-950/70 px-3 py-1 text-xs font-bold">
                          {tour.category}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <Link
                        href={`/book-tour/${tour.id}#tour-description`}
                        className="inline-block"
                      >
                        <h2 className="text-2xl font-extrabold transition hover:text-cyan-300">
                          {tour.title || "უსახელო ტური"}
                        </h2>
                      </Link>

                      <p className="mt-2 text-sm text-white/80">
                        📍{" "}
                        {tour.location ||
                          "მდებარეობა არ არის მითითებული"}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <TourInfoBox
                        icon="⏱️"
                        value={
                          tour.duration ||
                          "არ არის მითითებული"
                        }
                      />

                      <TourInfoBox
                        icon="👥"
                        value={
                          tour.max_people
                            ? `${tour.max_people} ადამიანი`
                            : "არ არის მითითებული"
                        }
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-lg">
                        👤
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                          ტურის ავტორი
                        </p>

                        <p className="truncate font-bold text-white">
                          {tour.user_id
                            ? authorNames[tour.user_id] ||
                              "ტურის ორგანიზატორი"
                            : "ტურის ორგანიზატორი"}
                        </p>
                      </div>
                    </div>

                    {tour.description && (
                      <p className="mt-4 line-clamp-3 leading-7 text-white/60">
                        {tour.description}
                      </p>
                    )}

                    <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                          ფასი
                        </p>

                        <p className="mt-1 text-2xl font-extrabold text-cyan-300">
                          {tour.price !== null
                            ? `${Number(
                                tour.price
                              ).toLocaleString(
                                "ka-GE"
                              )} ₾`
                            : "შეთანხმებით"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link
                          href={`/book-tour/${tour.id}#tour-description`}
                          className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
                        >
                          👁️ სრული აღწერა
                        </Link>

                        <Link
                          href={`/book-tour/${tour.id}#booking`}
                          className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
                        >
                          📅 დაჯავშნა
                        </Link>
                      </div>
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

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/70">
        {label}
      </span>

      {children}
    </label>
  );
}

function TourInfoBox({
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

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center text-red-100">
      <div className="mb-4 text-6xl">⚠️</div>

      <h2 className="text-2xl font-black">
        ტურები ვერ ჩაიტვირთა
      </h2>

      <p className="mx-auto mt-3 max-w-2xl text-red-200/80">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-2xl bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-600"
      >
        ხელახლა ცდა
      </button>
    </div>
  );
}

function EmptyState({
  title,
  description,
  showClearButton,
  onClear,
}: {
  title: string;
  description: string;
  showClearButton: boolean;
  onClear: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-10 text-center shadow-2xl">
      <div className="mb-4 text-7xl">🏔️</div>

      <h2 className="text-2xl font-bold">{title}</h2>

      <p className="mt-3 text-white/60">
        {description}
      </p>

      {showClearButton && (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 rounded-2xl bg-cyan-500 px-6 py-3 font-bold transition hover:bg-cyan-600"
        >
          ფილტრების გასუფთავება
        </button>
      )}
    </div>
  );
}