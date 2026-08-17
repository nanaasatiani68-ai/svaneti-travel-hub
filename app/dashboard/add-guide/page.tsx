"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  role: string | null;
  phone: string | null;
};

type PriceOption = "negotiable" | "GEL" | "USD";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function AddGuidePage() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [returnPath, setReturnPath] = useState("/dashboard");

  const [checkingUser, setCheckingUser] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [priceOption, setPriceOption] =
    useState<PriceOption>("negotiable");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const [imageFile, setImageFile] =
    useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [phone, setPhone] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasViber, setHasViber] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      setCheckingUser(true);

      try {
        let {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("User loading error:", userError);
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
          const nextPath = encodeURIComponent(
            "/dashboard/add-guide"
          );

          window.location.replace(
            `/login?next=${nextPath}`
          );
          return;
        }

        if (!mounted) {
          return;
        }

        setUserId(user.id);

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Profile loading error:",
            profileError
          );
        }

        const profile =
          profileData as Profile | null;

        const role = String(profile?.role ?? "")
          .trim()
          .toLowerCase();

        if (!mounted) {
          return;
        }

        setUserRole(role);

        if (profile?.phone) {
          setPhone(profile.phone);
        }

        if (
          role === "director" ||
          role === "admin"
        ) {
          setReturnPath("/admin-v2");
        } else if (role === "staff") {
          setReturnPath("/staff");
        } else {
          setReturnPath("/dashboard");
        }
      } catch (error) {
        console.error(
          "Authentication check error:",
          error
        );

        const nextPath = encodeURIComponent(
          "/dashboard/add-guide"
        );

        window.location.replace(
          `/login?next=${nextPath}`
        );
      } finally {
        if (mounted) {
          setCheckingUser(false);
        }
      }
    }

    void checkUser();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

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
      setMessage("ფოტოს მაქსიმალური ზომაა 10 MB.");
      setMessageType("error");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    event.target.value = "";
  }

  async function uploadGuideImage() {
    if (!imageFile) {
      return {
        publicUrl: null as string | null,
        filePath: null as string | null,
      };
    }

    if (!userId) {
      throw new Error("მომხმარებელი ვერ მოიძებნა.");
    }

    const extension = getFileExtension(imageFile);
    const filePath =
      `${userId}/guide-${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("guide-images")
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
        .from("guide-images")
        .getPublicUrl(filePath);

    return {
      publicUrl: publicUrlData.publicUrl,
      filePath,
    };
  }

  async function addGuide(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setMessage("");

    if (!userId) {
      setMessage(
        "მომხმარებელი ვერ მოიძებნა. თავიდან შედი ანგარიშზე."
      );
      setMessageType("error");
      return;
    }

    if (!fullName.trim()) {
      setMessage("ჩაწერე გიდის სახელი.");
      setMessageType("error");
      return;
    }

    if (!location.trim()) {
      setMessage("ჩაწერე გიდის მდებარეობა.");
      setMessageType("error");
      return;
    }

    if (!languages.trim()) {
      setMessage(
        "ჩაწერე რა ენებზე შეუძლია გიდს მომსახურება."
      );
      setMessageType("error");
      return;
    }

    if (experienceYears) {
      const numericExperience =
        Number(experienceYears);

      if (
        !Number.isInteger(numericExperience) ||
        numericExperience < 0
      ) {
        setMessage(
          "გამოცდილების წლები ჩაწერე სწორად."
        );
        setMessageType("error");
        return;
      }
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

    if (!phone.trim()) {
      setMessage("ჩაწერე საკონტაქტო ტელეფონი.");
      setMessageType("error");
      return;
    }

    if (!isValidPhone(phone)) {
      setMessage(
        "ტელეფონის ნომერი ჩაწერე საერთაშორისო ფორმატში, მაგალითად: +995555123456"
      );
      setMessageType("error");
      return;
    }

    setSaving(true);

    let uploadedFilePath: string | null = null;

    try {
      const uploadedImage =
        await uploadGuideImage();

      uploadedFilePath =
        uploadedImage.filePath;

      const { error } = await supabase
        .from("guides")
        .insert({
          user_id: userId,
          full_name: fullName.trim(),
          location: location.trim(),
          languages: languages.trim(),
          experience_years: experienceYears
            ? Number(experienceYears)
            : null,
          price_per_day: numericPrice,
          price_type: isNegotiable
            ? "negotiable"
            : "fixed",
          price_currency: isNegotiable
            ? null
            : priceOption,
          description:
            description.trim() || null,
          image_url:
            uploadedImage.publicUrl,
          phone: normalizePhone(phone),
          has_whatsapp: hasWhatsapp,
          has_viber: hasViber,
          status: "pending",
        });

      if (error) {
        if (uploadedFilePath) {
          await supabase.storage
            .from("guide-images")
            .remove([uploadedFilePath]);
        }

        throw error;
      }

      setMessage(
        "გიდი წარმატებით დაემატა და ელოდება ადმინისტრატორის დადასტურებას."
      );
      setMessageType("success");

      const destination =
        userRole === "director" ||
        userRole === "admin"
          ? "/admin-v2/guides"
          : "/dashboard";

      window.location.assign(destination);
    } catch (error) {
      console.error("Add guide error:", error);

      const errorText =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა მოხდა.";

      setMessage(
        `გიდის დამატება ვერ მოხერხდა: ${errorText}`
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">
            🧑‍💼
          </div>
          <p className="mt-4 text-lg font-semibold">
            გვერდი იტვირთება...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-300">
              Georgia Gateway Hub
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              🧑‍💼 გიდის დამატება
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-white/60">
              ფოტო სურვილის მიხედვით შეგიძლია ატვირთო.
              ფასისთვის აირჩიე შეთანხმებით, ლარი ან დოლარი.
            </p>
          </div>

          <Link
            href={returnPath}
            className="w-fit rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
          >
            ← უკან დაბრუნება
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
            {messageType === "success"
              ? "✅ "
              : "❌ "}
            {message}
          </div>
        )}

        <form
          onSubmit={addGuide}
          className="mt-8 space-y-8 rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8"
        >
          <section>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-600">
              Guide information
            </p>

            <h2 className="mt-2 text-3xl font-black">
              გიდის ინფორმაცია
            </h2>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Field
                label="გიდის სახელი"
                required
              >
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  placeholder="მაგალითად: გიორგი სვანიძე"
                  required
                  className="input"
                />
              </Field>

              <Field
                label="მდებარეობა"
                required
              >
                <input
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value
                    )
                  }
                  placeholder="მაგალითად: მესტია, სვანეთი"
                  required
                  className="input"
                />
              </Field>

              <Field label="ენები" required>
                <input
                  type="text"
                  value={languages}
                  onChange={(event) =>
                    setLanguages(
                      event.target.value
                    )
                  }
                  placeholder="მაგალითად: ქართული, ინგლისური"
                  required
                  className="input"
                />
              </Field>

              <Field label="გამოცდილება (წელი)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={experienceYears}
                  onChange={(event) =>
                    setExperienceYears(
                      event.target.value
                    )
                  }
                  placeholder="მაგალითად: 5"
                  className="input"
                />
              </Field>

              <Field
                label="ფასის ტიპი"
                required
              >
                <select
                  value={priceOption}
                  onChange={(event) => {
                    const value =
                      event.target
                        .value as PriceOption;

                    setPriceOption(value);

                    if (
                      value === "negotiable"
                    ) {
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
              </Field>

              {priceOption !==
              "negotiable" ? (
                <Field
                  label={
                    priceOption === "USD"
                      ? "ფასი დღეზე ($)"
                      : "ფასი დღეზე (₾)"
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
                        setPrice(
                          event.target.value
                        )
                      }
                      placeholder="მაგალითად: 150"
                      required
                      className="input pr-14"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                      {priceOption === "USD"
                        ? "$"
                        : "₾"}
                    </span>
                  </div>
                </Field>
              ) : (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm font-semibold leading-6 text-violet-800">
                  🤝 საიტზე გამოჩნდება:
                  <strong>
                    {" "}
                    ფასი შეთანხმებით
                  </strong>
                </div>
              )}
            </div>

            <div className="mt-5">
              <Field label="გიდის აღწერა">
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={7}
                  placeholder="აღწერე გამოცდილება, სპეციალიზაცია, რეგიონები და მომსახურების პირობები..."
                  className="input resize-none"
                />
              </Field>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-600">
              Profile photo
            </p>

            <h2 className="mt-2 text-3xl font-black">
              📷 გიდის ფოტო
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              ფოტო აუცილებელი არ არის. სურვილის
              შემთხვევაში შეგიძლია ატვირთო JPG,
              PNG ან WEBP ფოტო, მაქსიმუმ 10 MB.
            </p>

            <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
              <label className="inline-flex cursor-pointer rounded-2xl bg-violet-600 px-6 py-3 font-black text-white transition hover:bg-violet-700">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={saving}
                  className="hidden"
                />
                📷 ფოტოს არჩევა
              </label>

              {!imageFile && (
                <p className="mt-3 text-sm text-slate-500">
                  ფოტო არ არის არჩეული — შეგიძლია
                  გიდი ფოტოს გარეშეც დაამატო.
                </p>
              )}

              {imagePreview && (
                <div className="mt-5 max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <img
                    src={imagePreview}
                    alt="გიდის ფოტოს წინასწარი ნახვა"
                    className="h-72 w-full object-cover"
                  />

                  <div className="p-4">
                    <p className="truncate text-sm font-semibold text-slate-600">
                      {imageFile?.name}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setImageFile(null)
                      }
                      disabled={saving}
                      className="mt-3 w-full rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200"
                    >
                      🗑️ ფოტოს მოცილება
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-600">
              Contact information
            </p>

            <h2 className="mt-2 text-3xl font-black">
              საკონტაქტო ინფორმაცია
            </h2>

            <div className="mt-7">
              <Field
                label="ტელეფონის ნომერი"
                required
              >
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="+995555123456"
                  required
                  className="input"
                />
              </Field>
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
                    setHasWhatsapp(
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-emerald-600"
                />

                <div>
                  <p className="font-black text-slate-900">
                    WhatsApp
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    ამ ნომერზე WhatsApp
                    ხელმისაწვდომია
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
                    setHasViber(
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-violet-600"
                />

                <div>
                  <p className="font-black text-slate-900">
                    Viber
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    ამ ნომერზე Viber
                    ხელმისაწვდომია
                  </p>
                </div>
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-8 sm:flex-row sm:justify-end">
            <Link
              href={returnPath}
              className="rounded-2xl bg-slate-200 px-7 py-4 text-center font-bold text-slate-700 transition hover:bg-slate-300"
            >
              გაუქმება
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-violet-600 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving
                ? "ინახება..."
                : "🧑‍💼 გიდის გაგზავნა"}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.75rem 1rem;
          color: rgb(15 23 42);
          outline: none;
          transition: 0.2s ease;
        }

        .input:focus {
          border-color: rgb(124 58 237);
          box-shadow: 0 0 0 4px rgb(237 233 254);
        }
      `}</style>
    </main>
  );
}

function Field({
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
          <span className="ml-1 text-red-500">
            *
          </span>
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
    ["jpg", "jpeg", "png", "webp"].includes(
      extension
    )
  ) {
    return extension === "jpeg"
      ? "jpg"
      : extension;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function normalizePhone(phone: string) {
  const trimmedPhone = phone.trim();
  const hasPlus =
    trimmedPhone.startsWith("+");
  const digits =
    trimmedPhone.replace(/\D/g, "");

  return hasPlus
    ? `+${digits}`
    : digits;
}

function isValidPhone(phone: string) {
  const normalizedPhone =
    normalizePhone(phone);

  return /^\+\d{8,15}$/.test(
    normalizedPhone
  );
}