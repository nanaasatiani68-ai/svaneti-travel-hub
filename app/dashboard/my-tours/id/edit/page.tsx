"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 5;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type Tour = {
  id: number | string;
  user_id: string | null;
  title: string | null;
  description: string | null;
  location: string | null;
  price: number | null;
  duration: string | null;
  start_date: string | null;
  max_people: number | null;
  category: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  organizer_name: string | null;
  contact_phone: string | null;
  has_whatsapp: boolean | null;
  has_viber: boolean | null;
  status: string | null;
};

export default function EditTourPage() {
  const params = useParams<{ id: string }>();
  const tourId = params?.id;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [category, setCategory] = useState("");

  const [organizerName, setOrganizerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasViber, setHasViber] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    const urls = newImageFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setNewPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImageFiles]);

  useEffect(() => {
    async function loadTour() {
      setLoading(true);
      setMessage("");

      try {
        if (!tourId) {
          throw new Error("ტურის ID ვერ მოიძებნა.");
        }

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session loading error:", sessionError);
        }

        let user = sessionData.session?.user ?? null;

        if (!user) {
          const {
            data: userData,
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            console.error("User loading error:", userError);
          }

          user = userData.user;
        }

        if (!user) {
          const {
            data: refreshData,
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error(
              "Session refresh error:",
              refreshError
            );
          }

          user = refreshData.user ?? null;
        }

        if (!user) {
          window.location.replace(
            `/login?next=${encodeURIComponent(
              `/dashboard/my-tours/${tourId}/edit`
            )}`
          );
          return;
        }

        setUserId(user.id);

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
              duration,
              start_date,
              max_people,
              category,
              image_url,
              image_urls,
              organizer_name,
              contact_phone,
              has_whatsapp,
              has_viber,
              status
            `
          )
          .eq("id", tourId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("ტური ვერ მოიძებნა.");
        }

        const tour = data as Tour;

        if (tour.user_id !== user.id) {
          throw new Error(
            "ამ ტურის რედაქტირების უფლება არ გაქვს."
          );
        }

        setTitle(tour.title || "");
        setDescription(tour.description || "");
        setLocation(tour.location || "");
        setPrice(
          tour.price !== null && tour.price !== undefined
            ? String(tour.price)
            : ""
        );
        setDuration(tour.duration || "");
        setStartDate(tour.start_date || "");
        setMaxPeople(
          tour.max_people !== null &&
            tour.max_people !== undefined
            ? String(tour.max_people)
            : ""
        );
        setCategory(tour.category || "");
        setOrganizerName(tour.organizer_name || "");
        setContactPhone(tour.contact_phone || "");
        setHasWhatsapp(Boolean(tour.has_whatsapp));
        setHasViber(Boolean(tour.has_viber));

        const gallery = Array.isArray(tour.image_urls)
          ? tour.image_urls.filter(Boolean)
          : [];

        if (gallery.length > 0) {
          setExistingImages(gallery.slice(0, MAX_IMAGES));
        } else if (tour.image_url) {
          setExistingImages([tour.image_url]);
        } else {
          setExistingImages([]);
        }
      } catch (error) {
        console.error("Load tour error:", error);

        const text =
          error instanceof Error
            ? error.message
            : "უცნობი შეცდომა მოხდა.";

        setMessage(text);
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }

    void loadTour();
  }, [supabase, tourId]);

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setMessage("");

    const selectedFiles = Array.from(
      event.target.files ?? []
    );

    if (selectedFiles.length === 0) {
      return;
    }

    const currentTotal =
      existingImages.length + newImageFiles.length;

    for (const file of selectedFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setMessage(
          "შეგიძლია ატვირთო მხოლოდ JPG, PNG ან WEBP ფოტოები."
        );
        setMessageType("error");
        event.target.value = "";
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setMessage(
          `ფოტო "${file.name}" 10 MB-ზე მეტია.`
        );
        setMessageType("error");
        event.target.value = "";
        return;
      }
    }

    setNewImageFiles((currentFiles) => {
      const combined = [...currentFiles];

      selectedFiles.forEach((file) => {
        const alreadyExists = combined.some(
          (existingFile) =>
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.lastModified === file.lastModified
        );

        if (
          !alreadyExists &&
          existingImages.length + combined.length < MAX_IMAGES
        ) {
          combined.push(file);
        }
      });

      return combined;
    });

    if (
      currentTotal + selectedFiles.length >
      MAX_IMAGES
    ) {
      setMessage(
        `ერთ ტურზე მაქსიმუმ ${MAX_IMAGES} ფოტოს ატვირთვა შეგიძლია.`
      );
      setMessageType("error");
    }

    event.target.value = "";
  }

  function removeExistingImage(index: number) {
    setExistingImages((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );

    setMessage("");
  }

  function removeNewImage(index: number) {
    setNewImageFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );

    setMessage("");
  }

  async function uploadNewImages() {
    if (newImageFiles.length === 0) {
      return {
        publicUrls: [] as string[],
        filePaths: [] as string[],
      };
    }

    if (!userId) {
      throw new Error("მომხმარებელი ვერ მოიძებნა.");
    }

    const publicUrls: string[] = [];
    const filePaths: string[] = [];

    try {
      for (
        let index = 0;
        index < newImageFiles.length;
        index++
      ) {
        const file = newImageFiles[index];
        const extension = getFileExtension(file);
        const fileName =
          `tour-${Date.now()}-${index}-${crypto.randomUUID()}.${extension}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("tour-images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });

        if (uploadError) {
          throw new Error(
            `ფოტოს ატვირთვა ვერ მოხერხდა: ${uploadError.message}`
          );
        }

        const { data: publicUrlData } =
          supabase.storage
            .from("tour-images")
            .getPublicUrl(filePath);

        filePaths.push(filePath);
        publicUrls.push(publicUrlData.publicUrl);
      }

      return {
        publicUrls,
        filePaths,
      };
    } catch (error) {
      if (filePaths.length > 0) {
        await supabase.storage
          .from("tour-images")
          .remove(filePaths);
      }

      throw error;
    }
  }

  async function saveTour(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!tourId || !userId) {
      setMessage("ტურის ან მომხმარებლის მონაცემები ვერ მოიძებნა.");
      setMessageType("error");
      return;
    }

    if (!title.trim()) {
      setMessage("ჩაწერე ტურის სახელი.");
      setMessageType("error");
      return;
    }

    if (!description.trim()) {
      setMessage("ჩაწერე ტურის აღწერა.");
      setMessageType("error");
      return;
    }

    if (!location.trim()) {
      setMessage("ჩაწერე ტურის მდებარეობა.");
      setMessageType("error");
      return;
    }

    const numericPrice = Number(price);

    if (
      !price ||
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setMessage("ჩაწერე სწორი ფასი.");
      setMessageType("error");
      return;
    }

    if (maxPeople) {
      const numericMaxPeople = Number(maxPeople);

      if (
        !Number.isInteger(numericMaxPeople) ||
        numericMaxPeople < 1
      ) {
        setMessage(
          "ადამიანების მაქსიმალური რაოდენობა უნდა იყოს მინიმუმ 1."
        );
        setMessageType("error");
        return;
      }
    }

    if (startDate && startDate < getLocalToday()) {
      setMessage("გასული თარიღის არჩევა შეუძლებელია.");
      setMessageType("error");
      return;
    }

    if (!organizerName.trim()) {
      setMessage(
        "ჩაწერე ტურის ავტორის / ორგანიზატორის სახელი."
      );
      setMessageType("error");
      return;
    }

    if (!contactPhone.trim()) {
      setMessage(
        "ჩაწერე ტურის ორგანიზატორის ტელეფონის ნომერი."
      );
      setMessageType("error");
      return;
    }

    if (!isValidPhone(contactPhone)) {
      setMessage(
        "ტელეფონის ნომერი ჩაწერე საერთაშორისო ფორმატში, მაგალითად: +995555123456"
      );
      setMessageType("error");
      return;
    }

    if (
      existingImages.length + newImageFiles.length ===
      0
    ) {
      setMessage("ტურს მინიმუმ ერთი ფოტო უნდა ჰქონდეს.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    let uploadedFilePaths: string[] = [];

    try {
      const uploaded = await uploadNewImages();
      uploadedFilePaths = uploaded.filePaths;

      const allImages = [
        ...existingImages,
        ...uploaded.publicUrls,
      ].slice(0, MAX_IMAGES);

      const { error: updateError } = await supabase
        .from("tours")
        .update({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          price: numericPrice,
          duration: duration.trim() || null,
          start_date: startDate || null,
          max_people: maxPeople
            ? Number(maxPeople)
            : null,
          category: category || null,
          image_url: allImages[0] ?? null,
          image_urls: allImages,
          organizer_name: organizerName.trim(),
          contact_phone: normalizePhone(contactPhone),
          has_whatsapp: hasWhatsapp,
          has_viber: hasViber,

          // რედაქტირების შემდეგ კვლავ გადის ადმინისტრატორის შემოწმებას
          status: "pending",
          approved_at: null,
        })
        .eq("id", tourId)
        .eq("user_id", userId);

      if (updateError) {
        if (uploadedFilePaths.length > 0) {
          await supabase.storage
            .from("tour-images")
            .remove(uploadedFilePaths);
        }

        throw new Error(
          `ტურის განახლება ვერ მოხერხდა: ${updateError.message}`
        );
      }

      setMessage(
        "ტური წარმატებით განახლდა და კვლავ ელოდება ადმინისტრატორის დადასტურებას."
      );
      setMessageType("success");

      router.push("/dashboard/my-tours");
      router.refresh();
    } catch (error) {
      console.error("Update tour error:", error);

      const text =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა მოხდა.";

      setMessage(text);
      setMessageType("error");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">✏️</div>

          <p className="mt-4 text-lg font-semibold">
            ტურის მონაცემები იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  if (message && messageType === "error" && !title) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center">
          <div className="text-6xl">⚠️</div>

          <h1 className="mt-4 text-2xl font-black">
            ტური ვერ გაიხსნა
          </h1>

          <p className="mt-3 text-white/70">
            {message}
          </p>

          <Link
            href="/dashboard/my-tours"
            className="mt-6 inline-flex rounded-2xl bg-cyan-600 px-6 py-3 font-bold"
          >
            ← ჩემს ტურებზე დაბრუნება
          </Link>
        </div>
      </main>
    );
  }

  const totalImages =
    existingImages.length + newImageFiles.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              მომხმარებლის პანელი
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              ✏️ ტურის რედაქტირება
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-white/60">
              შეცვალე ტურის ინფორმაცია, ფოტოები და
              საკონტაქტო მონაცემები. მაქსიმუმ 5 ფოტო.
            </p>
          </div>

          <Link
            href="/dashboard/my-tours"
            className="w-fit rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
          >
            ← ჩემი ტურები
          </Link>
        </header>

        {message && (
          <div
            className={`mt-7 rounded-2xl border p-5 font-semibold ${
              messageType === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-400/30 bg-red-500/10 text-red-200"
            }`}
          >
            {messageType === "success" ? "✅ " : "❌ "}
            {message}
          </div>
        )}

        <form
          onSubmit={saveTour}
          className="mt-8 space-y-8 rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8"
        >
          <section>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Tour information
            </p>

            <h2 className="mt-2 text-3xl font-black">
              ტურის ინფორმაცია
            </h2>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <FormField label="ტურის სახელი" required>
                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  required
                  className="input"
                />
              </FormField>

              <FormField label="მდებარეობა" required>
                <input
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  required
                  className="input"
                />
              </FormField>

              <FormField label="ფასი" required>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    required
                    className="input pr-14"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₾
                  </span>
                </div>
              </FormField>

              <FormField label="ხანგრძლივობა">
                <input
                  type="text"
                  value={duration}
                  onChange={(event) =>
                    setDuration(event.target.value)
                  }
                  className="input"
                />
              </FormField>

              <FormField label="ტურის დაწყების თარიღი">
                <input
                  type="date"
                  value={startDate}
                  min={getLocalToday()}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                  className="input"
                />
              </FormField>

              <FormField label="ადამიანების მაქსიმალური რაოდენობა">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxPeople}
                  onChange={(event) =>
                    setMaxPeople(event.target.value)
                  }
                  className="input"
                />
              </FormField>

              <FormField label="კატეგორია">
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="input"
                >
                  <option value="">
                    აირჩიე კატეგორია
                  </option>
                  <option value="Hiking">
                    🥾 ლაშქრობა
                  </option>
                  <option value="Jeep Tour">
                    🚙 ჯიპ ტური
                  </option>
                  <option value="Horse Riding">
                    🐎 ცხენით გასეირნება
                  </option>
                  <option value="Cultural Tour">
                    🏛️ კულტურული ტური
                  </option>
                  <option value="Adventure">
                    🧗 სათავგადასავლო ტური
                  </option>
                  <option value="Sightseeing">
                    📸 ღირსშესანიშნაობები
                  </option>
                  <option value="Winter Tour">
                    ❄️ ზამთრის ტური
                  </option>
                </select>
              </FormField>
            </div>

            <div className="mt-5">
              <FormField
                label="ტურის სრული აღწერა"
                required
              >
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={7}
                  required
                  className="input resize-none"
                />
              </FormField>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Contact information
            </p>

            <h2 className="mt-2 text-3xl font-black">
              საკონტაქტო ინფორმაცია
            </h2>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <FormField
                label="ტურის ავტორი / ორგანიზატორი"
                required
              >
                <input
                  type="text"
                  value={organizerName}
                  onChange={(event) =>
                    setOrganizerName(event.target.value)
                  }
                  required
                  className="input"
                />
              </FormField>

              <FormField
                label="ტურის ორგანიზატორის ტელეფონის ნომერი"
                required
              >
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(event) =>
                    setContactPhone(event.target.value)
                  }
                  placeholder="+995555123456"
                  required
                  className="input"
                />
              </FormField>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${
                  hasWhatsapp
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 bg-slate-50 hover:border-emerald-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={hasWhatsapp}
                  onChange={(event) =>
                    setHasWhatsapp(event.target.checked)
                  }
                  className="h-5 w-5 accent-emerald-600"
                />

                <div>
                  <p className="font-black text-slate-900">
                    WhatsApp
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    ამ ნომერზე WhatsApp ხელმისაწვდომია
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${
                  hasViber
                    ? "border-violet-500 bg-violet-50"
                    : "border-slate-200 bg-slate-50 hover:border-violet-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={hasViber}
                  onChange={(event) =>
                    setHasViber(event.target.checked)
                  }
                  className="h-5 w-5 accent-violet-600"
                />

                <div>
                  <p className="font-black text-slate-900">
                    Viber
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    ამ ნომერზე Viber ხელმისაწვდომია
                  </p>
                </div>
              </label>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Tour gallery
            </p>

            <h2 className="mt-2 text-3xl font-black">
              📸 ტურის ფოტოები
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              მაქსიმუმ 5 ფოტო. პირველი ფოტო იქნება
              მთავარი ფოტო. შეგიძლია ძველი ფოტო წაშალო
              და ახალი დაამატო.
            </p>

            {existingImages.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 font-black text-slate-700">
                  არსებული ფოტოები
                </p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {existingImages.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm"
                    >
                      <div className="relative">
                        <img
                          src={url}
                          alt={`ტურის ფოტო ${index + 1}`}
                          className="h-48 w-full object-cover"
                        />

                        {index === 0 && (
                          <div className="absolute left-3 top-3 rounded-full bg-cyan-600 px-4 py-2 text-xs font-black text-white shadow-lg">
                            ⭐ მთავარი ფოტო
                          </div>
                        )}

                        <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-2 text-xs font-black text-white">
                          {index + 1}
                        </div>
                      </div>

                      <div className="p-4">
                        <button
                          type="button"
                          onClick={() =>
                            removeExistingImage(index)
                          }
                          disabled={saving}
                          className="w-full rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                        >
                          🗑️ ფოტოს წაშლა
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newPreviewUrls.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 font-black text-slate-700">
                  ახალი ფოტოები
                </p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {newPreviewUrls.map((url, index) => (
                    <div
                      key={url}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm"
                    >
                      <div className="relative">
                        <img
                          src={url}
                          alt={`ახალი ფოტო ${index + 1}`}
                          className="h-48 w-full object-cover"
                        />

                        {existingImages.length === 0 &&
                          index === 0 && (
                            <div className="absolute left-3 top-3 rounded-full bg-cyan-600 px-4 py-2 text-xs font-black text-white shadow-lg">
                              ⭐ მთავარი ფოტო
                            </div>
                          )}
                      </div>

                      <div className="p-4">
                        <p className="truncate text-sm font-semibold text-slate-600">
                          {newImageFiles[index]?.name}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            removeNewImage(index)
                          }
                          disabled={saving}
                          className="mt-3 w-full rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                        >
                          🗑️ ფოტოს მოცილება
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="mt-6 flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-cyan-500">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                disabled={
                  saving || totalImages >= MAX_IMAGES
                }
                className="hidden"
              />

              <div className="text-6xl">📷</div>

              <p className="mt-4 text-xl font-black">
                ახალი ფოტოების დასამატებლად დააჭირე აქ
              </p>

              <p className="mt-2 text-sm text-slate-500">
                სულ არის {totalImages} / {MAX_IMAGES} ფოტო
              </p>
            </label>

            {totalImages >= MAX_IMAGES && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                ✅ მაქსიმალური 5 ფოტო უკვე არჩეულია.
              </div>
            )}
          </section>

          <div className="flex flex-col-reverse gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/my-tours")
              }
              disabled={saving}
              className="rounded-2xl bg-slate-200 px-7 py-4 font-bold text-slate-700 transition hover:bg-slate-300 disabled:opacity-50"
            >
              გაუქმება
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-cyan-600 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:bg-cyan-700 disabled:bg-slate-400"
            >
              {saving
                ? "⏳ ინახება..."
                : "💾 ცვლილებების შენახვა"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

function getFileExtension(file: File) {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (
    extension &&
    ["jpg", "jpeg", "png", "webp"].includes(extension)
  ) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function getLocalToday() {
  const now = new Date();

  const timezoneOffset =
    now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
}

function normalizePhone(phone: string) {
  const trimmedPhone = phone.trim();
  const hasPlus = trimmedPhone.startsWith("+");

  const digits = trimmedPhone.replace(/\D/g, "");

  return hasPlus ? `+${digits}` : digits;
}

function isValidPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);

  return /^\+\d{8,15}$/.test(normalizedPhone);
}