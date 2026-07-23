"use client";

import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Tour = {
  id: number | string;
  user_id: string | null;
  title: string | null;
  description: string | null;
  location: string | null;
  price: number | null;
  image_url: string | null;
  duration: string | null;
  start_date: string | null;
  max_people: number | null;
  category: string | null;
  status: string | null;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function EditTourPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const tourId = params?.id;

  const [currentUserId, setCurrentUserId] = useState("");
  const [originalTour, setOriginalTour] =
    useState<Tour | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [category, setCategory] = useState("");

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    async function loadTour() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      if (!tourId) {
        setMessage("ტურის ID არასწორია.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

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
            start_date,
            max_people,
            category,
            status
          `
        )
        .eq("id", tourId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Tour loading error:", error);

        setMessage(
          `ტურის ჩატვირთვა ვერ მოხერხდა: ${error.message}`
        );

        setMessageType("error");
        setLoading(false);
        return;
      }

      if (!data) {
        setMessage(
          "ტური ვერ მოიძებნა ან მისი შეცვლის უფლება არ გაქვს."
        );

        setMessageType("error");
        setLoading(false);
        return;
      }

      const loadedTour = data as Tour;

      setOriginalTour(loadedTour);
      setTitle(loadedTour.title || "");
      setDescription(loadedTour.description || "");
      setLocation(loadedTour.location || "");
      setPrice(
        loadedTour.price !== null
          ? String(loadedTour.price)
          : ""
      );
      setDuration(loadedTour.duration || "");
      setStartDate(loadedTour.start_date || "");
      setMaxPeople(
        loadedTour.max_people !== null
          ? String(loadedTour.max_people)
          : ""
      );
      setCategory(loadedTour.category || "");
      setPreviewUrl(loadedTour.image_url || "");

      setLoading(false);
    }

    loadTour();
  }, [router, tourId]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setMessage("");

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setMessage(
        "შეგიძლია ატვირთო მხოლოდ JPG, PNG ან WEBP ფოტო."
      );

      setMessageType("error");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setMessage(
        "ფოტოს ზომა არ უნდა აღემატებოდეს 10 MB-ს."
      );

      setMessageType("error");
      event.target.value = "";
      return;
    }

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function cancelNewImage() {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(null);
    setPreviewUrl(originalTour?.image_url || "");
    setMessage("");
  }

  async function uploadNewImage() {
    if (!imageFile) {
      return {
        publicUrl: originalTour?.image_url || "",
        filePath: "",
      };
    }

    const extension = getFileExtension(imageFile);

    const fileName = `tour-${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const filePath = `${currentUserId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("tour-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      throw new Error(
        `ახალი ფოტოს ატვირთვა ვერ მოხერხდა: ${uploadError.message}`
      );
    }

    const { data } = supabase.storage
      .from("tour-images")
      .getPublicUrl(filePath);

    return {
      publicUrl: data.publicUrl,
      filePath,
    };
  }

  async function updateTour(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!originalTour || !currentUserId) {
      setMessage("ტურის ინფორმაცია ვერ მოიძებნა.");
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

    setSaving(true);

    let newUploadedPath = "";

    try {
      const uploadedImage = await uploadNewImage();

      newUploadedPath = uploadedImage.filePath;

      const { data, error } = await supabase
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
          image_url: uploadedImage.publicUrl || null,
          status: "pending",
          approved_at: null,
        })
        .eq("id", originalTour.id)
        .eq("user_id", currentUserId)
        .select("id");

      if (error) {
        if (newUploadedPath) {
          await supabase.storage
            .from("tour-images")
            .remove([newUploadedPath]);
        }

        throw new Error(
          `ტურის განახლება ვერ მოხერხდა: ${error.message}`
        );
      }

      if (!data || data.length === 0) {
        if (newUploadedPath) {
          await supabase.storage
            .from("tour-images")
            .remove([newUploadedPath]);
        }

        throw new Error(
          "ტური არ განახლდა. გადაამოწმე UPDATE პოლიტიკა."
        );
      }

      if (
        imageFile &&
        originalTour.image_url &&
        originalTour.image_url !== uploadedImage.publicUrl
      ) {
        const oldImagePath = getStoragePathFromPublicUrl(
          originalTour.image_url,
          "tour-images"
        );

        if (oldImagePath) {
          const { error: oldImageDeleteError } =
            await supabase.storage
              .from("tour-images")
              .remove([oldImagePath]);

          if (oldImageDeleteError) {
            console.error(
              "Old image delete error:",
              oldImageDeleteError
            );
          }
        }
      }

      setMessage(
        "ტური წარმატებით განახლდა და ხელახლა გაიგზავნა დასამტკიცებლად."
      );

      setMessageType("success");

      router.push("/dashboard/my-tours");
      router.refresh();
    } catch (error) {
      console.error("Tour update error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა მოხდა."
      );

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
            ტურის ინფორმაცია იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  if (!originalTour) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
          <div className="text-7xl">❌</div>

          <h1 className="mt-5 text-2xl font-black">
            ტური ვერ მოიძებნა
          </h1>

          <p className="mt-3 text-white/60">
            {message}
          </p>

          <Link
            href="/dashboard/my-tours"
            className="mt-7 inline-flex rounded-2xl bg-cyan-500 px-6 py-3 font-bold transition hover:bg-cyan-600"
          >
            ჩემი ტურები
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              მომხმარებლის პანელი
            </p>

            <h1 className="mt-3 text-4xl font-black">
              ✏️ ტურის რედაქტირება
            </h1>

            <p className="mt-3 text-white/60">
              ცვლილების შენახვის შემდეგ ტური ხელახლა გადავა
              ადმინისტრატორის დასამტკიცებელ სიაში.
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
          onSubmit={updateTour}
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

              <FormField
                label="ფასი ერთ ადამიანზე"
                required
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  required
                  className="input"
                />
              </FormField>

              <FormField label="ხანგრძლივობა">
                <input
                  type="text"
                  value={duration}
                  onChange={(event) =>
                    setDuration(event.target.value)
                  }
                  placeholder="მაგალითად: 1 დღე"
                  className="input"
                />
              </FormField>

              <FormField label="დაწყების თარიღი">
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                  className="input"
                />
              </FormField>

              <FormField label="მაქსიმალური რაოდენობა">
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
              <FormField label="ტურის აღწერა" required>
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
              Cover image
            </p>

            <h2 className="mt-2 text-3xl font-black">
              ტურის მთავარი ფოტო
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              ახალი ფოტოს არჩევის შემთხვევაში ძველი ფოტო
              ავტომატურად შეიცვლება.
            </p>

            <label className="mt-6 block cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-cyan-500">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={saving}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="ტურის ფოტო"
                    className="h-[300px] w-full object-cover sm:h-[430px]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <p className="font-black">
                      📸 ფოტოს შესაცვლელად დააჭირე სურათს
                    </p>

                    {imageFile && (
                      <p className="mt-1 text-sm text-white/70">
                        ახალი ფოტო: {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                  <div className="text-7xl">📸</div>

                  <p className="mt-5 text-xl font-black">
                    აირჩიე ტურის ფოტო
                  </p>
                </div>
              )}
            </label>

            {imageFile && (
              <button
                type="button"
                onClick={cancelNewImage}
                disabled={saving}
                className="mt-4 rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
              >
                ახალი ფოტოს გაუქმება
              </button>
            )}
          </section>

          <div className="flex flex-col-reverse gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/my-tours")
              }
              disabled={saving}
              className="rounded-2xl bg-slate-200 px-7 py-4 font-bold text-slate-700 transition hover:bg-slate-300"
            >
              გაუქმება
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-cyan-600 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving
                ? "ცვლილებები ინახება..."
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
  children: ReactNode;
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

function getStoragePathFromPublicUrl(
  publicUrl: string,
  bucketName: string
) {
  if (!publicUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${bucketName}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const encodedPath = publicUrl.slice(
    markerIndex + marker.length
  );

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
}