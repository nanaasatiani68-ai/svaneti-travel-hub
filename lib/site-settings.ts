import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PublicSiteSettings = {
  site_name: string;
  support_email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  default_currency: string;

  seo_title: string | null;
  seo_description: string | null;
  site_url: string | null;

  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  whatsapp_url: string | null;
};

const FALLBACK_SETTINGS: PublicSiteSettings = {
  site_name: "Georgia Gateway Hub",
  support_email: null,
  phone: null,
  whatsapp: null,
  address: null,
  default_currency: "GEL",

  seo_title: "Georgia Gateway Hub",
  seo_description:
    "Tours, transfers, hotels and local guides across Georgia.",
  site_url: "https://georgiagatewayhub.com",

  facebook_url: null,
  instagram_url: null,
  tiktok_url: null,
  whatsapp_url: null,
};

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select(`
        site_name,
        support_email,
        phone,
        whatsapp,
        address,
        default_currency,
        seo_title,
        seo_description,
        site_url,
        facebook_url,
        instagram_url,
        tiktok_url,
        whatsapp_url
      `)
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("Site settings loading error:", error);
      return FALLBACK_SETTINGS;
    }

    if (!data) {
      return FALLBACK_SETTINGS;
    }

    return {
      site_name:
        data.site_name?.trim() ||
        FALLBACK_SETTINGS.site_name,

      support_email:
        data.support_email?.trim() || null,

      phone:
        data.phone?.trim() || null,

      whatsapp:
        data.whatsapp?.trim() || null,

      address:
        data.address?.trim() || null,

      default_currency:
        data.default_currency?.trim() ||
        FALLBACK_SETTINGS.default_currency,

      seo_title:
        data.seo_title?.trim() ||
        data.site_name?.trim() ||
        FALLBACK_SETTINGS.seo_title,

      seo_description:
        data.seo_description?.trim() ||
        FALLBACK_SETTINGS.seo_description,

      site_url:
        data.site_url?.trim() ||
        FALLBACK_SETTINGS.site_url,

      facebook_url:
        data.facebook_url?.trim() || null,

      instagram_url:
        data.instagram_url?.trim() || null,

      tiktok_url:
        data.tiktok_url?.trim() || null,

      whatsapp_url:
        data.whatsapp_url?.trim() || null,
    };
  } catch (error) {
    console.error("Site settings helper error:", error);

    return FALLBACK_SETTINGS;
  }
}