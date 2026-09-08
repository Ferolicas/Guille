import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

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

export const leadFiles = pgTable("lead_files", {
  id: varchar("id", { length: 36 }).primaryKey(),
  leadId: varchar("lead_id", { length: 36 }).notNull().references(() => leads.id, { onDelete: "cascade" }),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  storageName: varchar("storage_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  kind: varchar("kind", { length: 20 }).notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gallerySlots = pgTable("gallery_slots", {
  slot: integer("slot").primaryKey(),
  title: varchar("title", { length: 120 }).notNull().default(""),
  description: text("description").notNull().default(""),
  mediaOneName: varchar("media_one_name", { length: 255 }),
  mediaOneType: varchar("media_one_type", { length: 20 }),
  mediaOneLabel: varchar("media_one_label", { length: 20 }),
  mediaTwoName: varchar("media_two_name", { length: 255 }),
  mediaTwoType: varchar("media_two_type", { length: 20 }),
  mediaTwoLabel: varchar("media_two_label", { length: 20 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const galleryVideos = pgTable("gallery_videos", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description").notNull().default(""),
  storageName: varchar("storage_name", { length: 255 }).notNull().unique(),
  posterName: varchar("poster_name", { length: 255 }).notNull(),
  sourceExternalId: varchar("source_external_id", { length: 100 }).notNull().unique(),
  sourceUrl: text("source_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminCredentials = pgTable("admin_credentials", {
  id: varchar("id", { length: 20 }).primaryKey(),
  passwordHash: text("password_hash").notNull(),
  recoveryEmail: varchar("recovery_email", { length: 320 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
