// import Sendgrid from "@sendgrid/mail";

import type { AppLoadContext } from "@remix-run/cloudflare";

export async function sendEmail(
  context: AppLoadContext,
  to: string,
  subject: string,
  body: string,
) {
  const env = context.env as Env;

  // const apiKey = env.SENDGRID_API_KEY;
  const fromEmail = env.FROM_EMAIL;

  console.log(
    "Sending email to",
    to,
    "from",
    fromEmail,
    "with subject",
    subject,
    "and body",
    body,
  );

  // Sendgrid.setApiKey(apiKey);

  // try {
  //   return await Sendgrid.send({
  //     to,
  //     from: fromEmail,
  //     subject,
  //     text: body.toString(),
  //     html: body.toString(),
  //   });
  // } catch (error: any) {
  //   console.error(error);

  //   if (error.response) {
  //     console.error(error.response.body);
  //   }
  // }
}
