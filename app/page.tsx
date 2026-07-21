"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  created_at: string | null;
};

const categories = [
  "ყველა",
  "Hiking",
  "Jeep Tour",
  "Horse Riding",
  "Cultural",
  "Adventure",
];

export default function Home() {
  const router = useRouter();

  const [showBeta, setShowBeta] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [tours, setTours] = useState<Tour[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [toursError, setToursError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ყველა");
  const [selectedLocation, setSelectedLocation] = useState("ყველა");

  useEffect(() => {
    async function loadApprovedTours() {
      setLoadingTours(true);
      setToursError("");

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
        setToursError(`ტურების ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
        setLoadingTours(false);
        return;
      }

      setTours((data as Tour[]) ?? []);
      setLoadingTours(false);
    }

    loadApprovedTours();
  }, []);

  async function goToAddTour() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    router.push("/dashboard/add-tour");
  }

  const locations = useMemo(() => {
    const uniqueLocations = Array.from(
      new Set(
        tours
          .map((tour) => tour.location?.trim())
          .filter((location): location is string => Boolean(location))
      )
    );

    return ["ყველა", ...uniqueLocations];
  }, [tours]);

  const filteredTours = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return tours.filter((tour) => {
      const matchesSearch =
        !searchValue ||
        String(tour.title || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(tour.description || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(tour.location || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(tour.category || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        selectedCategory === "ყველა" ||
        String(tour.category || "").toLowerCase() ===
          selectedCategory.toLowerCase();

      const matchesLocation =
        selectedLocation === "ყველა" ||
        String(tour.location || "").toLowerCase() ===
          selectedLocation.toLowerCase();

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [tours, search, selectedCategory, selectedLocation]);

  const popularTours = tours.slice(0, 3);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {showBeta && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-slate-900/90 p-7 text-center shadow-2xl sm:p-9">
            <div className="mb-4 text-5xl">🚀</div>

            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Welcome to Public Beta
            </h2>

            <p className="mt-4 leading-7 text-white/70">
              Georgia Travel Hub ყოველდღიურად ვითარდება. დაათვალიერე ტურები,
              ტრანსფერები, სასტუმროები და დაგეგმე მოგზაურობა საქართველოში.
            </p>

            <button
              type="button"
              onClick={() => setShowBeta(false)}
              className="mt-7 w-full rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-white transition hover:bg-cyan-600 sm:w-auto"
            >
              საიტის დათვალიერება
            </button>
          </div>
        </div>
      )}

      <section
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,6,23,.62), rgba(2,6,23,.88)), url('/hero.jpg')",
        }}
      >
        <header className="relative z-50 border-b border-white/10 bg-slate-950/30 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-2xl shadow-lg">
                🏔️
              </div>

              <div>
                <h1 className="text-lg font-extrabold sm:text-xl">
                  Georgia Travel Hub
                </h1>

                <p className="text-xs text-white/60">
                  Discover Georgia
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 lg:flex">
              <a
                href="#tours"
                className="font-semibold text-white/80 transition hover:text-cyan-300"
              >
                ტურები
              </a>

              <a
                href="#services"
                className="font-semibold text-white/80 transition hover:text-cyan-300"
              >
                სერვისები
              </a>

              <Link
                href="/tours"
                className="font-semibold text-white/80 transition hover:text-cyan-300"
              >
                ყველა ტური
              </Link>

              <button
                type="button"
                onClick={goToAddTour}
                className="font-semibold text-white/80 transition hover:text-cyan-300"
              >
                ტურის დამატება
              </button>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/login"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 font-semibold transition hover:bg-white/20"
              >
                შესვლა
              </Link>

              <Link
                href="/signup"
                className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold transition hover:bg-emerald-600"
              >
                რეგისტრაცია
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl lg:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={closeMobileMenu}
              className="fixed inset-0 z-[9998] bg-black/70 lg:hidden"
            />

            <aside className="fixed bottom-0 right-0 top-0 z-[9999] w-[300px] max-w-[85vw] border-l border-white/10 bg-slate-950 p-5 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between">
                <p className="font-extrabold">Georgia Travel Hub</p>

                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl"
                >
                  ✕
                </button>
              </div>

              <nav className="mt-8 space-y-3">
                <a
                  href="#tours"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold"
                >
                  🏔️ ტურები
                </a>

                <a
                  href="#services"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold"
                >
                  🧭 სერვისები
                </a>

                <Link
                  href="/tours"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold"
                >
                  📋 ყველა ტური
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    goToAddTour();
                  }}
                  className="block w-full rounded-2xl bg-white/5 px-4 py-3 text-left font-semibold"
                >
                  ➕ ტურის დამატება
                </button>

                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl border border-white/10 px-4 py-3 text-center font-semibold"
                >
                  შესვლა
                </Link>

                <Link
                  href="/signup"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl bg-emerald-500 px-4 py-3 text-center font-semibold"
                >
                  რეგისტრაცია
                </Link>
              </nav>
            </aside>
          </>
        )}

        <div className="mx-auto flex min-h-[calc(100vh-89px)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full max-w-5xl">
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-xl">
              ტურები • სასტუმროები • ტრანსფერები • გიდები
            </div>

            <h2 className="mt-6 max-w-4xl text-4xl font-black leading-tight drop-shadow-xl sm:text-6xl lg:text-7xl">
              აღმოაჩინე საქართველო ერთ სივრცეში
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">
              მოძებნე ტური, შეადარე ფასები, ნახე მარშრუტები და დაჯავშნე
              სასურველი გამოცდილება რეგისტრაციის გარეშე.
            </p>

            <div className="mt-9 rounded-3xl border border-white/15 bg-slate-950/50 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto]">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                    🔎
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="მოძებნე ტური, ადგილი ან კატეგორია..."
                    className="w-full rounded-2xl border border-white/15 bg-white px-12 py-4 font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500"
                  />
                </div>

                <select
                  value={selectedLocation}
                  onChange={(event) =>
                    setSelectedLocation(event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/15 bg-white px-4 py-4 font-semibold text-slate-900 outline-none focus:border-cyan-500"
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location === "ყველა"
                        ? "ყველა მდებარეობა"
                        : location}
                    </option>
                  ))}
                </select>

                <a
                  href="#tours"
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-7 py-4 font-extrabold text-white shadow-lg transition hover:bg-cyan-600"
                >
                  ძებნა
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/tours"
                className="rounded-2xl bg-cyan-500 px-7 py-3.5 font-bold shadow-xl transition hover:bg-cyan-600"
              >
                ყველა ტურის ნახვა
              </Link>

              <button
                type="button"
                onClick={goToAddTour}
                className="rounded-2xl bg-emerald-500 px-7 py-3.5 font-bold shadow-xl transition hover:bg-emerald-600"
              >
                ➕ დაამატე შენი ტური
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900 px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            value={String(tours.length)}
            label="ხელმისაწვდომი ტური"
            icon="🏔️"
          />

          <StatCard
            value={String(locations.length - 1)}
            label="მდებარეობა"
            icon="📍"
          />

          <StatCard value="24/7" label="ონლაინ დაჯავშნა" icon="📱" />

          <StatCard value="100%" label="ადგილობრივი გამოცდილება" icon="🇬🇪" />
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
              კატეგორიები
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              რა ტიპის მოგზაურობა გსურს?
            </h2>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {categories.map((category) => {
              const active = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-5 py-3 text-sm font-bold transition ${
                    active
                      ? "bg-cyan-500 text-white"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="tours"
        className="scroll-mt-24 bg-slate-950 px-4 pb-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                ტურები
              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                იპოვე სასურველი ტური
              </h2>

              <p className="mt-3 text-white/55">
                ნაპოვნია {filteredTours.length} ტური
              </p>
            </div>

            {(search ||
              selectedCategory !== "ყველა" ||
              selectedLocation !== "ყველა") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("ყველა");
                  setSelectedLocation("ყველა");
                }}
                className="w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                ფილტრების გასუფთავება
              </button>
            )}
          </div>

          {loadingTours && (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <div className="text-5xl">⏳</div>
              <p className="mt-4 text-lg font-semibold">
                ტურები იტვირთება...
              </p>
            </div>
          )}

          {toursError && !loadingTours && (
            <div className="mt-10 rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-200">
              {toursError}
            </div>
          )}

          {!loadingTours &&
            !toursError &&
            filteredTours.length === 0 && (
              <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
                <div className="text-6xl">🔍</div>

                <h3 className="mt-4 text-2xl font-bold">
                  ტური ვერ მოიძებნა
                </h3>

                <p className="mt-2 text-white/50">
                  შეცვალე საძიებო სიტყვა ან ფილტრები.
                </p>
              </div>
            )}

          {!loadingTours &&
            !toursError &&
            filteredTours.length > 0 && (
              <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
                {filteredTours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            )}

          {!loadingTours && !toursError && tours.length > 6 && (
            <div className="mt-10 text-center">
              <Link
                href="/tours"
                className="inline-flex rounded-2xl border border-white/15 bg-white/10 px-7 py-4 font-bold transition hover:bg-white/20"
              >
                ყველა ტურის სრულ გვერდზე ნახვა
              </Link>
            </div>
          )}
        </div>
      </section>

      {popularTours.length > 0 && (
        <section className="bg-slate-900 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
                რეკომენდებული
              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                პოპულარული ტურები
              </h2>
            </div>

            <div className="mt-10 grid gap-7 lg:grid-cols-3">
              {popularTours.map((tour, index) => (
                <article
                  key={tour.id}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl"
                >
                  <div className="absolute left-4 top-4 z-10 rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-slate-950">
                    #{index + 1} პოპულარული
                  </div>

                  {tour.image_url ? (
                    <img
                      src={tour.image_url}
                      alt={tour.title || "Tour"}
                      className="h-72 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-72 items-center justify-center bg-white/5 text-8xl">
                      🏔️
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-2xl font-extrabold">
                      {tour.title || "უსახელო ტური"}
                    </h3>

                    <p className="mt-3 text-white/60">
                      📍 {tour.location || "საქართველო"}
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <p className="text-2xl font-black text-cyan-300">
                        {tour.price !== null
                          ? `${Number(tour.price).toLocaleString()} ₾`
                          : "შეთანხმებით"}
                      </p>

                      <Link
                        href={`/book-tour/${tour.id}`}
                        className="rounded-xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
                      >
                        დაჯავშნა
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        id="services"
        className="scroll-mt-24 bg-slate-950 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
              ყველაფერი ერთ სივრცეში
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              დაგეგმე სრული მოგზაურობა
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/55">
              აირჩიე ტური, ტრანსფერი, სასტუმრო ან ადგილობრივი გიდი.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <ServiceCard
              icon="🏔️"
              title="ტურები"
              description="ლაშქრობა, ჯიპ-ტურები, ცხენით გასეირნება და კულტურული მარშრუტები."
              href="/tours"
              buttonText="ტურების ნახვა"
            />

            <ServiceCard
              icon="🚐"
              title="ტრანსფერები"
              description="აეროპორტის, მესტიის, უშგულისა და კერძო ტრანსფერები."
              href="/transfers"
              buttonText="ტრანსფერების ნახვა"
            />

            <ServiceCard
              icon="🏨"
              title="სასტუმროები"
              description="სასტუმროები, საოჯახო სახლები და უნიკალური განთავსების ობიექტები."
              href="/hotels"
              buttonText="სასტუმროების ნახვა"
            />

            <ServiceCard
              icon="🧑‍💼"
              title="ადგილობრივი გიდები"
              description="იპოვე გამოცდილი გიდი სხვადასხვა ენასა და რეგიონში."
              href="/guides"
              buttonText="გიდების ნახვა"
            />
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-cyan-600 to-emerald-600 px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 text-center lg:flex-row lg:text-left">
          <div>
            <h2 className="text-3xl font-black sm:text-4xl">
              გაქვს საკუთარი ტური?
            </h2>

            <p className="mt-3 max-w-2xl text-white/80">
              დარეგისტრირდი, დაამატე ტური და მიიღე ონლაინ ჯავშნები ტურისტებისგან.
            </p>
          </div>

          <button
            type="button"
            onClick={goToAddTour}
            className="w-full rounded-2xl bg-white px-8 py-4 font-black text-slate-950 shadow-xl transition hover:bg-slate-100 sm:w-auto"
          >
            ➕ ტურის დამატება
          </button>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-xl font-extrabold">
              🏔️ Georgia Travel Hub
            </h3>

            <p className="mt-3 max-w-sm leading-7 text-white/50">
              ტურების, ტრანსფერების, სასტუმროებისა და ადგილობრივი
              გამოცდილებების პლატფორმა.
            </p>
          </div>

          <div>
            <h3 className="font-bold">სწრაფი ბმულები</h3>

            <div className="mt-4 space-y-3 text-white/55">
              <Link
                href="/tours"
                className="block transition hover:text-white"
              >
                ყველა ტური
              </Link>

              <Link
                href="/login"
                className="block transition hover:text-white"
              >
                შესვლა
              </Link>

              <Link
                href="/signup"
                className="block transition hover:text-white"
              >
                რეგისტრაცია
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold">ტურის მფლობელებისთვის</h3>

            <div className="mt-4 space-y-3 text-white/55">
              <button
                type="button"
                onClick={goToAddTour}
                className="block transition hover:text-white"
              >
                ტურის დამატება
              </button>

              <Link
                href="/dashboard"
                className="block transition hover:text-white"
              >
                მომხმარებლის პანელი
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-center text-sm text-white/40">
          <p>© 2026 Georgia Travel Hub</p>
          <p className="mt-1">Made with ❤️ in Georgia</p>
        </div>
      </footer>
    </main>
  );
}

function TourCard({ tour }: { tour: Tour }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/10">
      <div className="relative">
        {tour.image_url ? (
          <img
            src={tour.image_url}
            alt={tour.title || "Tour"}
            className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-64 items-center justify-center bg-white/5 text-8xl">
            🏔️
          </div>
        )}

        {tour.category && (
          <span className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-4 py-2 text-xs font-bold backdrop-blur-xl">
            {tour.category}
          </span>
        )}

        <button
          type="button"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/80 text-xl backdrop-blur-xl transition hover:bg-red-500"
          title="ფავორიტებში დამატება"
        >
          ♡
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-2xl font-extrabold">
            {tour.title || "უსახელო ტური"}
          </h3>

          <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
            ხელმისაწვდომია
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <TourInfo
            icon="📍"
            value={tour.location || "საქართველო"}
          />

          <TourInfo
            icon="⏱️"
            value={tour.duration || "არ არის მითითებული"}
          />

          <TourInfo
            icon="👥"
            value={
              tour.max_people
                ? `მაქს. ${tour.max_people}`
                : "რაოდენობა უცნობია"
            }
          />

          <TourInfo
            icon="⭐"
            value="ახალი შეთავაზება"
          />
        </div>

        {tour.description && (
          <p className="mt-5 line-clamp-3 leading-7 text-white/55">
            {tour.description}
          </p>
        )}

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/35">
              ფასი ერთ ადამიანზე
            </p>

            <p className="mt-1 text-2xl font-black text-cyan-300">
              {tour.price !== null
                ? `${Number(tour.price).toLocaleString()} ₾`
                : "შეთანხმებით"}
            </p>
          </div>

          <Link
            href={`/book-tour/${tour.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-white transition hover:bg-cyan-600"
          >
            დაჯავშნა
          </Link>
        </div>
      </div>
    </article>
  );
}

function TourInfo({
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

function ServiceCard({
  icon,
  title,
  description,
  href,
  buttonText,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  buttonText: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-7 shadow-xl transition hover:-translate-y-1 hover:bg-white/10">
      <div className="text-5xl">{icon}</div>

      <h3 className="mt-5 text-2xl font-extrabold">{title}</h3>

      <p className="mt-3 flex-1 leading-7 text-white/55">
        {description}
      </p>

      <Link
        href={href}
        className="mt-7 inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
      >
        {buttonText}
      </Link>
    </article>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center sm:p-6">
      <div className="text-3xl">{icon}</div>

      <p className="mt-3 text-2xl font-black text-cyan-300 sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 text-xs text-white/50 sm:text-sm">
        {label}
      </p>
    </div>
  );
}