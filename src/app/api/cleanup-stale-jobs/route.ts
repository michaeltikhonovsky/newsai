import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { users, creditRefunds } from "@/server/db/schema";
import { eq, and, isNull, lt } from "drizzle-orm";

// Credit costs for different video durations
const CREDIT_COSTS = {
  30: 10,
  60: 20,
} as const;

const API_BASE_URL = process.env.EXTERNAL_API_URL || "http://localhost:3001";
const API_AUTH_KEY = process.env.EXTERNAL_API_AUTH_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const body = await request.json();
    const { jobId, duration } = body;

    if (!jobId || !duration) {
      return NextResponse.json(
        { error: "jobId and duration are required" },
        { status: 400 }
      );
    }

    // Check if refund already exists for this job
    const existingRefund = await db.query.creditRefunds.findFirst({
      where: eq(creditRefunds.jobId, jobId),
    });

    if (existingRefund) {
      return NextResponse.json({
        success: false,
        error: "Refund already processed for this job",
        refundAmount: existingRefund.refundAmount,
      });
    }

    // Try to check the external API status first
    try {
      const headers: Record<string, string> = {};
      if (API_AUTH_KEY) {
        headers["Authorization"] = `Bearer ${API_AUTH_KEY}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/status/${jobId}`, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const status = await response.json();

        // If job is still pending/processing, don't refund yet
        if (
          status.status === "pending" ||
          status.status === "queued" ||
          status.status === "processing"
        ) {
          return NextResponse.json({
            success: false,
            error: "Job is still in progress",
            currentStatus: status.status,
          });
        }

        // If job failed on the external service, proceed with refund
        if (status.status === "failed") {
          // Continue to refund logic below
        } else if (status.status === "completed") {
          return NextResponse.json({
            success: false,
            error: "Job completed successfully",
            currentStatus: status.status,
          });
        }
      }
    } catch (externalApiError) {
      console.log(
        "External API not reachable, proceeding with refund:",
        externalApiError
      );
      // If external API is not reachable, assume the job failed and proceed with refund
    }

    const refundAmount = CREDIT_COSTS[duration as keyof typeof CREDIT_COSTS];
    const currentCredits = user.creditBalance || 0;
    const newBalance = currentCredits + refundAmount;

    // Update user's credit balance and record the refund
    await db.transaction(async (tx) => {
      // Update credit balance
      await tx
        .update(users)
        .set({
          creditBalance: newBalance,
        })
        .where(eq(users.id, user.id));

      // Record the refund
      await tx.insert(creditRefunds).values({
        userId: user.id,
        jobId,
        refundAmount,
        reason: "Stale job cleanup - server was unreachable",
      });
    });

    console.log(
      `Refunded ${refundAmount} credits to user ${user.id} for stale job ${jobId}. New balance: ${newBalance}`
    );

    return NextResponse.json({
      success: true,
      refundAmount,
      newBalance,
      reason: "Stale job cleanup - server was unreachable",
    });
  } catch (error) {
    console.error("Error in cleanup-stale-jobs API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
