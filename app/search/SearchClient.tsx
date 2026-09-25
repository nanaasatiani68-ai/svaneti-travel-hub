"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/app/providers/LanguageProvider";

type Tour = {
  id: string | number;
  title: string | null;
  location: string | null;
  price: number | null;
  price_type: string | null;
  price_currency: string | null;
  image_url: string | null;
  duration: string | null;
  category: string | null;
  max_people?: number | null;
};

type Transfer = {
  id: string | number;
  title?: string | null;
  from_location?: string | null;
  to_location?: string | null;
  from?: string | null;
  to?: string | null;
  price?: number | null;
  price_type?: string | null;
  image_url?: string | null;
  car_type?: string | null;
  seats?: number | null;
  passengers?: number | null;
};

type Hotel = {
  id: string | number;
  name?: string | null;
  title?: string | null;
  location?: string | null;
  city?: string | null;
  price?: number | null;
  price_per_night?: number | null;
  image_url?: string | null;
};

type Guide = {
  id: string | number;
  full_name?: string | null;
  location?: string | null;
  languages?: string | null;
  image_url?: string | null;
  price?: number | null;
  price_per_day?: number | null;
  experience_years?: number | null;
};

type ResultCardProps = {
  href: string;
  imageUrl?: string | null;
  fallback: string;
  title: string;
  subtitle: string;
  meta?: string;
  price?: string;
  buttonLabel: string;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const { language, languageReady } = useLanguage();

  const destination = searchParams.get("destination")?.trim() || "";
  const date = searchParams.get("date") || "";
  const guests = searchParams.get("guests") || "2";

  const [tours, setTours] = useState<Tour[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const text =
    language === "ka"
      ? {
          back: "მთავარ გვერდზე დაბრუნება",
          title: "ძიების შედეგები",
          destination: "მიმართულება",
          date: "თარიღი",
          guests: "სტუმრები",
          allGeorgia: "მთელი საქართველო",
          anyDate: "ნებისმიერი თარიღი",
          tours: "ტურები",
          transfers: "ტრანსფერები",
          hotels: "სასტუმროები",
          guides: "გიდები",
          results: "შედეგი",
          loading: "მიმდინარეობს ძიება...",
          noResults: "შედეგები ვერ მოიძებნა",
          noResultsText:
            "სცადე სხვა მიმართულება ან დაბრუნდი მთავარ გვერდზე და შეცვალე ძიების პირობები.",
          details: "დეტალები",
          view: "ნახვა",
          priceOnRequest: "ფასი შეთანხმებით",
          perNight: "ღამეში",
          perDay: "დღეში",
          route: "მარშრუტი",
          searchError: "ძიებისას დაფიქსირდა შეცდომა.",
          people: "ადამიანი",
          years: "წელი გამოცდილება",
        }
      : {
          back: "Back to Home",
          title: "Search Results",
          destination: "Destination",
          date: "Date",
          guests: "Guests",
          allGeorgia: "All Georgia",
          anyDate: "Any date",
          tours: "Tours",
          transfers: "Transfers",
          hotels: "Hotels",
          guides: "Guides",
          results: "results",
          loading: "Searching...",
          noResults: "No results found",
          noResultsText:
            "Try another destination or return to the homepage and change your search.",
          details: "View Details",
          view: "View",
          priceOnRequest: "Price on request",
          perNight: "per night",
          perDay: "per day",
          route: "Route",
          searchError: "Something went wrong while searching.",
          people: "people",
          years: "years experience",
        };

  useEffect(() => {
    async function runSearch() {
      setLoading(true);
      setError("");

      const [
        toursResult,
        transfersResult,
        hotelsResult,
        guidesResult,
      ] = await Promise.all([
        supabase
          .from("tours")
          .select(
            "id,title,location,price,price_type,price_currency,image_url,duration,category,max_people"
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false }),

        supabase
          .from("transfers")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false }),

        supabase
          .from("hotels")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false }),

        supabase
          .from("guides")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
      ]);

      const errors = [
        toursResult.error,
        transfersResult.error,
        hotelsResult.error,
        guidesResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error("Search errors:", errors);
        setError(text.searchError);
      }

      setTours((toursResult.data as Tour[] | null) ?? []);
      setTransfers((transfersResult.data as Transfer[] | null) ?? []);
      setHotels((hotelsResult.data as Hotel[] | null) ?? []);
      setGuides((guidesResult.data as Guide[] | null) ?? []);

      setLoading(false);
    }

    void runSearch();
  }, [supabase]);

  const normalizedDestination = destination.toLocaleLowerCase();

  function matchesDestination(values: Array<string | null | undefined>) {
    if (!normalizedDestination) return true;

    return values.some((value) =>
      String(value || "")
        .toLocaleLowerCase()
        .includes(normalizedDestination)
    );
  }

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const destinationMatch = matchesDestination([
        tour.title,
        tour.location,
        tour.category,
      ]);

      const guestMatch =
        !tour.max_people ||
        Number(tour.max_people) >= Number(guests || 1);

      return destinationMatch && guestMatch;
    });
  }, [tours, normalizedDestination, guests]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const destinationMatch = matchesDestination([
        transfer.title,
        transfer.from_location,
        transfer.to_location,
        transfer.from,
        transfer.to,
      ]);

      const capacity =
        transfer.seats ?? transfer.passengers ?? null;

      const guestMatch =
        !capacity || Number(capacity) >= Number(guests || 1);

      return destinationMatch && guestMatch;
    });
  }, [transfers, normalizedDestination, guests]);

  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) =>
      matchesDestination([
        hotel.name,
        hotel.title,
        hotel.location,
        hotel.city,
      ])
    );
  }, [hotels, normalizedDestination]);

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) =>
      matchesDestination([
        guide.full_name,
        guide.location,
        guide.languages,
      ])
    );
  }, [guides, normalizedDestination]);

  const totalResults =
    filteredTours.length +
    filteredTransfers.length +
    filteredHotels.length +
    filteredGuides.length;

  if (!languageReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="text-5xl">🏔️</div>
          <p className="mt-4 font-bold">Georgia Gateway Hub</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-xl">
              🏔️
            </div>

            <div>
              <p className="font-black">Georgia Gateway Hub</p>
              <p className="text-xs text-white/50">
                {language === "ka"
                  ? "აღმოაჩინე საქართველო"
                  : "Discover Georgia"}
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold transition hover:bg-white/10"
          >
            ← {text.back}
          </Link>
        </div>
      </header>

      <section className="border-b border-white/10 bg-gradient-to-b from-cyan-950/40 to-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
            🔍 Georgia Gateway Hub
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            {text.title}
          </h1>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <SearchInfo
              icon="📍"
              label={text.destination}
              value={destination || text.allGeorgia}
            />

            <SearchInfo
              icon="📅"
              label={text.date}
              value={date || text.anyDate}
            />

            <SearchInfo
              icon="👥"
              label={text.guests}
              value={guests}
            />
          </div>

          {!loading && (
            <p className="mt-6 font-bold text-white/60">
              {totalResults} {text.results}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5 text-amber-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <div className="text-5xl">🔎</div>
            <p className="mt-5 text-lg font-bold text-white/60">
              {text.loading}
            </p>
          </div>
        ) : totalResults === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
            <div className="text-6xl">🗺️</div>

            <h2 className="mt-5 text-2xl font-black">
              {text.noResults}
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-white/55">
              {text.noResultsText}
            </p>

            <Link
              href="/"
              className="mt-7 inline-block rounded-2xl bg-cyan-500 px-6 py-3 font-black transition hover:bg-cyan-600"
            >
              {text.back}
            </Link>
          </div>
        ) : (
          <div className="space-y-14">
            {filteredTours.length > 0 && (
              <ResultSection
                icon="🏔️"
                title={text.tours}
                count={filteredTours.length}
              >
                {filteredTours.map((tour) => (
                  <ResultCard
                    key={String(tour.id)}
                    href={`/book-tour/${tour.id}#tour-description`}
                    imageUrl={tour.image_url}
                    fallback="🏔️"
                    title={tour.title || text.tours}
                    subtitle={tour.location || "Georgia"}
                    meta={[
                      tour.duration,
                      tour.max_people
                        ? `${tour.max_people} ${text.people}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                    price={formatTourPrice(
                      tour.price,
                      tour.price_type,
                      tour.price_currency,
                      language,
                      text.priceOnRequest
                    )}
                    buttonLabel={text.details}
                  />
                ))}
              </ResultSection>
            )}

            {filteredTransfers.length > 0 && (
              <ResultSection
                icon="🚙"
                title={text.transfers}
                count={filteredTransfers.length}
              >
                {filteredTransfers.map((transfer) => {
                  const from =
                    transfer.from_location ||
                    transfer.from ||
                    "";

                  const to =
                    transfer.to_location ||
                    transfer.to ||
                    "";

                  const route =
                    from || to
                      ? `${from || "—"} → ${to || "—"}`
                      : transfer.title || text.transfers;

                  return (
                    <ResultCard
                      key={String(transfer.id)}
                      href={`/transfers`}
                      imageUrl={transfer.image_url}
                      fallback="🚙"
                      title={transfer.title || route}
                      subtitle={route}
                      meta={[
                        transfer.car_type,
                        transfer.seats
                          ? `${transfer.seats} ${text.people}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                      price={formatSimplePrice(
                        transfer.price,
                        language,
                        text.priceOnRequest
                      )}
                      buttonLabel={text.view}
                    />
                  );
                })}
              </ResultSection>
            )}

            {filteredHotels.length > 0 && (
              <ResultSection
                icon="🏨"
                title={text.hotels}
                count={filteredHotels.length}
              >
                {filteredHotels.map((hotel) => {
                  const hotelPrice =
                    hotel.price_per_night ??
                    hotel.price ??
                    null;

                  return (
                    <ResultCard
                      key={String(hotel.id)}
                      href="/hotels"
                      imageUrl={hotel.image_url}
                      fallback="🏨"
                      title={
                        hotel.name ||
                        hotel.title ||
                        text.hotels
                      }
                      subtitle={
                        hotel.location ||
                        hotel.city ||
                        "Georgia"
                      }
                      meta={
                        hotelPrice !== null
                          ? text.perNight
                          : ""
                      }
                      price={formatSimplePrice(
                        hotelPrice,
                        language,
                        text.priceOnRequest
                      )}
                      buttonLabel={text.view}
                    />
                  );
                })}
              </ResultSection>
            )}

            {filteredGuides.length > 0 && (
              <ResultSection
                icon="🧑‍💼"
                title={text.guides}
                count={filteredGuides.length}
              >
                {filteredGuides.map((guide) => {
                  const guidePrice =
                    guide.price_per_day ??
                    guide.price ??
                    null;

                  return (
                    <ResultCard
                      key={String(guide.id)}
                      href="/guides"
                      imageUrl={guide.image_url}
                      fallback="🧑‍💼"
                      title={
                        guide.full_name ||
                        text.guides
                      }
                      subtitle={
                        guide.location || "Georgia"
                      }
                      meta={[
                        guide.languages,
                        guide.experience_years
                          ? `${guide.experience_years} ${text.years}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                      price={
                        guidePrice !== null
                          ? `${formatSimplePrice(
                              guidePrice,
                              language,
                              text.priceOnRequest
                            )} / ${text.perDay}`
                          : text.priceOnRequest
                      }
                      buttonLabel={text.view}
                    />
                  );
                })}
              </ResultSection>
            )}
          </div>
        )}
      </div>

      <footer className="mt-12 border-t border-white/10 bg-black px-4 py-8 text-center text-sm text-white/40">
        © 2026 Georgia Gateway Hub
      </footer>
    </main>
  );
}

function SearchInfo({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-white/45">
        {icon} {label}
      </p>

      <p className="mt-2 truncate font-black text-white">
        {value}
      </p>
    </div>
  );
}

function ResultSection({
  icon,
  title,
  count,
  children,
}: {
  icon: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
            {icon} Georgia Gateway Hub
          </p>

          <h2 className="mt-2 text-2xl font-black sm:text-3xl">
            {title}
          </h2>
        </div>

        <span className="rounded-full bg-white/5 px-4 py-2 text-sm font-black text-white/60">
          {count}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

function ResultCard({
  href,
  imageUrl,
  fallback,
  title,
  subtitle,
  meta,
  price,
  buttonLabel,
}: ResultCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/10">
      <Link href={href} className="block h-full">
        <div className="relative h-36 overflow-hidden bg-white/5 sm:h-44">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">
              {fallback}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 font-black">
            {title}
          </h3>

          <p className="mt-2 line-clamp-1 text-sm text-white/60">
            {subtitle}
          </p>

          {meta && (
            <p className="mt-1 line-clamp-1 text-xs text-white/40">
              {meta}
            </p>
          )}

          {price && (
            <p className="mt-4 font-black text-cyan-300">
              {price}
            </p>
          )}

          <div className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-black transition group-hover:bg-cyan-500">
            {buttonLabel}
          </div>
        </div>
      </Link>
    </article>
  );
}

function formatTourPrice(
  value: number | null | undefined,
  priceType: string | null | undefined,
  currency: string | null | undefined,
  language: "ka" | "en",
  fallback: string
) {
  if (
    priceType === "negotiable" ||
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return fallback;
  }

  const amount = Number(value).toLocaleString(
    language === "ka" ? "ka-GE" : "en-US",
    {
      maximumFractionDigits: 2,
    }
  );

  return currency === "USD"
    ? `$${amount}`
    : `${amount} ₾`;
}

function formatSimplePrice(
  value: number | null | undefined,
  language: "ka" | "en",
  fallback: string
) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return fallback;
  }

  return `${Number(value).toLocaleString(
    language === "ka" ? "ka-GE" : "en-US",
    {
      maximumFractionDigits: 2,
    }
  )} ₾`;
}
