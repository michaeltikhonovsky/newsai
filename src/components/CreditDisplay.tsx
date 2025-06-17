"use client";

import { api } from "@/trpc/react";
import { Coins, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface CreditDisplayProps {
  className?: string;
  showLabel?: boolean;
}

export function CreditDisplay({
  className = "",
  showLabel = true,
}: CreditDisplayProps) {
  const { isLoaded, isSignedIn } = useUser();
  const { data: creditData, isLoading } = api.users.getCreditBalance.useQuery(
    undefined,
    {
      enabled: isLoaded && isSignedIn,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    }
  );

  if (!isLoaded) {
    return <div className={`w-16 h-6 ${className}`} />;
  }

  if (!isSignedIn) {
    return <div className={`w-0 h-6 ${className}`} />;
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
        {showLabel && (
          <span className="text-sm text-gray-400 font-mono">Loading...</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Coins className="w-4 h-4 text-yellow-400" />
      {showLabel && (
        <span className="text-sm text-gray-400 font-mono">Credits:</span>
      )}
      <span className="text-sm font-mono text-yellow-300 font-bold">
        {creditData?.balance || 0}
      </span>
    </div>
  );
}
