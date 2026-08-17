"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 5;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function AddTourPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [checkingUser, setCheckingUser] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [priceOption, setPriceOption] = useState<
    "negotiable" | "GEL" | "USD"
  >("negotiable");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [category, setCategory] = useState("");

  const [contactPhone, setContactPhone] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasViber, setHasViber] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    async function checkUser() {
      setCheckingUser(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session loading error:", sessionError);
      }

      let authenticatedUser = session?.user ?? null;

      if (!authenticatedUser) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("User loading error:", userError);
        }

        authenticatedUser = user;
      }

      if (!authenticatedUser) {
        router.replace("/login");
        return;
      }

      setUserId(authenticatedUser.id);

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("phone")
          .eq("id", authenticatedUser.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Profile phone loading error:",
          profileError
        );
      }

      if (profile?.phone) {
        setContactPhone(profile.phone);
      }

      setCheckingUser(false);
    }

    checkUser();
  }, [router, supabase]);

  useEffect(() => {
    const urls = imageFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [imageFiles]);

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

    setImageFiles((currentFiles) => {
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
          combined.length < MAX_IMAGES
        ) {
          combined.push(file);
        }
      });

      return combined;
    });

    if (
      imageFiles.length + selectedFiles.length >
      MAX_IMAGES
    ) {
      setMessage(
        `ერთ ტურზე მაქსიმუმ ${MAX_IMAGES} ფოტოს ატვირთვა შეგიძლია.`
      );
      setMessageType("error");
    }

    event.target.value = "";
  }

  function removeSelectedImage(index: number) {
    setImageFiles((currentFiles) =>
      currentFiles.filter(
        (_, fileIndex) => fileIndex !== index
      )
    );

    setMessage("");
  }

  async function uploadImages() {
    if (imageFiles.length === 0) {
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
        index < imageFiles.length;
        index++
      ) {
        const imageFile = imageFiles[index];

        const extension =
          getFileExtension(imageFile);
        const randomPart =
          crypto.randomUUID();

        const fileName =
          `tour-${Date.now()}-${index}-${randomPart}.${extension}`;

        const filePath =
          `${userId}/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
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

        const { data: publicUrlData } =
          supabase.storage
            .from("tour-images")
            .getPublicUrl(filePath);

        filePaths.push(filePath);
        publicUrls.push(
          publicUrlData.publicUrl
        );
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

    const isNegotiable =
      priceOption === "negotiable";

    const numericPrice = isNegotiable
      ? null
      : Number(price);

    if (
      !isNegotiable &&
      (!price ||
        numericPrice === null ||
        Number.isNaN(numericPrice) ||
        numericPrice < 0)
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

    if (imageFiles.length === 0) {
      setMessage(
        "აირჩიე მინიმუმ ერთი ფოტო."
      );
      setMessageType("error");
      return;
    }

    setSaving(true);

    let uploadedFilePaths: string[] = [];

    try {
      const uploadedImages =
        await uploadImages();

      uploadedFilePaths =
        uploadedImages.filePaths;

      const firstImage =
        uploadedImages.publicUrls[0] ??
        null;

      const { error: insertError } = await supabase
        .from("tours")
        .insert({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          price: numericPrice,
          price_type: isNegotiable ? "negotiable" : "fixed",
          price_currency: isNegotiable ? null : priceOption,
          duration: duration.trim() || null,
          start_date: startDate || null,
          max_people: maxPeople
            ? Number(maxPeople)
            : null,
          category: category || null,
          image_url: firstImage,
          image_urls:
            uploadedImages.publicUrls,
          user_id: userId,
          status: "pending",
          contact_phone: normalizePhone(contactPhone),
          has_whatsapp: hasWhatsapp,
          has_viber: hasViber,
        });

      if (insertError) {
        if (uploadedFilePaths.length > 0) {
          await supabase.storage
            .from("tour-images")
            .remove(uploadedFilePaths);
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
              შეავსე ტურის ინფორმაცია და ატვირთე მაქსიმუმ 5 ფოტო.
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
                label="ფასის ტიპი"
                required
              >
                <select
                  value={priceOption}
                  onChange={(event) => {
                    const value = event.target.value as
                      | "negotiable"
                      | "GEL"
                      | "USD";

                    setPriceOption(value);

                    if (value === "negotiable") {
                      setPrice("");
                    }
                  }}
                  className="input"
                >
                  <option value="negotiable">
                    🤝 ფასი შეთანხმებით
                  </option>
                  <option value="GEL">
                    ₾ ფასი ლარში
                  </option>
                  <option value="USD">
                    $ ფასი დოლარში
                  </option>
                </select>
              </FormField>

              {priceOption !== "negotiable" ? (
                <FormField
                  label={
                    priceOption === "USD"
                      ? "ფასი დოლარში ($)"
                      : "ფასი ლარში (₾)"
                  }
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
                      {priceOption === "USD" ? "$" : "₾"}
                    </span>
                  </div>
                </FormField>
              ) : (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-800">
                  🤝 საიტზე გამოჩნდება: <strong>ფასი შეთანხმებით</strong>
                </div>
              )}

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
              Contact information
            </p>

            <h2 className="mt-2 text-3xl font-black">
              საკონტაქტო ინფორმაცია
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              ჩაწერე საერთაშორისო ფორმატის ნომერი. უცხოელი
              ტურისტი ამ ნომრით შეძლებს WhatsApp-ზე ან Viber-ზე
              დაკავშირებას.
            </p>

            <div className="mt-7">
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

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  გამოიყენე ქვეყნის კოდი, მაგალითად:
                  +995555123456
                </p>
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

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-2xl text-white">
                  ☎
                </div>

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

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-2xl text-white">
                  📞
                </div>

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

            {!hasWhatsapp && !hasViber && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                ℹ️ WhatsApp ან Viber მონიშნული არ არის.
                მომხმარებელი მხოლოდ ჩვეულებრივი ზარით შეძლებს
                დაკავშირებას.
              </div>
            )}
          </section>

          <section className="border-t border-slate-200 pt-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Tour gallery
            </p>

            <h2 className="mt-2 text-3xl font-black">
              📸 ტურის ფოტოები
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              შეგიძლია ატვირთო მაქსიმუმ 5 ფოტო.
              პირველი ფოტო იქნება ტურის მთავარი ფოტო.
              თითოეული ფოტოს მაქსიმალური ზომაა 10 MB.
            </p>

            <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-black text-slate-900">
                    📷 დაამატე ფოტო
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    არჩეულია {imageFiles.length} / {MAX_IMAGES} ფოტო
                  </p>
                </div>

                <label
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 font-black text-white shadow-lg transition sm:w-auto ${
                    saving ||
                    imageFiles.length >= MAX_IMAGES
                      ? "cursor-not-allowed bg-slate-400"
                      : "cursor-pointer bg-cyan-600 hover:bg-cyan-700"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageChange}
                    disabled={
                      saving ||
                      imageFiles.length >= MAX_IMAGES
                    }
                    className="hidden"
                  />

                  {imageFiles.length === 0
                    ? "➕ ფოტოს დამატება"
                    : imageFiles.length >= MAX_IMAGES
                      ? "✅ 5 ფოტო დამატებულია"
                      : "➕ კიდევ ფოტოს დამატება"}
                </label>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                ტელეფონიდან შეგიძლია ფოტოები მონიშნო ერთდროულად
                ან ღილაკს რამდენჯერმე დააჭირო.
              </p>
            </div>

            {previewUrls.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {previewUrls.map(
                  (url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm"
                    >
                      <div className="relative">
                        <img
                          src={url}
                          alt={`ტურის ფოტო ${
                            index + 1
                          }`}
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
                        <p className="truncate text-sm font-semibold text-slate-600">
                          {
                            imageFiles[index]
                              ?.name
                          }
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            removeSelectedImage(
                              index
                            )
                          }
                          disabled={saving}
                          className="mt-3 w-full rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                        >
                          🗑️ ფოტოს მოცილება
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {imageFiles.length >= MAX_IMAGES && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                ✅ 5 ფოტო უკვე არჩეულია.
              </div>
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
                ? `ტური და ${imageFiles.length} ფოტო ინახება...`
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