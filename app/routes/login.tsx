import { json, redirect } from "@remix-run/cloudflare";
import {
  Form,
  Link,
  // useActionData,
  useSearchParams,
  useLoaderData,
} from "@remix-run/react";
import { z } from "zod";

import { getAuthenticator } from "~/utils/auth.server";
import { getUserSession, getSessionStorage } from "~/utils/session.server";

import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";

import stylesUrl from "~/styles/login.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export let loader = async ({ context, request }: LoaderFunctionArgs) => {
  const auth = getAuthenticator(context);
  await auth.isAuthenticated(request, { successRedirect: "/app" });

  // This session key `auth:magiclink` is the default one used by the EmailLinkStrategy
  // you can customize it passing a `sessionMagicLinkKey` when creating an
  // instance.
  const session = await getUserSession(context, request);
  return json({
    magicLinkSent: session.has("auth:magiclink"),
    magicLinkEmail: session.get("auth:email"),
    magicError: session.get("auth:error"),
  });
};

export let action = async ({ context, request }: ActionFunctionArgs) => {
  const clonedRequest = request.clone();

  const payload = Object.fromEntries(await clonedRequest.formData());

  // The success redirect is required in this action, this is where the user is
  // going to be redirected after the magic link is sent, note that here the
  // user is not yet authenticated, so you can't send it to a private page.
  const auth = getAuthenticator(context);
  const { action } = z
    .object({
      action: z.enum(["send", "reset"]),
    })
    .parse(payload);
  if (action === "send") {
    return auth.authenticate("email-link", request, {
      successRedirect: "/login",
      // If this is not set, any error will be throw and the ErrorBoundary will be
      // rendered.
      failureRedirect: "/login",
    });
  } else {
    const session = await getUserSession(context, request);
    session.unset("auth:magiclink");

    const sessionStorage = getSessionStorage(context);
    return redirect("/login", {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  }
};

export default function Login() {
  const { magicLinkSent, magicLinkEmail, magicError } =
    useLoaderData<typeof loader>();
  // const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  return (
    <div className="container">
      <div className="content" data-light="">
        {magicLinkSent ? (
          <>
            <p>
              ログインURLを送信しました
              {magicLinkEmail ? `: ${magicLinkEmail}` : ""}
            </p>
            <Form method="post">
              <input
                type="hidden"
                name="redirectTo"
                value={searchParams.get("redirectTo") ?? undefined}
              />
              <button
                type="submit"
                className="button"
                name="action"
                value="reset"
              >
                別のメールアドレスに送信 / 再送信
              </button>
            </Form>
            {magicError ? <p>{magicError}</p> : ""}
          </>
        ) : (
          <>
            <h1>Login</h1>
            <Form method="post">
              <input
                type="hidden"
                name="redirectTo"
                value={searchParams.get("redirectTo") ?? undefined}
              />
              <div>
                <label htmlFor="email-input">Email</label>
                <input type="email" id="email-input" name="email" />
              </div>
              <div id="form-error-message"></div>
              <button
                type="submit"
                className="button"
                name="action"
                value="send"
              >
                Submit
              </button>
            </Form>
          </>
        )}
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
