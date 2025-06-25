import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { recentVideos } from "@/server/db/schema";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request (basic security)
    const cronSecret = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    // Allow requests from Vercel Cron or if no secret is configured
    if (expectedSecret && cronSecret !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Delete all videos older than 24 hours (for all users)
    const deletedVideos = await db
      .delete(recentVideos)
      .where(sql`${recentVideos.createdAt} < ${twentyFourHoursAgo}`)
      .returning({ id: recentVideos.id, userId: recentVideos.userId });

    const executionTime = Date.now() - startTime;

    console.log(
      `🧹 [CRON] Cleaned up ${deletedVideos.length} expired videos in ${executionTime}ms`,
      {
        deletedCount: deletedVideos.length,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      deletedCount: deletedVideos.length,
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
      message: `Successfully deleted ${deletedVideos.length} expired videos`,
    });
  } catch (error) {
    console.error("❌ [CRON] Error cleaning up expired videos:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to cleanup expired videos: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET method for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
