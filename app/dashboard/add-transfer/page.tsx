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

const MAX_TRANSFER_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TRANSFER_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const TRANSFER_TYPES = [
  "Private Transfer",
  "Shared Transfer",
  "Airport Transfer",
  "4x4 Transfer",
  "Premium Transfer",
  "Group Transfer",
];

export default function AddTransferPage() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [returnPath, setReturnPath] = useState("/dashboard");
  const [checkingUser, setCheckingUser] = useState(true);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [transferType, setTransferType] = useState("Private Transfer");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [price, setPrice] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [seats, setSeats] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [contactPhone, setContactPhone] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasViber, setHasViber] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      setCheckingUser(true);

      try {
        let {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          const { data } = await supabase.auth.refreshSession();
          user = data.user ?? null;
        }

        if (!user) {
          const nextPath = encodeURIComponent("/dashboard/add-transfer");
          window.location.replace(`/login?next=${nextPath}`);
          return;
        }

        if (!mounted) return;

        setUserId(user.id);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("role, phone")
          .eq("id", user.id)
          .maybeSingle();

        const profile = profileData as Profile | null;
        const role = String(profile?.role ?? "").trim().toLowerCase();

        if (profile?.phone) setContactPhone(profile.phone);
        if (!mounted) return;

        setUserRole(role);

        if (role === "director" || role === "admin") {
          setReturnPath("/admin-v2");
        } else if (role === "staff") {
          setReturnPath("/staff");
        } else {
          setReturnPath("/dashboard");
        }
      } catch (error) {
        console.error("Authentication check error:", error);
        const nextPath = encodeURIComponent("/dashboard/add-transfer");
        window.location.replace(`/login?next=${nextPath}`);
      } finally {
        if (mounted) setCheckingUser(false);
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

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  function handleTransferImageChange(event: ChangeEvent<HTMLInputElement>) {
    setMessage("");
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    if (!ALLOWED_TRANSFER_IMAGE_TYPES.includes(file.type)) {
      setMessage("შეგიძლია ატვირთო მხოლოდ JPG, PNG ან WEBP ფოტო.");
      setMessageType("error");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_TRANSFER_IMAGE_SIZE) {
      setMessage("ფოტოს მაქსიმალური ზომაა 10 MB.");
      setMessageType("error");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    event.target.value = "";
  }

  async function uploadTransferImage() {
    if (!imageFile) {
      return {
        publicUrl: null as string | null,
        filePath: null as string | null,
      };
    }

    if (!userId) throw new Error("მომხმარებელი ვერ მოიძებნა.");

    const extension =
      imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath =
      `${userId}/transfer-${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("transfer-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      throw new Error(`ფოტოს ატვირთვა ვერ მოხერხდა: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from("transfer-images")
      .getPublicUrl(filePath);

    return {
      publicUrl: data.publicUrl,
      filePath,
    };
  }

  async function addTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setMessage("");

    if (!userId) {
      setMessage("მომხმარებელი ვერ მოიძებნა. თავიდან შედი ანგარიშზე.");
      setMessageType("error");
      return;
    }

    if (!title.trim()) {
      setMessage("ჩაწერე ტრანსფერის სახელი.");
      setMessageType("error");
      return;
    }

    if (!fromLocation.trim() || !toLocation.trim()) {
      setMessage("შეავსე ტრანსფერის საწყისი და საბოლოო მდებარეობა.");
      setMessageType("error");
      return;
    }

    const numericPrice = Number(price);

    if (!price || Number.isNaN(numericPrice) || numericPrice < 0) {
      setMessage("ჩაწერე სწორი ფასი.");
      setMessageType("error");
      return;
    }

    if (seats) {
      const numericSeats = Number(seats);

      if (!Number.isInteger(numericSeats) || numericSeats < 1) {
        setMessage("ადგილების რაოდენობა უნდა იყოს მინიმუმ 1.");
        setMessageType("error");
        return;
      }
    }

    if (!contactPhone.trim() || !isValidPhone(contactPhone)) {
      setMessage(
        "ტელეფონის ნომერი ჩაწერე საერთაშორისო ფორმატში, მაგალითად: +995555123456"
      );
      setMessageType("error");
      return;
    }

    setLoading(true);
    let uploadedFilePath: string | null = null;

    try {
      const uploadedImage = await uploadTransferImage();
      uploadedFilePath = uploadedImage.filePath;

      const { error } = await supabase.from("transfers").insert({
        user_id: userId,
        title: title.trim(),
        transfer_type: transferType,
        from_location: fromLocation.trim(),
        to_location: toLocation.trim(),
        price: numericPrice,
        vehicle: vehicle.trim() || null,
        seats: seats ? Number(seats) : null,
        description: description.trim() || null,
        image_url: uploadedImage.publicUrl,
        contact_phone: normalizePhone(contactPhone),
        has_whatsapp: hasWhatsapp,
        has_viber: hasViber,
        status: "pending",
      });

      if (error) {
        if (uploadedFilePath) {
          await supabase.storage
            .from("transfer-images")
            .remove([uploadedFilePath]);
        }
        throw error;
      }

      setMessage(
        "ტრანსფერი წარმატებით დაემატა და ელოდება ადმინისტრატორის დადასტურებას."
      );
      setMessageType("success");

      const destination =
        userRole === "director" || userRole === "admin"
          ? "/admin-v2/transfers"
          : "/dashboard";

      window.location.assign(destination);
    } catch (error) {
      const errorText =
        error instanceof Error ? error.message : "უცნობი შეცდომა მოხდა.";
      setMessage(`ტრანსფერის დამატება ვერ მოხერხდა: ${errorText}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">🚐</div>
          <p className="mt-4 text-lg font-semibold">გვერდი იტვირთება...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              Georgia Gateway Hub
            </p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              🚐 ტრანსფერის დამატება
            </h1>
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
            {messageType === "success" ? "✅ " : "❌ "}
            {message}
          </div>
        )}

        <form
          onSubmit={addTransfer}
          className="mt-8 space-y-6 rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8"
        >
          <Field label="ტრანსფერის სახელი" required>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="✈️ Kutaisi Airport → Mestia Private Transfer"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </Field>

          <Field label="ტრანსფერის ტიპი" required>
            <select
              value={transferType}
              onChange={(event) => setTransferType(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
            >
              {TRANSFER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="საიდან" required>
              <input
                type="text"
                value={fromLocation}
                onChange={(event) => setFromLocation(event.target.value)}
                placeholder="Kutaisi International Airport"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              />
            </Field>

            <Field label="სადამდე" required>
              <input
                type="text"
                value={toLocation}
                onChange={(event) => setToLocation(event.target.value)}
                placeholder="Mestia"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              />
            </Field>

            <Field label="ფასი (₾)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="250"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              />
            </Field>

            <Field label="მანქანა">
              <input
                type="text"
                value={vehicle}
                onChange={(event) => setVehicle(event.target.value)}
                placeholder="Mercedes Vito / Toyota 4x4"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              />
            </Field>

            <Field label="ადგილების რაოდენობა">
              <input
                type="number"
                min="1"
                step="1"
                value={seats}
                onChange={(event) => setSeats(event.target.value)}
                placeholder="7"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              />
            </Field>

            <Field label="ტრანსფერის ფოტო">
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
                <label
                  className={`inline-flex w-full cursor-pointer items-center justify-center rounded-2xl px-6 py-3 font-black text-white transition ${
                    loading
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-cyan-600 hover:bg-cyan-700"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleTransferImageChange}
                    disabled={loading}
                    className="hidden"
                  />
                  📷 ფოტოს ატვირთვა
                </label>

                {imagePreview && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <img
                      src={imagePreview}
                      alt="ტრანსფერის ფოტო"
                      className="h-64 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="w-full bg-red-50 px-4 py-3 font-bold text-red-700"
                    >
                      🗑️ ფოტოს მოცილება
                    </button>
                  </div>
                )}
              </div>
            </Field>
          </div>

          <Field label="ტრანსფერის აღწერა">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder="მოკლედ აღწერე მომსახურება..."
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </Field>

          <Field label="ტელეფონის ნომერი" required>
            <input
              type="tel"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="+995555123456"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <CheckBox
              label="WhatsApp"
              checked={hasWhatsapp}
              onChange={setHasWhatsapp}
              activeClass="border-emerald-500 bg-emerald-50"
            />
            <CheckBox
              label="Viber"
              checked={hasViber}
              onChange={setHasViber}
              activeClass="border-violet-500 bg-violet-50"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <Link
              href={returnPath}
              className="rounded-2xl bg-slate-200 px-7 py-4 text-center font-bold text-slate-700"
            >
              გაუქმება
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-cyan-600 px-8 py-4 text-lg font-black text-white disabled:bg-slate-400"
            >
              {loading ? "ინახება..." : "🚐 ტრანსფერის გაგზავნა"}
            </button>
          </div>
        </form>
      </div>
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
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function CheckBox({
  label,
  checked,
  onChange,
  activeClass,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  activeClass: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 ${
        checked ? activeClass : "border-slate-200 bg-slate-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5"
      />
      <span className="font-black text-slate-900">{label}</span>
    </label>
  );
}

function normalizePhone(phone: string) {
  const trimmedPhone = phone.trim();
  const hasPlus = trimmedPhone.startsWith("+");
  const digits = trimmedPhone.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function isValidPhone(phone: string) {
  return /^\+\d{8,15}$/.test(normalizePhone(phone));
}
