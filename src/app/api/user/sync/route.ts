import { NextResponse } from "next/server";
import { syncUser } from "@/lib/user";
import { z } from "zod";

const userSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email format"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("User sync request body:", body);

    // Validate request body
    const validatedData = userSchema.parse(body);
    console.log("Validated user data:", validatedData);

    // Call syncUser with detailed error logging
    try {
      const userId = await syncUser(
        validatedData.userId,
        validatedData.email,
        validatedData.firstName,
        validatedData.lastName
      );

      console.log("User synced successfully with ID:", userId);
      return NextResponse.json({ success: true, userId });
    } catch (syncError) {
      console.error("Error in syncUser function:", syncError);
      return NextResponse.json(
        {
          error: "Database error while syncing user",
          details:
            syncError instanceof Error
              ? syncError.message
              : "Unknown database error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in sync user endpoint:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON",
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: "Failed to sync user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
