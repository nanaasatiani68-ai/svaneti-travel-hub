"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { useLanguage } from "@/app/providers/LanguageProvider";

type Tour = {
  id: number | string;
  user_id: string | null;
  title: string | null;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  location: string | null;
  location_en: string | null;
  price: number | null;
  price_type: "fixed" | "negotiable" | null;
  price_currency: "GEL" | "USD" | null;
  image_url: string | null;
  image_urls: string[] | null;
  duration: string | null;
  duration_en: string | null;
  max_people: number | null;
  category: string | null;
  category_en: string | null;
  status: string | null;
  created_at: string | null;
  organizer_name: string | null;
  contact_phone: string | null;
  has_whatsapp: boolean | null;
  has_viber: boolean | null;
};

type Review = {
  id: string;
  tour_id: number | string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export default function BookTourPage() {
  const { language } = useLanguage();
  const c = bookTourCopy[language];
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tourId = params?.id;

  const [tour, setTour] = useState<Tour | null>(null);
  const [ownerTours, setOwnerTours] = useState<Tour[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [showMobileGallery, setShowMobileGallery] = useState(false);

  const [currentUserId, setCurrentUserId] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasBookingForTour, setHasBookingForTour] = useState(false);
  const [hasCompletedBookingForTour, setHasCompletedBookingForTour] = useState(false);
  const [loadingTour, setLoadingTour] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);

  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewMessageType, setReviewMessageType] = useState<
    "success" | "error"
  >("success");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [people, setPeople] = useState(1);
  const [notes, setNotes] = useState("");
  const bookingRequestInProgress = useRef(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const loadReviews = useCallback(async () => {
    if (!tourId) {
      setLoadingReviews(false);
      return;
    }

    setLoadingReviews(true);

    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
          id,
          tour_id,
          user_id,
          rating,
          comment,
          created_at,
          updated_at
        `
      )
      .eq("tour_id", tourId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Reviews loading error:", error);
      setLoadingReviews(false);
      return;
    }

    setReviews((data as Review[] | null) ?? []);
    setLoadingReviews(false);
  }, [tourId, c]);

  const loadTour = useCallback(async () => {
    setLoadingTour(true);
    setErrorMessage("");
    setTour(null);
    setOwnerTours([]);

    try {
      if (!tourId) {
        throw new Error(c.invalidTourId);
      }

      const { data, error } = await supabase
        .from("tours")
        .select(
          `
            id,
            user_id,
            title,
            title_en,
            description,
            description_en,
            location,
            location_en,
            price,
            price_type,
            price_currency,
            image_url,
            image_urls,
            duration,
            duration_en,
            max_people,
            category,
            category_en,
            status,
            created_at,
            organizer_name,
            contact_phone,
            has_whatsapp,
            has_viber
          `
        )
        .eq("id", tourId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          c.tourNotFoundError
        );
      }

      const loadedTour = data as Tour;
      setTour(loadedTour);

      const initialGallery =
        Array.isArray(loadedTour.image_urls) &&
        loadedTour.image_urls.length > 0
          ? loadedTour.image_urls.filter(Boolean).slice(0, 5)
          : loadedTour.image_url
            ? [loadedTour.image_url]
            : [];

      setSelectedImage(initialGallery[0] || "");

      if (!loadedTour.user_id) {
        return;
      }

      const ownerToursResult = await supabase
        .from("tours")
        .select(
          `
            id,
            user_id,
            title,
            title_en,
            description,
            description_en,
            location,
            location_en,
            price,
            price_type,
            price_currency,
            image_url,
            image_urls,
            duration,
            duration_en,
            max_people,
            category,
            category_en,
            status,
            created_at,
            organizer_name,
            contact_phone,
            has_whatsapp,
            has_viber
          `
        )
        .eq("user_id", loadedTour.user_id)
        .eq("status", "approved")
        .neq("id", loadedTour.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (ownerToursResult.error) {
        console.error(
          "Owner tours loading error:",
          ownerToursResult.error
        );
      } else {
        setOwnerTours(
          (ownerToursResult.data as Tour[] | null) ?? []
        );
      }
    } catch (error: unknown) {
      console.error("Tour loading error:", error);

      const message =
        error instanceof Error
          ? error.message
          : c.unknownLoadError;

      setErrorMessage(message);
      setTour(null);
    } finally {
      setLoadingTour(false);
    }
  }, [tourId]);

  useEffect(() => {
    void loadTour();
  }, [loadTour]);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "Session loading error:",
            sessionError
          );
          return;
        }

        const user = session?.user;

        if (!user) {
          setCurrentUserId("");
          setHasBookingForTour(false);
          setHasCompletedBookingForTour(false);
          setCheckingAuth(false);
          return;
        }

        setCurrentUserId(user.id);
        setGuestEmail(user.email || "");

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
          console.error(
            "Profile loading error:",
            profileError
          );
        }

        if (profile?.full_name) {
          setGuestName(profile.full_name);
        } else if (user.user_metadata?.full_name) {
          setGuestName(user.user_metadata.full_name);
        }

        if (profile?.phone) {
          setGuestPhone(profile.phone);
        }

        if (tourId) {
          const { data: bookingRows, error: bookingLookupError } =
            await supabase
              .from("bookings")
              .select("id,status")
              .eq("tour_id", tourId)
              .eq("user_id", user.id);

          if (bookingLookupError) {
            console.error(
              "Booking access lookup error:",
              bookingLookupError
            );
          } else {
            const rows =
              (bookingRows as { id: string; status: string | null }[] | null) ??
              [];

            setHasBookingForTour(rows.length > 0);
            setHasCompletedBookingForTour(
              rows.some((row) => row.status === "completed")
            );
          }
        }

        setCheckingAuth(false);
      } catch (error) {
        console.error(
          "Current user loading error:",
          error
        );
        setCheckingAuth(false);
      }
    }

    void loadCurrentUser();
  }, [tourId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const myReview = useMemo(() => {
    if (!currentUserId) {
      return null;
    }

    return (
      reviews.find(
        (review) => review.user_id === currentUserId
      ) ?? null
    );
  }, [reviews, currentUserId]);

  useEffect(() => {
    if (myReview) {
      setReviewRating(myReview.rating);
      setReviewComment(myReview.comment || "");
    }
  }, [myReview]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  const galleryImages = useMemo(() => {
    if (!tour) {
      return [] as string[];
    }

    const urls =
      Array.isArray(tour.image_urls) &&
      tour.image_urls.length > 0
        ? tour.image_urls.filter(Boolean)
        : tour.image_url
          ? [tour.image_url]
          : [];

    return Array.from(new Set(urls)).slice(0, 5);
  }, [tour]);

  useEffect(() => {
    if (
      galleryImages.length > 0 &&
      !galleryImages.includes(selectedImage)
    ) {
      setSelectedImage(galleryImages[0]);
    }
  }, [galleryImages, selectedImage]);


  const today = getLocalToday();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting || bookingRequestInProgress.current) {
      return;
    }

    setErrorMessage("");
    setSuccess(false);

    if (!tour) {
      setErrorMessage(c.tourInfoMissing);
      return;
    }

    if (!currentUserId) {
      router.push(
        `/login?next=${encodeURIComponent(`/book-tour/${tour.id}`)}`
      );
      return;
    }

    if (!guestName.trim()) {
      setErrorMessage(c.nameRequired);
      return;
    }

    if (!guestEmail.trim()) {
      setErrorMessage(c.emailRequired);
      return;
    }

    if (!guestPhone.trim()) {
      setErrorMessage(c.phoneRequired);
      return;
    }

    if (!bookingDate) {
      setErrorMessage(c.dateRequired);
      return;
    }

    if (bookingDate < today) {
      setErrorMessage(c.pastDate);
      return;
    }

    if (!Number.isInteger(people) || people < 1) {
      setErrorMessage(
        c.peopleMin
      );
      return;
    }

    if (tour.max_people && people > tour.max_people) {
      setErrorMessage(
        `${c.maxPeoplePrefix} ${tour.max_people} ${c.peopleWord}.`
      );
      return;
    }

    bookingRequestInProgress.current = true;
    setSubmitting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "Session loading error:",
          sessionError
        );
      }

      if (!session?.user || !session.access_token) {
        router.push(
          `/login?next=${encodeURIComponent(`/book-tour/${tour.id}`)}`
        );
        return;
      }

      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          tourId: tour.id,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim().toLowerCase(),
          guestPhone: guestPhone.trim(),
          bookingDate,
          people,
          notes: notes.trim() || null,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        emailWarning?: string | null;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            c.bookingRequestFailed
        );
      }

      if (result.emailWarning) {
        console.warn("Booking email warning:", result.emailWarning);
      }

      setSuccess(true);
      setHasBookingForTour(true);
      setBookingDate("");
      setPeople(1);
      setNotes("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error: unknown) {
      console.error("Booking error:", error);

      const message =
        error instanceof Error
          ? error.message
          : c.unknownError;

      setErrorMessage(
        `${c.bookingRequestFailed}: ${message}`
      );
    } finally {
      bookingRequestInProgress.current = false;
      setSubmitting(false);
    }
  }

  async function saveReview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setReviewMessage("");

    if (!tour) {
      setReviewMessage(c.tourInfoMissing);
      setReviewMessageType("error");
      return;
    }

    if (!hasCompletedBookingForTour) {
      setReviewMessage(
        language === "ka"
          ? "შეფასების დატოვება შესაძლებელია მხოლოდ შესრულებული ჯავშნის შემდეგ."
          : "You can leave a review only after a completed booking."
      );
      setReviewMessageType("error");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    if (
      !Number.isInteger(reviewRating) ||
      reviewRating < 1 ||
      reviewRating > 5
    ) {
      setReviewMessage(c.chooseRating);
      setReviewMessageType("error");
      return;
    }

    if (reviewComment.trim().length > 1000) {
      setReviewMessage(
        c.commentTooLong
      );
      setReviewMessageType("error");
      return;
    }

    setSavingReview(true);

    const { error } = await supabase
      .from("reviews")
      .upsert(
        {
          tour_id: tour.id,
          user_id: user.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        },
        {
          onConflict: "tour_id,user_id",
        }
      );

    if (error) {
      console.error("Review saving error:", error);

      setReviewMessage(
        `${c.reviewSaveFailed}: ${error.message}`
      );

      setReviewMessageType("error");
      setSavingReview(false);
      return;
    }

    setReviewMessage(
      myReview
        ? c.reviewUpdated
        : c.reviewAdded
    );

    setReviewMessageType("success");
    setSavingReview(false);

    await loadReviews();
  }

  async function deleteReview() {
    if (!myReview || !currentUserId) {
      return;
    }

    const confirmed = window.confirm(
      c.confirmDeleteReview
    );

    if (!confirmed) {
      return;
    }

    setDeletingReview(true);
    setReviewMessage("");

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", myReview.id)
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Review deleting error:", error);

      setReviewMessage(
        `${c.reviewDeleteFailed}: ${error.message}`
      );

      setReviewMessageType("error");
      setDeletingReview(false);
      return;
    }

    setReviewRating(5);
    setReviewComment("");
    setReviewMessage(c.reviewDeleted);
    setReviewMessageType("success");
    setDeletingReview(false);

    await loadReviews();
  }

  if (loadingTour) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />

          <p className="mt-5 text-lg font-semibold">
            {c.loadingTour}
          </p>
        </div>
      </main>
    );
  }

  if (!tour) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl">
          <div className="text-7xl">🏔️</div>

          <h1 className="mt-5 text-2xl font-black">
            {c.tourNotFound}
          </h1>

          <p className="mt-3 leading-7 text-white/65">
            {errorMessage}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadTour}
              className="rounded-2xl bg-emerald-500 px-6 py-3 font-bold transition hover:bg-emerald-600"
            >
              {c.tryAgain}
            </button>

            <Link
              href="/tours"
              className="rounded-2xl bg-cyan-500 px-6 py-3 font-bold transition hover:bg-cyan-600"
            >
              {c.allTours}
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
            >
              {c.home}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const tourTitle = getLocalizedTourField(
    tour.title,
    tour.title_en,
    language
  );
  const tourDescription = getLocalizedTourField(
    tour.description,
    tour.description_en,
    language
  );
  const tourLocation = getLocalizedTourField(
    tour.location,
    tour.location_en,
    language
  );
  const tourDuration = getLocalizedTourField(
    tour.duration,
    tour.duration_en,
    language
  );
  const tourCategory = getLocalizedTourField(
    tour.category,
    tour.category_en,
    language
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 font-black"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-2xl shadow-lg">
              🏔️
            </div>

            <div>
              <p>Georgia Gateway Hub</p>

              <p className="text-xs font-medium text-white/45">
                {c.tourDetails}
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/tours"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20"
            >
              ← {c.allTours}
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold transition hover:bg-cyan-600"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {success && (
          <div className="mb-8 rounded-3xl border border-emerald-400/30 bg-emerald-500/15 p-6 text-emerald-100 shadow-xl">
            <p className="text-xl font-black">
              ✅ {c.bookingSent}
            </p>

            <p className="mt-2 leading-7 text-emerald-100/75">
              მოთხოვნა მიღებულია. ტურის ორგანიზატორი დაგიკავშირდება
              ტელეფონზე ან ელფოსტაზე.
            </p>
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
              <div className="relative">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={tourTitle || "Tour"}
                    className="h-[300px] w-full object-cover sm:h-[480px]"
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center bg-gradient-to-br from-cyan-950 to-slate-900 sm:h-[480px]">
                    <span className="text-9xl">🏔️</span>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-black shadow-lg">
                      ✓ {c.available}
                    </span>

                    {tourCategory && (
                      <span className="rounded-full border border-white/20 bg-slate-950/60 px-4 py-2 text-xs font-bold backdrop-blur-md">
                        {tourCategory}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-4 text-3xl font-black drop-shadow-xl sm:text-5xl">
                    {tourTitle || c.untitledTour}
                  </h1>

                  <p className="mt-3 text-lg text-white/80">
                    📍 {tourLocation || c.georgia}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <StarDisplay rating={averageRating} language={language} />

                    <span className="font-black">
                      {reviews.length > 0
                        ? averageRating.toFixed(1)
                        : c.noRatingYet}
                    </span>

                    {reviews.length > 0 && (
                      <span className="text-sm text-white/65">
                        ({reviews.length} {c.reviewsCount})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {galleryImages.length > 1 && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                      {language === "ka" ? "ტურის გალერეა" : "Tour gallery"}
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      📸 {c.tourPhotos}
                    </h2>
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                    {galleryImages.length} {c.photos}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMobileGallery((current) => !current)}
                  className="mt-4 flex w-full items-center justify-between rounded-2xl bg-cyan-500 px-5 py-4 font-black text-white transition hover:bg-cyan-600 sm:hidden"
                >
                  <span>📷 {c.viewPhotos}</span>
                  <span>{showMobileGallery ? "▲" : "▼"}</span>
                </button>

                <div
                  className={`mt-4 grid grid-cols-2 gap-3 sm:grid sm:grid-cols-3 md:grid-cols-5 ${
                    showMobileGallery ? "grid" : "hidden"
                  }`}
                >
                  {galleryImages.map((image, index) => {
                    const active = image === selectedImage;

                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedImage(image);
                          if (window.innerWidth < 640) {
                            window.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            });
                          }
                        }}
                        className={`group relative overflow-hidden rounded-2xl border-2 transition ${
                          active
                            ? "border-cyan-400 ring-2 ring-cyan-400/30"
                            : "border-white/10 hover:border-white/30"
                        }`}
                        aria-label={`${c.tourPhoto} ${index + 1}`}
                      >
                        <img
                          src={image}
                          alt={`${tourTitle || c.tour} - ${c.photo} ${index + 1}`}
                          className="h-24 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-28"
                        />

                        <span className="absolute right-2 top-2 rounded-full bg-slate-950/75 px-2 py-1 text-[10px] font-black text-white">
                          {index + 1}
                        </span>

                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 rounded-full bg-cyan-500 px-2 py-1 text-[10px] font-black text-white">
                            {c.mainPhoto}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoBox
                  label={c.location}
                  value={tourLocation || c.notSpecified}
                  icon="📍"
                />

                <InfoBox
                  label={c.duration}
                  value={tourDuration || c.notSpecified}
                  icon="⏱️"
                />

                <InfoBox
                  label={c.price}
                  value={formatTourPrice(tour, language)}
                  icon="💰"
                />

                <InfoBox
                  label={c.maximum}
                  value={
                    tour.max_people
                      ? `${tour.max_people} ${c.peopleWord}`
                      : c.notSpecified
                  }
                  icon="👥"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                {language === "ka" ? "ტურის აღწერა" : "Tour description"}
              </p>

              <h2 className="mt-3 text-3xl font-black">
                {c.tourDescription}
              </h2>

              <p className="mt-5 whitespace-pre-line leading-8 text-white/70">
                {tourDescription || c.noDescription}
              </p>
            </section>

            <OwnerCard tour={tour} language={language} canViewContact={hasBookingForTour} />

            <section className="grid gap-5 md:grid-cols-2">
              <DetailCard
                icon="✅"
                title={c.mayIncludeTitle}
                items={[
                  c.includeGuide,
                  c.includePlanning,
                  c.includeOrganization,
                  c.includeSupport,
                ]}
                note={c.includeNote}
              />

              <DetailCard
                icon="❌"
                title={c.mayNotIncludeTitle}
                items={[
                  c.excludeFood,
                  c.excludeHotel,
                  c.excludePersonal,
                  c.excludeActivities,
                ]}
                note={c.excludeNote}
              />
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                    {language === "ka" ? "შეფასებები" : "Reviews"}
                  </p>

                  <h2 className="mt-3 text-3xl font-black">
                    ⭐ {c.reviewsTitle}
                  </h2>
                </div>

                <div className="rounded-2xl bg-white/10 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <StarDisplay rating={averageRating} language={language} />

                    <span className="text-xl font-black">
                      {reviews.length > 0
                        ? averageRating.toFixed(1)
                        : "0.0"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-white/50">
                    {reviews.length} {c.reviewsCount}
                  </p>
                </div>
              </div>

              {reviewMessage && (
                <div
                  className={`mt-6 rounded-2xl border p-4 font-semibold ${
                    reviewMessageType === "success"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      : "border-red-400/30 bg-red-500/10 text-red-200"
                  }`}
                >
                  {reviewMessageType === "success" ? "✅ " : "❌ "}
                  {reviewMessage}
                </div>
              )}

              {currentUserId && hasCompletedBookingForTour ? (
                <form
                  onSubmit={saveReview}
                  className="mt-7 rounded-3xl bg-white p-6 text-slate-900"
                >
                  <h3 className="text-2xl font-black">
                    {myReview
                      ? c.editReview
                      : c.rateTour}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    აირჩიე ვარსკვლავების რაოდენობა და დაწერე
                    {c.comment}.
                  </p>

                  <div className="mt-5">
                    <p className="mb-3 text-sm font-bold text-slate-700">
                      {c.yourRating}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition ${
                            star <= reviewRating
                              ? "bg-amber-400 text-white"
                              : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                          }`}
                          aria-label={`${star} ${c.starWord}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <p className="mt-2 text-sm font-bold text-amber-600">
                      {reviewRating} / 5
                    </p>
                  </div>

                  <label className="mt-5 block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      {c.comment}
                    </span>

                    <textarea
                      value={reviewComment}
                      onChange={(event) =>
                        setReviewComment(event.target.value)
                      }
                      placeholder={c.commentPlaceholder}
                      rows={5}
                      maxLength={1000}
                      className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    />

                    <span className="mt-2 block text-right text-xs text-slate-400">
                      {reviewComment.length} / 1000
                    </span>
                  </label>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={savingReview}
                      className="rounded-2xl bg-cyan-600 px-6 py-3 font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingReview
                        ? c.saving
                        : myReview
                          ? c.updateReview
                          : c.addReview}
                    </button>

                    {myReview && (
                      <button
                        type="button"
                        onClick={deleteReview}
                        disabled={deletingReview}
                        className="rounded-2xl bg-red-600 px-6 py-3 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingReview
                          ? c.deleting
                          : c.deleteReview}
                      </button>
                    )}
                  </div>
                </form>
              ) : currentUserId ? (
                <div className="mt-7 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6 text-center">
                  <p className="font-bold">
                    {language === "ka"
                      ? "შეფასების დატოვება შესაძლებელი გახდება მას შემდეგ, რაც თქვენი ჯავშანი შესრულებულად მოინიშნება."
                      : "You can leave a review after your booking is marked as completed."}
                  </p>

                  <Link
                    href="/dashboard/bookings"
                    className="mt-4 inline-flex rounded-2xl bg-amber-500 px-6 py-3 font-black text-slate-950 transition hover:bg-amber-400"
                  >
                    {language === "ka" ? "ჩემი ჯავშნები" : "My bookings"}
                  </Link>
                </div>
              ) : (
                <div className="mt-7 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6 text-center">
                  <p className="font-bold">
                    {c.loginToReview}
                  </p>

                  <Link
                    href={`/login?next=${encodeURIComponent(`/book-tour/${tour.id}`)}`}
                    className="mt-4 inline-flex rounded-2xl bg-cyan-500 px-6 py-3 font-black transition hover:bg-cyan-600"
                  >
                    {c.login}
                  </Link>
                </div>
              )}

              <div className="mt-8 space-y-4">
                {loadingReviews ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
                    {c.loadingReviews}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                    <div className="text-5xl">⭐</div>

                    <h3 className="mt-4 text-xl font-black">
                      {c.noReviewsYet}
                    </h3>

                    <p className="mt-2 text-white/55">
                      {c.beFirstReview}
                    </p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <article
                      key={review.id}
                      className={`rounded-3xl border p-5 ${
                        review.user_id === currentUserId
                          ? "border-cyan-400/40 bg-cyan-500/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl">
                              👤
                            </div>

                            <div>
                              <h3 className="font-black">
                                {review.user_id === currentUserId
                                  ? "{c.yourRating}"
                                  : c.user}
                              </h3>

                              <p className="text-xs text-white/40">
                                {formatDate(review.created_at, language)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <StarDisplay rating={review.rating} language={language} />
                        </div>
                      </div>

                      {review.comment && (
                        <p className="mt-5 whitespace-pre-line leading-7 text-white/70">
                          {review.comment}
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                {language === "ka" ? "მნიშვნელოვანი ინფორმაცია" : "Important information"}
              </p>

              <h2 className="mt-3 text-3xl font-black">
                {c.importantInfo}
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NoticeCard
                  icon="📅"
                  title={c.advanceBooking}
                  text={c.advanceBookingText}
                />

                <NoticeCard
                  icon="🌦️"
                  title={c.weather}
                  text={c.weatherText}
                />

                <NoticeCard
                  icon="🥾"
                  title={c.clothing}
                  text={c.clothingText}
                />

                <NoticeCard
                  icon="📞"
                  title={c.confirmation}
                  text={c.confirmationText}
                />
              </div>
            </section>

            {ownerTours.length > 0 && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                  {language === "ka" ? "სხვა ტურები" : "More tours"}
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  {c.otherTours}
                </h2>

                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {ownerTours.map((ownerTour) => (
                    <Link
                      key={ownerTour.id}
                      href={`/book-tour/${ownerTour.id}`}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-black/20 transition hover:-translate-y-1 hover:bg-white/10"
                    >
                      <div className="h-48 overflow-hidden">
                        {ownerTour.image_url ? (
                          <img
                            src={ownerTour.image_url}
                            alt={
                              getLocalizedTourField(
                                ownerTour.title,
                                ownerTour.title_en,
                                language
                              ) || "Tour"
                            }
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-slate-900 text-6xl">
                            🏔️
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="text-xl font-black">
                          {getLocalizedTourField(
                              ownerTour.title,
                              ownerTour.title_en,
                              language
                            ) || c.untitledTour}
                        </h3>

                        <p className="mt-2 text-sm text-white/60">
                          📍{" "}
                          {getLocalizedTourField(
                            ownerTour.location,
                            ownerTour.location_en,
                            language
                          ) || c.georgia}
                        </p>

                        <p className="mt-4 text-xl font-black text-cyan-300">
                          {formatTourPrice(ownerTour, language)}
                        </p>

                        <div className="mt-4 text-sm font-bold text-cyan-300">
                          {c.viewTour} →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7 lg:sticky lg:top-24">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
                {language === "ka" ? "დაჯავშნა" : "Booking"}
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {c.bookTour}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {c.fillAndSend}
              </p>
            </div>

            {errorMessage && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            {checkingAuth ? (
              <div className="mt-7 rounded-3xl bg-slate-100 p-7 text-center">
                <div className="text-4xl">⏳</div>
                <p className="mt-3 font-bold text-slate-600">
                  {language === "ka" ? "ანგარიში მოწმდება..." : "Checking your account..."}
                </p>
              </div>
            ) : !currentUserId ? (
              <div className="mt-7 rounded-3xl border border-cyan-200 bg-cyan-50 p-7 text-center">
                <div className="text-5xl">🔐</div>
                <h3 className="mt-4 text-2xl font-black text-slate-900">
                  {language === "ka"
                    ? "ტურის დასაჯავშნად გაიარე ავტორიზაცია"
                    : "Sign in to book this tour"}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {language === "ka"
                    ? "რეგისტრირებული მომხმარებელი Dashboard-ში ნახავს ჯავშნის სტატუსს და დაჯავშნის შემდეგ ექნება ორგანიზატორის კონტაქტზე წვდომა."
                    : "Registered users can track booking status in the Dashboard and access the organizer contact after booking."}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/login?next=${encodeURIComponent(`/book-tour/${tour.id}`)}`}
                    className="rounded-2xl bg-cyan-600 px-5 py-3 font-black text-white transition hover:bg-cyan-700"
                  >
                    {language === "ka" ? "შესვლა" : "Login"}
                  </Link>

                  <Link
                    href={`/signup?next=${encodeURIComponent(`/book-tour/${tour.id}`)}`}
                    className="rounded-2xl bg-slate-900 px-5 py-3 font-black text-white transition hover:bg-slate-800"
                  >
                    {language === "ka" ? "რეგისტრაცია" : "Sign Up"}
                  </Link>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <FormField label={c.fullName}>
                <input
                  type="text"
                  value={guestName}
                  onChange={(event) =>
                    setGuestName(event.target.value)
                  }
                  placeholder={c.namePlaceholder}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label={c.email}>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(event) =>
                    setGuestEmail(event.target.value)
                  }
                  placeholder="guest@example.com"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label={c.phone}>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(event) =>
                    setGuestPhone(event.target.value)
                  }
                  placeholder="+995 5XX XX XX XX"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={c.tourDate}>
                  <input
                    type="date"
                    value={bookingDate}
                    min={today}
                    onChange={(event) =>
                      setBookingDate(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </FormField>

                <FormField label={c.peopleCount}>
                  <input
                    type="number"
                    min={1}
                    max={tour.max_people || undefined}
                    value={people}
                    onChange={(event) => {
                      const value = Number(event.target.value);

                      setPeople(
                        Number.isNaN(value)
                          ? 1
                          : Math.max(1, Math.floor(value))
                      );
                    }}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </FormField>
              </div>

              <FormField label={c.notes}>
                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder={c.notesPlaceholder}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <div className="rounded-2xl bg-slate-100 p-5">
                <PriceRow
                  label={c.price}
                  value={formatTourPrice(tour, language)}
                />

                <PriceRow
                  label={c.peopleCount}
                  value={String(people)}
                />

                <p className="mt-3 rounded-xl bg-cyan-50 p-3 text-xs font-semibold leading-5 text-cyan-800">
                  ადამიანების რაოდენობა ფასს არ ცვლის — მითითებული თანხა
                  არის ერთი მანქანის სრული ფასი.
                </p>

                <div className="mt-4 border-t border-slate-300 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-black">
                      ფასი
                    </span>

                    <span className="text-2xl font-black text-cyan-700">
                      {formatTourPrice(tour, language)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? c.submitting
                  : c.sendBookingRequest}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                მოთხოვნის გაგზავნა ავტომატურად დადასტურებულ
                ჯავშანს არ ნიშნავს.
              </p>
            </form>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}


const bookTourCopy = {
  ka: {
    invalidTourId: "ტურის ID არასწორია.",
    tourNotFoundError: "ტური ვერ მოიძებნა ან ჯერ არ არის დამტკიცებული.",
    unknownLoadError: "ტურის ჩატვირთვისას უცნობი შეცდომა დაფიქსირდა.",
    unknownError: "უცნობი შეცდომა დაფიქსირდა.",
    tourInfoMissing: "ტურის ინფორმაცია ვერ მოიძებნა.",
    nameRequired: "ჩაწერე სტუმრის სახელი და გვარი.",
    emailRequired: "ჩაწერე ელფოსტა.",
    phoneRequired: "ჩაწერე ტელეფონის ნომერი.",
    dateRequired: "აირჩიე ტურის თარიღი.",
    pastDate: "გასული თარიღის არჩევა შეუძლებელია.",
    peopleMin: "სტუმრების რაოდენობა უნდა იყოს მინიმუმ 1.",
    maxPeoplePrefix: "ამ ტურზე მაქსიმალური რაოდენობაა",
    peopleWord: "ადამიანი",
    bookingRequestFailed: "დაჯავშნის მოთხოვნა ვერ გაიგზავნა",
    chooseRating: "აირჩიე შეფასება 1-დან 5-მდე.",
    commentTooLong: "კომენტარი არ უნდა აღემატებოდეს 1000 სიმბოლოს.",
    reviewSaveFailed: "შეფასების შენახვა ვერ მოხერხდა",
    reviewUpdated: "შეფასება წარმატებით განახლდა.",
    reviewAdded: "შეფასება წარმატებით დაემატა.",
    confirmDeleteReview: "ნამდვილად გინდა შეფასების წაშლა?",
    reviewDeleteFailed: "შეფასების წაშლა ვერ მოხერხდა",
    reviewDeleted: "შეფასება წარმატებით წაიშალა.",
    loadingTour: "ტურის ინფორმაცია იტვირთება...",
    tourNotFound: "ტური ვერ მოიძებნა",
    tryAgain: "ხელახლა ცდა",
    allTours: "ყველა ტური",
    home: "მთავარი გვერდი",
    tourDetails: "ტურის დეტალები",
    bookingSent: "დაჯავშნის მოთხოვნა წარმატებით გაიგზავნა",
    bookingSentText: "მოთხოვნა მიღებულია. ტურის ორგანიზატორი დაგიკავშირდება ტელეფონზე ან ელფოსტაზე.",
    available: "ხელმისაწვდომია",
    untitledTour: "უსახელო ტური",
    georgia: "საქართველო",
    noRatingYet: "ჯერ არ არის შეფასება",
    reviewsCount: "შეფასება",
    tourPhotos: "ტურის ფოტოები",
    photos: "ფოტო",
    viewPhotos: "ფოტოების ნახვა",
    tourPhoto: "ტურის ფოტო",
    photo: "ფოტო",
    tour: "ტური",
    mainPhoto: "მთავარი",
    location: "მდებარეობა",
    duration: "ხანგრძლივობა",
    price: "ფასი",
    maximum: "მაქსიმუმ",
    notSpecified: "არ არის მითითებული",
    tourDescription: "ტურის აღწერა",
    noDescription: "ტურის სრული აღწერა ჯერ არ არის დამატებული.",
    mayIncludeTitle: "რა შეიძლება შედიოდეს ფასში",
    includeGuide: "პროფესიონალი გიდის მომსახურება",
    includePlanning: "მარშრუტის დაგეგმვა",
    includeOrganization: "ტურის ორგანიზება",
    includeSupport: "ტურის დროს მხარდაჭერა",
    includeNote: "ზუსტი მომსახურებები გადაამოწმე ორგანიზატორთან.",
    mayNotIncludeTitle: "რა შეიძლება არ შედიოდეს ფასში",
    excludeFood: "კვება და სასმელი",
    excludeHotel: "სასტუმროში განთავსება",
    excludePersonal: "პირადი ხარჯები",
    excludeActivities: "დამატებითი აქტივობები",
    excludeNote: "პირობები შეიძლება განსხვავდებოდეს კონკრეტული ტურის მიხედვით.",
    reviewsTitle: "შეფასებები და კომენტარები",
    editReview: "შეფასების შეცვლა",
    rateTour: "ტურის შეფასება",
    reviewHelp: "აირჩიე ვარსკვლავების რაოდენობა და დაწერე კომენტარი.",
    yourRating: "შენი შეფასება",
    starWord: "ვარსკვლავი",
    comment: "კომენტარი",
    commentPlaceholder: "დაწერე შენი გამოცდილების შესახებ...",
    saving: "ინახება...",
    updateReview: "შეფასების განახლება",
    addReview: "შეფასების დამატება",
    deleting: "იშლება...",
    deleteReview: "შეფასების წაშლა",
    loginToReview: "შეფასების დასაწერად საჭიროა ავტორიზაცია.",
    login: "შესვლა",
    loadingReviews: "შეფასებები იტვირთება...",
    noReviewsYet: "შეფასებები ჯერ არ არის",
    beFirstReview: "პირველი შეფასება შენ დაამატე.",
    yourReview: "შენი შეფასება",
    user: "მომხმარებელი",
    importantInfo: "მნიშვნელოვანი ინფორმაცია",
    advanceBooking: "წინასწარი დაჯავშნა",
    advanceBookingText: "ტურის მოთხოვნა სასურველია წინასწარ გააგზავნო.",
    weather: "ამინდი",
    weatherText: "მარშრუტი შეიძლება შეიცვალოს ამინდის პირობების მიხედვით.",
    clothing: "ტანსაცმელი",
    clothingText: "თან იქონიე კომფორტული ფეხსაცმელი და შესაბამისი ტანსაცმელი.",
    confirmation: "დადასტურება",
    confirmationText: "დაჯავშნა საბოლოოდ დადასტურდება ორგანიზატორთან დაკავშირების შემდეგ.",
    otherTours: "სხვა ტურები",
    viewTour: "ტურის ნახვა",
    bookTour: "ტურის დაჯავშნა",
    fillAndSend: "შეავსე მონაცემები და გააგზავნე მოთხოვნა.",
    fullName: "სახელი და გვარი",
    namePlaceholder: "მაგალითად: Anna Brown",
    email: "ელფოსტა",
    phone: "ტელეფონის ნომერი",
    tourDate: "ტურის თარიღი",
    peopleCount: "ადამიანების რაოდენობა",
    notes: "დამატებითი შეტყობინება",
    notesPlaceholder: "მაგალითად: გვჭირდება სასტუმროდან აყვანა...",
    pricePeopleNote: "ადამიანების რაოდენობა ფასს არ ცვლის — მითითებული თანხა არის სრული ფასი.",
    submitting: "მოთხოვნა იგზავნება...",
    sendBookingRequest: "დაჯავშნის მოთხოვნის გაგზავნა",
    notAutoConfirmed: "მოთხოვნის გაგზავნა ავტომატურად დადასტურებულ ჯავშანს არ ნიშნავს.",
  },
  en: {
    invalidTourId: "Invalid tour ID.",
    tourNotFoundError: "Tour was not found or is not approved yet.",
    unknownLoadError: "An unknown error occurred while loading the tour.",
    unknownError: "An unknown error occurred.",
    tourInfoMissing: "Tour information could not be found.",
    nameRequired: "Enter the guest's full name.",
    emailRequired: "Enter an email address.",
    phoneRequired: "Enter a phone number.",
    dateRequired: "Choose a tour date.",
    pastDate: "You cannot choose a past date.",
    peopleMin: "Number of guests must be at least 1.",
    maxPeoplePrefix: "The maximum number of guests for this tour is",
    peopleWord: "people",
    bookingRequestFailed: "Could not send booking request",
    chooseRating: "Choose a rating from 1 to 5.",
    commentTooLong: "Comment cannot exceed 1000 characters.",
    reviewSaveFailed: "Could not save review",
    reviewUpdated: "Review updated successfully.",
    reviewAdded: "Review added successfully.",
    confirmDeleteReview: "Are you sure you want to delete your review?",
    reviewDeleteFailed: "Could not delete review",
    reviewDeleted: "Review deleted successfully.",
    loadingTour: "Loading tour information...",
    tourNotFound: "Tour not found",
    tryAgain: "Try again",
    allTours: "All tours",
    home: "Home",
    tourDetails: "Tour details",
    bookingSent: "Booking request sent successfully",
    bookingSentText: "Your request has been received. The tour organizer will contact you by phone or email.",
    available: "Available",
    untitledTour: "Untitled tour",
    georgia: "Georgia",
    noRatingYet: "No rating yet",
    reviewsCount: "reviews",
    tourPhotos: "Tour photos",
    photos: "photos",
    viewPhotos: "View photos",
    tourPhoto: "Tour photo",
    photo: "photo",
    tour: "tour",
    mainPhoto: "Main",
    location: "Location",
    duration: "Duration",
    price: "Price",
    maximum: "Maximum",
    notSpecified: "Not specified",
    tourDescription: "Tour description",
    noDescription: "A full tour description has not been added yet.",
    mayIncludeTitle: "What may be included",
    includeGuide: "Professional guide service",
    includePlanning: "Route planning",
    includeOrganization: "Tour organization",
    includeSupport: "Support during the tour",
    includeNote: "Confirm exact services with the organizer.",
    mayNotIncludeTitle: "What may not be included",
    excludeFood: "Food and drinks",
    excludeHotel: "Hotel accommodation",
    excludePersonal: "Personal expenses",
    excludeActivities: "Additional activities",
    excludeNote: "Terms may vary depending on the specific tour.",
    reviewsTitle: "Reviews and comments",
    editReview: "Edit review",
    rateTour: "Rate this tour",
    reviewHelp: "Choose the number of stars and write a comment.",
    yourRating: "Your rating",
    starWord: "stars",
    comment: "Comment",
    commentPlaceholder: "Write about your experience...",
    saving: "Saving...",
    updateReview: "Update review",
    addReview: "Add review",
    deleting: "Deleting...",
    deleteReview: "Delete review",
    loginToReview: "You need to sign in to write a review.",
    login: "Login",
    loadingReviews: "Loading reviews...",
    noReviewsYet: "No reviews yet",
    beFirstReview: "Be the first to add a review.",
    yourReview: "Your review",
    user: "User",
    importantInfo: "Important information",
    advanceBooking: "Advance booking",
    advanceBookingText: "It is best to send your tour request in advance.",
    weather: "Weather",
    weatherText: "The route may change depending on weather conditions.",
    clothing: "Clothing",
    clothingText: "Bring comfortable shoes and appropriate clothing.",
    confirmation: "Confirmation",
    confirmationText: "The booking is final after confirmation with the organizer.",
    otherTours: "Other tours",
    viewTour: "View tour",
    bookTour: "Book Tour",
    fillAndSend: "Fill in your details and send a request.",
    fullName: "Full name",
    namePlaceholder: "For example: Anna Brown",
    email: "Email",
    phone: "Phone number",
    tourDate: "Tour date",
    peopleCount: "Number of people",
    notes: "Additional message",
    notesPlaceholder: "For example: We need hotel pickup...",
    pricePeopleNote: "The number of people does not change the listed total price.",
    submitting: "Sending request...",
    sendBookingRequest: "Send booking request",
    notAutoConfirmed: "Sending a request does not automatically confirm the booking.",
  },
} as const;



function getLocalizedTourField(
  kaValue: string | null | undefined,
  enValue: string | null | undefined,
  language: "ka" | "en"
) {
  if (language === "en") {
    return enValue?.trim() || kaValue?.trim() || "";
  }

  return kaValue?.trim() || enValue?.trim() || "";
}

function formatTourPrice(tour: Tour, language: "ka" | "en") {
  if (
    tour.price_type === "negotiable" ||
    tour.price === null ||
    tour.price === undefined
  ) {
    return language === "ka" ? "ფასი შეთანხმებით" : "Contact for price";
  }

  const amount = Number(tour.price).toLocaleString(
    language === "ka" ? "ka-GE" : "en-US",
    { maximumFractionDigits: 2 }
  );

  return tour.price_currency === "USD"
    ? `$${amount}`
    : `${amount} ₾`;
}

function StarDisplay({ rating, language }: { rating: number; language: "ka" | "en" }) {
  return (
    <div
      className="flex gap-1"
      aria-label={`${rating.toFixed(1)} ${language === "ka" ? "ვარსკვლავი" : "stars"}`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= Math.round(rating)
              ? "text-amber-400"
              : "text-white/20"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

function OwnerCard({
  tour,
  language,
  canViewContact,
}: {
  tour: Tour;
  language: "ka" | "en";
  canViewContact: boolean;
}) {
  const organizerName =
    tour.organizer_name?.trim() || (language === "ka" ? "ტურის ორგანიზატორი" : "Tour organizer");

  const phone = tour.contact_phone?.trim() || "";

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-white/5 p-6 shadow-xl sm:p-8">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
        {language === "ka" ? "ტურის ორგანიზატორი" : "Tour organizer"}
      </p>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-cyan-500 text-5xl shadow-xl">
          👤
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-black">
              {organizerName}
            </h2>

            {organizerName === "Georgia Gateway Hub" && (
              <span className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-black text-white">
                Official
              </span>
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {language === "ka" ? "ამ ტურის საჯარო ორგანიზატორი" : "Public organizer for this tour"}
          </p>

          {phone && canViewContact ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-bold text-white transition hover:bg-cyan-600"
              >
                <span aria-hidden="true">📞</span>
                <span>{phone}</span>
              </a>

              {tour.has_whatsapp && (
                <a
                  href={getWhatsAppUrl(phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-white transition hover:bg-emerald-600"
                  aria-label={`${language === "ka" ? "WhatsApp-ზე დაკავშირება" : "Contact on WhatsApp"}: ${phone}`}
                >
                  <span aria-hidden="true">💬</span>
                  <span>WhatsApp</span>
                </a>
              )}

              {tour.has_viber && (
                <a
                  href={getViberUrl(phone)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white transition hover:bg-violet-700"
                  aria-label={`${language === "ka" ? "Viber-ზე დაკავშირება" : "Contact on Viber"}: ${phone}`}
                >
                  <span aria-hidden="true">📲</span>
                  <span>Viber</span>
                </a>
              )}
            </div>
          ) : (
            <div className="mt-5 inline-flex rounded-2xl border border-amber-300/30 bg-amber-500/10 px-5 py-3 font-bold text-amber-200">
              {phone
                ? language === "ka"
                  ? "🔒 ორგანიზატორის ნომერი გამოჩნდება ამ ტურის დაჯავშნის შემდეგ."
                  : "🔒 Organizer contact becomes visible after you book this tour."
                : language === "ka"
                  ? "⚠️ ორგანიზატორის ტელეფონის ნომერი ჯერ არ არის მითითებული"
                  : "⚠️ Organizer phone number is not available yet"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-white/40">
            {label}
          </p>

          <p className="mt-1 break-words font-bold text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  icon,
  title,
  items,
  note,
}: {
  icon: string;
  title: string;
  items: string[];
  note: string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <div className="text-4xl">{icon}</div>

      <h2 className="mt-4 text-2xl font-black">{title}</h2>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 text-white/70"
          >
            <span className="mt-1 text-cyan-300">•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/40">
        {note}
      </p>
    </section>
  );
}

function NoticeCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-3 font-black">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/55">
        {text}
      </p>
    </div>
  );
}

function PriceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  );
}


function normalizePhoneForMessenger(value: string) {
  const trimmedValue = value.trim();
  const hasPlus = trimmedValue.startsWith("+");
  const digits = trimmedValue.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return hasPlus ? `+${digits}` : digits;
}

function getWhatsAppUrl(phone: string) {
  const normalizedPhone = normalizePhoneForMessenger(phone).replace(
    /^\+/,
    ""
  );

  return normalizedPhone
    ? `https://wa.me/${normalizedPhone}`
    : "https://www.whatsapp.com/";
}

function getViberUrl(phone: string) {
  const normalizedPhone = normalizePhoneForMessenger(phone);

  return normalizedPhone
    ? `viber://chat?number=${encodeURIComponent(normalizedPhone)}`
    : "viber://chat";
}

function getLocalToday() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
}

function formatDate(value: string, language: "ka" | "en") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "ka" ? "ka-GE" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}