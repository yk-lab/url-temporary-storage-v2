import { json, redirect } from "@remix-run/cloudflare";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import { z } from "zod";

import {
  insertUserSchema,
  insert,
} from "~/features/users/services/users.server";
import { getAuthenticator } from "~/utils/auth.server";
import { sendSignupCompleteEmail } from "~/utils/email.server";
import { forbidden, badRequest } from "~/utils/request.server";
import { getSessionStorage, getUserSession } from "~/utils/session.server";
import {
  getEmailVerificator,
  InvalidMacError,
  ExpiredError,
} from "~/utils/signup.server";

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
  const verified = session.get("signup:verified");

  if (email && !verified) {
    // メールアドレス入力済み、未認証
    const url = new URL(request.url);

    // Make sure you have the minimum necessary query parameters.
    if (!url.searchParams.has("mac") || !url.searchParams.has("expiry")) {
      return badRequest({
        email: null,
        verified: false,
        message: "Missing query parameter",
      });
    }

    const verificator = await getEmailVerificator(context);

    // Extract the query parameters we need and run the HMAC algorithm on the
    // parts of the request we are authenticating: the path and the expiration
    // timestamp. It is crucial to pad the input data, for example, by adding a symbol
    // in-between the two fields that can never occur on the right side. In this
    // case, use the @ symbol to separate the fields.
    const expiry = Number(url.searchParams.get("expiry"));

    // The received MAC is Base64-encoded, so you have to go to some trouble to
    // get it into a buffer type that crypto.subtle.verify() can read.
    const receivedMacBase64 = url.searchParams.get("mac")!;

    try {
      await verificator.verify(email, expiry, receivedMacBase64);
    } catch (error) {
      if (error instanceof InvalidMacError) {
        return badRequest({
          email: null,
          verified: false,
          message: "Invalid MAC",
        });
      } else if (error instanceof ExpiredError) {
        return forbidden({
          email: null,
          verified: false,
          message: `URL expired at ${new Date(expiry)}`,
        });
      }
      throw error;
    }

    session.set("signup:verified", true);
    const sessionStorage = getSessionStorage(context);
    return json(
      {
        email,
        verified: true,
        message: null,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": await sessionStorage.commitSession(session),
        },
      },
    );
  }

  return json({
    email,
    verified,
    message: null,
  });
};

export const action = async ({ context, request }: ActionFunctionArgs) => {
  const payload = Object.fromEntries(await request.formData());
  const { action } = z
    .object({
      action: z.enum(["reset", "signup"]),
    })
    .parse(payload);
  if (action === "signup") {
    const session = await getUserSession(context, request);
    session.unset("auth:magiclink");

    const email = session.get("signup:email");
    const verified = session.get("signup:verified");

    if (!email || !verified) {
      return badRequest({
        email: null,
        verified: false,
        message: "Invalid request",
      });
    }

    const data = insertUserSchema.parse({
      id: crypto.randomUUID(),
      email,
      ...payload,
    });

    await insert(context, data);

    session.unset("signup:email");
    session.unset("signup:verified");

    await sendSignupCompleteEmail(context)({
      emailAddress: email,
      domainUrl: new URL(request.url).origin,
    });

    const sessionStorage = getSessionStorage(context);
    return redirect("/login", {
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

export default function Registration() {
  const { email, verified, message } = useLoaderData<typeof loader>();

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
          {email && verified ? (
            <Form className="grid grid-cols-1 gap-y-6" method="POST">
              <input
                type="hidden"
                name="redirectTo"
                value={searchParams.get("redirectTo") ?? undefined}
              />

              <div>
                <div className="block text-sm font-medium leading-6 text-gray-900">
                  メールアドレス
                </div>
                <div className="mt-2">{email}</div>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  表示名
                </label>
                <div className="mt-2">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="nickname"
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
                  value="signup"
                >
                  アカウントを作成する
                </button>
              </div>
            </Form>
          ) : (
            <div className="space-y-6">
              <p className="text-center text-sm text-gray-700">
                {message ? `エラー: ${message}` : "エラー"}
              </p>
              <p className="text-center text-sm text-gray-700">
                {message
                  ? "もう一度最初からやり直してください。"
                  : "登録に使用したブラウザでアクセスしてください。"}
              </p>
              <p className="text-center text-sm text-gray-700">
                もし、エラーが解消しない場合は、お問い合わせください。
              </p>
              <Form method="POST">
                <input
                  type="hidden"
                  name="redirectTo"
                  value={searchParams.get("redirectTo") ?? undefined}
                />
                <button
                  type="submit"
                  className="mx-auto block w-fit font-semibold leading-6 text-sky-600 hover:text-sky-500 hover:decoration-sky-500 hover:underline"
                  name="action"
                  value="reset"
                >
                  最初からやり直す
                </button>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
