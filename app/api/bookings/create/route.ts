import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://georgiagatewayhub.com";

const DIRECTOR_EMAIL =
  process.env.DIRECTOR_EMAIL?.trim().toLowerCase() || "";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";

const RESEND_FROM_NAME =
  process.env.RESEND_FROM_NAME?.trim() ||
  "Georgia Gateway Hub";

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL?.trim().toLowerCase() ||
  "onboarding@resend.dev";

const EMAIL_FROM =
  `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`;

type BookingRequestBody = {
  tourId?: string | number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  bookingDate?: string;
  people?: number;
  notes?: string | null;
};

type TourData = {
  id: string | number;
  user_id: string | null;
  title: string | null;
  location: string | null;
  price: number | null;
  max_people: number | null;
  status: string | null;
};

type ResendEmailPayload = {
  from: string;
  to: string[];
  bcc?: string[];
  reply_to?: string;
  subject: string;
  html: string;
};

type ResendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    const resendApiKey =
      process.env.RESEND_API_KEY?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "სერვერის კონფიგურაცია არასრულია. Supabase-ის მონაცემები ვერ მოიძებნა.",
        },
        {
          status: 500,
        }
      );
    }

    let body: BookingRequestBody;

    try {
      body = (await request.json()) as BookingRequestBody;
    } catch (error) {
      console.error("Invalid booking request JSON:", error);

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

    const tourId = body.tourId;

    const guestName =
      body.guestName?.trim() || "";

    const guestEmail =
      body.guestEmail?.trim().toLowerCase() || "";

    const guestPhone =
      body.guestPhone?.trim() || "";

    const bookingDate =
      body.bookingDate?.trim() || "";

    const people =
      Number(body.people);

    const notes =
      body.notes?.trim() || null;

    if (
      tourId === undefined ||
      tourId === null ||
      String(tourId).trim() === "" ||
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
          error:
            "შეავსე ჯავშნის ყველა სავალდებულო ველი.",
        },
        {
          status: 400,
        }
      );
    }

    if (guestName.length > 150) {
      return NextResponse.json(
        {
          success: false,
          error:
            "სახელი და გვარი ძალიან გრძელია.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidEmail(guestEmail)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ელფოსტის მისამართი არასწორია.",
        },
        {
          status: 400,
        }
      );
    }

    if (guestPhone.length > 60) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ტელეფონის ნომერი ძალიან გრძელია.",
        },
        {
          status: 400,
        }
      );
    }

    if (notes && notes.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "დამატებითი შეტყობინება არ უნდა აღემატებოდეს 2000 სიმბოლოს.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidBookingDate(bookingDate)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ტურის თარიღი არასწორია ან უკვე გასულია.",
        },
        {
          status: 400,
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
      data: tourResult,
      error: tourError,
    } = await supabaseAdmin
      .from("tours")
      .select(
        `
          id,
          user_id,
          title,
          location,
          price,
          max_people,
          status
        `
      )
      .eq("id", tourId)
      .maybeSingle();

    if (tourError) {
      console.error(
        "Tour loading error:",
        tourError
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
      tourResult as TourData | null;

    if (!tour || tour.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error:
            "ტური ვერ მოიძებნა ან ხელმისაწვდომი აღარ არის.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      tour.max_people &&
      people > Number(tour.max_people)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `ამ ტურზე მაქსიმალური რაოდენობაა ${tour.max_people} ადამიანი.`,
        },
        {
          status: 400,
        }
      );
    }

    let bookingUserId: string | null = null;

    const authorization =
      request.headers.get("authorization");

    if (authorization?.startsWith("Bearer ")) {
      const accessToken =
        authorization.slice(7).trim();

      if (accessToken) {
        const {
          data: userData,
          error: userError,
        } = await supabaseAdmin.auth.getUser(
          accessToken
        );

        if (userError) {
          console.error(
            "Booking user loading error:",
            userError
          );
        } else if (userData.user) {
          bookingUserId = userData.user.id;
        }
      }
    }

    const totalPrice =
      tour.price === null ||
      tour.price === undefined
        ? null
        : Number(tour.price);

    const {
      data: booking,
      error: bookingError,
    } = await supabaseAdmin
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
      console.error(
        "Booking insert error:",
        bookingError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            `ჯავშნის შენახვა ვერ მოხერხდა: ${bookingError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    let ownerEmail: string | null = null;
    let ownerName: string | null = null;

    if (tour.user_id) {
      const [
        ownerAuthResult,
        ownerProfileResult,
      ] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(
          tour.user_id
        ),

        supabaseAdmin
          .from("profiles")
          .select("full_name")
          .eq("id", tour.user_id)
          .maybeSingle(),
      ]);

      if (ownerAuthResult.error) {
        console.error(
          "Tour owner email loading error:",
          ownerAuthResult.error
        );
      } else {
        ownerEmail =
          ownerAuthResult.data.user?.email
            ?.trim()
            .toLowerCase() || null;
      }

      if (ownerProfileResult.error) {
        console.error(
          "Tour owner profile loading error:",
          ownerProfileResult.error
        );
      } else {
        ownerName =
          ownerProfileResult.data?.full_name
            ?.trim() || null;
      }
    }

    let emailWarning: string | null = null;

    if (!resendApiKey) {
      emailWarning =
        "RESEND_API_KEY სერვერზე ვერ მოიძებნა. ჯავშანი შეიქმნა, მაგრამ ელფოსტა არ გაგზავნილა.";

      console.error(emailWarning);
    } else {
      try {
        const bookingId =
          String(booking.id);

        const tourTitle =
          tour.title?.trim() ||
          "უსახელო ტური";

        const tourLocation =
          tour.location?.trim() ||
          "საქართველო";

        const bookingDetailsUrl =
          `${SITE_URL}/admin-v2/bookings`;

        const staffRecipients =
          uniqueEmails([
            DIRECTOR_EMAIL,
            ADMIN_EMAIL,
            ownerEmail,
          ]);

        if (staffRecipients.length === 0) {
          throw new Error(
            "DIRECTOR_EMAIL, ADMIN_EMAIL ან ტურის მფლობელის ელფოსტა ვერ მოიძებნა."
          );
        }

        const primaryStaffRecipient =
          staffRecipients[0];

        const staffBcc =
          staffRecipients.slice(1);

        const staffEmailResult =
          await sendResendEmail(
            resendApiKey,
            {
              from: EMAIL_FROM,
              to: [primaryStaffRecipient],

              ...(staffBcc.length > 0
                ? {
                    bcc: staffBcc,
                  }
                : {}),

              reply_to: guestEmail,

              subject:
                `ახალი ჯავშანი: ${tourTitle}`,

              html: buildStaffEmailHtml({
                bookingId,
                tourTitle,
                tourLocation,
                ownerName,
                guestName,
                guestEmail,
                guestPhone,
                bookingDate,
                people,
                totalPrice,
                notes,
                bookingDetailsUrl,
              }),
            }
          );

        console.log(
          "Staff booking email sent:",
          staffEmailResult.id
        );

        const guestReplyEmail =
          isValidEmail(DIRECTOR_EMAIL)
            ? DIRECTOR_EMAIL
            : primaryStaffRecipient;

        const guestEmailResult =
          await sendResendEmail(
            resendApiKey,
            {
              from: EMAIL_FROM,
              to: [guestEmail],
              reply_to: guestReplyEmail,

              subject:
                `Your booking request was received: ${tourTitle}`,

              html: buildGuestEmailHtml({
                bookingId,
                tourTitle,
                tourLocation,
                guestName,
                bookingDate,
                people,
                totalPrice,
                notes,
              }),
            }
          );

        console.log(
          "Guest booking email sent:",
          guestEmailResult.id
        );
      } catch (emailError: unknown) {
        console.error(
          "Booking email sending error:",
          emailError
        );

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
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    console.error(
      "Booking API error:",
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

async function sendResendEmail(
  apiKey: string,
  payload: ResendEmailPayload
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

  let result: ResendResponse = {};

  try {
    result =
      (await response.json()) as ResendResponse;
  } catch (error) {
    console.error(
      "Resend response parsing error:",
      error
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        result.name ||
        `Resend-მა ელფოსტის გაგზავნა ვერ შეძლო. HTTP ${response.status}`
    );
  }

  return result;
}

function buildStaffEmailHtml({
  bookingId,
  tourTitle,
  tourLocation,
  ownerName,
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
  tourLocation: string;
  ownerName: string | null;
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
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </head>

      <body
        style="
          margin: 0;
          background: #f1f5f9;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
        "
      >
        <div
          style="
            max-width: 680px;
            margin: 0 auto;
            padding: 32px 16px;
          "
        >
          <div
            style="
              background: #0f172a;
              border-radius: 24px;
              padding: 32px;
              color: #ffffff;
            "
          >
            <p
              style="
                margin: 0;
                color: #67e8f9;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 1.5px;
                text-transform: uppercase;
              "
            >
              Georgia Gateway Hub
            </p>

            <h1
              style="
                margin: 14px 0 8px;
                font-size: 30px;
                line-height: 1.2;
              "
            >
              ახალი ჯავშნის მოთხოვნა
            </h1>

            <p
              style="
                margin: 0;
                color: #cbd5e1;
                line-height: 1.7;
              "
            >
              მომხმარებელმა ტურის დაჯავშნის მოთხოვნა გამოგზავნა.
            </p>
          </div>

          <div
            style="
              margin-top: 18px;
              background: #ffffff;
              border-radius: 24px;
              padding: 28px;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            "
          >
            ${emailRow(
              "ჯავშნის ნომერი",
              bookingId
            )}

            ${emailRow(
              "ტური",
              tourTitle
            )}

            ${emailRow(
              "მდებარეობა",
              tourLocation
            )}

            ${emailRow(
              "ტურის ორგანიზატორი",
              ownerName ||
                "სახელი არ არის მითითებული"
            )}

            ${emailRow(
              "სტუმარი",
              guestName
            )}

            ${emailRow(
              "ელფოსტა",
              guestEmail
            )}

            ${emailRow(
              "ტელეფონი",
              guestPhone
            )}

            ${emailRow(
              "ტურის თარიღი",
              formatEmailDateKa(bookingDate)
            )}

            ${emailRow(
              "ადამიანების რაოდენობა",
              String(people)
            )}

            ${emailRow(
              "სრული ფასი",
              formatPriceKa(totalPrice)
            )}

            ${emailRow(
              "დამატებითი შეტყობინება",
              notes || "არ არის"
            )}

            <a
              href="${escapeHtml(
                bookingDetailsUrl
              )}"
              style="
                display: inline-block;
                margin-top: 24px;
                background: #0891b2;
                color: #ffffff;
                text-decoration: none;
                font-weight: 700;
                padding: 14px 22px;
                border-radius: 14px;
              "
            >
              ჯავშნების გვერდის გახსნა
            </a>

            <p
              style="
                margin: 24px 0 0;
                color: #64748b;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              ამ წერილზე პასუხის გაცემისას პასუხი პირდაპირ
              მომხმარებლის ელფოსტაზე გაიგზავნება.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildGuestEmailHtml({
  bookingId,
  tourTitle,
  tourLocation,
  guestName,
  bookingDate,
  people,
  totalPrice,
  notes,
}: {
  bookingId: string;
  tourTitle: string;
  tourLocation: string;
  guestName: string;
  bookingDate: string;
  people: number;
  totalPrice: number | null;
  notes: string | null;
}) {
  return `
    <!doctype html>

    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </head>

      <body
        style="
          margin: 0;
          background: #f1f5f9;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
        "
      >
        <div
          style="
            max-width: 680px;
            margin: 0 auto;
            padding: 32px 16px;
          "
        >
          <div
            style="
              background: #0f172a;
              border-radius: 24px;
              padding: 32px;
              color: #ffffff;
            "
          >
            <p
              style="
                margin: 0;
                color: #67e8f9;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 1.5px;
                text-transform: uppercase;
              "
            >
              Georgia Gateway Hub
            </p>

            <h1
              style="
                margin: 14px 0 8px;
                font-size: 30px;
                line-height: 1.2;
              "
            >
              Your booking request was received
            </h1>

            <p
              style="
                margin: 0;
                color: #cbd5e1;
                line-height: 1.7;
              "
            >
              Hello ${escapeHtml(guestName)}, your request has
              been sent to the tour organizer.
            </p>
          </div>

          <div
            style="
              margin-top: 18px;
              background: #ffffff;
              border-radius: 24px;
              padding: 28px;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            "
          >
            ${emailRow(
              "Booking number",
              bookingId
            )}

            ${emailRow(
              "Tour",
              tourTitle
            )}

            ${emailRow(
              "Location",
              tourLocation
            )}

            ${emailRow(
              "Tour date",
              formatEmailDateEn(bookingDate)
            )}

            ${emailRow(
              "Number of guests",
              String(people)
            )}

            ${emailRow(
              "Full price",
              formatPriceEn(totalPrice)
            )}

            ${emailRow(
              "Your message",
              notes || "Not provided"
            )}

            <div
              style="
                margin-top: 24px;
                padding: 18px;
                border-radius: 16px;
                background: #ecfeff;
                color: #155e75;
                line-height: 1.7;
              "
            >
              This email confirms that your request was received.
              It is not a final booking confirmation. The tour
              organizer will contact you by phone or email.
            </div>

            <p
              style="
                margin: 24px 0 0;
                color: #64748b;
                line-height: 1.7;
              "
            >
              Thank you for choosing Georgia Gateway Hub.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function emailRow(
  label: string,
  value: string
) {
  return `
    <div
      style="
        padding: 12px 0;
        border-bottom: 1px solid #e2e8f0;
      "
    >
      <div
        style="
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        "
      >
        ${escapeHtml(label)}
      </div>

      <div
        style="
          margin-top: 5px;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          white-space: pre-line;
          word-break: break-word;
        "
      >
        ${escapeHtml(value)}
      </div>
    </div>
  `;
}

function uniqueEmails(
  values: Array<string | null | undefined>
) {
  return Array.from(
    new Set(
      values
        .filter(
          (
            value
          ): value is string =>
            Boolean(value)
        )
        .map((value) =>
          value.trim().toLowerCase()
        )
        .filter(isValidEmail)
    )
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function isValidBookingDate(
  value: string
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [
    yearString,
    monthString,
    dayString,
  ] = value.split("-");

  const year =
    Number(yearString);

  const month =
    Number(monthString);

  const day =
    Number(dayString);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }

  return value >= getTodayInTbilisi();
}

function getTodayInTbilisi() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Tbilisi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
}

function formatEmailDateKa(
  value: string
) {
  const date =
    createDateFromDateString(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "ka-GE",
    {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(date);
}

function formatEmailDateEn(
  value: string
) {
  const date =
    createDateFromDateString(value);

  if (!date) {
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

function createDateFromDateString(
  value: string
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const [
    yearString,
    monthString,
    dayString,
  ] = value.split("-");

  const date =
    new Date(
      Date.UTC(
        Number(yearString),
        Number(monthString) - 1,
        Number(dayString)
      )
    );

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date;
}

function formatPriceKa(
  value: number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return "შეთანხმებით";
  }

  return `${value.toLocaleString(
    "ka-GE"
  )} ₾`;
}

function formatPriceEn(
  value: number | null
) {
  if (
    value === null ||
    Number.isNaN(value)
  ) {
    return "By agreement";
  }

  return `${value.toLocaleString(
    "en-GB"
  )} ₾`;
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}