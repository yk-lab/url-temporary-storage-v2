import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useSearchParams, useLoaderData } from "@remix-run/react";
import { z } from "zod";

import { getAuthenticator } from "~/utils/auth.server";
import { getUserSession, getSessionStorage } from "~/utils/session.server";

import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";

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
      action: z.enum(["login", "reset"]),
    })
    .parse(payload);
  if (action === "login") {
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

  const [searchParams] = useSearchParams();
  return (
    <div className="px-4 flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          ログイン
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          {magicLinkSent ? (
            <div className="space-y-6">
              <p className="text-gray-700">
                ログインURLを送信しました
                {magicLinkEmail ? (
                  <>
                    {": "}
                    <a
                      className="text-gray-700 decoration-gray-700 hover:underline"
                      href={`mailto:${magicLinkEmail}`}
                    >
                      {magicLinkEmail}
                    </a>
                  </>
                ) : (
                  ""
                )}
              </p>
              <Form method="post">
                <input
                  type="hidden"
                  name="redirectTo"
                  value={searchParams.get("redirectTo") ?? undefined}
                />
                <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-teal-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                    name="action"
                    value="reset"
                  >
                    別のメールアドレスに送信 / 再送信
                  </button>
                </div>
              </Form>
              {magicError ? <p>{magicError}</p> : ""}
            </div>
          ) : (
            <Form className="space-y-6" method="POST">
              <input
                type="hidden"
                name="redirectTo"
                value={searchParams.get("redirectTo") ?? undefined}
              />
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  メールアドレス
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-teal-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                  name="action"
                  value="login"
                >
                  ログイン
                </button>
              </div>
            </Form>
          )}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          または{" "}
          <Link
            to="/signup"
            className="font-semibold leading-6 text-sky-600 hover:text-sky-500 hover:decoration-sky-500 hover:underline"
          >
            アカウントを作成する
          </Link>
        </p>
      </div>
    </div>
  );
}
