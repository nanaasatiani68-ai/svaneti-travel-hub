import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const body = await req.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      message,
    } = body;

    // Email to customer
    await resend.emails.send({
      from: "Svaneti Travel Hub <onboarding@resend.dev>",
      to: customerEmail,
      subject: "Booking Confirmation",
      html: `
        <h2>Thank you for your booking!</h2>

        <p>Hello <b>${customerName}</b>,</p>

        <p>We have received your booking request.</p>

        <p>Our team will contact you shortly.</p>

        <hr>

        <p><b>Phone:</b> ${customerPhone}</p>
        <p><b>Message:</b> ${message || "-"}</p>

        <br>

        <p>Svaneti Travel Hub</p>
      `,
    });

    // Email to admin
    await resend.emails.send({
      from: "Svaneti Travel Hub <onboarding@resend.dev>",
      to: "nanaasatiani68@gmail.com",
      subject: "New Booking",
      html: `
        <h2>New Booking</h2>

        <p><b>Name:</b> ${customerName}</p>
        <p><b>Email:</b> ${customerEmail}</p>
        <p><b>Phone:</b> ${customerPhone}</p>
        <p><b>Message:</b> ${message || "-"}</p>
      `,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email",
      },
      {
        status: 500,
      }
    );
  }
}