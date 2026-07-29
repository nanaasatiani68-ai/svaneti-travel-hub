import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VisitRow = {
  visitor_id: string;
  path: string;
  country: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "სერვერის კონფიგურაცია არასრულია." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "ავტორიზაცია აუცილებელია." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice(7).trim();

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

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

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
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

    if (String(profile?.role || "").trim().toLowerCase() !== "director") {
      return NextResponse.json(
        {
          success: false,
          error: "ამ გვერდის ნახვა მხოლოდ Director-ს შეუძლია.",
        },
        { status: 403 }
      );
    }

    const start30Days = startOfDay(
      new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    );

    const { data, error } = await supabaseAdmin
      .from("site_visits")
      .select("visitor_id, path, country, created_at")
      .gte("created_at", start30Days.toISOString())
      .order("created_at", { ascending: false })
      .limit(20000);

    if (error) {
      console.error("Analytics loading error:", error);

      return NextResponse.json(
        {
          success: false,
          error: `სტატისტიკის ჩატვირთვა ვერ მოხერხდა: ${error.message}`,
        },
        { status: 500 }
      );
    }

    const visits = (data as VisitRow[] | null) || [];
    const todayStart = startOfDay(new Date());
    const sevenDaysStart = startOfDay(
      new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    );

    const todayVisits = visits.filter(
      (visit) => new Date(visit.created_at) >= todayStart
    );
    const sevenDayVisits = visits.filter(
      (visit) => new Date(visit.created_at) >= sevenDaysStart
    );

    const pageMap = new Map<string, number>();
    const countryMap = new Map<string, number>();

    for (const visit of visits) {
      pageMap.set(visit.path, (pageMap.get(visit.path) || 0) + 1);

      const country = visit.country || "Unknown";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    }

    return NextResponse.json(
      {
        success: true,
        stats: {
          todayUniqueVisitors: uniqueVisitors(todayVisits),
          todayPageViews: todayVisits.length,
          sevenDayUniqueVisitors: uniqueVisitors(sevenDayVisits),
          sevenDayPageViews: sevenDayVisits.length,
          thirtyDayUniqueVisitors: uniqueVisitors(visits),
          thirtyDayPageViews: visits.length,
          topPages: toTopItems(pageMap, 8),
          topCountries: toTopItems(countryMap, 8),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Director analytics error:", error);

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

function uniqueVisitors(visits: VisitRow[]) {
  return new Set(visits.map((visit) => visit.visitor_id)).size;
}

function toTopItems(map: Map<string, number>, limit: number) {
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, limit);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}