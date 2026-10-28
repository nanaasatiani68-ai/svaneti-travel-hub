import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const FALLBACK_SETTINGS = {
  site_name: "Georgia Gateway Hub",
  support_email: null,
  phone: null,
  whatsapp: null,
  address: null,
  default_currency: "GEL",
  facebook_url: null,
  instagram_url: null,
  tiktok_url: null,
  whatsapp_url: null,
};

export async function GET() {
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
        facebook_url,
        instagram_url,
        tiktok_url,
        whatsapp_url
      `)
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error(
        "Public site settings loading error:",
        error
      );

      return NextResponse.json(
        FALLBACK_SETTINGS,
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        ...FALLBACK_SETTINGS,
        ...(data ?? {}),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Public site settings error:",
      error
    );

    return NextResponse.json(
      FALLBACK_SETTINGS,
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}