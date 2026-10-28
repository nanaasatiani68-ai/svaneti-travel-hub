import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

type RequestBody = {
  status?: BookingStatus;
};

type BookingRecord = {
  id: string;
  tour_id: string | number | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  booking_date: string | null;
  people: number | null;
  total_price: number | null;
  notes: string | null;
  status: string | null;
  completed_at: string | null;
};

type TourRecord = {
  id: string | number;
  title: string | null;
};

type ResendPayload = {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
};

const ALLOWED_ROLES = ["director", "admin"];

const ALLOWED_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
];

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "სერვერის Supabase კონფიგურაცია არასრულია.",
        },
        { status: 500 }
      );
    }

    const { id } = await context.params;
    const bookingId = id?.trim();

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: "ჯავშნის ID არასწორია.",
        },
        { status: 400 }
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

    const accessToken =
      authorization.slice(7).trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "ავტორიზაციის token ვერ მოიძებნა.",
        },
        { status: 401 }
      );
    }

    let body: RequestBody;

    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "მოთხოვნის მონაცემები არასწორია.",
        },
        { status: 400 }
      );
    }

    const newStatus = body.status;

    if (
      !newStatus ||
      !ALLOWED_STATUSES.includes(newStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "ჯავშნის ახალი სტატუსი არასწორია.",
        },
        { status: 400 }
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
        "Booking status user verification error:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error: "მომხმარებლის ავტორიზაცია ვერ დადასტურდა.",
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
      console.error(
        "Booking status role loading error:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error: "მომხმარებლის როლის შემოწმება ვერ მოხერხდა.",
        },
        { status: 500 }
      );
    }

    const role = String(
      profile?.role || ""
    )
      .trim()
      .toLowerCase();

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ჯავშნის სტატუსის შეცვლა მხოლოდ Director-ს ან Admin-ს შეუძლია.",
        },
        { status: 403 }
      );
    }

    const {
      data: bookingData,
      error: bookingLoadError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        `
          id,
          tour_id,
          guest_name,
          guest_email,
          guest_phone,
          booking_date,
          people,
          total_price,
          notes,
          status,
          completed_at
        `
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingLoadError) {
      console.error(
        "Booking loading before status update error:",
        bookingLoadError
      );

      return NextResponse.json(
        {
          success: false,
          error: "ჯავშნის ჩატვირთვა ვერ მოხერხდა.",
        },
        { status: 500 }
      );
    }

    const booking =
      bookingData as BookingRecord | null;

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: "ჯავშანი ვერ მოიძებნა.",
        },
        { status: 404 }
      );
    }

    const updatePayload = {
      status: newStatus,
      completed_at:
        newStatus === "completed"
          ? new Date().toISOString()
          : null,
    };

    const {
      data: updatedBooking,
      error: updateError,
    } = await supabaseAdmin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId)
      .select("id, status, completed_at")
      .single();

    if (updateError) {
      console.error(
        "Booking status update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            `ჯავშნის სტატუსის შეცვლა ვერ მოხერხდა: ${updateError.message}`,
        },
        { status: 500 }
      );
    }

    let tourTitle = "Georgia Gateway Hub Tour";

    if (booking.tour_id !== null) {
      const {
        data: tourData,
        error: tourError,
      } = await supabaseAdmin
        .from("tours")
        .select("id, title")
        .eq("id", booking.tour_id)
        .maybeSingle();

      if (tourError) {
        console.error(
          "Booking tour loading error:",
          tourError
        );
      } else {
        const tour =
          tourData as TourRecord | null;

        if (tour?.title) {
          tourTitle = tour.title;
        }
      }
    }

    let emailWarning: string | null = null;

    const guestEmail =
      booking.guest_email?.trim().toLowerCase() || "";

    const resendApiKey =
      process.env.RESEND_API_KEY?.trim();

    if (guestEmail && isValidEmail(guestEmail)) {
      if (!resendApiKey) {
        emailWarning =
          "RESEND_API_KEY ვერ მოიძებნა და მომხმარებლისთვის წერილი არ გაგზავნილა.";
      } else {
        try {
          const fromName =
            process.env.RESEND_FROM_NAME?.trim() ||
            "Georgia Gateway Hub";

          const fromEmail =
            process.env.RESEND_FROM_EMAIL?.trim() ||
            "onboarding@resend.dev";

          const directorEmail =
            process.env.DIRECTOR_EMAIL?.trim().toLowerCase() ||
            "";

          await sendResendEmail(
            resendApiKey,
            {
              from: `${fromName} <${fromEmail}>`,
              to: [guestEmail],
              ...(isValidEmail(directorEmail)
                ? { reply_to: directorEmail }
                : {}),
              subject: buildEmailSubject(
                newStatus,
                tourTitle
              ),
              html: buildGuestStatusEmail({
                status: newStatus,
                guestName:
                  booking.guest_name || "Guest",
                tourTitle,
                bookingDate:
                  booking.booking_date,
                people: booking.people,
                totalPrice:
                  booking.total_price,
              }),
            }
          );
        } catch (emailError: unknown) {
          console.error(
            "Booking status email error:",
            emailError
          );

          emailWarning =
            emailError instanceof Error
              ? emailError.message
              : "ელფოსტის გაგზავნისას უცნობი შეცდომა დაფიქსირდა.";
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        booking: updatedBooking,
        message: statusSuccessMessage(newStatus),
        emailWarning,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(
      "Admin booking status API error:",
      error
    );

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

async function sendResendEmail(
  apiKey: string,
  payload: ResendPayload
) {
  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result = (await response.json()) as {
    id?: string;
    message?: string;
    name?: string;
  };

  if (!response.ok) {
    throw new Error(
      result.message ||
        result.name ||
        "Resend-მა ელფოსტის გაგზავნა ვერ შეძლო."
    );
  }

  return result;
}

function buildEmailSubject(
  status: BookingStatus,
  tourTitle: string
) {
  if (status === "confirmed") {
    return `Booking confirmed: ${tourTitle}`;
  }

  if (status === "rejected") {
    return `Booking request declined: ${tourTitle}`;
  }

  if (status === "cancelled") {
    return `Booking cancelled: ${tourTitle}`;
  }

  if (status === "completed") {
    return `Tour completed: ${tourTitle}`;
  }

  return `Booking status updated: ${tourTitle}`;
}

function buildGuestStatusEmail({
  status,
  guestName,
  tourTitle,
  bookingDate,
  people,
  totalPrice,
}: {
  status: BookingStatus;
  guestName: string;
  tourTitle: string;
  bookingDate: string | null;
  people: number | null;
  totalPrice: number | null;
}) {
  const content = statusEmailContent(status);

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
          <div style="background:#0f172a;border-radius:24px;padding:32px;color:#ffffff;">
            <p style="margin:0;color:#67e8f9;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
              Georgia Gateway Hub
            </p>
            <h1 style="margin:14px 0 8px;font-size:30px;line-height:1.2;">
              ${escapeHtml(content.title)}
            </h1>
            <p style="margin:0;color:#cbd5e1;line-height:1.7;">
              Hello ${escapeHtml(guestName)}, ${escapeHtml(content.description)}
            </p>
          </div>

          <div style="margin-top:18px;background:#ffffff;border-radius:24px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,.08);">
            ${emailRow("Tour", tourTitle)}
            ${emailRow("Tour date", formatDate(bookingDate))}
            ${emailRow("Number of guests", people ? String(people) : "Not provided")}
            ${emailRow("Price", formatPrice(totalPrice))}

            <div style="margin-top:24px;padding:18px;border-radius:16px;background:${content.background};color:${content.color};line-height:1.7;">
              ${escapeHtml(content.notice)}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function statusEmailContent(
  status: BookingStatus
) {
  if (status === "confirmed") {
    return {
      title: "Your booking is confirmed",
      description:
        "your booking has been confirmed by our team.",
      notice:
        "Your booking is now confirmed. The organizer may contact you with final meeting and tour details.",
      background: "#ecfdf5",
      color: "#065f46",
    };
  }

  if (status === "rejected") {
    return {
      title: "Your booking request was declined",
      description:
        "unfortunately, your booking request could not be accepted.",
      notice:
        "Please contact Georgia Gateway Hub if you would like help choosing another date or tour.",
      background: "#fef2f2",
      color: "#991b1b",
    };
  }

  if (status === "cancelled") {
    return {
      title: "Your booking was cancelled",
      description:
        "your booking has been marked as cancelled.",
      notice:
        "Please contact Georgia Gateway Hub if you believe this was a mistake or want to make a new booking.",
      background: "#f1f5f9",
      color: "#334155",
    };
  }

  if (status === "completed") {
    return {
      title: "Your tour is completed",
      description:
        "your tour has been marked as completed.",
      notice:
        "Thank you for travelling with Georgia Gateway Hub. You can now leave a review for this completed tour.",
      background: "#eef2ff",
      color: "#3730a3",
    };
  }

  return {
    title: "Your booking is pending",
    description:
      "your booking has been returned to pending status.",
    notice:
      "The booking is being reviewed. You will receive another message when a final decision is made.",
    background: "#fffbeb",
    color: "#92400e",
  };
}

function statusSuccessMessage(
  status: BookingStatus
) {
  if (status === "confirmed") {
    return "ჯავშანი წარმატებით დადასტურდა.";
  }

  if (status === "rejected") {
    return "ჯავშანი წარმატებით უარყოფილია.";
  }

  if (status === "cancelled") {
    return "ჯავშანი წარმატებით გაუქმდა.";
  }

  if (status === "completed") {
    return "ტური წარმატებით მოინიშნა შესრულებულად.";
  }

  return "ჯავშანი მოლოდინის სტატუსზე დაბრუნდა.";
}

function emailRow(
  label: string,
  value: string
) {
  return `
    <div style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
      <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;">
        ${escapeHtml(label)}
      </div>
      <div style="margin-top:5px;font-size:16px;font-weight:700;color:#0f172a;white-space:pre-line;word-break:break-word;">
        ${escapeHtml(value)}
      </div>
    </div>
  `;
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(
    `${value}T00:00:00Z`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(date);
}

function formatPrice(
  value: number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return "By agreement";
  }

  return `${value.toLocaleString("en-GB")} ₾`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}