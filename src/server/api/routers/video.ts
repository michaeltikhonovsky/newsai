import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { users } from "@/server/db/schema";

// Credit costs for different video durations
const CREDIT_COSTS = {
  30: 10, // 30 second videos cost 10 credits
  60: 20, // 60 second videos cost 20 credits
} as const;

const API_BASE_URL = process.env.EXTERNAL_API_URL || "http://localhost:3001";
const API_AUTH_KEY = process.env.EXTERNAL_API_AUTH_KEY;

if (!API_AUTH_KEY) {
  console.warn("EXTERNAL_API_AUTH_KEY not set - external API calls may fail");
}

interface GenerateVideoRequest {
  mode: "single" | "host_guest_host";
  selectedHost: string;
  selectedGuest?: string;
  singleCharacterText?: string;
  host1Text?: string;
  guest1Text?: string;
  host2Text?: string;
}

export const videoRouter = createTRPCRouter({
  // get user's credit balance
  getCreditBalance: protectedProcedure.query(async ({ ctx }) => {
    return {
      balance: ctx.user.creditBalance || 0,
    };
  }),

  // check if user has enough credits for a video
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

  // generate video with credit deduction
  generateVideo: protectedProcedure
    .input(
      z.object({
        mode: z.union([z.literal("single"), z.literal("host_guest_host")]),
        duration: z
          .union([z.literal(30), z.literal(60)])
          .optional()
          .default(30),
        selectedHost: z.string(),
        selectedGuest: z.string().optional(),
        singleCharacterText: z.string().optional(),
        host1Text: z.string().optional(),
        guest1Text: z.string().optional(),
        host2Text: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const requiredCredits = CREDIT_COSTS[input.duration];
      const userCredits = ctx.user.creditBalance || 0;

      // check if user has enough credits
      if (userCredits < requiredCredits) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient credits. You need ${requiredCredits} credits but only have ${userCredits}.`,
        });
      }

      // validate required fields based on mode
      if (input.mode === "single" && !input.singleCharacterText?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Single character text is required for single mode",
        });
      }

      if (input.mode === "host_guest_host") {
        if (
          !input.host1Text?.trim() ||
          !input.guest1Text?.trim() ||
          !input.host2Text?.trim()
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "All text fields (host intro, guest, host outro) are required for host+guest mode",
          });
        }
        if (!input.selectedGuest) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Guest selection is required for host+guest mode",
          });
        }
      }

      try {
        // prepare request for external api
        const requestBody: GenerateVideoRequest = {
          mode: input.mode,
          selectedHost: input.selectedHost,
          selectedGuest: input.selectedGuest,
          singleCharacterText: input.singleCharacterText,
          host1Text: input.host1Text,
          guest1Text: input.guest1Text,
          host2Text: input.host2Text,
        };

        // call external api
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        headers["Authorization"] = `Bearer ${API_AUTH_KEY}`;

        const response = await fetch(`${API_BASE_URL}/generate-video`, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const result = await response.json();

        // deduct credits from user's balance
        await ctx.db
          .update(users)
          .set({
            creditBalance: userCredits - requiredCredits,
          })
          .where(eq(users.id, ctx.user.id));

        // return success response with job ID and updated balance
        return {
          jobId: result.jobId,
          creditsDeducted: requiredCredits,
          remainingCredits: userCredits - requiredCredits,
        };
      } catch (error) {
        console.error("Error generating video:", error);

        // if external api call failed dont deduct credits
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to start video generation: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }),

  // get video status (no credits needed for this)
  getVideoStatus: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const headers: Record<string, string> = {};

        headers["Authorization"] = `Bearer ${API_AUTH_KEY}`;

        const response = await fetch(`${API_BASE_URL}/status/${input.jobId}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const status = await response.json();
        return status;
      } catch (error) {
        console.error("Error fetching video status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch video status: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }),

  // get video metadata (returns URL for video streaming)
  // Note: For actual video streaming, use the Next.js API route at /api/video/[jobId]
  getVideoMetadata: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const headers: Record<string, string> = {};

        headers["Authorization"] = `Bearer ${API_AUTH_KEY}`;

        // First check if video exists by calling status
        const statusResponse = await fetch(
          `${API_BASE_URL}/status/${input.jobId}`,
          {
            headers,
          }
        );

        if (!statusResponse.ok) {
          if (statusResponse.status === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Video not found",
            });
          }
          throw new Error(`HTTP error! status: ${statusResponse.status}`);
        }

        const status = await statusResponse.json();

        // Return metadata including the streaming URL for the Next.js API route
        return {
          jobId: input.jobId,
          status: status.status,
          streamUrl: `/api/video/${input.jobId}`,
          ...status,
        };
      } catch (error) {
        console.error("Error fetching video metadata:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch video metadata: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }),
});
