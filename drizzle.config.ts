import type { Config } from "drizzle-kit";

export default {
  schema: "./app/db/schema.ts",
  out: "./migrations",
  // driver: "better-sqlite",
  // dbCredentials: {
  //   url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/79b6882251bcc1b3361a8dea43873f88ea5277f1bd6ab8747250d33f17ac07e9.sqlite",
  // },
} satisfies Config;
