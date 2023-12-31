import type { AppLoadContext } from "@remix-run/cloudflare";

export async function sendEmail(
  context: AppLoadContext,
  to: string,
  subject: string,
  body: string
) {
  const env = context.env as Env;

  const apiKey = env.SENDGRID_API_KEY;
  const fromEmail = env.FROM_EMAIL;

  if (!apiKey && process.env.NODE_ENV === "development") {
    console.log(
      "Sending email to",
      to,
      "from",
      fromEmail,
      "with subject",
      subject,
      "and body",
      body
    );
    return;
  }

  try {
    console.log("Sending email to", to, "from", fromEmail);
    const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject,
          },
        ],
        from: { email: fromEmail },
        content: [
          {
            type: "text/plain",
            value: body,
          },
          {
            type: "text/html",
            value: body,
          },
        ],
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const text = await resp.text();
    if (!resp.ok) {
      throw new Error(text);
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send email");
  }
}
