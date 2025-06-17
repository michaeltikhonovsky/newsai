import { SQL, sql } from "drizzle-orm";
import {
  AnyPgColumn,
  index,
  pgTableCreator,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `newsai_${name}`);

export function lower(column: AnyPgColumn): SQL {
  return sql`lower(${column})`;
}

export const users = createTable(
  "users",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    firstName: d.varchar("first_name", { length: 256 }),
    lastName: d.varchar("last_name", { length: 256 }),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d
      .timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date()),
    clerkId: d.text("clerk_id").notNull().unique(),
    email: d.text("email").notNull().unique(),
    stripeCustomerId: d.text("stripe_customer_id"),
    stripeSubscriptionId: d.text("stripe_subscription_id"),
    stripePriceId: d.text("stripe_price_id"),
    stripeCurrentPeriodEnd: d.timestamp("stripe_current_period_end", {
      withTimezone: true,
    }),
    creditBalance: d.integer("credit_balance").default(0),
  }),
  (t) => [index("clerk_id_idx").on(t.clerkId), index("email_idx").on(t.email)]
);

export const creditRefunds = createTable(
  "credit_refunds",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .integer("user_id")
      .notNull()
      .references(() => users.id),
    jobId: d.text("job_id").notNull().unique(),
    refundAmount: d.integer("refund_amount").notNull(),
    reason: d.text("reason"),
    createdAt: d
      .timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [index("user_id_idx").on(t.userId), index("job_id_idx").on(t.jobId)]
);
