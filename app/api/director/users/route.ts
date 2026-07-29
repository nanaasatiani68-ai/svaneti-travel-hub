import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserRole = "director" | "admin" | "user";
type UserAction = "block" | "unblock";

type PatchBody = {
  userId?: string;
  action?: UserAction;
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
    const authResult = await authenticateDirector(request);

    if (!authResult.success) {
      return authResult.response;
    }

    const { supabaseAdmin, currentUser } = authResult;

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
          error: "áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ”áƒ‘áƒ˜áƒ¡ áƒ©áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ•áƒ áƒ•áƒ”áƒ  áƒ›áƒáƒ®áƒ”áƒ áƒ®áƒ“áƒ.",
        },
        { status: 500 }
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
        .select("id, full_name, phone, avatar_url, role")
        .in("id", userIds);

      if (profilesError) {
        console.error("Profiles loading error:", profilesError);

        return NextResponse.json(
          {
            success: false,
            error: "áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ”áƒ‘áƒ˜áƒ¡ áƒžáƒ áƒáƒ¤áƒ˜áƒšáƒ”áƒ‘áƒ˜ áƒ•áƒ”áƒ  áƒ©áƒáƒ˜áƒ¢áƒ•áƒ˜áƒ áƒ—áƒ.",
          },
          { status: 500 }
        );
      }

      profiles =
        (profilesData as ProfileRecord[] | null) || [];
    }

    const profileMap = new Map(
      profiles.map((profile) => [profile.id, profile])
    );

    const users = authUsers
      .map((authUser) => {
        const profile = profileMap.get(authUser.id);

        return {
          id: authUser.id,
          email: authUser.email || "",
          full_name:
            profile?.full_name ||
            String(authUser.user_metadata?.full_name || "").trim() ||
            null,
          phone: profile?.phone || authUser.phone || null,
          avatar_url: profile?.avatar_url || null,
          role: profile?.role || "user",
          created_at: authUser.created_at || null,
          last_sign_in_at: authUser.last_sign_in_at || null,
          email_confirmed_at: authUser.email_confirmed_at || null,
          banned_until: authUser.banned_until || null,
        };
      })
      .sort((firstUser, secondUser) => {
        const roleOrder: Record<UserRole, number> = {
          director: 0,
          admin: 1,
          user: 2,
        };

        const roleDifference =
          roleOrder[normalizeRole(firstUser.role)] -
          roleOrder[normalizeRole(secondUser.role)];

        if (roleDifference !== 0) {
          return roleDifference;
        }

        return String(
          firstUser.full_name || firstUser.email
        ).localeCompare(
          String(secondUser.full_name || secondUser.email),
          "ka"
        );
      });

    return NextResponse.json(
      {
        success: true,
        users,
        currentUserId: currentUser.id,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Director users GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "áƒ£áƒªáƒœáƒáƒ‘áƒ˜ áƒ¨áƒ”áƒªáƒ“áƒáƒ›áƒ áƒ“áƒáƒ¤áƒ˜áƒ¥áƒ¡áƒ˜áƒ áƒ“áƒ.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateDirector(request);

    if (!authResult.success) {
      return authResult.response;
    }

    const { supabaseAdmin, currentUser } = authResult;

    let body: PatchBody;

    try {
      body = (await request.json()) as PatchBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "áƒ›áƒáƒ—áƒ®áƒáƒ•áƒœáƒ˜áƒ¡ áƒ›áƒáƒœáƒáƒªáƒ”áƒ›áƒ”áƒ‘áƒ˜ áƒáƒ áƒáƒ¡áƒ¬áƒáƒ áƒ˜áƒ.",
        },
        { status: 400 }
      );
    }

    const userId = String(body.userId || "").trim();
    const action = body.action;

    if (!userId || (action !== "block" && action !== "unblock")) {
      return NextResponse.json(
        {
          success: false,
          error: "áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ˜áƒ¡ ID áƒáƒœ áƒ›áƒáƒ¥áƒ›áƒ”áƒ“áƒ”áƒ‘áƒ áƒáƒ áƒáƒ¡áƒ¬áƒáƒ áƒ˜áƒ.",
        },
        { status: 400 }
      );
    }

    const protectionResult = await verifyTargetIsManageable(
      supabaseAdmin,
      currentUser.id,
      userId
    );

    if (!protectionResult.success) {
      return protectionResult.response;
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: action === "block" ? "876000h" : "none",
      });

    if (updateError) {
      console.error("User block update error:", updateError);

      return NextResponse.json(
        {
          success: false,
          error: `áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ˜áƒ¡ áƒ¡áƒ¢áƒáƒ¢áƒ£áƒ¡áƒ˜áƒ¡ áƒ¨áƒ”áƒªáƒ•áƒšáƒ áƒ•áƒ”áƒ  áƒ›áƒáƒ®áƒ”áƒ áƒ®áƒ“áƒ: ${updateError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          action === "block"
            ? "áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ˜áƒ¡ áƒáƒœáƒ’áƒáƒ áƒ˜áƒ¨áƒ˜ áƒ“áƒáƒ˜áƒ‘áƒšáƒáƒ™áƒ."
            : "áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ˜áƒ¡ áƒáƒœáƒ’áƒáƒ áƒ˜áƒ¨áƒ¡ áƒ‘áƒšáƒáƒ™áƒ˜ áƒ›áƒáƒ”áƒ®áƒ¡áƒœáƒ.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Director users PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "áƒ£áƒªáƒœáƒáƒ‘áƒ˜ áƒ¨áƒ”áƒªáƒ“áƒáƒ›áƒ áƒ“áƒáƒ¤áƒ˜áƒ¥áƒ¡áƒ˜áƒ áƒ“áƒ.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateDirector(request);

    if (!authResult.success) {
      return authResult.response;
    }

    const { supabaseAdmin, currentUser } = authResult;

    const userId =
      request.nextUrl.searchParams.get("userId")?.trim() || "";

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ˜áƒ¡ ID áƒáƒ  áƒáƒ áƒ˜áƒ¡ áƒ›áƒ˜áƒ—áƒ˜áƒ—áƒ”áƒ‘áƒ£áƒšáƒ˜.",
        },
        { status: 400 }
      );
    }

    const protectionResult = await verifyTargetIsManageable(
      supabaseAdmin,
      currentUser.id,
      userId
    );

    if (!protectionResult.success) {
      return protectionResult.response;
    }

    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Auth user deletion error:", deleteError);

      return NextResponse.json(
        {
          success: false,
          error:
            `áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ˜áƒ¡ áƒ¬áƒáƒ¨áƒšáƒ áƒ•áƒ”áƒ  áƒ›áƒáƒ®áƒ”áƒ áƒ®áƒ“áƒ: ${deleteError.message}. ` +
            "áƒ—áƒ£ áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒ”áƒšáƒ˜ Storage-áƒ˜áƒ¡ áƒ¤áƒáƒ˜áƒšáƒ”áƒ‘áƒ¡ áƒ¤áƒšáƒáƒ‘áƒ¡, áƒ¯áƒ”áƒ  áƒ˜áƒ¡ áƒ¤áƒáƒ˜áƒšáƒ”áƒ‘áƒ˜ áƒ£áƒœáƒ“áƒ áƒ¬áƒáƒ˜áƒ¨áƒáƒšáƒáƒ¡ áƒáƒœ áƒ›áƒ¤áƒšáƒáƒ‘áƒ”áƒšáƒ˜ áƒ¨áƒ”áƒ˜áƒªáƒ•áƒáƒšáƒáƒ¡.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒ”áƒšáƒ˜ áƒ¬áƒáƒ áƒ›áƒáƒ¢áƒ”áƒ‘áƒ˜áƒ— áƒ¬áƒáƒ˜áƒ¨áƒáƒšáƒ.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Director users DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "áƒ£áƒªáƒœáƒáƒ‘áƒ˜ áƒ¨áƒ”áƒªáƒ“áƒáƒ›áƒ áƒ“áƒáƒ¤áƒ˜áƒ¥áƒ¡áƒ˜áƒ áƒ“áƒ.",
      },
      { status: 500 }
    );
  }
}

async function authenticateDirector(request: NextRequest) {
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
          error: "áƒ¡áƒ”áƒ áƒ•áƒ”áƒ áƒ˜áƒ¡ áƒ™áƒáƒœáƒ¤áƒ˜áƒ’áƒ£áƒ áƒáƒªáƒ˜áƒ áƒáƒ áƒáƒ¡áƒ áƒ£áƒšáƒ˜áƒ.",
        },
        { status: 500 }
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
          error: "áƒáƒ•áƒ¢áƒáƒ áƒ˜áƒ–áƒáƒªáƒ˜áƒ áƒáƒ£áƒªáƒ˜áƒšáƒ”áƒ‘áƒ”áƒšáƒ˜áƒ.",
        },
        { status: 401 }
      ),
    };
  }

  const accessToken = authorization.slice(7).trim();

  if (!accessToken) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "áƒáƒ•áƒ¢áƒáƒ áƒ˜áƒ–áƒáƒªáƒ˜áƒ˜áƒ¡ áƒ›áƒáƒœáƒáƒªáƒ”áƒ›áƒ”áƒ‘áƒ˜ áƒ•áƒ”áƒ  áƒ›áƒáƒ˜áƒ«áƒ”áƒ‘áƒœáƒ.",
        },
        { status: 401 }
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
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !userData.user) {
    console.error("Director authentication error:", userError);

    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ˜áƒ¡ áƒáƒ•áƒ¢áƒáƒ áƒ˜áƒ–áƒáƒªáƒ˜áƒ áƒ•áƒ”áƒ  áƒ“áƒáƒ“áƒáƒ¡áƒ¢áƒ£áƒ áƒ“áƒ.",
        },
        { status: 401 }
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
    console.error("Director role loading error:", profileError);

    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Director-áƒ˜áƒ¡ áƒ áƒáƒšáƒ˜áƒ¡ áƒ¨áƒ”áƒ›áƒáƒ¬áƒ›áƒ”áƒ‘áƒ áƒ•áƒ”áƒ  áƒ›áƒáƒ®áƒ”áƒ áƒ®áƒ“áƒ.",
        },
        { status: 500 }
      ),
    };
  }

  if (normalizeRole(profile?.role || "user") !== "director") {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "áƒáƒ› áƒ¤áƒ£áƒœáƒ¥áƒªáƒ˜áƒ˜áƒ¡ áƒ’áƒáƒ›áƒáƒ§áƒ”áƒœáƒ”áƒ‘áƒ áƒ›áƒ®áƒáƒšáƒáƒ“ Director-áƒ¡ áƒ¨áƒ”áƒ£áƒ«áƒšáƒ˜áƒ.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    success: true as const,
    supabaseAdmin,
    currentUser,
  };
}

async function verifyTargetIsManageable(
  supabaseAdmin: any,
  currentUserId: string,
  targetUserId: string
) {
  if (targetUserId === currentUserId) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "áƒ¡áƒáƒ™áƒ£áƒ—áƒáƒ áƒ˜ áƒáƒœáƒ’áƒáƒ áƒ˜áƒ¨áƒ˜áƒ¡ áƒ¨áƒ”áƒªáƒ•áƒšáƒ áƒáƒœ áƒ¬áƒáƒ¨áƒšáƒ áƒ¨áƒ”áƒ£áƒ«áƒšáƒ”áƒ‘áƒ”áƒšáƒ˜áƒ.",
        },
        { status: 403 }
      ),
    };
  }

  const {
    data: targetProfile,
    error: targetProfileError,
  } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetProfileError) {
    console.error("Target profile loading error:", targetProfileError);

    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ˜áƒ¡ áƒ áƒáƒšáƒ˜áƒ¡ áƒ¨áƒ”áƒ›áƒáƒ¬áƒ›áƒ”áƒ‘áƒ áƒ•áƒ”áƒ  áƒ›áƒáƒ®áƒ”áƒ áƒ®áƒ“áƒ.",
        },
        { status: 500 }
      ),
    };
  }

  if (normalizeRole(targetProfile?.role || "user") === "director") {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Director-áƒ˜áƒ¡ áƒáƒœáƒ’áƒáƒ áƒ˜áƒ¨áƒ˜áƒ¡ áƒ¨áƒ”áƒªáƒ•áƒšáƒ áƒáƒœ áƒ¬áƒáƒ¨áƒšáƒ áƒ¨áƒ”áƒ£áƒ«áƒšáƒ”áƒ‘áƒ”áƒšáƒ˜áƒ.",
        },
        { status: 403 }
      ),
    };
  }

  const {
    data: targetAuthUser,
    error: targetAuthError,
  } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

  if (targetAuthError || !targetAuthUser.user) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒ”áƒšáƒ˜ áƒ•áƒ”áƒ  áƒ›áƒáƒ˜áƒ«áƒ”áƒ‘áƒœáƒ.",
        },
        { status: 404 }
      ),
    };
  }

  return {
    success: true as const,
  };
}

function normalizeRole(role: string | null): UserRole {
  const normalizedRole = String(role || "").trim().toLowerCase();

  if (normalizedRole === "director") {
    return "director";
  }

  if (normalizedRole === "admin") {
    return "admin";
  }

  return "user";
}

