"use client";

import { api } from "@/trpc/react";
import { Coins, Loader2 } from "lucide-react";

interface CreditDisplayProps {
  className?: string;
  showLabel?: boolean;
}

export function CreditDisplay({
  className = "",
  showLabel = true,
}: CreditDisplayProps) {
  const { data: creditData, isLoading } = api.video.getCreditBalance.useQuery();

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
