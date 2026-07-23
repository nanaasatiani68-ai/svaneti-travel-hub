"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function AddTourPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [checkingUser, setCheckingUser] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [category, setCategory] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    async function checkUser() {
      setCheckingUser(true);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setCheckingUser(false);
    }

    checkUser();
  }, [router]);

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

    const newPreviewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setPreviewUrl(newPreviewUrl);
  }

  function removeSelectedImage() {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(null);
    setPreviewUrl("");
    setMessage("");
  }

  async function uploadImage() {
    if (!imageFile) {
      return {
        publicUrl: "",
        filePath: "",
      };
    }

    if (!userId) {
      throw new Error("მომხმარებელი ვერ მოიძებნა.");
    }

    const extension = getFileExtension(imageFile);

    const randomPart = crypto.randomUUID();

    const fileName = `tour-${Date.now()}-${randomPart}.${extension}`;

    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("tour-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      throw new Error(
        `ფოტოს ატვირთვა ვერ მოხერხდა: ${uploadError.message}`
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("tour-images")
      .getPublicUrl(filePath);

    return {
      publicUrl: publicUrlData.publicUrl,
      filePath,
    };
  }

  async function addTour(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!userId) {
      setMessage("მომხმარებელი ვერ მოიძებნა.");
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

    setSaving(true);

    let uploadedFilePath = "";

    try {
      const uploadedImage = await uploadImage();

      uploadedFilePath = uploadedImage.filePath;

      const { error: insertError } = await supabase
        .from("tours")
        .insert({
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
          user_id: userId,
          status: "pending",
        });

      if (insertError) {
        if (uploadedFilePath) {
          await supabase.storage
            .from("tour-images")
            .remove([uploadedFilePath]);
        }

        throw new Error(
          `ტურის შენახვა ვერ მოხერხდა: ${insertError.message}`
        );
      }

      setMessage(
        "ტური წარმატებით დაემატა და ელოდება ადმინისტრატორის დადასტურებას."
      );
      setMessageType("success");

      router.push("/dashboard/my-tours");
      router.refresh();
    } catch (error) {
      console.error("Add tour error:", error);

      const errorText =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა მოხდა.";

      setMessage(errorText);
      setMessageType("error");
      setSaving(false);
    }
  }

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">🏔️</div>

          <p className="mt-4 text-lg font-semibold">
            გვერდი იტვირთება...
          </p>
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

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              ➕ ახალი ტურის დამატება
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-white/60">
              შეავსე ტურის ინფორმაცია და ატვირთე მთავარი ფოტო.
              ტური გამოქვეყნდება ადმინისტრატორის დადასტურების
              შემდეგ.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
          >
            ← Dashboard
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
          onSubmit={addTour}
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
              <FormField
                label="ტურის სახელი"
                required
              >
                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="მაგალითად: უშგულის ერთდღიანი ტური"
                  required
                  className="input"
                />
              </FormField>

              <FormField
                label="მდებარეობა"
                required
              >
                <input
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  placeholder="მაგალითად: უშგული, სვანეთი"
                  required
                  className="input"
                />
              </FormField>

              <FormField
                label="ფასი ერთ ადამიანზე"
                required
              >
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    placeholder="მაგალითად: 150"
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
                  placeholder="მაგალითად: 1 დღე"
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
                  placeholder="მაგალითად: 12"
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
                  placeholder="აღწერე მარშრუტი, მომსახურება, შეხვედრის ადგილი და მნიშვნელოვანი პირობები..."
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
              დასაშვებია JPG, PNG ან WEBP. მაქსიმალური ზომაა
              10 MB.
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
                    alt="ტურის ფოტოს წინასწარი ნახვა"
                    className="h-[280px] w-full object-cover sm:h-[420px]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <p className="font-black">
                      📸 ფოტო არჩეულია
                    </p>

                    <p className="mt-1 break-words text-sm text-white/70">
                      {imageFile?.name}
                    </p>

                    <p className="mt-1 text-xs text-white/55">
                      სხვა ფოტოს ასარჩევად დააჭირე სურათს
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center">
                  <div className="text-7xl">📸</div>

                  <p className="mt-5 text-xl font-black text-slate-800">
                    ფოტოს ასარჩევად დააჭირე აქ
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    შეგიძლია აირჩიო ფოტო ტელეფონიდან ან
                    კომპიუტერიდან
                  </p>
                </div>
              )}
            </label>

            {previewUrl && (
              <button
                type="button"
                onClick={removeSelectedImage}
                disabled={saving}
                className="mt-4 rounded-2xl bg-red-100 px-5 py-3 font-bold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                🗑️ არჩეული ფოტოს მოცილება
              </button>
            )}
          </section>

          <div className="flex flex-col-reverse gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              disabled={saving}
              className="rounded-2xl bg-slate-200 px-7 py-4 font-bold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              გაუქმება
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-cyan-600 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving
                ? "ტური და ფოტო ინახება..."
                : "🏔️ ტურის გაგზავნა"}
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

  if (extension && ["jpg", "jpeg", "png", "webp"].includes(extension)) {
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
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
}