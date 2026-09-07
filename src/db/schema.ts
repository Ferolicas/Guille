import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }),
  city: varchar("city", { length: 120 }),
  service: varchar("service", { length: 100 }).notNull(),
  message: text("message").notNull(),
  consent: boolean("consent").notNull(),
  source: varchar("source", { length: 60 }).notNull().default("web-form"),
  ipHash: varchar("ip_hash", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
