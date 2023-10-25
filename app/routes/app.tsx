import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

import { getAuthenticator } from "~/utils/auth.server";

import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export let loader = async ({ context, request }: LoaderFunctionArgs) => {
  // If the user is here, it's already authenticated, if not redirect them to
  // the login page.
  const auth = getAuthenticator(context);
  const user = await auth.isAuthenticated(request, {
    failureRedirect: "/login?redirectTo=/app",
  });
  return json({ user });
};

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <p>You are logged in as {user.email}</p>
    </div>
  );
}
