"use client";

import { usePendingJobsCheck } from "@/hooks/usePendingJobsCheck";

export const PendingJobsChecker = () => {
  usePendingJobsCheck();
  return null; // This component doesn't render anything
};
