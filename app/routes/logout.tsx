import { getAuthenticator } from "~/utils/auth.server";

import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export let loader = async ({ context, request }: LoaderFunctionArgs) => {
  const auth = getAuthenticator(context);
  await auth.logout(request, { redirectTo: "/login" });
};
