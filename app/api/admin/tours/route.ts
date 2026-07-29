import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ProfileRole = {
  role: string | null;
};

type TourRecord = {
  id: string | number;
  image_url: string | null;
};

const ALLOWED_ROLES = ["director", "admin"];

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );

      return NextResponse.json(
        {
          success: false,
          error: "სერვერის კონფიგურაცია არასრულია.",
        },
        {
          status: 500,
        }
      );
    }

    const { id } = await context.params;
    const tourId = id?.trim();

    if (!tourId) {
      return NextResponse.json(
        {
          success: false,
          error: "ტურის ID არასწორია.",
        },
        {
          status: 400,
        }
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
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization.slice(7).trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "ავტორიზაციის მონაცემები ვერ მოიძებნა.",
        },
        {
          status: 401,
        }
      );
    }

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
    } = await supabaseAdmin.auth.getUser(
      accessToken
    );

    if (userError || !userData.user) {
      console.error(
        "Admin tour delete user error:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "მომხმარებლის ავტორიზაცია ვერ დადასტურდა.",
        },
        {
          status: 401,
        }
      );
    }

    const user = userData.user;

    const {
      data: profileResult,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Admin profile role loading error:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "მომხმარებლის როლის შემოწმება ვერ მოხერხდა.",
        },
        {
          status: 500,
        }
      );
    }

    const profile =
      profileResult as ProfileRole | null;

    const normalizedRole =
      profile?.role?.trim().toLowerCase() || "";

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ტურის წაშლის უფლება მხოლოდ Director-ს ან Admin-ს აქვს.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      data: tourResult,
      error: tourLoadError,
    } = await supabaseAdmin
      .from("tours")
      .select("id, image_url")
      .eq("id", tourId)
      .maybeSingle();

    if (tourLoadError) {
      console.error(
        "Tour loading before delete error:",
        tourLoadError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "ტურის ინფორმაციის ჩატვირთვა ვერ მოხერხდა.",
        },
        {
          status: 500,
        }
      );
    }

    const tour =
      tourResult as TourRecord | null;

    if (!tour) {
      return NextResponse.json(
        {
          success: false,
          error: "ტური ვერ მოიძებნა.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      error: notificationsDeleteError,
    } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("tour_id", tour.id);

    if (notificationsDeleteError) {
      console.warn(
        "Related notifications were not deleted:",
        notificationsDeleteError
      );
    }

    const {
      error: reviewsDeleteError,
    } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("tour_id", tour.id);

    if (reviewsDeleteError) {
      console.warn(
        "Related reviews were not deleted:",
        reviewsDeleteError
      );
    }

    const {
      error: bookingsDeleteError,
    } = await supabaseAdmin
      .from("bookings")
      .delete()
      .eq("tour_id", tour.id);

    if (bookingsDeleteError) {
      console.error(
        "Related bookings delete error:",
        bookingsDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "ტურთან დაკავშირებული ჯავშნების წაშლა ვერ მოხერხდა.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: deletedTours,
      error: tourDeleteError,
    } = await supabaseAdmin
      .from("tours")
      .delete()
      .eq("id", tour.id)
      .select("id");

    if (tourDeleteError) {
      console.error(
        "Admin tour delete error:",
        tourDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            `ტურის წაშლა ვერ მოხერხდა: ${tourDeleteError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    if (!deletedTours || deletedTours.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ტური ვერ წაიშალა ან უკვე წაშლილია.",
        },
        {
          status: 404,
        }
      );
    }

    const imagePath =
      getStoragePathFromPublicUrl(
        tour.image_url || "",
        "tour-images"
      );

    if (imagePath) {
      const {
        error: imageDeleteError,
      } = await supabaseAdmin.storage
        .from("tour-images")
        .remove([imagePath]);

      if (imageDeleteError) {
        console.warn(
          "Tour deleted, but image deletion failed:",
          imageDeleteError
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "ტური წარმატებით წაიშალა.",
        deletedTourId: tour.id,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error(
      "Admin tour delete API error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "უცნობი შეცდომა დაფიქსირდა.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}

function getStoragePathFromPublicUrl(
  publicUrl: string,
  bucketName: string
) {
  if (!publicUrl) {
    return null;
  }

  const marker =
    `/storage/v1/object/public/${bucketName}/`;

  const markerIndex =
    publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const encodedPath =
    publicUrl.slice(
      markerIndex + marker.length
    );

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
}