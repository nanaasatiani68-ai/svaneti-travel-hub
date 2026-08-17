"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Guide = {
  id: string;
  full_name: string;
  location: string | null;
  languages: string | null;
  experience_years: number | null;
  price_per_day: number | null;
  price_type: "fixed" | "negotiable" | null;
  price_currency: "GEL" | "USD" | null;
  phone: string | null;
  has_whatsapp: boolean | null;
  has_viber: boolean | null;
  description: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
};

export default function GuidesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [guides, setGuides] =
    useState<Guide[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [search, setSearch] =
    useState("");
  const [locationFilter, setLocationFilter] =
    useState("all");
  const [languageFilter, setLanguageFilter] =
    useState("all");

  useEffect(() => {
    async function loadGuides() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } =
        await supabase
          .from("guides")
          .select(
            `
              id,
              full_name,
              location,
              languages,
              experience_years,
              price_per_day,
              price_type,
              price_currency,
              phone,
              has_whatsapp,
              has_viber,
              description,
              image_url,
              status,
              created_at
            `
          )
          .eq("status", "approved")
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Guides loading error:",
          error
        );
        setErrorMessage(
          `გიდების ჩატვირთვა ვერ მოხერხდა: ${error.message}`
        );
        setLoading(false);
        return;
      }

      setGuides(
        (data as Guide[] | null) ?? []
      );
      setLoading(false);
    }

    void loadGuides();
  }, [supabase]);

  const locations = useMemo(() => {
    return Array.from(
      new Set(
        guides
          .map((guide) =>
            String(
              guide.location || ""
            ).trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b, "ka")
    );
  }, [guides]);

  const languages = useMemo(() => {
    const values = new Set<string>();

    guides.forEach((guide) => {
      String(guide.languages || "")
        .split(/[,;/|]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) =>
          values.add(item)
        );
    });

    return Array.from(values).sort(
      (a, b) =>
        a.localeCompare(b, "ka")
    );
  }, [guides]);

  const filteredGuides = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    return guides.filter((guide) => {
      const fullName = String(
        guide.full_name || ""
      ).toLowerCase();

      const location = String(
        guide.location || ""
      ).toLowerCase();

      const guideLanguages = String(
        guide.languages || ""
      ).toLowerCase();

      const description = String(
        guide.description || ""
      ).toLowerCase();

      const matchesSearch =
        !value ||
        fullName.includes(value) ||
        location.includes(value) ||
        guideLanguages.includes(value) ||
        description.includes(value);

      const matchesLocation =
        locationFilter === "all" ||
        String(
          guide.location || ""
        ).trim() === locationFilter;

      const matchesLanguage =
        languageFilter === "all" ||
        guideLanguages.includes(
          languageFilter.toLowerCase()
        );

      return (
        matchesSearch &&
        matchesLocation &&
        matchesLanguage
      );
    });
  }, [
    guides,
    search,
    locationFilter,
    languageFilter,
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-2xl">
              🧑‍💼
            </div>

            <div>
              <h1 className="font-extrabold">
                Georgia Gateway Hub
              </h1>
              <p className="text-xs text-white/50">
                ადგილობრივი გიდები
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/add-guide"
              className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-bold transition hover:bg-violet-600"
            >
              ➕ გიდის დამატება
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              ← მთავარი
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-400">
            Local Guides
          </p>

          <h2 className="mt-3 text-4xl font-black sm:text-5xl">
            ადგილობრივი გიდები
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-white/60">
            მოძებნე გამოცდილი გიდი
            მდებარეობის, ენის ან
            გამოცდილების მიხედვით.
          </p>

          <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl md:grid-cols-3">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="მოძებნე გიდი, ადგილი ან ენა..."
              className="w-full rounded-2xl border border-white/10 bg-white px-5 py-4 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-500"
            />

            <select
              value={locationFilter}
              onChange={(event) =>
                setLocationFilter(
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-white/10 bg-white px-5 py-4 font-medium text-slate-900 outline-none focus:border-violet-500"
            >
              <option value="all">
                ყველა მდებარეობა
              </option>

              {locations.map(
                (location) => (
                  <option
                    key={location}
                    value={location}
                  >
                    {location}
                  </option>
                )
              )}
            </select>

            <select
              value={languageFilter}
              onChange={(event) =>
                setLanguageFilter(
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-white/10 bg-white px-5 py-4 font-medium text-slate-900 outline-none focus:border-violet-500"
            >
              <option value="all">
                ყველა ენა
              </option>

              {languages.map(
                (language) => (
                  <option
                    key={language}
                    value={language}
                  >
                    {language}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {!loading &&
            !errorMessage && (
              <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                <p className="text-white/55">
                  ნაპოვნია{" "}
                  <strong className="text-white">
                    {filteredGuides.length}
                  </strong>{" "}
                  გიდი
                </p>

                {(search ||
                  locationFilter !== "all" ||
                  languageFilter !==
                    "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setLocationFilter(
                        "all"
                      );
                      setLanguageFilter(
                        "all"
                      );
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold transition hover:bg-white/10"
                  >
                    ფილტრების გასუფთავება
                  </button>
                )}
              </div>
            )}

          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
              <div className="text-5xl">
                ⏳
              </div>
              <p className="mt-4 text-lg font-semibold">
                გიდები იტვირთება...
              </p>
            </div>
          )}

          {!loading &&
            errorMessage && (
              <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-200">
                {errorMessage}
              </div>
            )}

          {!loading &&
            !errorMessage &&
            filteredGuides.length ===
              0 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
                <div className="text-6xl">
                  🧑‍💼
                </div>

                <h3 className="mt-4 text-2xl font-bold">
                  გიდი ვერ მოიძებნა
                </h3>

                <p className="mt-2 text-white/50">
                  შეცვალე ძებნა ან
                  ფილტრები.
                </p>
              </div>
            )}

          {!loading &&
            !errorMessage &&
            filteredGuides.length >
              0 && (
              <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
                {filteredGuides.map(
                  (guide) => {
                    const phone =
                      guide.phone?.trim() ||
                      "";

                    const phoneDigits =
                      phone.replace(
                        /\D/g,
                        ""
                      );

                    return (
                      <article
                        key={guide.id}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl transition hover:-translate-y-1 hover:bg-white/10"
                      >
                        {guide.image_url ? (
                          <img
                            src={
                              guide.image_url
                            }
                            alt={
                              guide.full_name
                            }
                            className="h-72 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-72 items-center justify-center bg-gradient-to-br from-violet-900/50 to-slate-900 text-8xl">
                            🧑‍💼
                          </div>
                        )}

                        <div className="p-6">
                          <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                            ხელმისაწვდომია
                          </span>

                          <h3 className="mt-4 text-2xl font-extrabold">
                            {
                              guide.full_name
                            }
                          </h3>

                          <p className="mt-3 text-white/60">
                            📍{" "}
                            {guide.location ||
                              "საქართველო"}
                          </p>

                          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                            <InfoBox
                              icon="🌍"
                              value={
                                guide.languages ||
                                "ენა არ არის მითითებული"
                              }
                            />

                            <InfoBox
                              icon="⭐"
                              value={
                                guide.experience_years !==
                                  null
                                  ? `${guide.experience_years} წელი`
                                  : "გამოცდილება უცნობია"
                              }
                            />
                          </div>

                          {guide.description && (
                            <p className="mt-5 line-clamp-3 leading-7 text-white/55">
                              {
                                guide.description
                              }
                            </p>
                          )}

                          <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/35">
                              ფასი ერთ დღეზე
                            </p>

                            <p className="mt-1 text-2xl font-black text-violet-300">
                              {formatGuidePrice(
                                guide
                              )}
                            </p>
                          </div>

                          {phone && (
                            <div className="mt-5 grid gap-2 sm:grid-cols-3">
                              <a
                                href={`tel:${phone}`}
                                className="rounded-xl bg-slate-700 px-3 py-3 text-center text-sm font-black transition hover:bg-slate-600"
                              >
                                📞 ზარი
                              </a>

                              {guide.has_whatsapp &&
                                phoneDigits && (
                                  <a
                                    href={`https://wa.me/${phoneDigits}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl bg-emerald-600 px-3 py-3 text-center text-sm font-black transition hover:bg-emerald-700"
                                  >
                                    WhatsApp
                                  </a>
                                )}

                              {guide.has_viber &&
                                phoneDigits && (
                                  <a
                                    href={`viber://chat?number=%2B${phoneDigits}`}
                                    className="rounded-xl bg-violet-600 px-3 py-3 text-center text-sm font-black transition hover:bg-violet-700"
                                  >
                                    Viber
                                  </a>
                                )}
                            </div>
                          )}

                          <Link
                            href={`/guides/${guide.id}`}
                            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-violet-500 px-6 py-3 font-bold transition hover:bg-violet-600"
                          >
                            ⭐ დეტალები და
                            შეფასებები
                          </Link>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </div>
      </section>
    </main>
  );
}

function formatGuidePrice(
  guide: Guide
) {
  if (
    guide.price_type ===
      "negotiable" ||
    guide.price_per_day === null ||
    guide.price_per_day === undefined
  ) {
    return "ფასი შეთანხმებით";
  }

  const amount =
    Number(
      guide.price_per_day
    ).toLocaleString("ka-GE", {
      maximumFractionDigits: 2,
    });

  return guide.price_currency ===
    "USD"
    ? `$${amount}`
    : `${amount} ₾`;
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
      <span className="mr-2">
        {icon}
      </span>
      <span>{value}</span>
    </div>
  );
}