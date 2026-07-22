"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import WeatherCard from "./components/WeatherCard";

type Language = "ka" | "en";

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

const translations = {
  ka: {
    betaTitle: "კეთილი იყოს თქვენი მობრძანება Public Beta-ზე",
    betaText:
      "Georgia Travel Hub ყოველდღიურად ვითარდება. დაათვალიერე ტურები, ტრანსფერები, სასტუმროები და დაგეგმე მოგზაურობა საქართველოში.",
    exploreNow: "საიტის დათვალიერება",

    discoverGeorgia: "აღმოაჩინე საქართველო",
    tours: "ტურები",
    services: "სერვისები",
    allTours: "ყველა ტური",
    addTour: "ტურის დამატება",
    login: "შესვლა",
    signup: "რეგისტრაცია",

    menu: "მენიუ",
    closeMenu: "მენიუს დახურვა",

    heroBadge: "ტურები • სასტუმროები • ტრანსფერები • გიდები",
    heroTitle: "აღმოაჩინე საქართველო ერთ სივრცეში",
    heroText:
      "მოძებნე ტური, შეადარე ფასები, ნახე მარშრუტები და დაჯავშნე სასურველი გამოცდილება რეგისტრაციის გარეშე.",

    searchPlaceholder: "მოძებნე ტური, ადგილი ან კატეგორია...",
    allLocations: "ყველა მდებარეობა",
    search: "ძებნა",
    viewAllTours: "ყველა ტურის ნახვა",
    addYourTour: "დაამატე შენი ტური",

    availableTours: "ხელმისაწვდომი ტური",
    locations: "მდებარეობა",
    onlineBooking: "ონლაინ დაჯავშნა",
    localExperience: "ადგილობრივი გამოცდილება",

    categoriesLabel: "კატეგორიები",
    categoriesTitle: "რა ტიპის მოგზაურობა გსურს?",

    allCategory: "ყველა",
    hiking: "ლაშქრობა",
    jeepTour: "ჯიპ-ტური",
    horseRiding: "ცხენით გასეირნება",
    cultural: "კულტურული",
    adventure: "სათავგადასავლო",

    toursLabel: "ტურები",
    toursTitle: "იპოვე სასურველი ტური",
    toursFound: "ნაპოვნია",
    tourWord: "ტური",
    clearFilters: "ფილტრების გასუფთავება",

    loadingTours: "ტურები იტვირთება...",
    noToursTitle: "ტური ვერ მოიძებნა",
    noToursText: "შეცვალე საძიებო სიტყვა ან ფილტრები.",
    loadingError: "ტურების ჩატვირთვა ვერ მოხერხდა",

    available: "ხელმისაწვდომია",
    georgia: "საქართველო",
    notSpecified: "არ არის მითითებული",
    maxPeople: "მაქს.",
    people: "ადამიანი",
    peopleUnknown: "რაოდენობა უცნობია",
    newOffer: "ახალი შეთავაზება",
    pricePerPerson: "ფასი ერთ ადამიანზე",
    negotiable: "შეთანხმებით",
    book: "დაჯავშნა",
    addFavorite: "ფავორიტებში დამატება",

    recommended: "რეკომენდებული",
    popularTours: "პოპულარული ტურები",
    popular: "პოპულარული",

    everythingInOnePlace: "ყველაფერი ერთ სივრცეში",
    planFullTrip: "დაგეგმე სრული მოგზაურობა",
    planFullTripText:
      "აირჩიე ტური, ტრანსფერი, სასტუმრო ან ადგილობრივი გიდი.",

    transfers: "ტრანსფერები",
    hotels: "სასტუმროები",
    guides: "ადგილობრივი გიდები",

    toursDescription:
      "ლაშქრობა, ჯიპ-ტურები, ცხენით გასეირნება და კულტურული მარშრუტები.",
    transfersDescription:
      "აეროპორტის, მესტიის, უშგულისა და კერძო ტრანსფერები.",
    hotelsDescription:
      "სასტუმროები, საოჯახო სახლები და უნიკალური განთავსების ობიექტები.",
    guidesDescription:
      "იპოვე გამოცდილი გიდი სხვადასხვა ენასა და რეგიონში.",

    viewTours: "ტურების ნახვა",
    viewTransfers: "ტრანსფერების ნახვა",
    viewHotels: "სასტუმროების ნახვა",
    viewGuides: "გიდების ნახვა",

    ownTourTitle: "გაქვს საკუთარი ტური?",
    ownTourText:
      "დარეგისტრირდი, დაამატე ტური და მიიღე ონლაინ ჯავშნები ტურისტებისგან.",

    footerDescription:
      "ტურების, ტრანსფერების, სასტუმროებისა და ადგილობრივი გამოცდილებების პლატფორმა.",
    quickLinks: "სწრაფი ბმულები",
    forTourOwners: "ტურის მფლობელებისთვის",
    userDashboard: "მომხმარებლის პანელი",
    madeInGeorgia: "დამზადებულია საქართველოში ❤️",
  },

  en: {
    betaTitle: "Welcome to Public Beta",
    betaText:
      "Georgia Travel Hub is growing every day. Explore tours, transfers and hotels, and plan your journey across Georgia.",
    exploreNow: "Explore Now",

    discoverGeorgia: "Discover Georgia",
    tours: "Tours",
    services: "Services",
    allTours: "All Tours",
    addTour: "Add Tour",
    login: "Login",
    signup: "Create Account",

    menu: "Menu",
    closeMenu: "Close menu",

    heroBadge: "Tours • Hotels • Transfers • Guides",
    heroTitle: "Discover Georgia in One Place",
    heroText:
      "Find tours, compare prices, explore routes and book your preferred experience without registration.",

    searchPlaceholder: "Search by tour, location or category...",
    allLocations: "All locations",
    search: "Search",
    viewAllTours: "View All Tours",
    addYourTour: "Add Your Tour",

    availableTours: "Available tours",
    locations: "Locations",
    onlineBooking: "Online booking",
    localExperience: "Local experience",

    categoriesLabel: "Categories",
    categoriesTitle: "What kind of journey are you looking for?",

    allCategory: "All",
    hiking: "Hiking",
    jeepTour: "Jeep Tour",
    horseRiding: "Horse Riding",
    cultural: "Cultural",
    adventure: "Adventure",

    toursLabel: "Tours",
    toursTitle: "Find Your Perfect Tour",
    toursFound: "Found",
    tourWord: "tours",
    clearFilters: "Clear Filters",

    loadingTours: "Loading tours...",
    noToursTitle: "No tours found",
    noToursText: "Try changing the search term or filters.",
    loadingError: "Tours could not be loaded",

    available: "Available",
    georgia: "Georgia",
    notSpecified: "Not specified",
    maxPeople: "Max.",
    people: "people",
    peopleUnknown: "Capacity unknown",
    newOffer: "New offer",
    pricePerPerson: "Price per person",
    negotiable: "Contact for price",
    book: "Book Now",
    addFavorite: "Add to favorites",

    recommended: "Recommended",
    popularTours: "Popular Tours",
    popular: "Popular",

    everythingInOnePlace: "Everything in One Place",
    planFullTrip: "Plan Your Complete Journey",
    planFullTripText:
      "Choose a tour, transfer, hotel or experienced local guide.",

    transfers: "Transfers",
    hotels: "Hotels",
    guides: "Local Guides",

    toursDescription:
      "Hiking, jeep tours, horse riding and cultural routes.",
    transfersDescription:
      "Airport, Mestia, Ushguli and private transfers.",
    hotelsDescription:
      "Hotels, guesthouses and unique accommodation across Georgia.",
    guidesDescription:
      "Find an experienced guide by language and destination.",

    viewTours: "View Tours",
    viewTransfers: "View Transfers",
    viewHotels: "View Hotels",
    viewGuides: "View Guides",

    ownTourTitle: "Do You Offer Tours?",
    ownTourText:
      "Create an account, add your tour and receive online bookings from travelers.",

    footerDescription:
      "A platform for tours, transfers, hotels and local experiences across Georgia.",
    quickLinks: "Quick Links",
    forTourOwners: "For Tour Owners",
    userDashboard: "User Dashboard",
    madeInGeorgia: "Made with ❤️ in Georgia",
  },
};

const categoryOptions = [
  {
    value: "all",
    ka: "ყველა",
    en: "All",
  },
  {
    value: "hiking",
    ka: "ლაშქრობა",
    en: "Hiking",
  },
  {
    value: "jeep tour",
    ka: "ჯიპ-ტური",
    en: "Jeep Tour",
  },
  {
    value: "horse riding",
    ka: "ცხენით გასეირნება",
    en: "Horse Riding",
  },
  {
    value: "cultural",
    ka: "კულტურული",
    en: "Cultural",
  },
  {
    value: "adventure",
    ka: "სათავგადასავლო",
    en: "Adventure",
  },
];

export default function Home() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("ka");
  const [languageLoaded, setLanguageLoaded] = useState(false);

  const [showBeta, setShowBeta] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [tours, setTours] = useState<Tour[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [toursError, setToursError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const t = translations[language];

  useEffect(() => {
    const savedLanguage = localStorage.getItem("site-language");

    if (savedLanguage === "ka" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }

    const betaClosed = sessionStorage.getItem("beta-closed");

    if (betaClosed === "true") {
      setShowBeta(false);
    }

    setLanguageLoaded(true);
  }, []);

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

        setToursError(`${t.loadingError}: ${error.message}`);
        setLoadingTours(false);
        return;
      }

      setTours((data as Tour[]) ?? []);
      setLoadingTours(false);
    }

    loadApprovedTours();
  }, [t.loadingError]);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    localStorage.setItem("site-language", nextLanguage);
  }

  function closeBetaModal() {
    setShowBeta(false);
    sessionStorage.setItem("beta-closed", "true");
  }

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

    return uniqueLocations;
  }, [tours]);

  const filteredTours = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return tours.filter((tour) => {
      const tourTitle = String(tour.title || "").toLowerCase();
      const tourDescription = String(
        tour.description || ""
      ).toLowerCase();
      const tourLocation = String(tour.location || "").toLowerCase();
      const tourCategory = String(tour.category || "").toLowerCase();

      const matchesSearch =
        !searchValue ||
        tourTitle.includes(searchValue) ||
        tourDescription.includes(searchValue) ||
        tourLocation.includes(searchValue) ||
        tourCategory.includes(searchValue);

      const matchesCategory =
        selectedCategory === "all" ||
        tourCategory.includes(selectedCategory.toLowerCase());

      const matchesLocation =
        selectedLocation === "all" ||
        tourLocation === selectedLocation.toLowerCase();

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [tours, search, selectedCategory, selectedLocation]);

  const popularTours = tours.slice(0, 3);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  if (!languageLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="text-6xl">🏔️</div>
          <p className="mt-4 font-semibold">Georgia Travel Hub</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {showBeta && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-slate-900/95 p-7 text-center shadow-2xl sm:p-9">
            <div className="mb-4 text-5xl">🚀</div>

            <h2 className="text-2xl font-extrabold sm:text-3xl">
              {t.betaTitle}
            </h2>

            <p className="mt-4 leading-7 text-white/70">
              {t.betaText}
            </p>

            <div className="mt-6 flex justify-center">
              <LanguageSwitcher
                language={language}
                changeLanguage={changeLanguage}
              />
            </div>

            <button
              type="button"
              onClick={closeBetaModal}
              className="mt-7 w-full rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-white transition hover:bg-cyan-600 sm:w-auto"
            >
              {t.exploreNow}
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
                  {t.discoverGeorgia}
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 lg:flex">
              <a
                href="#tours"
                className="font-semibold text-white/80 transition hover:text-cyan-300"
              >
                {t.tours}
              </a>

              <a
                href="#services"
                className="font-semibold text-white/80 transition hover:text-cyan-300"
              >
                {t.services}
              </a>

              <Link
                href="/tours"
                className="font-semibold text-white/80 transition hover:text-cyan-300"
              >
                {t.allTours}
              </Link>

              <button
                type="button"
                onClick={goToAddTour}
                className="font-semibold text-white/80 transition hover:text-cyan-300"
              >
                {t.addTour}
              </button>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <LanguageSwitcher
                language={language}
                changeLanguage={changeLanguage}
              />

              <Link
                href="/login"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 font-semibold transition hover:bg-white/20"
              >
                {t.login}
              </Link>

              <Link
                href="/signup"
                className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold transition hover:bg-emerald-600"
              >
                {t.signup}
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl lg:hidden"
              aria-label={t.menu}
            >
              ☰
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label={t.closeMenu}
              onClick={closeMobileMenu}
              className="fixed inset-0 z-[9998] bg-black/70 lg:hidden"
            />

            <aside className="fixed bottom-0 right-0 top-0 z-[9999] w-[300px] max-w-[85vw] overflow-y-auto border-l border-white/10 bg-slate-950 p-5 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between">
                <p className="font-extrabold">
                  Georgia Travel Hub
                </p>

                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl"
                  aria-label={t.closeMenu}
                >
                  ✕
                </button>
              </div>

              <div className="mt-6">
                <LanguageSwitcher
                  language={language}
                  changeLanguage={changeLanguage}
                  fullWidth
                />
              </div>

              <nav className="mt-8 space-y-3">
                <a
                  href="#tours"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold"
                >
                  🏔️ {t.tours}
                </a>

                <a
                  href="#services"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold"
                >
                  🧭 {t.services}
                </a>

                <Link
                  href="/tours"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl bg-white/5 px-4 py-3 font-semibold"
                >
                  📋 {t.allTours}
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    goToAddTour();
                  }}
                  className="block w-full rounded-2xl bg-white/5 px-4 py-3 text-left font-semibold"
                >
                  ➕ {t.addTour}
                </button>

                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl border border-white/10 px-4 py-3 text-center font-semibold"
                >
                  {t.login}
                </Link>

                <Link
                  href="/signup"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl bg-emerald-500 px-4 py-3 text-center font-semibold"
                >
                  {t.signup}
                </Link>
              </nav>
            </aside>
          </>
        )}

        <div className="mx-auto flex min-h-[calc(100vh-89px)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full max-w-5xl">
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-xl">
              {t.heroBadge}
            </div>

            <h2 className="mt-6 max-w-4xl text-4xl font-black leading-tight drop-shadow-xl sm:text-6xl lg:text-7xl">
              {t.heroTitle}
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">
              {t.heroText}
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
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder={t.searchPlaceholder}
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
                  <option value="all">{t.allLocations}</option>

                  {locations.map((location) => (
                    <option
                      key={location}
                      value={location.toLowerCase()}
                    >
                      {location}
                    </option>
                  ))}
                </select>

                <a
                  href="#tours"
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-7 py-4 font-extrabold text-white shadow-lg transition hover:bg-cyan-600"
                >
                  {t.search}
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/tours"
                className="rounded-2xl bg-cyan-500 px-7 py-3.5 font-bold shadow-xl transition hover:bg-cyan-600"
              >
                {t.viewAllTours}
              </Link>

              <button
                type="button"
                onClick={goToAddTour}
                className="rounded-2xl bg-emerald-500 px-7 py-3.5 font-bold shadow-xl transition hover:bg-emerald-600"
              >
                ➕ {t.addYourTour}
              </button>
            </div>

            <div className="mt-8">
              <WeatherCard />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900 px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            value={String(tours.length)}
            label={t.availableTours}
            icon="🏔️"
          />

          <StatCard
            value={String(locations.length)}
            label={t.locations}
            icon="📍"
          />

          <StatCard
            value="24/7"
            label={t.onlineBooking}
            icon="📱"
          />

          <StatCard
            value="100%"
            label={t.localExperience}
            icon="🇬🇪"
          />
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            {t.categoriesLabel}
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            {t.categoriesTitle}
          </h2>

          <div className="mt-8 flex flex-wrap gap-3">
            {categoryOptions.map((category) => {
              const active =
                selectedCategory === category.value;

              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category.value)
                  }
                  className={`rounded-full px-5 py-3 text-sm font-bold transition ${
                    active
                      ? "bg-cyan-500 text-white"
                      : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {category[language]}
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
                {t.toursLabel}
              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                {t.toursTitle}
              </h2>

              <p className="mt-3 text-white/55">
                {t.toursFound} {filteredTours.length} {t.tourWord}
              </p>
            </div>

            {(search ||
              selectedCategory !== "all" ||
              selectedLocation !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setSelectedLocation("all");
                }}
                className="w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {t.clearFilters}
              </button>
            )}
          </div>

          {loadingTours && (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <div className="text-5xl">⏳</div>

              <p className="mt-4 text-lg font-semibold">
                {t.loadingTours}
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
                  {t.noToursTitle}
                </h3>

                <p className="mt-2 text-white/50">
                  {t.noToursText}
                </p>
              </div>
            )}

          {!loadingTours &&
            !toursError &&
            filteredTours.length > 0 && (
              <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
                {filteredTours.map((tour) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    language={language}
                  />
                ))}
              </div>
            )}
        </div>
      </section>

      {popularTours.length > 0 && (
        <section className="bg-slate-900 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              {t.recommended}
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              {t.popularTours}
            </h2>

            <div className="mt-10 grid gap-7 lg:grid-cols-3">
              {popularTours.map((tour, index) => (
                <article
                  key={tour.id}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl"
                >
                  <div className="absolute left-4 top-4 z-10 rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-slate-950">
                    #{index + 1} {t.popular}
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
                      {tour.title || t.tours}
                    </h3>

                    <p className="mt-3 text-white/60">
                      📍 {tour.location || t.georgia}
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <p className="text-2xl font-black text-cyan-300">
                        {tour.price !== null
                          ? `${Number(
                              tour.price
                            ).toLocaleString()} ₾`
                          : t.negotiable}
                      </p>

                      <Link
                        href={`/book-tour/${tour.id}`}
                        className="rounded-xl bg-cyan-500 px-5 py-3 font-bold transition hover:bg-cyan-600"
                      >
                        {t.book}
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
              {t.everythingInOnePlace}
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              {t.planFullTrip}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/55">
              {t.planFullTripText}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <ServiceCard
              icon="🏔️"
              title={t.tours}
              description={t.toursDescription}
              href="/tours"
              buttonText={t.viewTours}
            />

            <ServiceCard
              icon="🚐"
              title={t.transfers}
              description={t.transfersDescription}
              href="/transfers"
              buttonText={t.viewTransfers}
            />

            <ServiceCard
              icon="🏨"
              title={t.hotels}
              description={t.hotelsDescription}
              href="/hotels"
              buttonText={t.viewHotels}
            />

            <ServiceCard
              icon="🧑‍💼"
              title={t.guides}
              description={t.guidesDescription}
              href="/guides"
              buttonText={t.viewGuides}
            />
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-cyan-600 to-emerald-600 px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 text-center lg:flex-row lg:text-left">
          <div>
            <h2 className="text-3xl font-black sm:text-4xl">
              {t.ownTourTitle}
            </h2>

            <p className="mt-3 max-w-2xl text-white/80">
              {t.ownTourText}
            </p>
          </div>

          <button
            type="button"
            onClick={goToAddTour}
            className="w-full rounded-2xl bg-white px-8 py-4 font-black text-slate-950 shadow-xl transition hover:bg-slate-100 sm:w-auto"
          >
            ➕ {t.addTour}
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
              {t.footerDescription}
            </p>
          </div>

          <div>
            <h3 className="font-bold">{t.quickLinks}</h3>

            <div className="mt-4 space-y-3 text-white/55">
              <Link
                href="/tours"
                className="block transition hover:text-white"
              >
                {t.allTours}
              </Link>

              <Link
                href="/login"
                className="block transition hover:text-white"
              >
                {t.login}
              </Link>

              <Link
                href="/signup"
                className="block transition hover:text-white"
              >
                {t.signup}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold">{t.forTourOwners}</h3>

            <div className="mt-4 space-y-3 text-white/55">
              <button
                type="button"
                onClick={goToAddTour}
                className="block transition hover:text-white"
              >
                {t.addTour}
              </button>

              <Link
                href="/dashboard"
                className="block transition hover:text-white"
              >
                {t.userDashboard}
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row">
          <div>
            <p>© 2026 Georgia Travel Hub</p>
            <p className="mt-1">{t.madeInGeorgia}</p>
          </div>

          <LanguageSwitcher
            language={language}
            changeLanguage={changeLanguage}
          />
        </div>
      </footer>
    </main>
  );
}

function TourCard({
  tour,
  language,
}: {
  tour: Tour;
  language: Language;
}) {
  const t = translations[language];

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/10">
      <div className="relative overflow-hidden">
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
          title={t.addFavorite}
        >
          ♡
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-2xl font-extrabold">
            {tour.title || t.tours}
          </h3>

          <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
            {t.available}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <TourInfo
            icon="📍"
            value={tour.location || t.georgia}
          />

          <TourInfo
            icon="⏱️"
            value={tour.duration || t.notSpecified}
          />

          <TourInfo
            icon="👥"
            value={
              tour.max_people
                ? `${t.maxPeople} ${tour.max_people} ${t.people}`
                : t.peopleUnknown
            }
          />

          <TourInfo icon="⭐" value={t.newOffer} />
        </div>

        {tour.description && (
          <p className="mt-5 line-clamp-3 leading-7 text-white/55">
            {tour.description}
          </p>
        )}

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/35">
              {t.pricePerPerson}
            </p>

            <p className="mt-1 text-2xl font-black text-cyan-300">
              {tour.price !== null
                ? `${Number(tour.price).toLocaleString()} ₾`
                : t.negotiable}
            </p>
          </div>

          <Link
            href={`/book-tour/${tour.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-white transition hover:bg-cyan-600"
          >
            {t.book}
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

      <h3 className="mt-5 text-2xl font-extrabold">
        {title}
      </h3>

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

function LanguageSwitcher({
  language,
  changeLanguage,
  fullWidth = false,
}: {
  language: Language;
  changeLanguage: (language: Language) => void;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`flex items-center rounded-xl border border-white/15 bg-white/10 p-1 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => changeLanguage("ka")}
        className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
          fullWidth ? "flex-1" : ""
        } ${
          language === "ka"
            ? "bg-white text-slate-950"
            : "text-white/70 hover:text-white"
        }`}
      >
        🇬🇪 ქართული
      </button>

      <button
        type="button"
        onClick={() => changeLanguage("en")}
        className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
          fullWidth ? "flex-1" : ""
        } ${
          language === "en"
            ? "bg-white text-slate-950"
            : "text-white/70 hover:text-white"
        }`}
      >
        🇬🇧 English
      </button>
    </div>
  );
}