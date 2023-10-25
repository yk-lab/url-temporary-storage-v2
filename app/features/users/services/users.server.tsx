import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import i18next from "i18next";
import { z } from "zod";
import { zodI18nMap } from "zod-i18n-map";
// Import your language translation files
import translation from "zod-i18n-map/locales/ja/zod.json";

import { users } from "~/db/schema";
import { createClient } from "~/utils/db.server";

import type { AppLoadContext } from "@remix-run/cloudflare";

// lng and resources key depend on your locale.
i18next.init({
  lng: "ja",
  resources: {
    ja: { zod: translation },
  },
});
z.setErrorMap(zodI18nMap);

// Schema for inserting a user - can be used to validate API requests
export const insertUserSchema = createInsertSchema(users, {
  id: (schema) => schema.id.uuid(),
  email: (schema) => schema.email.email(),
});

// Schema for selecting a user - can be used to validate API responses
export const selectUserSchema = createSelectSchema(users, {
  id: (schema) => schema.id.uuid(),
  email: (schema) => schema.email.email(),
});

export const getUserByEmail = async (
  context: AppLoadContext,
  email: string,
) => {
  const env = context.env as Env;
  const db = createClient(env.DB);
  return await db.select().from(users).where(eq(users.email, email)).get();
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
