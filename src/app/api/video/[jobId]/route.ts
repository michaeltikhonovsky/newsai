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

    // Get range header for partial content requests
    const range = request.headers.get("range");

    // call external api for video
    const headers: Record<string, string> = {};
    headers["Authorization"] = `Bearer ${API_AUTH_KEY}`;

    // Forward range header if present
    if (range) {
      headers["Range"] = range;
    }

    const response = await fetch(`${API_BASE_URL}/video/${jobId}`, {
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is JSON (S3 URL) or binary (video file)
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Response is JSON with S3 URL - fetch the video from S3 and stream it
      const jsonData = await response.json();

      if (jsonData.s3Url || jsonData.videoUrl || jsonData.url) {
        const videoUrl = jsonData.s3Url || jsonData.videoUrl || jsonData.url;

        // Prepare headers for S3 request
        const s3Headers: Record<string, string> = {};
        if (range) {
          s3Headers["Range"] = range;
        }

        // Fetch the video from S3 with range support
        const videoResponse = await fetch(videoUrl, {
          headers: s3Headers,
        });

        if (!videoResponse.ok) {
          throw new Error(
            `Failed to fetch video from S3: ${videoResponse.status}`
          );
        }

        const videoContentType =
          videoResponse.headers.get("content-type") || "video/mp4";
        const videoContentLength = videoResponse.headers.get("content-length");
        const videoContentRange = videoResponse.headers.get("content-range");
        const acceptRanges = videoResponse.headers.get("accept-ranges");

        const responseHeaders = new Headers({
          "Content-Type": videoContentType,
          "Cache-Control": "public, max-age=3600", // Shorter cache for range requests
          "Accept-Ranges": acceptRanges || "bytes",
        });

        if (videoContentLength) {
          responseHeaders.set("Content-Length", videoContentLength);
        }

        if (videoContentRange) {
          responseHeaders.set("Content-Range", videoContentRange);
        }

        // Return appropriate status code
        const status = videoResponse.status === 206 ? 206 : 200;

        return new NextResponse(videoResponse.body, {
          status,
          headers: responseHeaders,
        });
      } else {
        throw new Error("No video URL found in response");
      }
    } else {
      // Response is binary video file - stream it through
      const contentLength = response.headers.get("content-length");
      const contentRange = response.headers.get("content-range");
      const acceptRanges = response.headers.get("accept-ranges");

      const responseHeaders = new Headers({
        "Content-Type": contentType || "video/mp4",
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": acceptRanges || "bytes",
      });

      if (contentLength) {
        responseHeaders.set("Content-Length", contentLength);
      }

      if (contentRange) {
        responseHeaders.set("Content-Range", contentRange);
      }

      // Return appropriate status code for range requests
      const status = response.status === 206 ? 206 : 200;

      return new NextResponse(response.body, {
        status,
        headers: responseHeaders,
      });
    }
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
