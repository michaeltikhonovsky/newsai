import { createCallerFactory, createTRPCRouter } from "./trpc";
import { userRouter } from "./routers/user";
import { stripeRouter } from "./routers/stripe";

export const appRouter = createTRPCRouter({
  users: userRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
