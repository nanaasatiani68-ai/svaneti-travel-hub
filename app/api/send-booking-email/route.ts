import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BookingEmailRequest = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingDate?: string;
  people?: number;
  message?: string | null;

  tourTitle?: string;
  tourLocation?: string;
  tourPrice?: number | string | null;

  ownerName?: string | null;
  ownerEmail?: string | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "შეთანხმებით";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return `${escapeHtml(value)} ₾`;
  }

  return `${numericValue.toLocaleString("ka-GE")} ₾`;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("RESEND_API_KEY is missing.");

      return NextResponse.json(
        {
          success: false,
          error: "ელფოსტის სერვისი არ არის გამართული.",
        },
        {
          status: 500,
        }
      );
    }

    const body = (await req.json()) as BookingEmailRequest;

    const customerName = String(body.customerName ?? "").trim();
    const customerEmail = normalizeEmail(body.customerEmail);
    const customerPhone = String(body.customerPhone ?? "").trim();

    const bookingDate = String(body.bookingDate ?? "").trim();
    const people = Number(body.people ?? 1);
    const message = String(body.message ?? "").trim();

    const tourTitle =
      String(body.tourTitle ?? "").trim() || "Georgia Gateway Hub Tour";

    const tourLocation =
      String(body.tourLocation ?? "").trim() || "Georgia";

    const ownerName =
      String(body.ownerName ?? "").trim() || "ტურის ორგანიზატორი";

    const ownerEmail = normalizeEmail(body.ownerEmail);

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          error: "სტუმრის სახელი არ არის მითითებული.",
        },
        {
          status: 400,
        }
      );
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "სტუმრის ელფოსტა არასწორია.",
        },
        {
          status: 400,
        }
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "სტუმრის ტელეფონის ნომერი არ არის მითითებული.",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(people) || people < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "ადამიანების რაოდენობა არასწორია.",
        },
        {
          status: 400,
        }
      );
    }

    const resend = new Resend(apiKey);

    const senderEmail =
      process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const senderName =
      process.env.RESEND_FROM_NAME || "Georgia Gateway Hub";

    const nanaEmail =
      process.env.ADMIN_EMAIL || "nanaasatiani68@gmail.com";

    const leriEmail = normalizeEmail(process.env.LERI_EMAIL);

    const safeCustomerName = escapeHtml(customerName);
    const safeCustomerPhone = escapeHtml(customerPhone);
    const safeCustomerEmail = escapeHtml(customerEmail);
    const safeBookingDate = escapeHtml(bookingDate || "არ არის მითითებული");
    const safePeople = escapeHtml(people);
    const safeMessage = escapeHtml(message || "-");

    const safeTourTitle = escapeHtml(tourTitle);
    const safeTourLocation = escapeHtml(tourLocation);
    const safeTourPrice = formatPrice(body.tourPrice);

    const safeOwnerName = escapeHtml(ownerName);

    const customerResult = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: customerEmail,
      subject: `Booking request received – ${tourTitle}`,
      html: `
        <div style="
          max-width: 640px;
          margin: 0 auto;
          padding: 32px;
          background: #f8fafc;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
        ">
          <div style="
            background: linear-gradient(135deg, #0891b2, #0f766e);
            border-radius: 24px;
            padding: 30px;
            color: white;
          ">
            <div style="font-size: 34px; margin-bottom: 12px;">🏔️</div>

            <h1 style="
              margin: 0;
              font-size: 28px;
              line-height: 1.3;
            ">
              Booking request received
            </h1>

            <p style="
              margin: 12px 0 0;
              color: rgba(255,255,255,0.85);
              line-height: 1.7;
            ">
              Thank you for choosing Georgia Gateway Hub.
            </p>
          </div>

          <div style="
            margin-top: 20px;
            background: white;
            border-radius: 24px;
            padding: 28px;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          ">
            <p style="font-size: 17px; line-height: 1.7;">
              Hello <strong>${safeCustomerName}</strong>,
            </p>

            <p style="line-height: 1.7; color: #475569;">
              We have successfully received your booking request.
              The tour organizer will contact you by phone or email.
            </p>

            <div style="
              margin-top: 24px;
              border: 1px solid #e2e8f0;
              border-radius: 18px;
              overflow: hidden;
            ">
              <div style="
                padding: 16px 18px;
                background: #ecfeff;
                font-size: 19px;
                font-weight: bold;
                color: #0e7490;
              ">
                ${safeTourTitle}
              </div>

              <div style="padding: 18px;">
                <p style="margin: 0 0 12px;">
                  <strong>Location:</strong> ${safeTourLocation}
                </p>

                <p style="margin: 0 0 12px;">
                  <strong>Date:</strong> ${safeBookingDate}
                </p>

                <p style="margin: 0 0 12px;">
                  <strong>Number of guests:</strong> ${safePeople}
                </p>

                <p style="margin: 0 0 12px;">
                  <strong>Price:</strong> ${safeTourPrice}
                </p>

                <p style="margin: 0;">
                  <strong>Your message:</strong> ${safeMessage}
                </p>
              </div>
            </div>

            <div style="
              margin-top: 24px;
              padding: 16px;
              border-radius: 16px;
              background: #fff7ed;
              color: #9a3412;
              line-height: 1.6;
            ">
              This email confirms that your request was received.
              The booking becomes final after confirmation from the organizer.
            </div>

            <p style="
              margin-top: 28px;
              color: #64748b;
              line-height: 1.7;
            ">
              Georgia Gateway Hub<br />
              Discover Georgia with local professionals.
            </p>
          </div>
        </div>
      `,
    });

    if (customerResult.error) {
      console.error(
        "Customer email sending error:",
        customerResult.error
      );

      return NextResponse.json(
        {
          success: false,
          error: "სტუმრისთვის ელფოსტის გაგზავნა ვერ მოხერხდა.",
        },
        {
          status: 500,
        }
      );
    }

    const adminRecipients = new Set<string>();

    if (isValidEmail(nanaEmail)) {
      adminRecipients.add(nanaEmail);
    }

    if (leriEmail && isValidEmail(leriEmail)) {
      adminRecipients.add(leriEmail);
    }

    if (ownerEmail && isValidEmail(ownerEmail)) {
      adminRecipients.add(ownerEmail);
    }

    const notificationRecipients = Array.from(adminRecipients);

    if (notificationRecipients.length > 0) {
      const adminResult = await resend.emails.send({
        from: `${senderName} <${senderEmail}>`,
        to: notificationRecipients,
        replyTo: customerEmail,
        subject: `New booking – ${tourTitle}`,
        html: `
          <div style="
            max-width: 680px;
            margin: 0 auto;
            padding: 32px;
            background: #f1f5f9;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
          ">
            <div style="
              padding: 28px;
              border-radius: 24px;
              background: #0f172a;
              color: white;
            ">
              <div style="font-size: 34px; margin-bottom: 10px;">📩</div>

              <h1 style="
                margin: 0;
                font-size: 28px;
                line-height: 1.3;
              ">
                New tour booking
              </h1>

              <p style="
                margin: 12px 0 0;
                color: rgba(255,255,255,0.7);
              ">
                Georgia Gateway Hub
              </p>
            </div>

            <div style="
              margin-top: 20px;
              padding: 28px;
              border-radius: 24px;
              background: white;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            ">
              <h2 style="margin-top: 0; color: #0e7490;">
                ${safeTourTitle}
              </h2>

              <div style="
                margin-top: 20px;
                display: block;
                border: 1px solid #e2e8f0;
                border-radius: 18px;
                padding: 20px;
              ">
                <p style="margin: 0 0 12px;">
                  <strong>ტურის ორგანიზატორი:</strong>
                  ${safeOwnerName}
                </p>

                <p style="margin: 0 0 12px;">
                  <strong>მდებარეობა:</strong>
                  ${safeTourLocation}
                </p>

                <p style="margin: 0 0 12px;">
                  <strong>ტურის თარიღი:</strong>
                  ${safeBookingDate}
                </p>

                <p style="margin: 0 0 12px;">
                  <strong>ადამიანების რაოდენობა:</strong>
                  ${safePeople}
                </p>

                <p style="margin: 0;">
                  <strong>ფასი:</strong>
                  ${safeTourPrice}
                </p>
              </div>

              <h3 style="margin-top: 28px;">
                სტუმრის მონაცემები
              </h3>

              <div style="
                border-radius: 18px;
                background: #f8fafc;
                padding: 20px;
              ">
                <p style="margin: 0 0 12px;">
                  <strong>სახელი:</strong>
                  ${safeCustomerName}
                </p>

                <p style="margin: 0 0 12px;">
                  <strong>ელფოსტა:</strong>
                  <a
                    href="mailto:${safeCustomerEmail}"
                    style="color: #0891b2;"
                  >
                    ${safeCustomerEmail}
                  </a>
                </p>

                <p style="margin: 0 0 12px;">
                  <strong>ტელეფონი:</strong>
                  <a
                    href="tel:${safeCustomerPhone}"
                    style="color: #0891b2;"
                  >
                    ${safeCustomerPhone}
                  </a>
                </p>

                <p style="margin: 0;">
                  <strong>შეტყობინება:</strong>
                  ${safeMessage}
                </p>
              </div>

              <p style="
                margin-top: 24px;
                color: #64748b;
                line-height: 1.7;
              ">
                მომხმარებელს ავტომატურად გაეგზავნა შეტყობინება,
                რომ მოთხოვნა მიღებულია.
              </p>
            </div>
          </div>
        `,
      });

      if (adminResult.error) {
        console.error(
          "Admin notification email error:",
          adminResult.error
        );

        return NextResponse.json(
          {
            success: true,
            warning:
              "სტუმრის ელფოსტა გაიგზავნა, მაგრამ ადმინისტრატორის შეტყობინება ვერ გაიგზავნა.",
          },
          {
            status: 200,
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "ელფოსტები წარმატებით გაიგზავნა.",
    });
  } catch (error: unknown) {
    console.error("Booking email route error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown email sending error";

    return NextResponse.json(
      {
        success: false,
        error: "ელფოსტის გაგზავნა ვერ მოხერხდა.",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}