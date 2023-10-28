import { Link } from "@remix-run/react";

import { getAuthenticator } from "~/utils/auth.server";
import { getSessionStorage, getUserSession } from "~/utils/session.server";

import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export let loader = async ({ context, request }: LoaderFunctionArgs) => {
  const auth = getAuthenticator(context);
  await auth.isAuthenticated(request, { successRedirect: "/app" });

  const session = await getUserSession(context, request);
  session.unset("auth:magiclink");

  const sessionStorage = getSessionStorage(context);
  return {
    status: 200,
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  };
};

export default function App() {
  return (
    <div className="px-4 flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          アカウント作成
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <div className="space-y-6">
            <p className="text-gray-700">
              準備中です。しばらくお待ちください。
            </p>
          </div>
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
