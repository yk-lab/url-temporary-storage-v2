import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

import { users } from "./users";

import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    userId: text("user_id").references((): AnySQLiteColumn => users.id),
    createdAt: text("createdAt")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text("updatedAt")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (items) => ({
    userIdIdx: index("userIdIdx").on(items.userId),
    createdAtIdx: index("createdAtIdx").on(items.createdAt),
    userIdNameIdx: index("userIdNameIdx").on(items.userId, items.name),
    userIdUrlIdx: index("userIdUrlIdx").on(items.userId, items.url),
    userIdCreatedAtIdx: index("userIdCreatedAtIdx").on(
      items.userId,
      items.createdAt,
    ),
  }),
);
