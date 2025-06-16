"use client";

import { useEffect } from "react";
import { api } from "@/trpc/react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function AuthCallbackContent() {
  const { isSignedIn } = useUser();
  const syncUser = api.users.syncUser.useMutation({
    onSuccess: () => {
      const from = searchParams.get("from");
      window.location.href = from ? `/${from.replace(/^\//, "")}` : "/";
    },
    onError: (error) => {
      console.error("Sync error:", error);
    },
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    if (isSignedIn) {
      syncUser.mutate();
    }
  }, [isSignedIn]);

  return (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div>
          <p>Syncing user</p>
        </div>
      </div>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl={`/sync${
          searchParams.get("from") ? `?from=${searchParams.get("from")}` : ""
        }`}
        continueSignUpUrl={`/sync${
          searchParams.get("from") ? `?from=${searchParams.get("from")}` : ""
        }`}
        redirectUrl={`/sync${
          searchParams.get("from") ? `?from=${searchParams.get("from")}` : ""
        }`}
        afterSignInUrl={`/sync${
          searchParams.get("from") ? `?from=${searchParams.get("from")}` : ""
        }`}
        afterSignUpUrl={`/sync${
          searchParams.get("from") ? `?from=${searchParams.get("from")}` : ""
        }`}
      />
    </>
  );
}
