import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration is missing." },
        { status: 500 }
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "ავტორიზაცია აუცილებელია." },
        { status: 401 }
      );
    }

    const accessToken =
      authorization.slice(7).trim();

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
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(
      accessToken
    );

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "სესია არასწორია ან ვადა გაუვიდა.",
        },
        { status: 401 }
      );
    }

    /*
     * SITE SETTINGS
     *
     * Provider განაცხადების ჩართვა/გამორთვა,
     * Email notification toggle და
     * Email recipient ახლა Settings-იდან იმართება.
     */
    const {
      data: siteSettings,
      error: settingsError,
    } = await supabaseAdmin
      .from("site_settings")
      .select(
        `
          provider_applications_enabled,
          notify_provider_application,
          provider_notification_email
        `
      )
      .eq("id", 1)
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Provider site settings load error:",
        settingsError
      );

      return NextResponse.json(
        {
          error:
            "საიტის პარამეტრების ჩატვირთვა ვერ მოხერხდა.",
        },
        { status: 500 }
      );
    }

    if (
      siteSettings &&
      siteSettings.provider_applications_enabled ===
        false
    ) {
      return NextResponse.json(
        {
          error:
            "Provider განაცხადების მიღება ამჟამად გამორთულია.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      message?: unknown;
    };

    const message =
      typeof body.message === "string"
        ? body.message.trim().slice(0, 5000)
        : "";

    /*
     * მომხმარებელს ერთდროულად მხოლოდ ერთი
     * pending განაცხადი შეიძლება ჰქონდეს.
     */
    const {
      data: pendingApplication,
      error: pendingError,
    } = await supabaseAdmin
      .from("provider_applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      console.error(
        "Provider pending application check error:",
        pendingError
      );

      return NextResponse.json(
        {
          error:
            "მოთხოვნის შემოწმება ვერ მოხერხდა.",
        },
        { status: 500 }
      );
    }

    if (pendingApplication) {
      return NextResponse.json(
        {
          error:
            "უკვე გაქვს განხილვაში მყოფი მოთხოვნა.",
        },
        { status: 409 }
      );
    }

    /*
     * PROVIDER APPLICATION INSERT
     */
    const {
      data: application,
      error: insertError,
    } = await supabaseAdmin
      .from("provider_applications")
      .insert({
        user_id: user.id,
        status: "pending",
        message: message || null,
      })
      .select("id, created_at")
      .single();

    if (insertError || !application) {
      console.error(
        "Provider application insert error:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            "მოთხოვნის გაგზავნა ვერ მოხერხდა.",
        },
        { status: 500 }
      );
    }

    /*
     * მოთხოვნა უკვე შენახულია.
     *
     * თუ Email notification გამორთულია,
     * აქვე ვაბრუნებთ წარმატებულ პასუხს.
     */
    if (
      siteSettings &&
      siteSettings.notify_provider_application ===
        false
    ) {
      return NextResponse.json({
        success: true,
        applicationId: application.id,
        emailSent: false,
        emailWarning: null,
        emailSkipped: true,
      });
    }

    /*
     * EMAIL NOTIFICATION
     *
     * Email-ის შეცდომამ უკვე შექმნილი
     * Provider მოთხოვნა არ უნდა გააუქმოს.
     */
    let emailSent = false;
    let emailWarning: string | null = null;

    try {
      const apiKey =
        process.env.RESEND_API_KEY?.trim();

      /*
       * პირველი პრიორიტეტი:
       * Settings -> Provider Notification Email
       *
       * fallback:
       * .env.local -> PROVIDER_APPLICATION_EMAIL
       */
      const settingsRecipient =
        siteSettings?.provider_notification_email
          ?.trim()
          .toLowerCase();

      const fallbackRecipient =
        process.env.PROVIDER_APPLICATION_EMAIL
          ?.trim()
          .toLowerCase();

      const recipient =
        settingsRecipient ||
        fallbackRecipient;

      const fromName =
        process.env.RESEND_FROM_NAME?.trim() ||
        "Georgia Gateway Hub";

      const fromEmail =
        process.env.RESEND_FROM_EMAIL
          ?.trim()
          .toLowerCase();

      if (!apiKey) {
        throw new Error(
          "RESEND_API_KEY არ არის დაყენებული."
        );
      }

      if (!recipient) {
        throw new Error(
          "Provider Notification Email არ არის მითითებული."
        );
      }

      if (!fromEmail) {
        throw new Error(
          "RESEND_FROM_EMAIL არ არის დაყენებული."
        );
      }

      const applicantName =
        String(
          user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            ""
        ).trim() || "მომხმარებელი";

      const applicantEmail =
        user.email?.trim().toLowerCase() ||
        "არ არის მითითებული";

      const safeName =
        escapeHtml(applicantName);

      const safeEmail =
        escapeHtml(applicantEmail);

      const safeMessage = escapeHtml(
        message ||
          "მომხმარებელს დამატებითი ტექსტი არ დაუწერია."
      ).replaceAll("\n", "<br />");

      const createdAt =
        new Intl.DateTimeFormat("ka-GE", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Tbilisi",
        }).format(
          new Date(application.created_at)
        );

      const response = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [recipient],
            subject:
              "ახალი Provider მოთხოვნა — Georgia Gateway Hub",
            html: `
              <div
                style="
                  font-family:Arial,sans-serif;
                  max-width:640px;
                  margin:0 auto;
                  color:#0f172a;
                "
              >
                <h2 style="margin-bottom:20px;">
                  ახალი Provider მოთხოვნა
                </h2>

                <p>
                  Georgia Gateway Hub-ზე შემოვიდა
                  ახალი Provider სტატუსის მოთხოვნა.
                </p>

                <div
                  style="
                    background:#f8fafc;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                    padding:18px;
                    margin:20px 0;
                  "
                >
                  <p>
                    <strong>მომხმარებელი:</strong>
                    ${safeName}
                  </p>

                  <p>
                    <strong>ელფოსტა:</strong>
                    ${safeEmail}
                  </p>

                  <p>
                    <strong>მოთხოვნის დრო:</strong>
                    ${escapeHtml(createdAt)}
                  </p>

                  <p>
                    <strong>Application ID:</strong>
                    ${escapeHtml(
                      String(application.id)
                    )}
                  </p>

                  <p style="margin-bottom:6px;">
                    <strong>
                      მომხმარებლის შეტყობინება:
                    </strong>
                  </p>

                  <div
                    style="
                      background:white;
                      border-radius:8px;
                      padding:12px;
                    "
                  >
                    ${safeMessage}
                  </div>
                </div>

                <p>
                  მოთხოვნის განხილვა შეგიძლია
                  Georgia Gateway Hub-ის
                  ადმინისტრაციის პანელიდან.
                </p>
              </div>
            `,
          }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const responseText =
          await response.text();

        console.error(
          "Resend provider email response:",
          responseText
        );

        throw new Error(
          `Resend request failed with HTTP ${response.status}.`
        );
      }

      emailSent = true;
    } catch (emailError) {
      emailWarning =
        emailError instanceof Error
          ? emailError.message
          : "ელფოსტის გაგზავნა ვერ მოხერხდა.";

      console.error(
        "Provider application email notification failed:",
        emailWarning
      );
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      emailSent,
      emailWarning,
      emailSkipped: false,
    });
  } catch (error) {
    console.error(
      "Provider application submit route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "მოთხოვნის გაგზავნა ვერ მოხერხდა.",
      },
      { status: 500 }
    );
  }
}
