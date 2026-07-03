import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { customerName, customerEmail, customerPhone } = body;

    const { error } = await supabase.from("Bookings").insert([
      {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        tour_id: 1,
        status: "Pending",
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Svaneti Travel Hub <onboarding@resend.dev>",
        to: "nanaasatiani68@gmail.com",
        subject: "New Booking - Svaneti Travel Hub",
        html: `
          <h2>ახალი ჯავშანი</h2>
          <p><b>სახელი:</b> ${customerName}</p>
          <p><b>ელფოსტა:</b> ${customerEmail}</p>
          <p><b>ტელეფონი:</b> ${customerPhone}</p>
        `,
      }),
    });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Svaneti Travel Hub <onboarding@resend.dev>",
        to: customerEmail,
        subject: "Booking Received - Svaneti Travel Hub",
        html: `
          <h2>Thank you for your booking!</h2>
          <p>Hello ${customerName},</p>
          <p>We have received your booking.</p>
          <p>Our team will contact you shortly.</p>
          <br />
          <p>Best regards,<br />Svaneti Travel Hub</p>
        `,
      }),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}