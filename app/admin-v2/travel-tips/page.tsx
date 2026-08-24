"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type TravelTip = {
  id: string;
  title_ka: string;
  title_en: string | null;
  description_ka: string | null;
  description_en: string | null;
  best_time_ka: string | null;
  best_time_en: string | null;
  tip_ka: string | null;
  tip_en: string | null;
  image_url: string | null;
  is_published: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type FormState = {
  id: string | null;
  title_ka: string;
  title_en: string;
  description_ka: string;
  description_en: string;
  best_time_ka: string;
  best_time_en: string;
  tip_ka: string;
  tip_en: string;
  image_url: string;
  is_published: boolean;
  sort_order: number;
};

const emptyForm: FormState = {
  id: null,
  title_ka: "",
  title_en: "",
  description_ka: "",
  description_en: "",
  best_time_ka: "",
  best_time_en: "",
  tip_ka: "",
  tip_en: "",
  image_url: "",
  is_published: true,
  sort_order: 0,
};

export default function TravelTipsAdminPage() {
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<TravelTip[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      window.location.replace(
        `/login?next=${encodeURIComponent("/admin-v2/travel-tips")}`
      );
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    const role = String(profile?.role || "").toLowerCase();

    if (role !== "director" && role !== "admin") {
      window.location.replace("/dashboard");
      return;
    }

    const { data, error } = await supabase
      .from("travel_tips")
      .select(`
        id,
        title_ka,
        title_en,
        description_ka,
        description_en,
        best_time_ka,
        best_time_en,
        tip_ka,
        tip_en,
        image_url,
        is_published,
        sort_order,
        created_at,
        updated_at
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setItems((data as TravelTip[] | null) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("აირჩიე სურათის ფაილი.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("travel-tips")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("travel-tips")
        .getPublicUrl(path);

      setForm((current) => ({
        ...current,
        image_url: data.publicUrl,
      }));

      setMessage("✅ ფოტო წარმატებით აიტვირთა.");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "ფოტოს ატვირთვა ვერ მოხერხდა.";
      setMessage(errorMessage);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function saveTravelTip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title_ka.trim()) {
      setMessage("ქართული სათაური აუცილებელია.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      title_ka: form.title_ka.trim(),
      title_en: form.title_en.trim() || null,
      description_ka: form.description_ka.trim() || null,
      description_en: form.description_en.trim() || null,
      best_time_ka: form.best_time_ka.trim() || null,
      best_time_en: form.best_time_en.trim() || null,
      tip_ka: form.tip_ka.trim() || null,
      tip_en: form.tip_en.trim() || null,
      image_url: form.image_url.trim() || null,
      is_published: form.is_published,
      sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
      updated_at: new Date().toISOString(),
    };

    if (form.id) {
      const { error } = await supabase
        .from("travel_tips")
        .update(payload)
        .eq("id", form.id);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("✅ ჩანაწერი განახლდა.");
    } else {
      const { error } = await supabase
        .from("travel_tips")
        .insert(payload);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("✅ ახალი ადგილი დაემატა.");
    }

    setForm(emptyForm);
    setSaving(false);
    await load();
  }

  function editItem(item: TravelTip) {
    setForm({
      id: item.id,
      title_ka: item.title_ka || "",
      title_en: item.title_en || "",
      description_ka: item.description_ka || "",
      description_en: item.description_en || "",
      best_time_ka: item.best_time_ka || "",
      best_time_en: item.best_time_en || "",
      tip_ka: item.tip_ka || "",
      tip_en: item.tip_en || "",
      image_url: item.image_url || "",
      is_published: item.is_published ?? true,
      sort_order: item.sort_order ?? 0,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function togglePublished(item: TravelTip) {
    setMessage("");

    const nextValue = !(item.is_published ?? true);

    const { error } = await supabase
      .from("travel_tips")
      .update({
        is_published: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((current) =>
      current.map((row) =>
        row.id === item.id
          ? {
              ...row,
              is_published: nextValue,
            }
          : row
      )
    );

    setMessage(
      nextValue
        ? "✅ ადგილი გამოქვეყნდა."
        : "✅ ადგილი დამალულია საჯარო გვერდიდან."
    );
  }

  async function deleteItem(item: TravelTip) {
    const confirmed = window.confirm(
      `წავშალოთ "${item.title_ka}"? ეს მოქმედება უკან ვერ დაბრუნდება.`
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setMessage("");

    const { error } = await supabase
      .from("travel_tips")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      setDeletingId(null);
      return;
    }

    setItems((current) => current.filter((row) => row.id !== item.id));

    if (form.id === item.id) {
      setForm(emptyForm);
    }

    setMessage("✅ ადგილი წაიშალა.");
    setDeletingId(null);
  }

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((item) =>
      [
        item.title_ka,
        item.title_en,
        item.description_ka,
        item.description_en,
        item.best_time_ka,
        item.best_time_en,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [items, search]);

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
              Travel Tips Management
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              სვანეთის ადგილები და რჩევები
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-white/55">
              აქედან შეგიძლია დაამატო ახალი ადგილი, ატვირთო ფოტო,
              შეცვალო ტექსტი და გადაწყვიტო გამოჩნდეს თუ არა მთავარ გვერდზე.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin-v2"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold transition hover:bg-white/10"
            >
              ← Director Panel
            </Link>

            <Link
              href="/"
              className="rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950 transition hover:bg-emerald-400"
            >
              მთავარი გვერდი
            </Link>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            {message}
          </div>
        )}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                {form.id ? "Edit Place" : "Add New Place"}
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {form.id ? "ადგილის რედაქტირება" : "ახალი ადგილის დამატება"}
              </h2>
            </div>

            {form.id && (
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold transition hover:bg-white/10"
              >
                + ახალი ჩანაწერი
              </button>
            )}
          </div>

          <form onSubmit={saveTravelTip} className="mt-6 space-y-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <FormField label="ქართული სათაური *">
                <input
                  type="text"
                  value={form.title_ka}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title_ka: event.target.value,
                    }))
                  }
                  placeholder="მაგ: უშგული"
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="English Title">
                <input
                  type="text"
                  value={form.title_en}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title_en: event.target.value,
                    }))
                  }
                  placeholder="Example: Ushguli"
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <FormField label="მოკლე აღწერა ქართულად">
                <textarea
                  value={form.description_ka}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description_ka: event.target.value,
                    }))
                  }
                  placeholder="მოკლე ინფორმაცია ადგილის შესახებ..."
                  rows={4}
                  className={textareaClass}
                />
              </FormField>

              <FormField label="Short Description in English">
                <textarea
                  value={form.description_en}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description_en: event.target.value,
                    }))
                  }
                  placeholder="Short information about this place..."
                  rows={4}
                  className={textareaClass}
                />
              </FormField>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <FormField label="საუკეთესო დრო">
                <input
                  type="text"
                  value={form.best_time_ka}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      best_time_ka: event.target.value,
                    }))
                  }
                  placeholder="მაგ: მაისი — ოქტომბერი"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Best Time in English">
                <input
                  type="text"
                  value={form.best_time_en}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      best_time_en: event.target.value,
                    }))
                  }
                  placeholder="Example: May — October"
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <FormField label="რჩევა ქართულად">
                <textarea
                  value={form.tip_ka}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tip_ka: event.target.value,
                    }))
                  }
                  placeholder="მაგ: დილით გასვლა სჯობს..."
                  rows={4}
                  className={textareaClass}
                />
              </FormField>

              <FormField label="Tip in English">
                <textarea
                  value={form.tip_en}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tip_en: event.target.value,
                    }))
                  }
                  placeholder="Example: An early start is best..."
                  rows={4}
                  className={textareaClass}
                />
              </FormField>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
              <div>
                <FormField label="ფოტო">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="block w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:font-bold file:text-slate-950"
                  />
                </FormField>

                <p className="mt-2 text-xs text-white/45">
                  ფოტო აიტვირთება Supabase Storage-ის{" "}
                  <strong>travel-tips</strong> bucket-ში.
                </p>

                {uploading && (
                  <p className="mt-2 text-sm font-bold text-cyan-300">
                    ფოტო იტვირთება...
                  </p>
                )}

                <div className="mt-4">
                  <FormField label="Image URL">
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          image_url: event.target.value,
                        }))
                      }
                      placeholder="ფოტოს URL ავტომატურად ჩაიწერება"
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center text-6xl">
                    🏔️
                  </div>
                )}

                <div className="p-3 text-center text-xs text-white/45">
                  ფოტო Preview
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="რიგითობა">
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sort_order: Number(event.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <label className="flex cursor-pointer items-center gap-3 self-end rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_published: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-emerald-500"
                />

                <div>
                  <p className="font-black">გამოქვეყნებულია</p>
                  <p className="text-xs text-white/45">
                    გამოჩნდეს მთავარ გვერდზე
                  </p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-2xl bg-emerald-500 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "ინახება..."
                : form.id
                ? "💾 ცვლილებების შენახვა"
                : "➕ ადგილის დამატება"}
            </button>
          </form>
        </section>

        <section className="mt-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                Existing Places
              </p>

              <h2 className="mt-1 text-2xl font-black">
                დამატებული ადგილები
              </h2>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ძებნა..."
              className="w-full rounded-xl bg-white px-4 py-3 text-slate-900 outline-none sm:max-w-xs"
            />
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/55">
              იტვირთება...
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/55">
              ჩანაწერები ჯერ არ არის.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title_ka}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-black/20 text-6xl">
                      🏔️
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">
                          {item.title_ka}
                        </h3>

                        {item.title_en && (
                          <p className="mt-1 text-sm text-white/45">
                            {item.title_en}
                          </p>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          item.is_published
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-slate-500/25 text-slate-300"
                        }`}
                      >
                        {item.is_published ? "Published" : "Hidden"}
                      </span>
                    </div>

                    {item.description_ka && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/60">
                        {item.description_ka}
                      </p>
                    )}

                    <div className="mt-4 grid gap-2 text-sm text-white/60">
                      <p>🗓️ {item.best_time_ka || "—"}</p>
                      <p>💡 {item.tip_ka || "—"}</p>
                      <p>↕️ რიგი: {item.sort_order ?? 0}</p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editItem(item)}
                        className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-400"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void togglePublished(item)}
                        className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black transition hover:bg-white/20"
                      >
                        {item.is_published ? "Hide" : "Publish"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteItem(item)}
                        disabled={deletingId === item.id}
                        className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-black text-red-200 transition hover:bg-red-500/30 disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/70">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400";

const textareaClass =
  "w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400";