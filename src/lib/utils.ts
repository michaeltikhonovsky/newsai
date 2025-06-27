import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { VideoConfig } from "@/types/video";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper functions for job config localStorage management
export const getJobConfig = (jobId: string): VideoConfig | null => {
  try {
    const stored = localStorage.getItem(`activeVideoJobs_${jobId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to get job config from localStorage:", error);
    return null;
  }
};

export const removeJobConfig = (jobId: string) => {
  try {
    localStorage.removeItem(`activeVideoJobs_${jobId}`);
  } catch (error) {
    console.error("Failed to remove job config from localStorage:", error);
  }
};

// Helper function to generate title from job config
export const generateTitleFromConfig = (config: VideoConfig | null): string => {
  if (!config) return "Video";

  const mode = config.mode === "single" ? "Single Host" : "Host & Guest";
  return `${mode} Video (${config.duration}s)`;
};
