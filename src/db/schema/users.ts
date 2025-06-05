import { sql } from "drizzle-orm";
import {
  uniqueIndex,
  text,
  timestamp,
  integer,
  varchar,
} from "drizzle-orm/pg-core";
import { createTable } from "./table";

export const users = createTable(
  "user",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    firstName: varchar("first_name", { length: 256 }),
    lastName: varchar("last_name", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    stripeCurrentPeriodEnd: timestamp("stripe_current_period_end", {
      withTimezone: true,
    }),
  },
  (table) => ({
    clerkIdIdx: uniqueIndex("clerk_id_idx").on(table.clerkId),
    emailIdx: uniqueIndex("email_idx").on(table.email),
  })
);
