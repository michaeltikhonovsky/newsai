import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { recentVideos } from "@/server/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export const videosRouter = createTRPCRouter({
  // Add a completed video to the user's recent videos
  addVideo: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        s3Url: z.string(),
        title: z.string(),
        mode: z.enum(["single", "host_guest_host"]),
        selectedHost: z.string().optional(),
        selectedGuest: z.string().optional(),
        duration: z.union([z.literal(30), z.literal(60)]),
        singleCharacterText: z.string().optional(),
        host1Text: z.string().optional(),
        guest1Text: z.string().optional(),
        host2Text: z.string().optional(),
        enableMusic: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if video already exists for this user and jobId
      const existingVideo = await ctx.db.query.recentVideos.findFirst({
        where: and(
          eq(recentVideos.userId, ctx.user.id),
          eq(recentVideos.jobId, input.jobId)
        ),
      });

      if (existingVideo) {
        // Update existing video with S3 URL if it wasn't set before
        await ctx.db
          .update(recentVideos)
          .set({
            s3Url: input.s3Url,
            title: input.title,
            mode: input.mode,
            selectedHost: input.selectedHost,
            selectedGuest: input.selectedGuest,
            duration: input.duration,
            singleCharacterText: input.singleCharacterText,
            host1Text: input.host1Text,
            guest1Text: input.guest1Text,
            host2Text: input.host2Text,
            enableMusic: input.enableMusic,
          })
          .where(eq(recentVideos.id, existingVideo.id));

        return { success: true, videoId: existingVideo.id, updated: true };
      }

      // Insert new video
      const [newVideo] = await ctx.db
        .insert(recentVideos)
        .values({
          userId: ctx.user.id,
          jobId: input.jobId,
          s3Url: input.s3Url,
          title: input.title,
          mode: input.mode,
          selectedHost: input.selectedHost,
          selectedGuest: input.selectedGuest,
          duration: input.duration,
          singleCharacterText: input.singleCharacterText,
          host1Text: input.host1Text,
          guest1Text: input.guest1Text,
          host2Text: input.host2Text,
          enableMusic: input.enableMusic,
        })
        .returning({ id: recentVideos.id });

      return { success: true, videoId: newVideo?.id, updated: false };
    }),

  // Get recent videos for the current user (only videos with S3 URLs from last 24 hours)
  getRecentVideos: protectedProcedure.query(async ({ ctx }) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const videos = await ctx.db.query.recentVideos.findMany({
      where: and(
        eq(recentVideos.userId, ctx.user.id),
        sql`${recentVideos.s3Url} IS NOT NULL`,
        gte(recentVideos.createdAt, twentyFourHoursAgo)
      ),
      orderBy: [sql`${recentVideos.createdAt} DESC`],
    });

    return videos;
  }),

  // Manually cleanup expired videos (will be called by cron job)
  cleanupExpiredVideos: protectedProcedure.mutation(async ({ ctx }) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deletedVideos = await ctx.db
      .delete(recentVideos)
      .where(
        and(
          eq(recentVideos.userId, ctx.user.id),
          sql`${recentVideos.createdAt} < ${twentyFourHoursAgo}`
        )
      )
      .returning({ id: recentVideos.id });

    return {
      success: true,
      deletedCount: deletedVideos.length,
      deletedIds: deletedVideos.map((v) => v.id),
    };
  }),
});
