import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { recentVideos, users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1)
      .then((res) => res[0]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get video record from database to verify ownership and get S3 URL
    const video = await db
      .select()
      .from(recentVideos)
      .where(
        and(eq(recentVideos.jobId, jobId), eq(recentVideos.userId, user.id))
      )
      .limit(1)
      .then((res) => res[0]);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!video.s3Url) {
      return NextResponse.json(
        { error: "Video not ready for download" },
        { status: 400 }
      );
    }

    // Fetch the video from S3
    const s3Response = await fetch(video.s3Url);

    if (!s3Response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch video from S3" },
        { status: 500 }
      );
    }

    // Get the video content
    const videoBuffer = await s3Response.arrayBuffer();

    // Generate a clean filename
    const cleanTitle = video.title.replace(/[^a-z0-9]/gi, "_");
    const filename = `${cleanTitle}.mp4`;

    // Create response with proper headers to force download
    const headers = new Headers({
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": videoBuffer.byteLength.toString(),
      "Cache-Control": "no-cache",
    });

    return new NextResponse(videoBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error downloading video:", error);
    return NextResponse.json(
      {
        error: `Failed to download video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
