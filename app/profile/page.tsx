"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type ProfileForm = {
  full_name: string;
  phone: string;
  country: string;
  city: string;
  bio: string;
  avatar_url: string;
};

const emptyProfile: ProfileForm = {
  full_name: "",
  phone: "",
  country: "",
  city: "",
  bio: "",
  avatar_url: "",
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<ProfileForm>(emptyProfile);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    async function loadProfile() {
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

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            full_name,
            phone,
            country,
            city,
            bio,
            avatar_url
          `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile loading error:", error);

        setMessage(
          `პროფილის ჩატვირთვა ვერ მოხერხდა: ${error.message}`
        );

        setMessageType("error");
        setLoading(false);
        return;
      }

      setProfile({
        full_name:
          data?.full_name ||
          user.user_metadata?.full_name ||
          "",
        phone: data?.phone || "",
        country: data?.country || "",
        city: data?.city || "",
        bio: data?.bio || "",
        avatar_url: data?.avatar_url || "",
      });

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("პროფილის შესანახად საჭიროა ავტორიზაცია.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    if (!profile.full_name.trim()) {
      setMessage("ჩაწერე სახელი და გვარი.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    const profileValues = {
      id: user.id,
      full_name: profile.full_name.trim(),
      phone: profile.phone.trim() || null,
      country: profile.country.trim() || null,
      city: profile.city.trim() || null,
      bio: profile.bio.trim() || null,
      avatar_url: profile.avatar_url.trim() || null,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(profileValues, {
        onConflict: "id",
      });

    if (error) {
      console.error("Profile saving error:", error);

      setMessage(
        `პროფილის შენახვა ვერ მოხერხდა: ${error.message}`
      );

      setMessageType("error");
      setSaving(false);
      return;
    }

    await supabase.auth.updateUser({
      data: {
        full_name: profile.full_name.trim(),
      },
    });

    setMessage("პროფილი წარმატებით შეინახა.");
    setMessageType("success");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">👤</div>

          <p className="mt-4 text-lg font-semibold">
            პროფილი იტვირთება...
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
              👤 ჩემი პროფილი
            </h1>

            <p className="mt-3 text-white/60">
              შეავსე ინფორმაცია, რომელიც შენს ტურებზე გამოჩნდება.
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
            className={`mt-7 rounded-2xl border p-4 font-semibold ${
              messageType === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-400/30 bg-red-500/10 text-red-200"
            }`}
          >
            {messageType === "success" ? "✅ " : "❌ "}
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl lg:sticky lg:top-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Profile"}
                className="mx-auto h-44 w-44 rounded-full border-4 border-cyan-400/30 object-cover shadow-2xl"
              />
            ) : (
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border-4 border-cyan-400/30 bg-cyan-500/20 text-7xl shadow-2xl">
                👤
              </div>
            )}

            <h2 className="mt-5 text-2xl font-black">
              {profile.full_name || "მომხმარებელი"}
            </h2>

            <p className="mt-2 break-words text-sm text-white/50">
              {email}
            </p>

            {(profile.city || profile.country) && (
              <p className="mt-3 text-white/65">
                📍 {[profile.city, profile.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}

            {profile.phone && (
              <p className="mt-3 text-white/65">
                📞 {profile.phone}
              </p>
            )}

            <div className="mt-6 rounded-2xl bg-cyan-500/10 p-4 text-left">
              <p className="text-sm font-bold text-cyan-200">
                საჯარო ინფორმაცია
              </p>

              <p className="mt-2 text-xs leading-5 text-white/50">
                სახელი, ფოტო, ქალაქი, აღწერა და ტელეფონი გამოჩნდება
                შენს ტურის გვერდზე.
              </p>
            </div>
          </aside>

          <form
            onSubmit={saveProfile}
            className="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8"
          >
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
                Profile information
              </p>

              <h2 className="mt-2 text-3xl font-black">
                პირადი ინფორმაცია
              </h2>
            </div>

            <div className="mt-7 space-y-5">
              <ProfileField label="სახელი და გვარი">
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={updateField}
                  placeholder="მაგალითად: Nana Asatiani"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </ProfileField>

              <ProfileField label="ელფოსტა">
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
                />
              </ProfileField>

              <ProfileField label="ტელეფონის ნომერი">
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={updateField}
                  placeholder="+995 5XX XX XX XX"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </ProfileField>

              <div className="grid gap-5 sm:grid-cols-2">
                <ProfileField label="ქვეყანა">
                  <input
                    type="text"
                    name="country"
                    value={profile.country}
                    onChange={updateField}
                    placeholder="საქართველო"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </ProfileField>

                <ProfileField label="ქალაქი">
                  <input
                    type="text"
                    name="city"
                    value={profile.city}
                    onChange={updateField}
                    placeholder="მესტია"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </ProfileField>
              </div>

              <ProfileField label="პროფილის ფოტოს მისამართი">
                <input
                  type="url"
                  name="avatar_url"
                  value={profile.avatar_url}
                  onChange={updateField}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </ProfileField>

              <ProfileField label="ჩემ შესახებ">
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={updateField}
                  placeholder="მოკლედ დაწერე შენი გამოცდილების, მომსახურებისა და ტურების შესახებ..."
                  rows={6}
                  className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </ProfileField>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "პროფილი ინახება..."
                  : "💾 პროფილის შენახვა"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function ProfileField({
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