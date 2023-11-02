import * as cheerio from "cheerio";

import { json } from "@remix-run/cloudflare";
import { z } from "zod";

import { getAuthenticator } from "~/utils/auth.server";

import type { ActionFunctionArgs } from "@remix-run/cloudflare";

export const action = async ({ context, request }: ActionFunctionArgs) => {
  const auth = getAuthenticator(context);
  await auth.isAuthenticated(request, {
    failureRedirect: "/login?redirectTo=/app",
  });
  const { url } = z
    .object({
      url: z.string().url(),
    })
    .parse(await request.json());

  const $ = cheerio.load(
    await fetch(url, {
      headers: {
        "user-agent": "bot",
      },
    }).then((res) => res.text())
  );

  return json({
    title:
      $('meta[property="og:title"]')?.attr("content") || $("title")?.text(),
    siteName: $("meta[property='og:site_name']")?.attr("content"),
    description:
      $("meta[property='og:description']")?.attr("content") ||
      $("meta[name=description]")?.text(),
    image: $("meta[property='og:image']")?.attr("content"),
    ogUrl: $("meta[property='og:url']")?.attr("content"),
    url,
  });
};
