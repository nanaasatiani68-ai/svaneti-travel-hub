import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = [
  "nanaasatiani68@gmail.com",
  "lerichartolani1990@gmail.com",
];

const EMAIL_FROM =
  "Georgia Gateway Hub <bookings@georgiagatewayhub.com>";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://georgiagatewayhub.com";

type BookingRequestBody = {
  tourId?: string | number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  bookingDate?: string;
  people?: number;
  notes?: string | null;
};

type ResendEmailPayload = {
  from: string;
  to: string[];
  bcc?: string[];
  reply_to?: string;
  subject: string;
  html: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );

      return NextResponse.json(
        {
          success: false,
          error: "სერვერის კონფიგურაცია არასრულია.",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as BookingRequestBody;

    const tourId = body.tourId;
    const guestName = body.guestName?.trim() || "";
    const guestEmail = body.guestEmail?.trim().toLowerCase() || "";
    const guestPhone = body.guestPhone?.trim() || "";
    const bookingDate = body.bookingDate?.trim() || "";
    const people = Number(body.people);
    const notes = body.notes?.trim() || null;

    if (
      tourId === undefined ||
      tourId === null ||
      !guestName ||
      !guestEmail ||
      !guestPhone ||
      !bookingDate ||
      !Number.isInteger(people) ||
      people < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "შეავსე ჯავშნის ყველა სავალდებულო ველი.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(guestEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "ელფოსტის მისამართი არასწორია.",
        },
        { status: 400 }
      );
    }

    if (!isValidDate(bookingDate)) {
      return NextResponse.json(
        {
          success: false,
          error: "ტურის თარიღი არასწორია.",
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

    const { data: tour, error: tourError } = await supabaseAdmin
      .from("tours")
      .select(
        "id, user_id, title, price, max_people, status"
      )
      .eq("id", tourId)
      .maybeSingle();

    if (tourError) {
      console.error("Tour loading error:", tourError);

      return NextResponse.json(
        {
          success: false,
          error: "ტურის ინფორმაციის ჩატვირთვა ვერ მოხერხდა.",
        },
        { status: 500 }
      );
    }

    if (!tour || tour.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: "ტური ვერ მოიძებნა ან ხელმისაწვდომი აღარ არის.",
        },
        { status: 404 }
      );
    }

    if (tour.max_people && people > Number(tour.max_people)) {
      return NextResponse.json(
        {
          success: false,
          error: `ამ ტურზე მაქსიმალური რაოდენობაა ${tour.max_people} ადამიანი.`,
        },
        { status: 400 }
      );
    }

    let bookingUserId: string | null = null;
    const authorization = request.headers.get("authorization");

    if (authorization?.startsWith("Bearer ")) {
      const accessToken = authorization.slice(7).trim();

      if (accessToken) {
        const { data: userData, error: userError } =
          await supabaseAdmin.auth.getUser(accessToken);

        if (!userError && userData.user) {
          bookingUserId = userData.user.id;
        }
      }
    }

    const totalPrice =
      tour.price === null || tour.price === undefined
        ? null
        : Number(tour.price);

    const { data: booking, error: bookingError } =
      await supabaseAdmin
        .from("bookings")
        .insert({
          tour_id: tour.id,
          user_id: bookingUserId,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          booking_date: bookingDate,
          people,
          total_price: totalPrice,
          notes,
          status: "pending",
        })
        .select("id, created_at")
        .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);

      return NextResponse.json(
        {
          success: false,
          error: `ჯავშნის შენახვა ვერ მოხერხდა: ${bookingError.message}`,
        },
        { status: 500 }
      );
    }

    let ownerEmail: string | null = null;

    if (tour.user_id) {
      const { data: ownerData, error: ownerError } =
        await supabaseAdmin.auth.admin.getUserById(tour.user_id);

      if (ownerError) {
        console.error("Tour owner email loading error:", ownerError);
      } else {
        ownerEmail = ownerData.user?.email?.toLowerCase() || null;
      }
    }

    let emailWarning: string | null = null;

    if (!resendApiKey) {
      emailWarning =
        "RESEND_API_KEY სერვერზე ვერ მოიძებნა. ჯავშანი შეიქმნა, მაგრამ ელფოსტა არ გაგზავნილა.";
      console.error(emailWarning);
    } else {
      try {
        const bookingId = String(booking.id);
        const tourTitle = tour.title || "უსახელო ტური";
        const bookingDetailsUrl = `${SITE_URL}/dashboard/bookings/${encodeURIComponent(
          bookingId
        )}`;

        const staffRecipients = uniqueEmails([
          ...ADMIN_EMAILS,
          ownerEmail,
        ]);

        const primaryStaffRecipient =
          staffRecipients[0] || ADMIN_EMAILS[0];
        const staffBcc = staffRecipients.slice(1);

        await sendResendEmail(resendApiKey, {
          from: EMAIL_FROM,
          to: [primaryStaffRecipient],
          ...(staffBcc.length > 0 ? { bcc: staffBcc } : {}),
          reply_to: guestEmail,
          subject: `ახალი ჯავშანი: ${tourTitle}`,
          html: buildStaffEmailHtml({
            bookingId,
            tourTitle,
            guestName,
            guestEmail,
            guestPhone,
            bookingDate,
            people,
            totalPrice,
            notes,
            bookingDetailsUrl,
          }),
        });

        await sendResendEmail(resendApiKey, {
          from: EMAIL_FROM,
          to: [guestEmail],
          reply_to: ADMIN_EMAILS[0],
          subject: `Your booking request was received: ${tourTitle}`,
          html: buildGuestEmailHtml({
            bookingId,
            tourTitle,
            guestName,
            bookingDate,
            people,
            totalPrice,
            notes,
          }),
        });
      } catch (emailError) {
        console.error("Booking email sending error:", emailError);

        emailWarning =
          emailError instanceof Error
            ? emailError.message
            : "ელფოსტის გაგზავნისას უცნობი შეცდომა დაფიქსირდა.";
      }
    }

    return NextResponse.json(
      {
        success: true,
        bookingId: booking.id,
        emailWarning,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Booking API error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "უცნობი შეცდომა დაფიქსირდა.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

async function sendResendEmail(
  apiKey: string,
  payload: ResendEmailPayload
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

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

function buildStaffEmailHtml({
  bookingId,
  tourTitle,
  guestName,
  guestEmail,
  guestPhone,
  bookingDate,
  people,
  totalPrice,
  notes,
  bookingDetailsUrl,
}: {
  bookingId: string;
  tourTitle: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  bookingDate: string;
  people: number;
  totalPrice: number | null;
  notes: string | null;
  bookingDetailsUrl: string;
}) {
  return `
    <!doctype html>
    <html lang="ka">
      <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
          <div style="background:#0f172a;border-radius:24px;padding:32px;color:#ffffff;">
            <p style="margin:0;color:#67e8f9;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
              Georgia Gateway Hub
            </p>
            <h1 style="margin:14px 0 8px;font-size:30px;line-height:1.2;">
              ახალი ჯავშნის მოთხოვნა
            </h1>
            <p style="margin:0;color:#cbd5e1;line-height:1.7;">
              მომხმარებელმა ტურის დაჯავშნის მოთხოვნა გამოგზავნა.
            </p>
          </div>

          <div style="margin-top:18px;background:#ffffff;border-radius:24px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,.08);">
            ${emailRow("ჯავშნის ნომერი", bookingId)}
            ${emailRow("ტური", tourTitle)}
            ${emailRow("სტუმარი", guestName)}
            ${emailRow("ელფოსტა", guestEmail)}
            ${emailRow("ტელეფონი", guestPhone)}
            ${emailRow("ტურის თარიღი", formatEmailDate(bookingDate))}
            ${emailRow("ადამიანების რაოდენობა", String(people))}
            ${emailRow("მანქანის სრული ფასი", formatPrice(totalPrice))}
            ${emailRow("დამატებითი შეტყობინება", notes || "არ არის")}

            <a href="${escapeHtml(bookingDetailsUrl)}"
              style="display:inline-block;margin-top:24px;background:#0891b2;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:14px;">
              ჯავშნის ნახვა
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildGuestEmailHtml({
  bookingId,
  tourTitle,
  guestName,
  bookingDate,
  people,
  totalPrice,
  notes,
}: {
  bookingId: string;
  tourTitle: string;
  guestName: string;
  bookingDate: string;
  people: number;
  totalPrice: number | null;
  notes: string | null;
}) {
  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
          <div style="background:#0f172a;border-radius:24px;padding:32px;color:#ffffff;">
            <p style="margin:0;color:#67e8f9;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
              Georgia Gateway Hub
            </p>
            <h1 style="margin:14px 0 8px;font-size:30px;line-height:1.2;">
              Your booking request was received
            </h1>
            <p style="margin:0;color:#cbd5e1;line-height:1.7;">
              Hello ${escapeHtml(guestName)}, your request has been sent to the tour organizer.
            </p>
          </div>

          <div style="margin-top:18px;background:#ffffff;border-radius:24px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,.08);">
            ${emailRow("Booking number", bookingId)}
            ${emailRow("Tour", tourTitle)}
            ${emailRow("Tour date", formatEmailDate(bookingDate))}
            ${emailRow("Number of guests", String(people))}
            ${emailRow("Full vehicle price", formatPrice(totalPrice))}
            ${emailRow("Your message", notes || "Not provided")}

            <div style="margin-top:24px;padding:18px;border-radius:16px;background:#ecfeff;color:#155e75;line-height:1.7;">
              This is a booking request, not a final confirmation. The tour organizer will contact you by phone or email.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function emailRow(label: string, value: string) {
  return `
    <div style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
      <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;">
        ${escapeHtml(label)}
      </div>
      <div style="margin-top:5px;font-size:16px;font-weight:700;color:#0f172a;white-space:pre-line;">
        ${escapeHtml(value)}
      </div>
    </div>
  `;
}

function uniqueEmails(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim().toLowerCase())
        .filter(isValidEmail)
    )
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return date >= today;
}

function formatEmailDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatPrice(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "By agreement";
  }

  return `${value.toLocaleString("ka-GE")} ₾`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}