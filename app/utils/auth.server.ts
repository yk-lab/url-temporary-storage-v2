import { Authenticator } from "remix-auth";
import { EmailLinkStrategy } from "remix-auth-email-link";
import { z } from "zod";

import { getUserByEmail } from "~/features/users/services/users.server";
import { sendEmail } from "./email.server";
import { getSessionStorage } from "./session.server";

import type { AppLoadContext } from "@remix-run/cloudflare";

import type { User } from "~/features/users/services/users.server";

const verifyEmailAddress = async (email: string) => {
  const result = z.string().email().safeParse(email);
  if (!result.success) throw new Error(result.error.message);

  // findie/burner-email-providers: A list of temporary email providers
  // https://github.com/findie/burner-email-providers
  // import { isEmailBurner } from "burner-email-providers";
  // isEmailBurner('test@gmail.com'); // false
  // isEmailBurner('test@10minutemail.com');  // true
  // if (isEmailBurner(email)) throw new Error("Email not allowed.");
};

export const getAuthenticator = (context: AppLoadContext) => {
  // This secret is used to encrypt the token sent in the magic link and the
  // session used to validate someone else is not trying to sign-in as another
  // user.
  const env = context.env as Env;
  const secret = env.MAGIC_LINK_SECRET;

  // Here we need the sendEmail, the secret and the URL where the user is sent
  // after clicking on the magic link
  const auth = new Authenticator<User>(getSessionStorage(context));
  auth.use(
    new EmailLinkStrategy(
      {
        verifyEmailAddress,
        sendEmail: sendEmail(context),
        secret,
        callbackURL: "/magic",
      },
      // In the verify callback,
      // you will receive the email address, form data and whether or not this is being called after clicking on magic link
      // and you should return the user instance
      async ({ email, form, magicLinkVerify }) => {
        const user = await getUserByEmail(context, email);

        // TODO: handle the case where the user is not found
        if (!user) throw new Error("User not found");
        return user;
      },
    ),
  );

  return auth;
};
