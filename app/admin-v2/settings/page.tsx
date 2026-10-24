"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Settings = {
  id: number;

  site_name: string;
  support_email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  default_currency: "GEL" | "USD" | "EUR";
  maintenance_mode: boolean;

  notify_tour_booking: boolean;
  notify_hotel_booking: boolean;
  notify_transfer_booking: boolean;
  notify_provider_application: boolean;
  notify_booking_cancellation: boolean;
  send_customer_confirmation: boolean;
  notification_email: string | null;

  bookings_enabled: boolean;
  default_booking_status: "pending" | "confirmed";

  provider_applications_enabled: boolean;
  provider_manual_approval: boolean;
  provider_notification_email: string | null;

  payments_enabled: boolean;
  payment_currency: "GEL" | "USD" | "EUR";
  platform_commission_percent: number;
  provider_payout_percent: number;

  seo_title: string | null;
  seo_description: string | null;
  site_url: string | null;

  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  whatsapp_url: string | null;

  logo_url: string | null;
  hero_background_url: string | null;
  site_background_color: string;
  header_background_color: string;
  footer_background_color: string;
  primary_color: string;

  created_at?: string;
  updated_at?: string;
};

type Tab =
  | "general"
  | "notifications"
  | "bookings"
  | "providers"
  | "payments"
  | "seo"
  | "appearance";

const tabs: {
  id: Tab;
  label: string;
  icon: string;
}[] = [
  {
    id: "general",
    label: "General",
    icon: "⚙️",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "🔔",
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: "📅",
  },
  {
    id: "providers",
    label: "Providers",
    icon: "👥",
  },
  {
    id: "payments",
    label: "Payments",
    icon: "💳",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: "🎨",
  },
  {
    id: "seo",
    label: "SEO & Social",
    icon: "🌐",
  },
];

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
        checked ? "bg-cyan-500" : "bg-white/20",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
      aria-pressed={checked}
    >
      <span
        className={[
          "inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div>
        <h3 className="font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-white/55">
          {description}
        </p>
      </div>

      <Toggle
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="mb-2 block text-sm font-medium text-white/75">
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20";

export default function SettingsPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] =
    useState<Tab>("general");

  const [settings, setSettings] =
    useState<Settings | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingLogo, setUploadingLogo] =
    useState(false);

  const [uploadingHero, setUploadingHero] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  async function uploadLogoImage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("გთხოვ აირჩიე ლოგოს ფოტო.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("ლოგოს მაქსიმალური ზომაა 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingLogo(true);
      setErrorMessage("");
      setNotice("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("ავტორიზაცია აუცილებელია.");
      }

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "png";

      const filePath =
        `${user.id}/logo-${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("site-assets")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("site-assets")
          .getPublicUrl(filePath);

      updateSetting(
        "logo_url",
        publicUrlData.publicUrl
      );

      setNotice(
        "ლოგო აიტვირთა. ცვლილების დასასრულებლად დააჭირე Save Settings."
      );
    } catch (error) {
      console.error("Logo upload error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "ლოგოს ატვირთვა ვერ მოხერხდა."
      );
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }
  async function uploadHeroImage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("გთხოვ აირჩიე ფოტო.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("ფოტოს მაქსიმალური ზომაა 10 MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingHero(true);
      setErrorMessage("");
      setNotice("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("ავტორიზაცია აუცილებელია.");
      }

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath =
        `${user.id}/hero-${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("site-assets")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("site-assets")
          .getPublicUrl(filePath);

      updateSetting(
        "hero_background_url",
        publicUrlData.publicUrl
      );

      setNotice(
        "ფოტო აიტვირთა. ცვლილების დასასრულებლად დააჭირე Save Settings."
      );
    } catch (error) {
      console.error("Hero upload error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "ფოტოს ატვირთვა ვერ მოხერხდა."
      );
    } finally {
      setUploadingHero(false);
      event.target.value = "";
    }
  }
  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "ავტორიზაცია აუცილებელია."
      );
    }

    return session.access_token;
  }

  async function loadSettings() {
    setLoading(true);
    setErrorMessage("");

    try {
      const accessToken =
        await getAccessToken();

      const response = await fetch(
        "/api/admin/settings",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "პარამეტრების ჩატვირთვა ვერ მოხერხდა."
        );
      }

      setSettings(result.settings);
    } catch (error) {
      console.error(
        "Settings load error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "პარამეტრების ჩატვირთვა ვერ მოხერხდა."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) {
    setSettings((current) => {
      if (!current) return current;

      return {
        ...current,
        [key]: value,
      };
    });

    setNotice("");
    setErrorMessage("");
  }

  async function saveSettings() {
    if (!settings) return;

    setSaving(true);
    setNotice("");
    setErrorMessage("");

    try {
      const accessToken =
        await getAccessToken();

      const response = await fetch(
        "/api/admin/settings",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(settings),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "პარამეტრების შენახვა ვერ მოხერხდა."
        );
      }

      setSettings(result.settings);

      setNotice(
        "პარამეტრები წარმატებით შეინახა."
      );
    } catch (error) {
      console.error(
        "Settings save error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "პარამეტრების შენახვა ვერ მოხერხდა."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-xl">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />

            <p className="mt-4 text-white/60">
              პარამეტრები იტვირთება...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-white">
        <h1 className="text-2xl font-bold">
          Settings
        </h1>

        <p className="mt-4 text-red-100">
          {errorMessage ||
            "პარამეტრების ჩატვირთვა ვერ მოხერხდა."}
        </p>

        <button
          type="button"
          onClick={() => void loadSettings()}
          className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900"
        >
          თავიდან ცდა
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Georgia Gateway Hub
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">
              ⚙️ Settings
            </h1>

            <p className="mt-3 max-w-2xl text-white/60">
              მართე საიტის ძირითადი
              პარამეტრები, შეტყობინებები,
              ჯავშნები, Provider-ები,
              გადახდები და SEO.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void saveSettings()
            }
            disabled={saving}
            className="rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "ინახება..."
              : "💾 Save Settings"}
          </button>
        </div>

        {notice ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
            ✓ {notice}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/10 p-2 backdrop-blur-xl">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const active =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={[
                  "rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-cyan-500 text-white shadow-lg"
                    : "text-white/65 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span className="mr-2">
                  {tab.icon}
                </span>

                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        {activeTab === "general" ? (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">
                General
              </h2>

              <p className="mt-2 text-white/55">
                საიტის ძირითადი ინფორმაცია
                და საერთო პარამეტრები.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <FieldLabel>
                  საიტის სახელი
                </FieldLabel>

                <input
                  value={settings.site_name}
                  onChange={(event) =>
                    updateSetting(
                      "site_name",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="Georgia Gateway Hub"
                />
              </div>

              <div>
                <FieldLabel>
                  Support Email
                </FieldLabel>

                <input
                  type="email"
                  value={
                    settings.support_email ??
                    ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "support_email",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="support@example.com"
                />
              </div>

              <div>
                <FieldLabel>
                  ტელეფონი
                </FieldLabel>

                <input
                  value={
                    settings.phone ?? ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "phone",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="+995..."
                />
              </div>

              <div>
                <FieldLabel>
                  WhatsApp
                </FieldLabel>

                <input
                  value={
                    settings.whatsapp ?? ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "whatsapp",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="+995..."
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel>
                  მისამართი
                </FieldLabel>

                <input
                  value={
                    settings.address ?? ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "address",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="Georgia"
                />
              </div>

              <div>
                <FieldLabel>
                  ძირითადი ვალუტა
                </FieldLabel>

                <select
                  value={
                    settings.default_currency
                  }
                  onChange={(event) =>
                    updateSetting(
                      "default_currency",
                      event.target.value as
                        | "GEL"
                        | "USD"
                        | "EUR"
                    )
                  }
                  className={inputClass}
                >
                  <option
                    className="text-black"
                    value="GEL"
                  >
                    GEL — ₾
                  </option>

                  <option
                    className="text-black"
                    value="USD"
                  >
                    USD — $
                  </option>

                  <option
                    className="text-black"
                    value="EUR"
                  >
                    EUR — €
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-8">
              <ToggleRow
                title="Maintenance Mode"
                description="საიტის დროებით ტექნიკურ რეჟიმში გადაყვანა. რეალურ საიტზე ეფექტის მისაბმელად შემდეგ ეტაპზე middleware-ს დავუკავშირებთ."
                checked={
                  settings.maintenance_mode
                }
                onChange={(value) =>
                  updateSetting(
                    "maintenance_mode",
                    value
                  )
                }
              />
            </div>
          </div>
        ) : null}

        {activeTab ===
        "notifications" ? (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">
                Notifications
              </h2>

              <p className="mt-2 text-white/55">
                მართე ადმინისტრაციული და
                მომხმარებლის Email
                შეტყობინებები.
              </p>
            </div>

            <div className="mb-6">
              <FieldLabel>
                მთავარი Notification Email
              </FieldLabel>

              <input
                type="email"
                value={
                  settings.notification_email ??
                  ""
                }
                onChange={(event) =>
                  updateSetting(
                    "notification_email",
                    event.target.value
                  )
                }
                className={inputClass}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-4">
              <ToggleRow
                title="Tour Booking"
                description="ახალი ტურის ჯავშნის შესახებ ადმინისტრატორს გაეგზავნოს Email."
                checked={
                  settings.notify_tour_booking
                }
                onChange={(value) =>
                  updateSetting(
                    "notify_tour_booking",
                    value
                  )
                }
              />

              <ToggleRow
                title="Hotel Booking"
                description="ახალი სასტუმროს ჯავშნის შესახებ ადმინისტრატორს გაეგზავნოს Email."
                checked={
                  settings.notify_hotel_booking
                }
                onChange={(value) =>
                  updateSetting(
                    "notify_hotel_booking",
                    value
                  )
                }
              />

              <ToggleRow
                title="Transfer Booking"
                description="ახალი ტრანსფერის ჯავშნის შესახებ ადმინისტრატორს გაეგზავნოს Email."
                checked={
                  settings.notify_transfer_booking
                }
                onChange={(value) =>
                  updateSetting(
                    "notify_transfer_booking",
                    value
                  )
                }
              />

              <ToggleRow
                title="Provider Application"
                description="ახალი Provider განაცხადის მიღებისას ადმინისტრატორს გაეგზავნოს Email."
                checked={
                  settings.notify_provider_application
                }
                onChange={(value) =>
                  updateSetting(
                    "notify_provider_application",
                    value
                  )
                }
              />

              <ToggleRow
                title="Booking Cancellation"
                description="ჯავშნის გაუქმების შესახებ გაიგზავნოს ადმინისტრაციული შეტყობინება."
                checked={
                  settings.notify_booking_cancellation
                }
                onChange={(value) =>
                  updateSetting(
                    "notify_booking_cancellation",
                    value
                  )
                }
              />

              <ToggleRow
                title="Customer Confirmation"
                description="მომხმარებელს ჯავშნის შემდეგ ავტომატურად გაეგზავნოს confirmation Email."
                checked={
                  settings.send_customer_confirmation
                }
                onChange={(value) =>
                  updateSetting(
                    "send_customer_confirmation",
                    value
                  )
                }
              />
            </div>
          </div>
        ) : null}

        {activeTab === "bookings" ? (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">
                Bookings
              </h2>

              <p className="mt-2 text-white/55">
                ჯავშნების საერთო წესები და
                საწყისი სტატუსი.
              </p>
            </div>

            <div className="space-y-4">
              <ToggleRow
                title="Bookings Enabled"
                description="ახალი ჯავშნების მიღების საერთო პარამეტრი."
                checked={
                  settings.bookings_enabled
                }
                onChange={(value) =>
                  updateSetting(
                    "bookings_enabled",
                    value
                  )
                }
              />
            </div>

            <div className="mt-6 max-w-xl">
              <FieldLabel>
                ახალი ჯავშნის Default Status
              </FieldLabel>

              <select
                value={
                  settings.default_booking_status
                }
                onChange={(event) =>
                  updateSetting(
                    "default_booking_status",
                    event.target.value as
                      | "pending"
                      | "confirmed"
                  )
                }
                className={inputClass}
              >
                <option
                  className="text-black"
                  value="pending"
                >
                  Pending — საჭიროებს
                  დადასტურებას
                </option>

                <option
                  className="text-black"
                  value="confirmed"
                >
                  Confirmed — ავტომატურად
                  დადასტურებული
                </option>
              </select>
            </div>

            <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100">
              ეს პარამეტრები უკვე ინახება
              Settings-ში. შემდეგ ეტაპზე
              Booking API-ებს მივაბამთ, რათა
              რეალურად მართონ ახალი
              ჯავშნების მიღება და სტატუსი.
            </div>
          </div>
        ) : null}

        {activeTab === "providers" ? (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">
                Providers
              </h2>

              <p className="mt-2 text-white/55">
                Provider განაცხადების და
                დამტკიცების მართვა.
              </p>
            </div>

            <div className="space-y-4">
              <ToggleRow
                title="Provider Applications"
                description="მომხმარებლებს შეეძლოთ Provider სტატუსზე განაცხადის გამოგზავნა."
                checked={
                  settings.provider_applications_enabled
                }
                onChange={(value) =>
                  updateSetting(
                    "provider_applications_enabled",
                    value
                  )
                }
              />

              <ToggleRow
                title="Manual Approval"
                description="Provider განაცხადი Director/Admin-ის მიერ ხელით დამტკიცდეს."
                checked={
                  settings.provider_manual_approval
                }
                onChange={(value) =>
                  updateSetting(
                    "provider_manual_approval",
                    value
                  )
                }
              />
            </div>

            <div className="mt-6">
              <FieldLabel>
                Provider Notification Email
              </FieldLabel>

              <input
                type="email"
                value={
                  settings.provider_notification_email ??
                  ""
                }
                onChange={(event) =>
                  updateSetting(
                    "provider_notification_email",
                    event.target.value
                  )
                }
                className={inputClass}
                placeholder="admin@example.com"
              />

              <p className="mt-2 text-xs leading-5 text-white/45">
                აქ მითითებულ მისამართზე
                უნდა მივიდეს ახალი Provider
                მოთხოვნების შეტყობინებები.
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "payments" ? (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">
                Payments
              </h2>

              <p className="mt-2 text-white/55">
                გადახდების, საკომისიოსა და
                Provider payout-ის
                პარამეტრები.
              </p>
            </div>

            <ToggleRow
              title="Online Payments"
              description="ონლაინ გადახდების საერთო პარამეტრი. Payment provider-ის ინტეგრაციის შემდეგ ეს toggle რეალურ გადახდებს გააკონტროლებს."
              checked={
                settings.payments_enabled
              }
              onChange={(value) =>
                updateSetting(
                  "payments_enabled",
                  value
                )
              }
            />

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div>
                <FieldLabel>
                  Payment Currency
                </FieldLabel>

                <select
                  value={
                    settings.payment_currency
                  }
                  onChange={(event) =>
                    updateSetting(
                      "payment_currency",
                      event.target.value as
                        | "GEL"
                        | "USD"
                        | "EUR"
                    )
                  }
                  className={inputClass}
                >
                  <option
                    className="text-black"
                    value="GEL"
                  >
                    GEL
                  </option>

                  <option
                    className="text-black"
                    value="USD"
                  >
                    USD
                  </option>

                  <option
                    className="text-black"
                    value="EUR"
                  >
                    EUR
                  </option>
                </select>
              </div>

              <div>
                <FieldLabel>
                  Platform Commission %
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={
                    settings.platform_commission_percent
                  }
                  onChange={(event) =>
                    updateSetting(
                      "platform_commission_percent",
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel>
                  Provider Payout %
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={
                    settings.provider_payout_percent
                  }
                  onChange={(event) =>
                    updateSetting(
                      "provider_payout_percent",
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 text-sm leading-6 text-cyan-100">
              საბანკო Secret Key-ები და სხვა
              საიდუმლო მონაცემები ამ გვერდზე
              არ გამოჩნდება — ისინი
              Environment Variables-ში
              დარჩება.
            </div>
          </div>
        ) : null}

        {activeTab === "appearance" ? (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">
                🎨 Appearance
              </h2>

              <p className="mt-2 text-white/55">
                შეცვალე საიტის მთავარი ფოტო და ძირითადი ფერები.
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <FieldLabel>
                  Site Logo
                </FieldLabel>

                <div className="mt-3 flex min-h-40 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-6">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt="Site logo preview"
                      className="max-h-28 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-white/40">
                      Logo არ არის არჩეული
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
                    {uploadingLogo
                      ? "Uploading..."
                      : "Choose Logo"}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={uploadLogoImage}
                    />
                  </label>

                  {settings.logo_url ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateSetting(
                          "logo_url",
                          null
                        )
                      }
                      className="rounded-xl border border-red-400/30 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-500/10"
                    >
                      Remove Logo
                    </button>
                  ) : null}
                </div>
              </div>
              <div>
                <FieldLabel>
                  Hero Background Photo
                </FieldLabel>

                <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  {settings.hero_background_url ? (
                    <img
                      src={settings.hero_background_url}
                      alt="Hero preview"
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center text-white/40">
                      Hero ფოტო ჯერ არ არის არჩეული
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
                    {uploadingHero
                      ? "Uploading..."
                      : "📷 Choose Photo"}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingHero}
                      onChange={uploadHeroImage}
                    />
                  </label>

                  {settings.hero_background_url ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateSetting(
                          "hero_background_url",
                          null
                        )
                      }
                      className="rounded-xl border border-red-400/30 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-500/10"
                    >
                      Remove Photo
                    </button>
                  ) : null}
                </div>
              </div>

              {[
                {
                  key: "site_background_color",
                  label: "Site Background Color",
                  description:
                    "საიტის მთავარი ფონის ფერი",
                  fallback: "#020617",
                },
                {
                  key: "header_background_color",
                  label: "Header Background Color",
                  description:
                    "ზედა მენიუს ფონის ფერი",
                  fallback: "#0f172a",
                },
                {
                  key: "footer_background_color",
                  label: "Footer Background Color",
                  description:
                    "Footer-ის ფონის ფერი",
                  fallback: "#020617",
                },
                {
                  key: "primary_color",
                  label: "Primary / Button Color",
                  description:
                    "ღილაკებისა და მთავარი აქცენტების ფერი",
                  fallback: "#06b6d4",
                },
              ].map((item) => {
                const value =
                  (settings[
                    item.key as keyof Settings
                  ] as string | null) ||
                  item.fallback;

                return (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <FieldLabel>
                      {item.label}
                    </FieldLabel>

                    <p className="mt-1 text-sm text-white/45">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center gap-4">
                      <input
                        type="color"
                        value={value}
                        onChange={(event) =>
                          updateSetting(
                            item.key as keyof Settings,
                            event.target.value
                          )
                        }
                        className="h-14 w-20 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
                      />

                      <input
                        type="text"
                        value={value}
                        onChange={(event) =>
                          updateSetting(
                            item.key as keyof Settings,
                            event.target.value
                          )
                        }
                        className={inputClass}
                        placeholder={item.fallback}
                      />

                      <div
                        className="h-14 w-14 shrink-0 rounded-xl border border-white/15"
                        style={{
                          backgroundColor: value,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {activeTab === "seo" ? (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">
                SEO & Social
              </h2>

              <p className="mt-2 text-white/55">
                საძიებო სისტემებისა და
                სოციალური ქსელების ძირითადი
                ინფორმაცია.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel>
                  SEO Title
                </FieldLabel>

                <input
                  value={
                    settings.seo_title ?? ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "seo_title",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="Georgia Gateway Hub"
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel>
                  SEO Description
                </FieldLabel>

                <textarea
                  rows={4}
                  value={
                    settings.seo_description ??
                    ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "seo_description",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="Discover tours, hotels and transfers in Georgia..."
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel>
                  Site URL
                </FieldLabel>

                <input
                  type="url"
                  value={
                    settings.site_url ?? ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "site_url",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>

              <div>
                <FieldLabel>
                  Facebook URL
                </FieldLabel>

                <input
                  type="url"
                  value={
                    settings.facebook_url ??
                    ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "facebook_url",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <FieldLabel>
                  Instagram URL
                </FieldLabel>

                <input
                  type="url"
                  value={
                    settings.instagram_url ??
                    ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "instagram_url",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <FieldLabel>
                  TikTok URL
                </FieldLabel>

                <input
                  type="url"
                  value={
                    settings.tiktok_url ?? ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "tiktok_url",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="https://tiktok.com/@..."
                />
              </div>

              <div>
                <FieldLabel>
                  WhatsApp URL
                </FieldLabel>

                <input
                  type="url"
                  value={
                    settings.whatsapp_url ??
                    ""
                  }
                  onChange={(event) =>
                    updateSetting(
                      "whatsapp_url",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="https://wa.me/..."
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Settings ID: {settings.id}
        </span>

        <span>
          {settings.updated_at
            ? `ბოლო განახლება: ${new Date(
                settings.updated_at
              ).toLocaleString("ka-GE")}`
            : ""}
        </span>
      </div>
    </div>
  );
}
