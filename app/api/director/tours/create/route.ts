import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateTourBody = {
  title?: string;
  description?: string;
  location?: string;
  price?: number | null;
  price_type?: "fixed" | "negotiable";
  price_currency?: "GEL" | "USD" | null;
  duration?: string | null;
  start_date?: string | null;
  max_people?: number | null;
  category?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  organizer_name?: string | null;
  contact_phone?: string;
  has_whatsapp?: boolean;
  has_viber?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "სერვერის კონფიგურაცია არასრულია.",
        },
        { status: 500 }
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "ავტორიზაცია აუცილებელია.",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(7).trim();

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: userData,
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Director-ის ავტორიზაცია ვერ დადასტურდა.",
        },
        { status: 401 }
      );
    }

    const currentUser = userData.user;

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        {
          success: false,
          error: "Director-ის როლის შემოწმება ვერ მოხერხდა.",
        },
        { status: 500 }
      );
    }

    const role = String(profile?.role || "")
      .trim()
      .toLowerCase();

    if (role !== "director") {
      return NextResponse.json(
        {
          success: false,
          error:
            "ამ ფუნქციის გამოყენება მხოლოდ Director-ს შეუძლია.",
        },
        { status: 403 }
      );
    }

    let body: CreateTourBody;

    try {
      body = (await request.json()) as CreateTourBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "მოთხოვნის მონაცემები არასწორია.",
        },
        { status: 400 }
      );
    }

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const location = String(body.location || "").trim();
    const contactPhone = String(body.contact_phone || "").trim();
    const priceType =
      body.price_type === "negotiable"
        ? "negotiable"
        : "fixed";

    const priceCurrency =
      priceType === "negotiable"
        ? null
        : body.price_currency === "USD"
          ? "USD"
          : "GEL";

    const price =
      priceType === "negotiable"
        ? null
        : Number(body.price);

    if (!title || !description || !location || !contactPhone) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ტურის სახელი, აღწერა, მდებარეობა და ტელეფონი აუცილებელია.",
        },
        { status: 400 }
      );
    }

    if (
      priceType === "fixed" &&
      (price === null ||
        !Number.isFinite(price) ||
        price < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "ტურის ფასი არასწორია.",
        },
        { status: 400 }
      );
    }

    if (!/^\+\d{8,15}$/.test(contactPhone)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ტელეფონის ნომერი საერთაშორისო ფორმატში ჩაწერე.",
        },
        { status: 400 }
      );
    }

    const maxPeople =
      body.max_people === null ||
      body.max_people === undefined
        ? null
        : Number(body.max_people);

    if (
      maxPeople !== null &&
      (!Number.isInteger(maxPeople) || maxPeople < 1)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ადამიანების მაქსიმალური რაოდენობა არასწორია.",
        },
        { status: 400 }
      );
    }

    const {
      data: tour,
      error: insertError,
    } = await supabaseAdmin
      .from("tours")
      .insert({
        title,
        description,
        location,
        price,
        price_type: priceType,
        price_currency: priceCurrency,
        duration: body.duration || null,
        start_date: body.start_date || null,
        max_people: maxPeople,
        category: body.category || null,
        image_url: body.image_url || null,
        image_urls: Array.isArray(body.image_urls)
          ? body.image_urls.slice(0, 5)
          : [],
        organizer_name:
          String(body.organizer_name || "").trim() ||
          "Georgia Gateway Hub",
        user_id: currentUser.id,
        status: "approved",
        submitted_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        contact_phone: contactPhone,
        has_whatsapp: Boolean(body.has_whatsapp),
        has_viber: Boolean(body.has_viber),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Director tour insert error:", insertError);

      return NextResponse.json(
        {
          success: false,
          error: `ტურის შენახვა ვერ მოხერხდა: ${insertError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        tourId: tour.id,
        message: "ტური დაემატა და გამოქვეყნდა.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Director create tour error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "უცნობი შეცდომა დაფიქსირდა.",
      },
      { status: 500 }
    );
  }
}