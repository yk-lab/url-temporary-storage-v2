import {
  createCookie,
  createWorkersKVSessionStorage,
} from "@remix-run/cloudflare";

import type { AppLoadContext } from "@remix-run/cloudflare";

export const getSessionStorage = (context: AppLoadContext) => {
  const env = context.env as Env;
  const cookie = createCookie("__session", {
    secrets: [env.SESSION_SECRET],
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  return createWorkersKVSessionStorage({
    kv: env.SESSION_KV as KVNamespace,
    cookie,
  });
};

export function getUserSession(context: AppLoadContext, request: Request) {
  const sessionStorage = getSessionStorage(context);
  return sessionStorage.getSession(request.headers.get("Cookie"));
}
