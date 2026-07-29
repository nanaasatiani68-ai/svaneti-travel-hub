import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VisitBody = {
  visitorId?: string;
  path?: string;
  referrer?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Analytics configuration is missing." },
        { status: 500 }
      );
    }

    let body: VisitBody;

    try {
      body = (await request.json()) as VisitBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request." },
        { status: 400 }
      );
    }

    const visitorId = String(body.visitorId || "").trim();
    const path = normalizePath(body.path);
    const referrer = String(body.referrer || "").trim() || null;

    if (!visitorId || visitorId.length > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid visitor ID." },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;
    const city = request.headers.get("x-vercel-ip-city") || null;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabaseAdmin.from("site_visits").insert({
      visitor_id: visitorId,
      path,
      referrer,
      user_agent: userAgent,
      country,
      city,
    });

    if (error) {
      console.error("Site visit insert error:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error("Visit tracking route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown analytics error.",
      },
      { status: 500 }
    );
  }
}

function normalizePath(value: string | undefined) {
  const path = String(value || "/").trim();

  if (!path.startsWith("/")) {
    return "/";
  }

  return path.slice(0, 500);
}