import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = clean(body.name);
    const email = clean(body.email);
    const phone = clean(body.phone);
    const subject = clean(body.subject || "Website enquiry");
    const message = clean(body.message);

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Name, email and message are required." },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL || "Website <onboarding@resend.dev>",
      to: process.env.CONTACT_TO!,
      replyTo: email,
      subject: `Website enquiry: ${subject}`,
      html: `
        <h2>New website enquiry</h2>

        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>

        <hr />

        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, error: "Email failed to send." },
      { status: 500 }
    );
  }
}
