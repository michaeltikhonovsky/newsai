import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  betaProcedure,
  maybeAuthedProcedure,
} from "@/server/api/trpc";
import { currentUser } from "@clerk/nextjs/server";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

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
});
