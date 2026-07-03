import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { customerName, customerEmail, customerPhone } = body;

    // სტუმრისთვის
    await resend.emails.send({
      from: "Svaneti Travel Hub <onboarding@resend.dev>",
      to: customerEmail,
      subject: "Booking Confirmation",
      html: `
        <h2>Thank you for your booking!</h2>

        <p>Hello <b>${customerName}</b>,</p>

        <p>Your booking has been received successfully.</p>

        <p>We will contact you shortly.</p>

        <hr/>

        <p><b>Phone:</b> ${customerPhone}</p>

        <p>Best regards,<br/>Svaneti Travel Hub</p>
      `,
    });

    // შენთვის
    await resend.emails.send({
      from: "Svaneti Travel Hub <onboarding@resend.dev>",
      to: "nanaasatiani68@gmail.com", // აქ ჩაწერე შენი ელფოსტა თუ სხვა გინდა
      subject: "📩 New Booking",
      html: `
        <h2>New Booking Received</h2>

        <p><b>Name:</b> ${customerName}</p>

        <p><b>Email:</b> ${customerEmail}</p>

        <p><b>Phone:</b> ${customerPhone}</p>
      `,
    });

    return Response.json({
      success: true,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}