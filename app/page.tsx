import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import WeatherCard from "./components/WeatherCard";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { useLanguage } from "./providers/LanguageProvider";
import type { Language } from "./lib/i18n/translations";


type Tour = {
  id: string | number;
  title: string | null;
  location: string | null;
  price: number | null;
  price_type?: "fixed" | "negotiable" | null;
  price_currency?: "GEL" | "USD" | null;
  image_url: string | null;
  duration?: string | null;
  category?: string | null;
  created_at?: string | null;
};

type Transfer = {
  id: string | number;
  from_location: string | null;
  to_location: string | null;
  price: number | null;
  price_type?: "fixed" | "negotiable" | "from" | null;
  price_currency?: "GEL" | "USD" | null;
  vehicle: string | null;
  image_url: string | null;
  created_at?: string | null;
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
  created_at?: string | null;
};

type Guide = {
  id: string | number;
  full_name: string | null;
  location: string | null;
  languages: string | null;
  experience_years: number | null;
  price?: number | null;
  price_per_day?: number | null;
  price_type?: "fixed" | "negotiable" | null;
  price_currency?: "GEL" | "USD" | null;
  image_url: string | null;
  created_at?: string | null;
};

type SectionKey = "tours" | "transfers" | "hotels" | "guides";

const translations = {
  ka: {
    betaTitle: "კეთილი იყოს თქვენი მობრძანება Public Beta-ზე",
    betaText:
      "Georgia Gateway Hub ყოველდღიურად ვითარდება. დაათვალიერე ტურები, ტრანსფერები, სასტუმროები და გიდები ერთ სივრცეში.",
    exploreNow: "საიტის დათვალიერება",
    discoverGeorgia: "აღმოაჩინე საქართველო",
    menu: "მენიუ",
    closeMenu: "მენიუს დახურვა",
    login: "შესვლა",
    signup: "რეგისტრაცია",
    heroBadge: "ტურები • ტრანსფერები • სასტუმროები • გიდები",
    heroTitle: "აღმოაჩინე საქართველო ერთ სივრცეში",
    heroText:
      "აირჩიე ტური, დაგეგმე ტრანსფერი, იპოვე სასტუმრო და გამოცდილი ადგილობრივი გიდი.",
    browseServices: "სერვისების ნახვა",
    addService: "სერვისის დამატება",
    tours: "ტურები",
    transfers: "ტრანსფერები",
    hotels: "სასტუმროები",
    guides: "გიდები",
    viewAll: "ყველას ნახვა",
    page: "გვერდი",
    of: "დან",
    previous: "წინა",
    next: "შემდეგი",
    loading: "იტვირთება...",
    noItems: "ჩანაწერები ჯერ არ არის",
    loadError: "ჩატვირთვა ვერ მოხერხდა",
    details: "დეტალები",
    book: "დაჯავშნა",
    negotiable: "ფასი შეთანხმებით",
    perDay: "დღეში",
    perNight: "ღამეში",
    notSpecified: "არ არის მითითებული",
    georgia: "საქართველო",
    quickLinks: "სწრაფი ბმულები",
    userDashboard: "მომხმარებლის პანელი",
    footerDescription:
      "ტურების, ტრანსფერების, სასტუმროებისა და ადგილობრივი გიდების პლატფორმა საქართველოში.",
    madeInGeorgia: "დამზადებულია საქართველოში ❤️",
    addTour: "ტურის დამატება",
    addTransfer: "ტრანსფერის დამატება",
    addHotel: "სასტუმროს დამატება",
    addGuide: "გიდის დამატება",
  },
  en: {
    betaTitle: "Welcome to Public Beta",
    betaText:
      "Georgia Gateway Hub is growing every day. Explore tours, transfers, hotels and guides in one place.",
    exploreNow: "Explore Now",
    discoverGeorgia: "Discover Georgia",
    menu: "Menu",
    closeMenu: "Close menu",
    login: "Login",
    signup: "Create Account",
    heroBadge: "Tours • Transfers • Hotels • Guides",
    heroTitle: "Discover Georgia in One Place",
    heroText:
      "Choose a tour, plan a transfer, find a hotel and connect with an experienced local guide.",
    browseServices: "Browse Services",
    addService: "Add Service",
    tours: "Tours",
    transfers: "Transfers",
    hotels: "Hotels",
    guides: "Guides",
    viewAll: "View All",
    page: "Page",
    of: "of",
    previous: "Previous",
    next: "Next",
    loading: "Loading...",
    noItems: "No listings yet",
    loadError: "Could not load listings",
    details: "Details",
    book: "Book",
    negotiable: "Contact for price",
    perDay: "per day",
    perNight: "per night",
    notSpecified: "Not specified",
    georgia: "Georgia",
    quickLinks: "Quick Links",
    userDashboard: "User Dashboard",
    footerDescription:
      "A platform for tours, transfers, hotels and local guides across Georgia.",
    madeInGeorgia: "Made with ❤️ in Georgia",
    addTour: "Add Tour",
    addTransfer: "Add Transfer",
    addHotel: "Add Hotel",
    addGuide: "Add Guide",
  },
};

export default function Home() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const pageSize = useResponsivePageSize();
  const { language, languageReady } = useLanguage();
  const [showBeta, setShowBeta] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [tours, setTours] = useState<Tour[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pages, setPages] = useState<Record<SectionKey, number>>({
    tours: 0,
    transfers: 0,
    hotels: 0,
    guides: 0,
  });

  const t = translations[language];

  useEffect(() => {
    if (sessionStorage.getItem("beta-closed") === "true") {
      setShowBeta(false);
    }
  }, []);

  useEffect(() => {
    async function loadHomepageData() {
      setLoading(true);
      setLoadError("");

      const [toursResult, transfersResult, hotelsResult, guidesResult] =
        await Promise.all([
          supabase
            .from("tours")
            .select(
              "id,title,location,price,price_type,price_currency,image_url,duration,category,created_at"
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
        console.error("Homepage data loading errors:", errors);
        setLoadError(t.loadError);
      }

      setTours((toursResult.data as Tour[] | null) ?? []);
      setTransfers((transfersResult.data as Transfer[] | null) ?? []);
      setHotels((hotelsResult.data as Hotel[] | null) ?? []);
      setGuides((guidesResult.data as Guide[] | null) ?? []);
      setLoading(false);
    }

    void loadHomepageData();
  }, [supabase, t.loadError]);

  useEffect(() => {
    setPages({ tours: 0, transfers: 0, hotels: 0, guides: 0 });
  }, [pageSize]);


  function closeBetaModal() {
    setShowBeta(false);
    sessionStorage.setItem("beta-closed", "true");
  }

  async function goToAddService(path: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(path)}`);
      return;
    }

    router.push(path);
  }

  function setSectionPage(section: SectionKey, page: number) {
    setPages((current) => ({ ...current, [section]: page }));
  }

  if (!languageReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="text-6xl">🏔️</div>
          <p className="mt-4 font-semibold">Georgia Gateway Hub</p>
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
            <h2 className="text-2xl font-extrabold sm:text-3xl">{t.betaTitle}</h2>
            <p className="mt-4 leading-7 text-white/70">{t.betaText}</p>
            <div className="mt-6 flex justify-center">
              <LanguageSwitcher />
            </div>
            <button
              type="button"
              onClick={closeBetaModal}
              className="mt-7 rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-white transition hover:bg-cyan-600"
            >
              {t.exploreNow}
            </button>
          </div>
        </div>
      )}

      <section
        className="relative min-h-[620px] bg-cover bg-center bg-no-repeat sm:min-h-[660px]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,6,23,.58), rgba(2,6,23,.9)), url('/hero.jpg')",
        }}
      >
        <header className="relative z-50 border-b border-white/10 bg-slate-950/30 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-2xl shadow-lg">
                🏔️
              </div>
              <div>
                <h1 className="text-lg font-extrabold sm:text-xl">Georgia Gateway Hub</h1>
                <p className="text-xs text-white/60">{t.discoverGeorgia}</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              <a href="#tours" className="font-semibold text-white/75 hover:text-cyan-300">{t.tours}</a>
              <a href="#transfers" className="font-semibold text-white/75 hover:text-cyan-300">{t.transfers}</a>
              <a href="#hotels" className="font-semibold text-white/75 hover:text-cyan-300">{t.hotels}</a>
              <a href="#guides" className="font-semibold text-white/75 hover:text-cyan-300">{t.guides}</a>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <LanguageSwitcher />
              <Link href="/login" className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 font-semibold hover:bg-white/20">{t.login}</Link>
              <Link href="/signup" className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold hover:bg-emerald-600">{t.signup}</Link>
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
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[9998] bg-black/70 lg:hidden"
            />
            <aside className="fixed bottom-0 right-0 top-0 z-[9999] w-[300px] max-w-[85vw] border-l border-white/10 bg-slate-950 p-5 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between">
                <p className="font-extrabold">Georgia Gateway Hub</p>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="mt-8 space-y-3">
                {[
                  ["#tours", t.tours],
                  ["#transfers", t.transfers],
                  ["#hotels", t.hotels],
                  ["#guides", t.guides],
                ].map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl bg-white/5 px-4 py-3 font-semibold"
                  >
                    {label}
                  </a>
                ))}
              </div>

              <div className="mt-7">
                <LanguageSwitcher />
              </div>

              <div className="mt-7 grid gap-3">
                <Link href="/login" className="rounded-xl border border-white/15 px-4 py-3 text-center font-bold">{t.login}</Link>
                <Link href="/signup" className="rounded-xl bg-emerald-500 px-4 py-3 text-center font-bold">{t.signup}</Link>
              </div>
            </aside>
          </>
        )}

        <div className="mx-auto flex max-w-7xl flex-col justify-center px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pt-28">
          <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200">
            {t.heroBadge}
          </span>
          <h2 className="mt-6 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-7xl">
            {t.heroTitle}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">
            {t.heroText}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#tours" className="rounded-2xl bg-cyan-500 px-7 py-4 text-center font-black hover:bg-cyan-600">
              {t.browseServices}
            </a>
            <button
              type="button"
              onClick={() => void goToAddService("/dashboard/add-tour")}
              className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-black hover:bg-white/20"
            >
              + {t.addService}
            </button>
          </div>

          <div className="mt-8">
            <WeatherCard />
          </div>
        </div>
      </section>

      {loadError && (
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
            {loadError}
          </div>
        </div>
      )}

      <ShowcaseSection
        id="tours"
        icon="🏔️"
        title={t.tours}
        items={tours}
        page={pages.tours}
        pageSize={pageSize}
        loading={loading}
        viewAllHref="/tours"
        viewAllLabel={t.viewAll}
        pageLabel={t.page}
        ofLabel={t.of}
        previousLabel={t.previous}
        nextLabel={t.next}
        emptyLabel={t.noItems}
        onPageChange={(page) => setSectionPage("tours", page)}
        renderItem={(tour) => (
          <SmallCard
            href={`/book-tour/${tour.id}#tour-description`}
            imageUrl={tour.image_url}
            fallback="🏔️"
            title={tour.title || t.tours}
            subtitle={tour.location || t.georgia}
            meta={tour.duration || tour.category || t.notSpecified}
            price={formatPrice(tour.price, tour.price_type, tour.price_currency, language, t.negotiable)}
            actionLabel={t.details}
          />
        )}
      />

      <ShowcaseSection
        id="transfers"
        icon="🚐"
        title={t.transfers}
        items={transfers}
        page={pages.transfers}
        pageSize={pageSize}
        loading={loading}
        viewAllHref="/transfers"
        viewAllLabel={t.viewAll}
        pageLabel={t.page}
        ofLabel={t.of}
        previousLabel={t.previous}
        nextLabel={t.next}
        emptyLabel={t.noItems}
        onPageChange={(page) => setSectionPage("transfers", page)}
        renderItem={(transfer) => (
          <SmallCard
            href={`/book-transfer/${transfer.id}`}
            imageUrl={transfer.image_url}
            fallback="🚐"
            title={`${transfer.from_location || "—"} → ${transfer.to_location || "—"}`}
            subtitle={transfer.vehicle || t.transfers}
            meta={transfer.to_location || t.georgia}
            price={formatTransferPrice(transfer, language)}
            actionLabel={t.details}
          />
        )}
      />

      <ShowcaseSection
        id="hotels"
        icon="🏨"
        title={t.hotels}
        items={hotels}
        page={pages.hotels}
        pageSize={pageSize}
        loading={loading}
        viewAllHref="/hotels"
        viewAllLabel={t.viewAll}
        pageLabel={t.page}
        ofLabel={t.of}
        previousLabel={t.previous}
        nextLabel={t.next}
        emptyLabel={t.noItems}
        onPageChange={(page) => setSectionPage("hotels", page)}
        renderItem={(hotel) => {
          const hotelPrice = hotel.price_per_night ?? hotel.price ?? null;
          return (
            <SmallCard
              href="/hotels"
              imageUrl={hotel.image_url || null}
              fallback="🏨"
              title={hotel.name || hotel.title || t.hotels}
              subtitle={hotel.location || hotel.city || t.georgia}
              meta={hotelPrice !== null ? t.perNight : t.notSpecified}
              price={formatSimplePrice(hotelPrice, language, t.negotiable)}
              actionLabel={t.details}
            />
          );
        }}
      />

      <ShowcaseSection
        id="guides"
        icon="🧑‍💼"
        title={t.guides}
        items={guides}
        page={pages.guides}
        pageSize={pageSize}
        loading={loading}
        viewAllHref="/guides"
        viewAllLabel={t.viewAll}
        pageLabel={t.page}
        ofLabel={t.of}
        previousLabel={t.previous}
        nextLabel={t.next}
        emptyLabel={t.noItems}
        onPageChange={(page) => setSectionPage("guides", page)}
        renderItem={(guide) => {
          const guidePrice = guide.price_per_day ?? guide.price ?? null;
          return (
            <SmallCard
              href="/guides"
              imageUrl={guide.image_url}
              fallback="🧑‍💼"
              title={guide.full_name || t.guides}
              subtitle={guide.location || t.georgia}
              meta={guide.languages || (guide.experience_years ? `${guide.experience_years} ${language === "ka" ? "წელი გამოცდილება" : "years experience"}` : t.notSpecified)}
              price={formatPrice(guidePrice, guide.price_type, guide.price_currency, language, t.negotiable)}
              actionLabel={t.details}
            />
          );
        }}
      />

      <section className="border-y border-white/10 bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-black sm:text-3xl">{t.addService}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AddServiceButton label={t.addTour} onClick={() => void goToAddService("/dashboard/add-tour")} />
            <AddServiceButton label={t.addTransfer} onClick={() => void goToAddService("/dashboard/add-transfer")} />
            <AddServiceButton label={t.addHotel} onClick={() => void goToAddService("/dashboard/add-hotel")} />
            <AddServiceButton label={t.addGuide} onClick={() => void goToAddService("/dashboard/add-guide")} />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-xl font-extrabold">🏔️ Georgia Gateway Hub</h3>
            <p className="mt-3 max-w-sm leading-7 text-white/50">{t.footerDescription}</p>
          </div>

          <div>
            <h3 className="font-bold">{t.quickLinks}</h3>
            <div className="mt-4 space-y-3 text-white/55">
              <Link href="/tours" className="block hover:text-white">{t.tours}</Link>
              <Link href="/transfers" className="block hover:text-white">{t.transfers}</Link>
              <Link href="/hotels" className="block hover:text-white">{t.hotels}</Link>
              <Link href="/guides" className="block hover:text-white">{t.guides}</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold">{t.userDashboard}</h3>
            <div className="mt-4 space-y-3 text-white/55">
              <Link href="/dashboard" className="block hover:text-white">{t.userDashboard}</Link>
              <Link href="/login" className="block hover:text-white">{t.login}</Link>
              <Link href="/signup" className="block hover:text-white">{t.signup}</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row">
          <div>
            <p>© 2026 Georgia Gateway Hub</p>
            <p className="mt-1">{t.madeInGeorgia}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </footer>
    </main>
  );
}

function ShowcaseSection<T extends { id: string | number }>({
  id,
  icon,
  title,
  items,
  page,
  pageSize,
  loading,
  viewAllHref,
  viewAllLabel,
  pageLabel,
  ofLabel,
  previousLabel,
  nextLabel,
  emptyLabel,
  onPageChange,
  renderItem,
}: {
  id: string;
  icon: string;
  title: string;
  items: T[];
  page: number;
  pageSize: number;
  loading: boolean;
  viewAllHref: string;
  viewAllLabel: string;
  pageLabel: string;
  ofLabel: string;
  previousLabel: string;
  nextLabel: string;
  emptyLabel: string;
  onPageChange: (page: number) => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visibleItems = items.slice(safePage * pageSize, safePage * pageSize + pageSize);

  useEffect(() => {
    if (page !== safePage) onPageChange(safePage);
  }, [page, safePage, onPageChange]);

  return (
    <section id={id} className="scroll-mt-24 border-b border-white/10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-400">{icon} Georgia Gateway Hub</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h2>
          </div>
          <Link href={viewAllHref} className="w-fit rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black transition hover:bg-white/10">
            {viewAllLabel} →
          </Link>
        </div>

        {loading ? (
          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: pageSize }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">{emptyLabel}</div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {visibleItems.map((item) => (
              <div key={String(item.id)}>{renderItem(item)}</div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={previousLabel}
          >
            ← {previousLabel}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white/55">{pageLabel} {safePage + 1} {ofLabel} {totalPages}</span>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, index) => {
                const dotPage = totalPages <= 7 ? index : Math.min(totalPages - 1, Math.max(0, safePage - 3) + index);
                return (
                  <button
                    key={`${id}-${dotPage}`}
                    type="button"
                    onClick={() => onPageChange(dotPage)}
                    aria-label={`${pageLabel} ${dotPage + 1}`}
                    className={`h-2.5 rounded-full transition ${dotPage === safePage ? "w-6 bg-cyan-400" : "w-2.5 bg-white/20 hover:bg-white/40"}`}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
            disabled={safePage >= totalPages - 1}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={nextLabel}
          >
            {nextLabel} →
          </button>
        </div>
      </div>
    </section>
  );
}

function SmallCard({
  href,
  imageUrl,
  fallback,
  title,
  subtitle,
  meta,
  price,
  actionLabel,
}: {
  href: string;
  imageUrl: string | null | undefined;
  fallback: string;
  title: string;
  subtitle: string;
  meta: string;
  price: string;
  actionLabel: string;
}) {
  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg transition hover:-translate-y-1 hover:bg-white/10">
      <Link href={href} className="block">
        <div className="overflow-hidden bg-white/5">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="h-32 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-36" />
          ) : (
            <div className="flex h-32 items-center justify-center text-5xl sm:h-36">{fallback}</div>
          )}
        </div>

        <div className="p-3.5">
          <h3 className="line-clamp-2 min-h-[42px] text-sm font-black leading-5 sm:text-base">{title}</h3>
          <p className="mt-2 line-clamp-1 text-xs text-white/55">📍 {subtitle}</p>
          <p className="mt-1 line-clamp-1 text-xs text-white/40">{meta}</p>
          <p className="mt-3 line-clamp-1 text-sm font-black text-cyan-300">{price}</p>
          <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-black transition group-hover:bg-cyan-500">
            {actionLabel}
          </div>
        </div>
      </Link>
    </article>
  );
}

function AddServiceButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left font-black transition hover:border-cyan-400/40 hover:bg-white/10"
    >
      + {label}
    </button>
  );
}

function useResponsivePageSize() {
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    function updatePageSize() {
      const width = window.innerWidth;
      if (width < 640) {
        setPageSize(2);
      } else if (width < 1280) {
        setPageSize(3);
      } else {
        setPageSize(6);
      }
    }

    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  return pageSize;
}

function formatPrice(
  value: number | null | undefined,
  priceType: "fixed" | "negotiable" | null | undefined,
  currency: "GEL" | "USD" | null | undefined,
  language: Language,
  negotiableLabel: string
) {
  if (priceType === "negotiable" || value === null || value === undefined || Number.isNaN(Number(value))) {
    return negotiableLabel;
  }

  const amount = Number(value).toLocaleString(language === "ka" ? "ka-GE" : "en-US", {
    maximumFractionDigits: 2,
  });

  return currency === "USD" ? `$${amount}` : `${amount} ₾`;
}

function formatSimplePrice(
  value: number | null | undefined,
  language: Language,
  negotiableLabel: string
) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return negotiableLabel;
  }

  return `${Number(value).toLocaleString(language === "ka" ? "ka-GE" : "en-US", {
    maximumFractionDigits: 2,
  })} ₾`;
}

function formatTransferPrice(transfer: Transfer, language: Language) {
  const type =
    transfer.price_type === "negotiable" || transfer.price_type === "from"
      ? transfer.price_type
      : "fixed";

  if (type === "negotiable") {
    return language === "ka" ? "ფასი შეთანხმებით" : "Negotiable";
  }

  if (
    transfer.price === null ||
    transfer.price === undefined ||
    Number.isNaN(Number(transfer.price))
  ) {
    return language === "ka" ? "ფასი შეთანხმებით" : "Negotiable";
  }

  const amount = Number(transfer.price).toLocaleString(
    language === "ka" ? "ka-GE" : "en-US"
  );

  if (type === "from") {
    return language === "ka"
      ? `${amount} ₾-დან`
      : `From ${amount} ₾`;
  }

  return language === "ka"
    ? `${amount} ₾ მანქანაზე`
    : `${amount} ₾ per vehicle`;
}