import { createCallerFactory, createTRPCRouter } from "./trpc";
import { userRouter } from "./routers/user";
import { stripeRouter } from "./routers/stripe";
import { videosRouter } from "./routers/videos";

export const appRouter = createTRPCRouter({
  users: userRouter,
  stripe: stripeRouter,
  videos: videosRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
