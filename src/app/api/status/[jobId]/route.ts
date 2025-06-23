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

    // Validate jobId format to prevent unnecessary external API calls
    if (!/^[a-zA-Z0-9_-]+$/.test(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // call external api for status with timeout and retry logic
    const headers: Record<string, string> = {
      Authorization: `Bearer ${API_AUTH_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "NewsAI-Status-Client/1.0",
    };

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/status/${jobId}`, {
        headers,
        signal: controller.signal,
        // Add keepalive for better connection handling
        keepalive: true,
      });

      clearTimeout(timeoutId);

      // More nuanced error handling based on status codes
      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ error: "Job not found" }, { status: 404 });
        } else if (response.status === 429) {
          // Rate limited - return 503 to indicate temporary unavailability
          return NextResponse.json(
            { error: "Service temporarily busy, please retry" },
            { status: 503 }
          );
        } else if (response.status >= 500) {
          // Server error - return 503 to indicate temporary unavailability
          return NextResponse.json(
            { error: "External service temporarily unavailable" },
            { status: 503 }
          );
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Validate response content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from external service");
      }

      let status;
      try {
        status = await response.json();
      } catch (parseError) {
        throw new Error("Failed to parse response from external service");
      }

      // Validate response structure
      if (!status.jobId || !status.status) {
        throw new Error("Invalid response structure from external service");
      }

      // Add cache headers for successful responses
      const responseHeaders = new Headers({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      });

      return NextResponse.json(status, { headers: responseHeaders });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Handle specific fetch errors
      if (fetchError.name === "AbortError") {
        console.warn(`Status request timeout for job ${jobId}`);
        return NextResponse.json(
          { error: "Request timeout - service may be busy" },
          { status: 503 }
        );
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.error("Error fetching video status:", {
      jobId: (await params).jobId,
      error: error.message,
      stack: error.stack,
    });

    // Return appropriate error status based on error type
    if (
      error.message.includes("timeout") ||
      error.message.includes("AbortError")
    ) {
      return NextResponse.json(
        { error: "Service timeout - please retry" },
        { status: 503 }
      );
    } else if (
      error.message.includes("Network Error") ||
      error.message.includes("Failed to fetch")
    ) {
      return NextResponse.json(
        { error: "Network connectivity issue - please retry" },
        { status: 503 }
      );
    } else {
      return NextResponse.json(
        {
          error: `Failed to fetch video status: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }
  }
}
