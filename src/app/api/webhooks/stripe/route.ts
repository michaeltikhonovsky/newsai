import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { users } from "@/server/db/schema";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

// configuration
const CREDITS_PER_PACK = 50;

const processedEvents = new Set<string>();

export async function POST(req: Request) {
  console.log("🔔 Webhook received");

  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  console.log("📝 Webhook signature present:", !!signature);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log(
      "✅ Webhook verified successfully. Event type:",
      event.type,
      "Event ID:",
      event.id
    );
  } catch (error) {
    console.error("❌ Webhook verification failed:", error);
    return new Response(
      `Webhook Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 400 }
    );
  }

  if (processedEvents.has(event.id)) {
    console.log(`⚠️ Event ${event.id} already processed, skipping`);
    return new Response(null, { status: 200 });
  }

  try {
    switch (event.type) {
      // checkout session completion for credit pack purchase
      case "checkout.session.completed":
        console.log("💳 Processing checkout.session.completed");
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        console.log("📊 Checkout session mode:", checkoutSession.mode);
        console.log("👤 Customer ID:", checkoutSession.customer);

        // for credit pack purchase
        if (checkoutSession.mode === "payment") {
          console.log("🔄 Processing payment mode checkout");
          const customerId = checkoutSession.customer as string;

          if (!customerId) {
            console.error("❌ No customer ID found in checkout session");
            break;
          }

          console.log(
            "🔍 Looking for user with Stripe customer ID:",
            customerId
          );

          // find user by stripe customer id
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customerId));

          if (!user) {
            console.error(
              "❌ No user found with Stripe customer ID:",
              customerId
            );
            break;
          }

          console.log(
            "✅ Found user:",
            user.id,
            "Current balance:",
            user.creditBalance
          );

          const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
            checkoutSession.id,
            {
              expand: ["line_items"],
            }
          );

          const lineItem = sessionWithLineItems.line_items?.data?.[0];
          const quantity = lineItem?.quantity || 1;
          const creditsToAdd = CREDITS_PER_PACK * quantity;

          console.log("📦 Line item quantity:", quantity);
          console.log("💰 Credits to add:", creditsToAdd);
          console.log(
            "🔢 New balance will be:",
            (user.creditBalance ?? 0) + creditsToAdd
          );

          const updateResult = await db
            .update(users)
            .set({
              creditBalance: (user.creditBalance ?? 0) + creditsToAdd,
            })
            .where(eq(users.stripeCustomerId, customerId))
            .returning({ id: users.id, creditBalance: users.creditBalance });

          console.log("📈 Update result:", updateResult);

          console.log(
            `✅ Added ${creditsToAdd} credits (${quantity} packs × ${CREDITS_PER_PACK} credits) to user ${user.id} for event ${event.id}`
          );
        } else {
          console.log("ℹ️ Skipping non-payment checkout session");
        }
        break;

      default:
        console.log(`🤷 Unhandled event type: ${event.type}`);
        break;
    }

    processedEvents.add(event.id);

    if (processedEvents.size > 1000) {
      const eventArray = Array.from(processedEvents);
      processedEvents.clear();
      eventArray.slice(-500).forEach((id) => processedEvents.add(id));
    }
  } catch (error) {
    console.error(`💥 Error processing webhook event ${event.id}:`, error);
    return new Response(
      `Error processing webhook: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }

  console.log("🎉 Webhook processed successfully");
  return new Response(null, { status: 200 });
}
