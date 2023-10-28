import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { z } from "zod";

import { getAuthenticator } from "~/utils/auth.server";
import { sendSignupEmail } from "~/utils/email.server";
import { getSessionStorage, getUserSession } from "~/utils/session.server";
import { getEmailVerificator } from "~/utils/signup.server";
import { getUserByEmail } from "~/features/users/services/users.server";

import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  const auth = getAuthenticator(context);
  await auth.isAuthenticated(request, { successRedirect: "/app" });

  const session = await getUserSession(context, request);
  session.unset("auth:magiclink");

  const email = session.get("signup:email");

  const sessionStorage = getSessionStorage(context);
  return json(
    {
      email: email,
    },
    {
      status: 200,
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    },
  );
};

export const action = async ({ context, request }: ActionFunctionArgs) => {
  const payload = Object.fromEntries(await request.formData());

  const verificator = await getEmailVerificator(context);
  const { action } = z
    .object({
      action: z.enum(["send", "reset"]),
    })
    .parse(payload);
  if (action === "send") {
    const { email } = z
      .object({
        email: z.string().email(),
      })
      .parse(payload);

    const expiry = Date.now() + 1000 * 60 * 30; // 30 minutes
    const token = await verificator.sign(email, expiry);
    const url = new URL(request.url);
    url.pathname = "/registration";
    url.searchParams.set("mac", token);
    url.searchParams.set("expiry", String(expiry));

    const sendMail = sendSignupEmail(context);
    await sendMail({
      emailAddress: email,
      registrationLink: url.toString(),
      domainUrl: url.origin,
      user: await getUserByEmail(context, email),
    });

    const session = await getUserSession(context, request);
    session.set("signup:email", email);
    session.set("signup:verified", false);

    const sessionStorage = getSessionStorage(context);
    return redirect("/signup", {
      status: 200,
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  } else {
    const session = await getUserSession(context, request);
    session.unset("signup:email");
    session.unset("signup:verified");

    const sessionStorage = getSessionStorage(context);
    return redirect("/signup", {
      status: 200,
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  }
};

export default function Signup() {
  const { email } = useLoaderData<typeof loader>();

  const [searchParams] = useSearchParams();

  return (
    <div className="px-4 flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          アカウント作成
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          {email ? (
            <div className="space-y-6">
              <p className="text-center text-sm text-gray-500">
                <a
                  className="text-gray-700 hover:underline decoration-gray-700"
                  href={`mailto:${email}`}
                >
                  {email}
                </a>{" "}
                にメールアドレス確認リンクを送信しました。
              </p>
              <p className="text-center text-sm text-gray-500">
                メールを確認して、リンクをクリックしてください。
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
              </Form>{" "}
            </div>
          ) : (
            <Form className="grid grid-cols-1 gap-y-6" method="POST">
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
                  value="send"
                >
                  次へ
                </button>
              </div>
            </Form>
          )}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          または{" "}
          <Link
            to="/login"
            className="font-semibold leading-6 text-sky-600 hover:text-sky-500 hover:decoration-sky-500 hover:underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
