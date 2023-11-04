import { json  } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";

import { getAuthenticator } from "~/utils/auth.server";

import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "URL 一時保存" },
    { name: "description", content: "URL を一時保存するためのサイトです。" },
  ];
};

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  // If the user is here, it's already authenticated, if not redirect them to
  // the login page.
  const auth = getAuthenticator(context);
  const user = await auth.isAuthenticated(request, {});

  return json({ user });
};

export default function Index() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div className="flex flex-wrap">
          <h1 className="text-2xl font-semibold text-clip">URL 一時保存</h1>
        </div>

        <div>
          <ul>
            {!user ? (
              <>
                <li>
                  <Link
                    className="text-sky-600 hover:text-sky-500 hover:decoration-sky-500 hover:underline"
                    to="/login"
                  >
                    ログイン
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-sky-600 hover:text-sky-500 hover:decoration-sky-500 hover:underline"
                    to="/signup"
                  >
                    アカウント作成
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    className="text-sky-600 hover:text-sky-500 hover:decoration-sky-500 hover:underline"
                    to="/app"
                  >
                    一覧
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-sky-600 hover:text-sky-500 hover:decoration-sky-500 hover:underline"
                    to="/logout"
                  >
                    ログアウト
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <div>
          <p className="text-lg leading-7 text-gray-700">
            このサイトは、URL を一時保存するためのサイトです。
          </p>

          <p className="text-lg leading-7 text-gray-700">
            メールアドレスのみの登録で、利用できます。
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-clip text-gray-900">
            使い方
          </h2>
          <ol className="list-decimal list-inside">
            <li className="text-lg leading-7 text-gray-700">
              保存したい URL を入力して、保存ボタンを押します。
            </li>
            <li className="text-lg leading-7 text-gray-700">
              保存した URL は、一覧画面で確認できます。
            </li>
            <li className="text-lg leading-7 text-gray-700">
              保存した URL は、一覧画面で削除できます。
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-clip text-gray-900">
            Links
          </h2>
          <ul className="list-disc list-inside">
            <li>
              <a
                className="text-sky-600 hover:text-sky-500 hover:decoration-sky-500 hover:underline"
                href="https://github.com/yk-lab/"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub @yk-lab
              </a>
            </li>
            <li>
              <a
                className="text-sky-600 hover:text-sky-500 hover:decoration-sky-500 hover:underline"
                href="https://x.com/YetAnother_yk/"
                target="_blank"
                rel="noopener noreferrer"
              >
                X (旧 Twitter) @YetAnother_yk
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
