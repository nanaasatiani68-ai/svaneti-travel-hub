import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StaffRole = "director" | "admin" | "user";

type UpdateRoleBody = {
  userId?: string;
  role?: StaffRole;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const result = await authenticateDirector(request);

    if (!result.success) {
      return result.response;
    }

    const { supabaseAdmin, currentUser } = result;

    const {
      data: usersData,
      error: usersError,
    } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersError) {
      console.error("Auth users loading error:", usersError);

      return NextResponse.json(
        {
          success: false,
          error:
            "მომხმარებლების ჩატვირთვა ვერ მოხერხდა.",
        },
        {
          status: 500,
        }
      );
    }

    const authUsers = usersData.users;

    const userIds = authUsers.map((user) => user.id);

    let profiles: ProfileRecord[] = [];

    if (userIds.length > 0) {
      const {
        data: profilesData,
        error: profilesError,
      } = await supabaseAdmin
        .from("profiles")
        .select(
          `
            id,
            full_name,
            phone,
            avatar_url,
            role
          `
        )
        .in("id", userIds);

      if (profilesError) {
        console.error(
          "Staff profiles loading error:",
          profilesError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "მომხმარებლების პროფილების ჩატვირთვა ვერ მოხერხდა.",
          },
          {
            status: 500,
          }
        );
      }

      profiles =
        (profilesData as ProfileRecord[] | null) || [];
    }

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.id,
        profile,
      ])
    );

    const users = authUsers
      .map((authUser) => {
        const profile =
          profileMap.get(authUser.id);

        return {
          id: authUser.id,
          email: authUser.email || "",
          full_name:
            profile?.full_name ||
            String(
              authUser.user_metadata?.full_name || ""
            ).trim() ||
            null,
          phone: profile?.phone || null,
          avatar_url: profile?.avatar_url || null,
          role: profile?.role || "user",
          created_at: authUser.created_at || null,
        };
      })
      .sort((firstUser, secondUser) => {
        const roleOrder: Record<string, number> = {
          director: 0,
          admin: 1,
          user: 2,
        };

        const firstRole =
          normalizeRole(firstUser.role);

        const secondRole =
          normalizeRole(secondUser.role);

        const roleDifference =
          roleOrder[firstRole] -
          roleOrder[secondRole];

        if (roleDifference !== 0) {
          return roleDifference;
        }

        return String(
          firstUser.full_name || firstUser.email
        ).localeCompare(
          String(
            secondUser.full_name || secondUser.email
          ),
          "ka"
        );
      });

    return NextResponse.json(
      {
        success: true,
        users,
        currentUserId: currentUser.id,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Director staff GET error:", error);

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

export async function PATCH(request: NextRequest) {
  try {
    const result = await authenticateDirector(request);

    if (!result.success) {
      return result.response;
    }

    const { supabaseAdmin, currentUser } = result;

    let body: UpdateRoleBody;

    try {
      body =
        (await request.json()) as UpdateRoleBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "მოთხოვნის მონაცემები არასწორია.",
        },
        {
          status: 400,
        }
      );
    }

    const userId =
      String(body.userId || "").trim();

    const nextRole =
      normalizeRole(body.role || "user");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "მომხმარებლის ID არ არის მითითებული.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      nextRole !== "admin" &&
      nextRole !== "user"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "მომხმარებლისთვის დასაშვებია მხოლოდ Admin ან User როლი.",
        },
        {
          status: 400,
        }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "საკუთარი Director როლის შეცვლა შეუძლებელია.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      data: targetProfile,
      error: targetProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (targetProfileError) {
      console.error(
        "Target profile loading error:",
        targetProfileError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "მომხმარებლის პროფილის შემოწმება ვერ მოხერხდა.",
        },
        {
          status: 500,
        }
      );
    }

    const currentTargetRole =
      normalizeRole(targetProfile?.role || "user");

    if (currentTargetRole === "director") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Director-ის როლის შეცვლა ამ გვერდიდან შეუძლებელია.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      data: targetAuthUser,
      error: targetAuthUserError,
    } = await supabaseAdmin.auth.admin.getUserById(
      userId
    );

    if (
      targetAuthUserError ||
      !targetAuthUser.user
    ) {
      console.error(
        "Target auth user loading error:",
        targetAuthUserError
      );

      return NextResponse.json(
        {
          success: false,
          error: "მომხმარებელი ვერ მოიძებნა.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      error: roleUpdateError,
    } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          role: nextRole,
        },
        {
          onConflict: "id",
        }
      );

    if (roleUpdateError) {
      console.error(
        "Staff role update error:",
        roleUpdateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            `როლის შეცვლა ვერ მოხერხდა: ${roleUpdateError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          nextRole === "admin"
            ? "მომხმარებელს Admin-ის უფლება მიენიჭა."
            : "მომხმარებელს Admin-ის უფლება მოეხსნა.",
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error(
      "Director staff PATCH error:",
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

async function authenticateDirector(
  request: NextRequest
) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "სერვერის კონფიგურაცია არასრულია.",
        },
        {
          status: 500,
        }
      ),
    };
  }

  const authorization =
    request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "ავტორიზაცია აუცილებელია.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const accessToken =
    authorization.slice(7).trim();

  if (!accessToken) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error:
            "ავტორიზაციის მონაცემები ვერ მოიძებნა.",
        },
        {
          status: 401,
        }
      ),
    };
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
      "Director authentication error:",
      userError
    );

    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error:
            "მომხმარებლის ავტორიზაცია ვერ დადასტურდა.",
        },
        {
          status: 401,
        }
      ),
    };
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
    console.error(
      "Director role loading error:",
      profileError
    );

    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Director-ის როლის შემოწმება ვერ მოხერხდა.",
        },
        {
          status: 500,
        }
      ),
    };
  }

  const role =
    normalizeRole(profile?.role || "user");

  if (role !== "director") {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error:
            "ამ ფუნქციის გამოყენება მხოლოდ Director-ს შეუძლია.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    success: true as const,
    supabaseAdmin,
    currentUser,
  };
}

function normalizeRole(
  role: string
): StaffRole {
  const normalizedRole =
    String(role || "")
      .trim()
      .toLowerCase();

  if (normalizedRole === "director") {
    return "director";
  }

  if (normalizedRole === "admin") {
    return "admin";
  }

  return "user";
}