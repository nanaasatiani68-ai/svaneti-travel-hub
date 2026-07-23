"use client";

import {
  ChangeEvent,
  FormEvent,
  ReactNode,
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

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<ProfileForm>(emptyProfile);

  const [email, setEmail] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] =
    useState<File | null>(null);

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

      setCurrentUserId(user.id);
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

      const loadedProfile: ProfileForm = {
        full_name:
          data?.full_name ||
          user.user_metadata?.full_name ||
          "",
        phone: data?.phone || "",
        country: data?.country || "",
        city: data?.city || "",
        bio: data?.bio || "",
        avatar_url: data?.avatar_url || "",
      };

      setProfile(loadedProfile);
      setAvatarPreview(loadedProfile.avatar_url);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  useEffect(() => {
    return () => {
      if (
        avatarPreview &&
        avatarPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function updateField(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  }

  function handleAvatarSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setMessage("");

    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(selectedFile.type)) {
      setMessage(
        "შეგიძლია ატვირთო მხოლოდ JPG, PNG ან WEBP ფოტო."
      );
      setMessageType("error");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_AVATAR_SIZE) {
      setMessage(
        "ფოტოს ზომა არ უნდა აღემატებოდეს 5 MB-ს."
      );
      setMessageType("error");
      event.target.value = "";
      return;
    }

    if (
      avatarPreview &&
      avatarPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    setAvatarFile(selectedFile);
    setAvatarPreview(previewUrl);
  }

  async function uploadAvatar() {
    setMessage("");

    if (!avatarFile) {
      setMessage("ჯერ აირჩიე ფოტო.");
      setMessageType("error");
      return null;
    }

    if (!currentUserId) {
      setMessage(
        "ფოტოს ასატვირთად საჭიროა ავტორიზაცია."
      );
      setMessageType("error");
      return null;
    }

    setUploadingAvatar(true);

    const extension =
      avatarFile.name.split(".").pop()?.toLowerCase() ||
      getExtensionFromMimeType(avatarFile.type);

    const filePath = `${currentUserId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: avatarFile.type,
      });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);

      setMessage(
        `ფოტოს ატვირთვა ვერ მოხერხდა: ${uploadError.message}`
      );

      setMessageType("error");
      setUploadingAvatar(false);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: currentUserId,
          avatar_url: publicUrl,
        },
        {
          onConflict: "id",
        }
      );

    if (profileUpdateError) {
      console.error(
        "Avatar profile update error:",
        profileUpdateError
      );

      await supabase.storage
        .from("avatars")
        .remove([filePath]);

      setMessage(
        `ფოტოს პროფილზე შენახვა ვერ მოხერხდა: ${profileUpdateError.message}`
      );

      setMessageType("error");
      setUploadingAvatar(false);
      return null;
    }

    setProfile((currentProfile) => ({
      ...currentProfile,
      avatar_url: publicUrl,
    }));

    setAvatarPreview(publicUrl);
    setAvatarFile(null);

    setMessage("პროფილის ფოტო წარმატებით აიტვირთა.");
    setMessageType("success");
    setUploadingAvatar(false);

    return publicUrl;
  }

  async function removeAvatar() {
    if (!currentUserId) {
      return;
    }

    const confirmed = window.confirm(
      "ნამდვილად გინდა პროფილის ფოტოს წაშლა?"
    );

    if (!confirmed) {
      return;
    }

    setUploadingAvatar(true);
    setMessage("");

    const currentAvatarPath = getStoragePathFromPublicUrl(
      profile.avatar_url,
      "avatars"
    );

    if (currentAvatarPath) {
      const { error: removeError } = await supabase.storage
        .from("avatars")
        .remove([currentAvatarPath]);

      if (removeError) {
        console.error(
          "Avatar storage removal error:",
          removeError
        );
      }
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: currentUserId,
          avatar_url: null,
        },
        {
          onConflict: "id",
        }
      );

    if (error) {
      console.error("Avatar removing error:", error);

      setMessage(
        `ფოტოს წაშლა ვერ მოხერხდა: ${error.message}`
      );

      setMessageType("error");
      setUploadingAvatar(false);
      return;
    }

    if (
      avatarPreview &&
      avatarPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(avatarPreview);
    }

    setProfile((currentProfile) => ({
      ...currentProfile,
      avatar_url: "",
    }));

    setAvatarPreview("");
    setAvatarFile(null);

    setMessage("პროფილის ფოტო წაიშალა.");
    setMessageType("success");
    setUploadingAvatar(false);
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
      setMessage(
        "პროფილის შესანახად საჭიროა ავტორიზაცია."
      );

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

    let finalAvatarUrl = profile.avatar_url;

    if (avatarFile) {
      const uploadedAvatarUrl = await uploadAvatar();

      if (!uploadedAvatarUrl) {
        setSaving(false);
        return;
      }

      finalAvatarUrl = uploadedAvatarUrl;
    }

    const profileValues = {
      id: user.id,
      full_name: profile.full_name.trim(),
      phone: profile.phone.trim() || null,
      country: profile.country.trim() || null,
      city: profile.city.trim() || null,
      bio: profile.bio.trim() || null,
      avatar_url: finalAvatarUrl || null,
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

    const { error: authUpdateError } =
      await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name.trim(),
        },
      });

    if (authUpdateError) {
      console.error(
        "Auth profile update error:",
        authUpdateError
      );
    }

    setProfile((currentProfile) => ({
      ...currentProfile,
      avatar_url: finalAvatarUrl,
    }));

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
              შეავსე ინფორმაცია და ატვირთე პროფილის ფოტო.
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
            {avatarPreview ? (
              <img
                src={avatarPreview}
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
                📍{" "}
                {[profile.city, profile.country]
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
                პროფილის ფოტო
              </p>

              <p className="mt-2 text-xs leading-5 text-white/50">
                დასაშვებია JPG, PNG ან WEBP. მაქსიმალური ზომაა
                5 MB.
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
              <ProfileField label="პროფილის ფოტო">
                <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarSelection}
                    disabled={uploadingAvatar}
                    className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:font-bold file:text-white hover:file:bg-cyan-700"
                  />

                  {avatarFile && (
                    <p className="mt-3 break-words text-sm text-slate-500">
                      არჩეული ფოტო:{" "}
                      <strong>{avatarFile.name}</strong>
                    </p>
                  )}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={uploadAvatar}
                      disabled={!avatarFile || uploadingAvatar}
                      className="rounded-2xl bg-cyan-600 px-5 py-3 font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingAvatar
                        ? "ფოტო იტვირთება..."
                        : "📤 ფოტოს ატვირთვა"}
                    </button>

                    {(profile.avatar_url || avatarPreview) && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        disabled={uploadingAvatar}
                        className="rounded-2xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        🗑️ ფოტოს წაშლა
                      </button>
                    )}
                  </div>
                </div>
              </ProfileField>

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
                disabled={saving || uploadingAvatar}
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

function getExtensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
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