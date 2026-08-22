"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Role = "director" | "admin" | "user";

export default function EditTransferPage() {
  const params = useParams<{ id: string }>();
  const transferId = params?.id;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [role, setRole] = useState<Role>("user");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [transferType, setTransferType] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [priceType, setPriceType] = useState<"fixed" | "negotiable" | "from">("fixed");
  const [price, setPrice] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [seats, setSeats] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [contactPhone, setContactPhone] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasViber, setHasViber] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      if (!transferId) return;

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        window.location.replace(`/login?next=${encodeURIComponent(`/dashboard/my-transfers/${transferId}/edit`)}`);
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const normalized = String(profile?.role || "").toLowerCase();
      const resolvedRole: Role =
        normalized === "director" ? "director" : normalized === "admin" ? "admin" : "user";
      setRole(resolvedRole);

      let query = supabase
        .from("transfers")
        .select(`
          id,user_id,title,transfer_type,from_location,to_location,price,price_type,
          vehicle,seats,description,image_url,contact_phone,has_whatsapp,has_viber,status
        `)
        .eq("id", transferId);

      if (resolvedRole === "user") {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        setMessage(error?.message || "ამ ტრანსფერის რედაქტირების უფლება არ გაქვს.");
        setLoading(false);
        return;
      }

      setTitle(data.title || "");
      setTransferType(data.transfer_type || "");
      setFromLocation(data.from_location || "");
      setToLocation(data.to_location || "");
      setPriceType((data.price_type || "fixed") as "fixed" | "negotiable" | "from");
      setPrice(data.price == null ? "" : String(data.price));
      setVehicle(data.vehicle || "");
      setSeats(data.seats == null ? "" : String(data.seats));
      setDescription(data.description || "");
      setImageUrl(data.image_url || "");
      setContactPhone(data.contact_phone || "");
      setHasWhatsapp(Boolean(data.has_whatsapp));
      setHasViber(Boolean(data.has_viber));
      setLoading(false);
    }

    void load();
  }, [supabase, transferId]);

  function pickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("მხოლოდ JPG, PNG ან WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("ფოტოს მაქსიმალური ზომაა 10MB.");
      return;
    }
    setImageFile(file);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!transferId || !userId) return;

    if (!title.trim() || !fromLocation.trim() || !toLocation.trim()) {
      setMessage("შეავსე სათაური და მარშრუტი.");
      return;
    }

    if (priceType !== "negotiable") {
      const numeric = Number(price);
      if (!price || Number.isNaN(numeric) || numeric < 0) {
        setMessage("ჩაწერე სწორი ფასი.");
        return;
      }
    }

    setSaving(true);
    setMessage("");

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/transfer-edit-${Date.now()}-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("transfer-images")
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false });

        if (uploadError) throw uploadError;

        finalImageUrl = supabase.storage.from("transfer-images").getPublicUrl(path).data.publicUrl;
      }

      const status = role === "director" || role === "admin" ? "approved" : "pending";

      let updateQuery = supabase
        .from("transfers")
        .update({
          title: title.trim(),
          transfer_type: transferType.trim() || null,
          from_location: fromLocation.trim(),
          to_location: toLocation.trim(),
          price_type: priceType,
          price: priceType === "negotiable" ? null : Number(price),
          vehicle: vehicle.trim() || null,
          seats: seats ? Number(seats) : null,
          description: description.trim() || null,
          image_url: finalImageUrl || null,
          contact_phone: contactPhone.trim() || null,
          has_whatsapp: hasWhatsapp,
          has_viber: hasViber,
          status,
        })
        .eq("id", transferId);

      if (role === "user") {
        updateQuery = updateQuery.eq("user_id", userId);
      }

      const { data, error } = await updateQuery.select("id,status").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("ტრანსფერი არ განახლდა. შეამოწმე RLS policy.");

      setMessage(
        status === "approved"
          ? "✅ ცვლილებები შენახულია და ტრანსფერი approved დარჩა."
          : "✅ ცვლილებები შენახულია. ტრანსფერი ისევ ელოდება დირექტორის დამტკიცებას."
      );

      setTimeout(() => {
        router.push(role === "director" || role === "admin" ? "/admin-v2/transfers" : "/dashboard/my-transfers");
        router.refresh();
      }, 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "განახლება ვერ მოხერხდა.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="p-8">იტვირთება...</main>;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Edit Transfer</p>
            <h1 className="mt-2 text-4xl font-black">ტრანსფერის რედაქტირება</h1>
          </div>
          <Link href={role === "director" || role === "admin" ? "/admin-v2/transfers" : "/dashboard/my-transfers"} className="h-fit rounded-xl bg-white/10 px-4 py-2 font-bold">
            ← უკან
          </Link>
        </div>

        {message && <div className="mt-6 rounded-2xl bg-white/10 p-4">{message}</div>}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-3xl bg-white p-6 text-slate-900 sm:p-8">
          <Field label="სათაური" required>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" required />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="ტრანსფერის ტიპი">
              <input value={transferType} onChange={(e) => setTransferType(e.target.value)} placeholder="Private / Airport / Shared..." className="input" />
            </Field>
            <Field label="მანქანა">
              <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="input" />
            </Field>
            <Field label="საიდან" required>
              <input value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} className="input" required />
            </Field>
            <Field label="სადამდე" required>
              <input value={toLocation} onChange={(e) => setToLocation(e.target.value)} className="input" required />
            </Field>
            <Field label="ფასის ტიპი" required>
              <select value={priceType} onChange={(e) => setPriceType(e.target.value as "fixed" | "negotiable" | "from")} className="input">
                <option value="fixed">Fixed price / ფიქსირებული</option>
                <option value="negotiable">Negotiable / შეთანხმებით</option>
                <option value="from">From / ფასი იწყება</option>
              </select>
            </Field>
            <Field label="ფასი (₾)" required={priceType !== "negotiable"}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={priceType === "negotiable"}
                className="input disabled:bg-slate-100"
              />
            </Field>
            <Field label="ადგილები">
              <input type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} className="input" />
            </Field>
            <Field label="ტელეფონი">
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="input" />
            </Field>
          </div>

          <Field label="აღწერა">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="input resize-none" />
          </Field>

          <Field label="ახალი ფოტო">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickImage} className="input" />
          </Field>

          {imageUrl && !imageFile && <img src={imageUrl} alt="Current transfer" className="h-64 w-full rounded-2xl object-cover" />}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 font-bold">
              <input type="checkbox" checked={hasWhatsapp} onChange={(e) => setHasWhatsapp(e.target.checked)} />
              WhatsApp
            </label>
            <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 font-bold">
              <input type="checkbox" checked={hasViber} onChange={(e) => setHasViber(e.target.checked)} />
              Viber
            </label>
          </div>

          <button disabled={saving} className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-lg font-black text-white disabled:opacity-50">
            {saving ? "ინახება..." : "💾 ცვლილებების შენახვა"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          outline: none;
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
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}{required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}