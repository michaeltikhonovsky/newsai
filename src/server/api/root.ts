import { createCallerFactory, createTRPCRouter } from "./trpc";
import { userRouter } from "./routers/user";
import { stripeRouter } from "./routers/stripe";
import { videoRouter } from "./routers/video";

export const appRouter = createTRPCRouter({
  users: userRouter,
  stripe: stripeRouter,
  video: videoRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
