import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function authorize(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return { error: "ავტორიზაცია აუცილებელია.", status: 401 };
  }

  const token = authorization.slice(7).trim();
  const supabase = getAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return { error: "სესია არასწორია ან ვადა გაუვიდა.", status: 401 };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Settings profile error:", profileError);
    return { error: "უფლებების შემოწმება ვერ მოხერხდა.", status: 500 };
  }

  if (!profile || !["director", "admin"].includes(profile.role ?? "")) {
    return { error: "ამ გვერდზე წვდომის უფლება არ გაქვს.", status: 403 };
  }

  return { supabase, user };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request);

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { data, error } = await auth.supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Settings GET error:", error);

      return NextResponse.json(
        { error: "პარამეტრების ჩატვირთვა ვერ მოხერხდა." },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("Settings GET route error:", error);

    return NextResponse.json(
      { error: "პარამეტრების ჩატვირთვა ვერ მოხერხდა." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authorize(request);

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();

    const allowedFields = [
      "site_name",
      "support_email",
      "phone",
      "whatsapp",
      "address",
      "default_currency",
      "maintenance_mode",

      "notify_tour_booking",
      "notify_hotel_booking",
      "notify_transfer_booking",
      "notify_provider_application",
      "notify_booking_cancellation",
      "send_customer_confirmation",
      "notification_email",

      "bookings_enabled",
      "default_booking_status",

      "provider_applications_enabled",
      "provider_manual_approval",
      "provider_notification_email",

      "payments_enabled",
      "payment_currency",
      "platform_commission_percent",
      "provider_payout_percent",

      "seo_title",
      "seo_description",
      "site_url",

      "facebook_url",
      "instagram_url",
      "tiktok_url",
      "whatsapp_url",
    ] as const;

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "შესანახი პარამეტრები არ არის." },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("site_settings")
      .update(updates)
      .eq("id", 1)
      .select("*")
      .single();

    if (error) {
      console.error("Settings PUT error:", error);

      return NextResponse.json(
        { error: "პარამეტრების შენახვა ვერ მოხერხდა." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (error) {
    console.error("Settings PUT route error:", error);

    return NextResponse.json(
      { error: "პარამეტრების შენახვა ვერ მოხერხდა." },
      { status: 500 }
    );
  }
}
