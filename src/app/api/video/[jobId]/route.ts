import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

const API_BASE_URL = process.env.EXTERNAL_API_URL || "http://localhost:3001";
const API_AUTH_KEY = process.env.EXTERNAL_API_AUTH_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // check authentication
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

    // call external api for video
    const headers: Record<string, string> = {};

    headers["Authorization"] = `Bearer ${API_AUTH_KEY}`;

    const response = await fetch(`${API_BASE_URL}/video/${jobId}`, {
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // stream the video file through api
    const contentType = response.headers.get("content-type") || "video/mp4";
    const contentLength = response.headers.get("content-length");

    const responseHeaders = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    });

    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    // stream the response
    return new NextResponse(response.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
