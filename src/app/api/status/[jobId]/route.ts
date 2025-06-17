import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

const API_BASE_URL = process.env.EXTERNAL_API_URL || "http://localhost:3001";
const API_AUTH_KEY = process.env.EXTERNAL_API_AUTH_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // call external api for status
    const headers: Record<string, string> = {};

    headers["Authorization"] = `Bearer ${API_AUTH_KEY}`;

    const response = await fetch(`${API_BASE_URL}/status/${jobId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const status = await response.json();

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching video status:", error);
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
