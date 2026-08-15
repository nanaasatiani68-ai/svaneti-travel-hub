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

type Tour = {
  id: number | string;
  user_id: string | null;
  title: string | null;
  description: string | null;
  location: string | null;
  price: number | null;
  image_url: string | null;
  image_urls: string[] | null;
  duration: string | null;
  max_people: number | null;
  category: string | null;
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
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tourId = params?.id;

  const [tour, setTour] = useState<Tour | null>(null);
  const [ownerTours, setOwnerTours] = useState<Tour[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState("");

  const [currentUserId, setCurrentUserId] = useState("");
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
  }, [tourId]);

  const loadTour = useCallback(async () => {
    setLoadingTour(true);
    setErrorMessage("");
    setTour(null);
    setOwnerTours([]);

    try {
      if (!tourId) {
        throw new Error("ტურის ID არასწორია.");
      }

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
            image_urls,
            duration,
            max_people,
            category,
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
          "ტური ვერ მოიძებნა ან ჯერ არ არის დამტკიცებული."
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
            description,
            location,
            price,
            image_url,
            image_urls,
            duration,
            max_people,
            category,
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
          : "ტურის ჩატვირთვისას უცნობი შეცდომა დაფიქსირდა.";

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
      } catch (error) {
        console.error(
          "Current user loading error:",
          error
        );
      }
    }

    void loadCurrentUser();
  }, []);

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

  const totalPrice = useMemo(() => {
    if (tour?.price === null || tour?.price === undefined) {
      return null;
    }

    return Number(tour.price);
  }, [tour?.price]);

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
      setErrorMessage("ტურის ინფორმაცია ვერ მოიძებნა.");
      return;
    }

    if (!guestName.trim()) {
      setErrorMessage("ჩაწერე სტუმრის სახელი და გვარი.");
      return;
    }

    if (!guestEmail.trim()) {
      setErrorMessage("ჩაწერე ელფოსტა.");
      return;
    }

    if (!guestPhone.trim()) {
      setErrorMessage("ჩაწერე ტელეფონის ნომერი.");
      return;
    }

    if (!bookingDate) {
      setErrorMessage("აირჩიე ტურის თარიღი.");
      return;
    }

    if (bookingDate < today) {
      setErrorMessage("გასული თარიღის არჩევა შეუძლებელია.");
      return;
    }

    if (!Number.isInteger(people) || people < 1) {
      setErrorMessage(
        "სტუმრების რაოდენობა უნდა იყოს მინიმუმ 1."
      );
      return;
    }

    if (tour.max_people && people > tour.max_people) {
      setErrorMessage(
        `ამ ტურზე მაქსიმალური რაოდენობაა ${tour.max_people} ადამიანი.`
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
            "დაჯავშნის მოთხოვნა ვერ გაიგზავნა."
        );
      }

      if (result.emailWarning) {
        console.warn("Booking email warning:", result.emailWarning);
      }

      setSuccess(true);
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
          : "უცნობი შეცდომა დაფიქსირდა.";

      setErrorMessage(
        `დაჯავშნის მოთხოვნა ვერ გაიგზავნა: ${message}`
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
      setReviewMessage("ტურის ინფორმაცია ვერ მოიძებნა.");
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
      setReviewMessage("აირჩიე შეფასება 1-დან 5-მდე.");
      setReviewMessageType("error");
      return;
    }

    if (reviewComment.trim().length > 1000) {
      setReviewMessage(
        "კომენტარი არ უნდა აღემატებოდეს 1000 სიმბოლოს."
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
        `შეფასების შენახვა ვერ მოხერხდა: ${error.message}`
      );

      setReviewMessageType("error");
      setSavingReview(false);
      return;
    }

    setReviewMessage(
      myReview
        ? "შეფასება წარმატებით განახლდა."
        : "შეფასება წარმატებით დაემატა."
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
      "ნამდვილად გინდა შეფასების წაშლა?"
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
        `შეფასების წაშლა ვერ მოხერხდა: ${error.message}`
      );

      setReviewMessageType("error");
      setDeletingReview(false);
      return;
    }

    setReviewRating(5);
    setReviewComment("");
    setReviewMessage("შეფასება წარმატებით წაიშალა.");
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
            ტურის ინფორმაცია იტვირთება...
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
            ტური ვერ მოიძებნა
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
              ხელახლა ცდა
            </button>

            <Link
              href="/tours"
              className="rounded-2xl bg-cyan-500 px-6 py-3 font-bold transition hover:bg-cyan-600"
            >
              ყველა ტური
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
            >
              მთავარი გვერდი
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
                ტურის დეტალები
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/tours"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20"
            >
              ← ყველა ტური
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
              ✅ დაჯავშნის მოთხოვნა წარმატებით გაიგზავნა
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
                    alt={tour.title || "Tour"}
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
                      ✓ ხელმისაწვდომია
                    </span>

                    {tour.category && (
                      <span className="rounded-full border border-white/20 bg-slate-950/60 px-4 py-2 text-xs font-bold backdrop-blur-md">
                        {tour.category}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-4 text-3xl font-black drop-shadow-xl sm:text-5xl">
                    {tour.title || "უსახელო ტური"}
                  </h1>

                  <p className="mt-3 text-lg text-white/80">
                    📍 {tour.location || "საქართველო"}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <StarDisplay rating={averageRating} />

                    <span className="font-black">
                      {reviews.length > 0
                        ? averageRating.toFixed(1)
                        : "ჯერ არ არის შეფასება"}
                    </span>

                    {reviews.length > 0 && (
                      <span className="text-sm text-white/65">
                        ({reviews.length} შეფასება)
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
                      Tour gallery
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      📸 ტურის ფოტოები
                    </h2>
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                    {galleryImages.length} ფოტო
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {galleryImages.map((image, index) => {
                    const active = image === selectedImage;

                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        className={`group relative overflow-hidden rounded-2xl border-2 transition ${
                          active
                            ? "border-cyan-400 ring-2 ring-cyan-400/30"
                            : "border-white/10 hover:border-white/30"
                        }`}
                        aria-label={`ტურის ფოტო ${index + 1}`}
                      >
                        <img
                          src={image}
                          alt={`${tour.title || "ტური"} - ფოტო ${index + 1}`}
                          className="h-24 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-28"
                        />

                        <span className="absolute right-2 top-2 rounded-full bg-slate-950/75 px-2 py-1 text-[10px] font-black text-white">
                          {index + 1}
                        </span>

                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 rounded-full bg-cyan-500 px-2 py-1 text-[10px] font-black text-white">
                            მთავარი
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
                  label="მდებარეობა"
                  value={tour.location || "არ არის მითითებული"}
                  icon="📍"
                />

                <InfoBox
                  label="ხანგრძლივობა"
                  value={tour.duration || "არ არის მითითებული"}
                  icon="⏱️"
                />

                <InfoBox
                  label="ფასი"
                  value={
                    tour.price !== null
                      ? `${Number(tour.price).toLocaleString("ka-GE")} ₾`
                      : "შეთანხმებით"
                  }
                  icon="💰"
                />

                <InfoBox
                  label="მაქსიმუმ"
                  value={
                    tour.max_people
                      ? `${tour.max_people} ადამიანი`
                      : "არ არის მითითებული"
                  }
                  icon="👥"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                Tour description
              </p>

              <h2 className="mt-3 text-3xl font-black">
                ტურის აღწერა
              </h2>

              <p className="mt-5 whitespace-pre-line leading-8 text-white/70">
                {tour.description ||
                  "ტურის სრული აღწერა ჯერ არ არის დამატებული."}
              </p>
            </section>

            <OwnerCard tour={tour} />

            <section className="grid gap-5 md:grid-cols-2">
              <DetailCard
                icon="✅"
                title="რა შეიძლება შედიოდეს ფასში"
                items={[
                  "პროფესიონალი გიდის მომსახურება",
                  "მარშრუტის დაგეგმვა",
                  "ტურის ორგანიზება",
                  "ტურის დროს მხარდაჭერა",
                ]}
                note="ზუსტი მომსახურებები გადაამოწმე ორგანიზატორთან."
              />

              <DetailCard
                icon="❌"
                title="რა შეიძლება არ შედიოდეს ფასში"
                items={[
                  "კვება და სასმელი",
                  "სასტუმროში განთავსება",
                  "პირადი ხარჯები",
                  "დამატებითი აქტივობები",
                ]}
                note="პირობები შეიძლება განსხვავდებოდეს კონკრეტული ტურის მიხედვით."
              />
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                    Reviews
                  </p>

                  <h2 className="mt-3 text-3xl font-black">
                    ⭐ შეფასებები და კომენტარები
                  </h2>
                </div>

                <div className="rounded-2xl bg-white/10 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <StarDisplay rating={averageRating} />

                    <span className="text-xl font-black">
                      {reviews.length > 0
                        ? averageRating.toFixed(1)
                        : "0.0"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-white/50">
                    {reviews.length} შეფასება
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

              {currentUserId ? (
                <form
                  onSubmit={saveReview}
                  className="mt-7 rounded-3xl bg-white p-6 text-slate-900"
                >
                  <h3 className="text-2xl font-black">
                    {myReview
                      ? "შეფასების შეცვლა"
                      : "ტურის შეფასება"}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    აირჩიე ვარსკვლავების რაოდენობა და დაწერე
                    კომენტარი.
                  </p>

                  <div className="mt-5">
                    <p className="mb-3 text-sm font-bold text-slate-700">
                      შენი შეფასება
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
                          aria-label={`${star} ვარსკვლავი`}
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
                      კომენტარი
                    </span>

                    <textarea
                      value={reviewComment}
                      onChange={(event) =>
                        setReviewComment(event.target.value)
                      }
                      placeholder="დაწერე შენი გამოცდილების შესახებ..."
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
                        ? "ინახება..."
                        : myReview
                          ? "შეფასების განახლება"
                          : "შეფასების დამატება"}
                    </button>

                    {myReview && (
                      <button
                        type="button"
                        onClick={deleteReview}
                        disabled={deletingReview}
                        className="rounded-2xl bg-red-600 px-6 py-3 font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingReview
                          ? "იშლება..."
                          : "შეფასების წაშლა"}
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="mt-7 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6 text-center">
                  <p className="font-bold">
                    შეფასების დასაწერად საჭიროა ავტორიზაცია.
                  </p>

                  <Link
                    href="/login"
                    className="mt-4 inline-flex rounded-2xl bg-cyan-500 px-6 py-3 font-black transition hover:bg-cyan-600"
                  >
                    შესვლა
                  </Link>
                </div>
              )}

              <div className="mt-8 space-y-4">
                {loadingReviews ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
                    შეფასებები იტვირთება...
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                    <div className="text-5xl">⭐</div>

                    <h3 className="mt-4 text-xl font-black">
                      შეფასებები ჯერ არ არის
                    </h3>

                    <p className="mt-2 text-white/55">
                      პირველი შეფასება შენ დაამატე.
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
                                  ? "შენი შეფასება"
                                  : "მომხმარებელი"}
                              </h3>

                              <p className="text-xs text-white/40">
                                {formatDate(review.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <StarDisplay rating={review.rating} />
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
                Important information
              </p>

              <h2 className="mt-3 text-3xl font-black">
                მნიშვნელოვანი ინფორმაცია
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <NoticeCard
                  icon="📅"
                  title="წინასწარი დაჯავშნა"
                  text="ტურის მოთხოვნა სასურველია წინასწარ გააგზავნო."
                />

                <NoticeCard
                  icon="🌦️"
                  title="ამინდი"
                  text="მარშრუტი შეიძლება შეიცვალოს ამინდის პირობების მიხედვით."
                />

                <NoticeCard
                  icon="🥾"
                  title="ტანსაცმელი"
                  text="თან იქონიე კომფორტული ფეხსაცმელი და შესაბამისი ტანსაცმელი."
                />

                <NoticeCard
                  icon="📞"
                  title="დადასტურება"
                  text="დაჯავშნა საბოლოოდ დადასტურდება ორგანიზატორთან დაკავშირების შემდეგ."
                />
              </div>
            </section>

            {ownerTours.length > 0 && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                  More tours
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  სხვა ტურები
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
                            alt={ownerTour.title || "Tour"}
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
                          {ownerTour.title || "უსახელო ტური"}
                        </h3>

                        <p className="mt-2 text-sm text-white/60">
                          📍 {ownerTour.location || "საქართველო"}
                        </p>

                        <p className="mt-4 text-xl font-black text-cyan-300">
                          {ownerTour.price !== null
                            ? `${Number(
                                ownerTour.price
                              ).toLocaleString("ka-GE")} ₾`
                            : "შეთანხმებით"}
                        </p>

                        <div className="mt-4 text-sm font-bold text-cyan-300">
                          ტურის ნახვა →
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
                Booking
              </p>

              <h2 className="mt-2 text-3xl font-black">
                ტურის დაჯავშნა
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                შეავსე მონაცემები და გააგზავნე მოთხოვნა.
              </p>
            </div>

            {errorMessage && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <FormField label="სახელი და გვარი">
                <input
                  type="text"
                  value={guestName}
                  onChange={(event) =>
                    setGuestName(event.target.value)
                  }
                  placeholder="მაგალითად: Anna Brown"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label="ელფოსტა">
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

              <FormField label="ტელეფონის ნომერი">
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
                <FormField label="ტურის თარიღი">
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

                <FormField label="ადამიანების რაოდენობა">
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

              <FormField label="დამატებითი შეტყობინება">
                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="მაგალითად: გვჭირდება სასტუმროდან აყვანა..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </FormField>

              <div className="rounded-2xl bg-slate-100 p-5">
                <PriceRow
                  label="ფასი"
                  value={
                    tour.price !== null
                      ? `${Number(tour.price).toLocaleString("ka-GE")} ₾`
                      : "შეთანხმებით"
                  }
                />

                <PriceRow
                  label="ადამიანების რაოდენობა"
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
                      {totalPrice !== null
                        ? `${totalPrice.toLocaleString("ka-GE")} ₾`
                        : "შეთანხმებით"}
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
                  ? "მოთხოვნა იგზავნება..."
                  : "დაჯავშნის მოთხოვნის გაგზავნა"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                მოთხოვნის გაგზავნა ავტომატურად დადასტურებულ
                ჯავშანს არ ნიშნავს.
              </p>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div
      className="flex gap-1"
      aria-label={`${rating.toFixed(1)} ვარსკვლავი`}
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
}: {
  tour: Tour;
}) {
  const organizerName =
    tour.organizer_name?.trim() || "ტურის ორგანიზატორი";

  const phone = tour.contact_phone?.trim() || "";

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-white/5 p-6 shadow-xl sm:p-8">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
        Tour organizer
      </p>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-cyan-500 text-5xl shadow-xl">
          👤
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-black">
            {organizerName}
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/55">
            ამ ტურის საჯარო ორგანიზატორი
          </p>

          {phone ? (
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
                  aria-label={`WhatsApp-ზე დაკავშირება: ${phone}`}
                >
                  <span aria-hidden="true">💬</span>
                  <span>WhatsApp</span>
                </a>
              )}

              {tour.has_viber && (
                <a
                  href={getViberUrl(phone)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white transition hover:bg-violet-700"
                  aria-label={`Viber-ზე დაკავშირება: ${phone}`}
                >
                  <span aria-hidden="true">📲</span>
                  <span>Viber</span>
                </a>
              )}
            </div>
          ) : (
            <div className="mt-5 inline-flex rounded-2xl border border-amber-300/30 bg-amber-500/10 px-5 py-3 font-bold text-amber-200">
              ⚠️ ორგანიზატორის ტელეფონის ნომერი ჯერ არ არის მითითებული
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}