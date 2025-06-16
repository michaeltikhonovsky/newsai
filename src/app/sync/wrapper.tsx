"use client";

import { useEffect } from "react";
import { api } from "@/trpc/react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SyncContent() {
  const { isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const syncUser = api.users.syncUser.useMutation({
    onSuccess: () => {
      const from = searchParams.get("from");
      console.log("Sync successful, redirecting to", from || "/");
      window.location.href = from ? `/${from.replace(/^\//, "")}` : "/";
    },
    onError: (error) => {
      console.error("Sync failed:", error);
    },
  });

  useEffect(() => {
    if (isSignedIn) {
      console.log("User is signed in, attempting sync");
      syncUser.mutate();
    } else {
      console.log("Waiting for user to be signed in");
    }
  }, [isSignedIn]);

  return (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div>
          <p>Syncing user</p>
        </div>
      </div>
    </>
  );
}
