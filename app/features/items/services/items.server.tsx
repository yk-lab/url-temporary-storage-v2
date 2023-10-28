import { eq, and } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import i18next from "i18next";
import { z } from "zod";
import { zodI18nMap } from "zod-i18n-map";
// Import your language translation files
import translation from "zod-i18n-map/locales/ja/zod.json";

import { items } from "~/db/schema";
import { createClient } from "~/utils/db.server";

import type { AppLoadContext } from "@remix-run/cloudflare";

import type { User } from "~/features/users/services/users.server";

// lng and resources key depend on your locale.
i18next.init({
  lng: "ja",
  resources: {
    ja: { zod: translation },
  },
});
z.setErrorMap(zodI18nMap);

// Schema for inserting a item - can be used to validate API requests
export const insertItemSchema = createInsertSchema(items, {
  id: (schema) => schema.id.uuid(),
  url: (schema) => schema.url.url(),
});

// Schema for selecting a item - can be used to validate API responses
export const selectItemSchema = createSelectSchema(items, {
  id: (schema) => schema.id.uuid(),
  url: (schema) => schema.url.url(),
});

export const insert = async (context: AppLoadContext, item: InsertItem) => {
  const env = context.env as Env;
  const db = createClient(env.DB);
  return await db.insert(items).values(item).execute();
};

export const get = async (context: AppLoadContext, id: string) => {
  const env = context.env as Env;
  const db = createClient(env.DB);
  return await db.select().from(items).where(eq(items.id, id)).get();
};

export const filterByUser = async (context: AppLoadContext, user: User) => {
  return await filterByUserId(context, user.id);
};

export const filterByUserId = async (
  context: AppLoadContext,
  userId: string,
) => {
  const env = context.env as Env;
  const db = createClient(env.DB);
  return await db.select().from(items).where(eq(items.userId, userId));
};

export const remove = async (
  context: AppLoadContext,
  id: string,
  user: User | string | null = null,
) => {
  const env = context.env as Env;
  const db = createClient(env.DB);
  const filter = user
    ? and(
        eq(items.id, id),
        eq(items.userId, typeof user === "string" ? user : user.id),
      )
    : eq(items.id, id);
  return await db.delete(items).where(filter).execute();
};

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = z.infer<typeof selectItemSchema>;
