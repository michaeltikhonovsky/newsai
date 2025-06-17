import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// credit costs for video durations
const CREDIT_COSTS = {
  30: 10,
  60: 20,
} as const;

const API_BASE_URL = process.env.EXTERNAL_API_URL || "http://localhost:3001";
const API_AUTH_KEY = process.env.EXTERNAL_API_AUTH_KEY;

// validation schema
const generateVideoSchema = z.object({
  mode: z.union([z.literal("single"), z.literal("host_guest_host")]),
  selectedHost: z.string(),
  selectedGuest: z.string().optional(),
  singleCharacterText: z.string().optional(),
  host1Text: z.string().optional(),
  guest1Text: z.string().optional(),
  host2Text: z.string().optional(),
  duration: z
    .union([z.literal(30), z.literal(60)])
    .optional()
    .default(30),
});

export async function POST(request: NextRequest) {
  try {
    // check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1)
      .then((res) => res[0]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = generateVideoSchema.parse(body);

    const duration = validatedData.duration;
    const requiredCredits = CREDIT_COSTS[duration];
    const userCredits = user.creditBalance || 0;

    // check if user has enough credits
    if (userCredits < requiredCredits) {
      return NextResponse.json(
        {
          error: `Insufficient credits. You need ${requiredCredits} credits but only have ${userCredits}.`,
        },
        { status: 400 }
      );
    }

    // validate required fields based on mode
    if (
      validatedData.mode === "single" &&
      !validatedData.singleCharacterText?.trim()
    ) {
      return NextResponse.json(
        { error: "Single character text is required for single mode" },
        { status: 400 }
      );
    }

    if (validatedData.mode === "host_guest_host") {
      if (
        !validatedData.host1Text?.trim() ||
        !validatedData.guest1Text?.trim() ||
        !validatedData.host2Text?.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "All text fields (host intro, guest, host outro) are required for host+guest mode",
          },
          { status: 400 }
        );
      }
      if (!validatedData.selectedGuest) {
        return NextResponse.json(
          { error: "Guest selection is required for host+guest mode" },
          { status: 400 }
        );
      }
    }

    try {
      // prepare request for external api
      const requestBody = {
        mode: validatedData.mode,
        selectedHost: validatedData.selectedHost,
        selectedGuest: validatedData.selectedGuest,
        singleCharacterText: validatedData.singleCharacterText,
        host1Text: validatedData.host1Text,
        guest1Text: validatedData.guest1Text,
        host2Text: validatedData.host2Text,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      headers["Authorization"] = `Bearer ${API_AUTH_KEY}`;

      console.log("Calling external API:", {
        url: `${API_BASE_URL}/generate-video`,
        hasAuthKey: !!API_AUTH_KEY,
        headers: Object.keys(headers),
      });

      const response = await fetch(`${API_BASE_URL}/generate-video`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      console.log("External API response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("External API error:", {
          status: response.status,
          errorData,
        });
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      // deduct credits from users balance
      await db
        .update(users)
        .set({
          creditBalance: userCredits - requiredCredits,
        })
        .where(eq(users.id, user.id));

      // return response in the exact format the frontend expects
      return NextResponse.json({
        jobId: result.jobId,
        creditsDeducted: requiredCredits,
        remainingCredits: userCredits - requiredCredits,
      });
    } catch (error) {
      console.error("Error generating video:", error);

      // if api call failed dont deduct credits
      return NextResponse.json(
        {
          error: `Failed to start video generation: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in generate-video API:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
