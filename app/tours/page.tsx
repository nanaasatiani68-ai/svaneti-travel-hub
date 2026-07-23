"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Tour = {
  id: string | number;
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

type SortOption =
  | "newest"
  | "price-low"
  | "price-high"
  | "title";

export default function PublicToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [people, setPeople] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    async function loadTours() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("tours")
        .select(
          `
            id,
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
        console.error("Tours loading error:", error);

        setErrorMessage(
          `ტურების ჩატვირთვა ვერ მოხერხდა: ${error.message}`
        );

        setTours([]);
        setLoading(false);
        return;
      }

      setTours((data as Tour[] | null) ?? []);
      setLoading(false);
    }

    loadTours();
  }, []);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();

    tours.forEach((tour) => {
      const category = tour.category?.trim();

      if (category) {
        categorySet.add(category);
      }
    });

    return Array.from(categorySet).sort((a, b) =>
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
      const title = String(tour.title || "").toLowerCase();
      const location = String(
        tour.location || ""
      ).toLowerCase();
      const description = String(
        tour.description || ""
      ).toLowerCase();
      const category = String(
        tour.category || ""
      ).toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        location.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        category.includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === "all" ||
        tour.category === selectedCategory;

      const numericPrice =
        tour.price === null ? null : Number(tour.price);

      const matchesMinPrice =
        minimumPrice === null ||
        numericPrice === null ||
        numericPrice >= minimumPrice;

      const matchesMaxPrice =
        maximumPrice === null ||
        numericPrice === null ||
        numericPrice <= maximumPrice;

      const matchesPeople =
        requestedPeople === null ||
        !tour.max_people ||
        tour.max_people >= requestedPeople;

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
          a.price === null ? Number.POSITIVE_INFINITY : Number(a.price);
        const priceB =
          b.price === null ? Number.POSITIVE_INFINITY : Number(b.price);

        return priceA - priceB;
      }

      if (sortBy === "price-high") {
        const priceA =
          a.price === null ? Number.NEGATIVE_INFINITY : Number(a.price);
        const priceB =
          b.price === null ? Number.NEGATIVE_INFINITY : Number(b.price);

        return priceB - priceA;
      }

      if (sortBy === "title") {
        return String(a.title || "").localeCompare(
          String(b.title || "")
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mb-4 text-6xl">🏔️</div>

          <p className="text-xl font-semibold">
            ტურები იტვირთება...
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
              Georgia Travel Hub
            </p>

            <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
              🏔️ ყველა ტური
            </h1>

            <p className="mt-3 max-w-2xl text-white/60">
              მოძებნე ტური მდებარეობის, კატეგორიის, ფასისა და
              ადამიანების რაოდენობის მიხედვით.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
            >
              ← Dashboard
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 font-bold transition hover:bg-cyan-600"
            >
              მთავარი გვერდი
            </Link>
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="ძიება">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
                <option value="all">ყველა კატეგორია</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
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
                  setSortBy(event.target.value as SortOption)
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
                <option value="title">სახელის მიხედვით</option>
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

            {hasActiveFilters && (
              <span className="rounded-full bg-cyan-500/15 px-4 py-2 text-xs font-bold text-cyan-200">
                ფილტრები აქტიურია
              </span>
            )}
          </div>
        </section>

        {errorMessage && (
          <div className="mb-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">
            {errorMessage}
          </div>
        )}

        {!errorMessage && tours.length === 0 && (
          <EmptyState
            title="დამტკიცებული ტურები ჯერ არ არის"
            description="Supabase-ში ტურის სტატუსი უნდა იყოს approved."
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
          <section className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {filteredTours.map((tour) => (
              <article
                key={tour.id}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
                <div className="relative h-64 overflow-hidden">
                  {tour.image_url ? (
                    <img
                      src={tour.image_url}
                      alt={tour.title || "Tour"}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-950 to-slate-900">
                      <span className="text-8xl">🏔️</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                      ხელმისაწვდომია
                    </span>

                    {tour.category && (
                      <span className="rounded-full border border-white/20 bg-slate-950/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                        {tour.category}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-extrabold text-white drop-shadow-lg">
                      {tour.title || "უსახელო ტური"}
                    </h2>

                    <p className="mt-2 text-sm text-white/80">
                      📍{" "}
                      {tour.location ||
                        "მდებარეობა არ არის მითითებული"}
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <TourInfoBox
                      icon="⏱️"
                      value={
                        tour.duration ||
                        "ხანგრძლივობა უცნობია"
                      }
                    />

                    <TourInfoBox
                      icon="👥"
                      value={
                        tour.max_people
                          ? `${tour.max_people} ადამიანი`
                          : "რაოდენობა უცნობია"
                      }
                    />
                  </div>

                  {tour.description && (
                    <p className="mt-5 line-clamp-3 leading-7 text-white/60">
                      {tour.description}
                    </p>
                  )}

                  <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                        ფასი ერთ ადამიანზე
                      </p>

                      <p className="mt-1 text-2xl font-extrabold text-cyan-300">
                        {tour.price !== null
                          ? `${Number(
                              tour.price
                            ).toLocaleString()} ₾`
                          : "შეთანხმებით"}
                      </p>
                    </div>

                    <Link
                      href={`/book-tour/${tour.id}`}
                      className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 font-bold transition hover:bg-cyan-600"
                    >
                      ნახვა და დაჯავშნა
                    </Link>
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

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
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

      <p className="mt-3 text-white/60">{description}</p>

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