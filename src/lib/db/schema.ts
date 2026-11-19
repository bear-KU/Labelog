import { sql } from "drizzle-orm";
import { 
  boolean,
  date,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";
import type { BusinessHours } from "@/features/restaurants/schemas/restaurant";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const userRoleEnum = pgEnum("user_role", ["admin", "member"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  gender: genderEnum("gender"),
  birthDate: date("birth_date", { mode: "date" }),
  isApproved: boolean("is_approved").notNull().default(false),
  role: userRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address"),
  genre: text("genre").array().notNull().default(sql`ARRAY[]::text[]`),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  businessHours: jsonb("business_hours").$type<BusinessHours>(),
  businessHoursNote: text("business_hours_note"),
  url: text("url"),
  thumbnailPublicId: text("thumbnail_public_id"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})
