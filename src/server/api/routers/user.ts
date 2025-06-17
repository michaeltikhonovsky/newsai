import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  betaProcedure,
  maybeAuthedProcedure,
} from "@/server/api/trpc";
import { currentUser } from "@clerk/nextjs/server";
import { users, creditRefunds } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// Credit costs for different video durations
const CREDIT_COSTS = {
  30: 10, // 30 second videos cost 10 credits
  60: 20, // 60 second videos cost 20 credits
} as const;

export const userRouter = createTRPCRouter({
  getUser: maybeAuthedProcedure.query(async ({ ctx }) => {
    return ctx.user ?? null;
  }),

  getUserById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input),
      });
      return user ?? null;
    }),

  syncUser: publicProcedure.mutation(async ({ ctx }) => {
    console.log("syncUser mutation called");

    const user = await currentUser();
    console.log("Current user fetched:", user);

    if (!user) {
      console.error("User not found");
      throw new Error("User not found");
    }

    const existingUser = await ctx.db.query.users.findFirst({
      where: eq(users.clerkId, user.id),
    });
    console.log("Existing user fetched from database:", existingUser);

    if (!existingUser) {
      console.log("User not found in database, inserting new user");
      await ctx.db.insert(users).values({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
      });
      console.log("New user inserted into database");
    } else {
      console.log("User already exists in database, no insertion needed");
    }

    console.log("syncUser mutation completed successfully");
    return { success: true };
  }),

  updateUser: protectedProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set(input)
        .where(eq(users.clerkId, ctx.user.clerkId));
      return { success: true };
    }),

  // get user's credit balance
  getCreditBalance: protectedProcedure.query(async ({ ctx }) => {
    return {
      balance: ctx.user.creditBalance || 0,
    };
  }),
  checkCredits: protectedProcedure
    .input(
      z.object({
        duration: z.union([z.literal(30), z.literal(60)]),
      })
    )
    .query(async ({ ctx, input }) => {
      const requiredCredits = CREDIT_COSTS[input.duration];
      const userCredits = ctx.user.creditBalance || 0;

      return {
        hasEnoughCredits: userCredits >= requiredCredits,
        requiredCredits,
        userCredits,
        shortfall: Math.max(0, requiredCredits - userCredits),
      };
    }),

  hello: betaProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) {
      throw new Error("User not found");
    }
    return { message: `hello ${user.firstName}` };
  }),

  getAllUserIds: publicProcedure.query(async ({ ctx }) => {
    const userIds = await ctx.db.query.users.findMany({
      columns: {
        id: true,
      },
    });
    return userIds.map((user: { id: number }) => ({ id: user.id.toString() }));
  }),

  // refund credits for failed video generation
  refundCredits: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        duration: z.union([z.literal(30), z.literal(60)]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // check if refund already exists for this job
      const existingRefund = await ctx.db.query.creditRefunds.findFirst({
        where: eq(creditRefunds.jobId, input.jobId),
      });

      if (existingRefund) {
        return {
          success: false,
          error: "Refund already processed for this job",
          refundAmount: existingRefund.refundAmount,
        };
      }

      const refundAmount = CREDIT_COSTS[input.duration];
      const currentCredits = ctx.user.creditBalance || 0;
      const newBalance = currentCredits + refundAmount;

      // update user's credit balance and record the refund
      await ctx.db.transaction(async (tx) => {
        // update credit balance
        await tx
          .update(users)
          .set({
            creditBalance: newBalance,
          })
          .where(eq(users.id, ctx.user.id));

        // record the refund
        await tx.insert(creditRefunds).values({
          userId: ctx.user.id,
          jobId: input.jobId,
          refundAmount,
          reason: input.reason || "Video generation failed",
        });
      });

      console.log(
        `Refunded ${refundAmount} credits to user ${ctx.user.id} for failed job ${input.jobId}. New balance: ${newBalance}`
      );

      return {
        success: true,
        refundAmount,
        newBalance,
        reason: input.reason || "Video generation failed",
      };
    }),
});
