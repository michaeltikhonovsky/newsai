import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";

interface JobStatus {
  jobId: string;
  status: "pending" | "queued" | "processing" | "completed" | "failed";
  progress?: string;
  error?: string;
  queuePosition?: number;
  createdAt: string;
  updatedAt: string;
}

interface OngoingGeneration {
  jobId: string;
  title: string;
  startedAt: string;
  lastStatus?: JobStatus;
}

interface VideoConfig {
  mode: "single" | "host_guest_host";
  duration: 30 | 60;
  selectedHost: string;
  selectedGuest?: string;
  singleCharacterText?: string;
  host1Text?: string;
  guest1Text?: string;
  host2Text?: string;
  enableMusic: boolean;
}

// Helper functions for job config localStorage management
const getJobConfig = (jobId: string): VideoConfig | null => {
  try {
    const stored = localStorage.getItem(`activeVideoJobs_${jobId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to get job config from localStorage:", error);
    return null;
  }
};

const removeJobConfig = (jobId: string) => {
  try {
    localStorage.removeItem(`activeVideoJobs_${jobId}`);
  } catch (error) {
    console.error("Failed to remove job config from localStorage:", error);
  }
};

// Helper function to generate title from job config
const generateTitleFromConfig = (config: VideoConfig | null): string => {
  if (!config) return "Video";

  const mode = config.mode === "single" ? "Single Host" : "Host & Guest";
  return `${mode} Video (${config.duration}s)`;
};

const STORAGE_KEY = "ongoingGenerations";
const POLL_INTERVAL = 3000; // 3 seconds

export const useGlobalVideoProgress = () => {
  const [ongoingGenerations, setOngoingGenerations] = useState<
    OngoingGeneration[]
  >([]);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Load ongoing generations from localStorage
  const loadFromStorage = useCallback((): OngoingGeneration[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load ongoing generations from storage:", error);
      return [];
    }
  }, []);

  // Save to localStorage
  const saveToStorage = useCallback((generations: OngoingGeneration[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(generations));
    } catch (error) {
      console.error("Failed to save ongoing generations to storage:", error);
    }
  }, []);

  // Poll status for all ongoing generations
  const pollAllStatuses = useCallback(
    async (generations: OngoingGeneration[]) => {
      if (isPollingRef.current || generations.length === 0) return;

      isPollingRef.current = true;

      try {
        const updatedGenerations = await Promise.all(
          generations.map(async (gen) => {
            try {
              const response = await fetch(`/api/status/${gen.jobId}`, {
                headers: {
                  "Cache-Control": "no-cache",
                },
              });

              if (response.ok) {
                const status: JobStatus = await response.json();
                return { ...gen, lastStatus: status };
              } else {
                console.warn(
                  `Failed to fetch status for job ${gen.jobId}: ${response.status}`
                );
                return gen; // Keep existing status
              }
            } catch (error) {
              console.error(
                `Error fetching status for job ${gen.jobId}:`,
                error
              );
              return gen; // Keep existing status
            }
          })
        );

        setOngoingGenerations(updatedGenerations);

        // Check for completed or failed jobs and show toasts
        updatedGenerations.forEach(async (job) => {
          const status = job.lastStatus?.status;
          if (status === "completed" || status === "failed") {
            // Check if we've already shown a toast for this job
            const shownCompletions = JSON.parse(
              sessionStorage.getItem("shownCompletions") || "[]"
            );

            if (!shownCompletions.includes(job.jobId)) {
              if (status === "completed") {
                // Get config from localStorage for this specific job
                const jobConfig = getJobConfig(job.jobId);
                const title = generateTitleFromConfig(jobConfig);

                toast({
                  title: "Video Generation Complete! 🎉",
                  description: `"${title}" has finished generating. Check your Projects page to view it.`,
                });

                console.log(
                  `✅ Job ${job.jobId} completed - showing success toast from global polling with job-specific config`
                );

                // Clean up job config since it's completed
                removeJobConfig(job.jobId);
              } else if (status === "failed") {
                // Get config from localStorage for this specific job
                const jobConfig = getJobConfig(job.jobId);
                const title = generateTitleFromConfig(jobConfig);

                toast({
                  title: "Video Generation Failed",
                  description: `"${title}" failed to generate. You may retry from the script page.`,
                  variant: "destructive",
                });

                console.log(
                  `❌ Job ${job.jobId} failed - showing failure toast from global polling with job-specific config`
                );

                // Clean up job config since it failed
                removeJobConfig(job.jobId);
              }

              // Mark this job as having shown a toast
              shownCompletions.push(job.jobId);
              sessionStorage.setItem(
                "shownCompletions",
                JSON.stringify(shownCompletions)
              );
            }
          }
        });

        // Remove completed or failed generations from ongoing tracking
        const stillActive = updatedGenerations.filter((gen) => {
          const status = gen.lastStatus?.status;
          return status !== "completed" && status !== "failed";
        });

        setOngoingGenerations(stillActive);
        saveToStorage(stillActive);

        // Clean up sessionStorage if no more ongoing jobs
        if (stillActive.length === 0) {
          sessionStorage.removeItem("shownCompletions");
        }

        // Continue polling if there are active generations
        if (stillActive.length > 0) {
          pollTimeoutRef.current = setTimeout(() => {
            isPollingRef.current = false;
            pollAllStatuses(stillActive);
          }, POLL_INTERVAL);
        } else {
          isPollingRef.current = false;
        }
      } catch (error) {
        console.error("Error polling statuses:", error);
        isPollingRef.current = false;
      }
    },
    [saveToStorage]
  );

  // Add a new generation to track
  const addGeneration = useCallback(
    (jobId: string, title: string) => {
      const newGeneration: OngoingGeneration = {
        jobId,
        title,
        startedAt: new Date().toISOString(),
        lastStatus: {
          jobId,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      setOngoingGenerations((prev) => {
        // Avoid duplicates
        const filtered = prev.filter((gen) => gen.jobId !== jobId);
        const updated = [...filtered, newGeneration];
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Remove a generation (when completed/failed externally)
  const removeGeneration = useCallback(
    (jobId: string) => {
      setOngoingGenerations((prev) => {
        const updated = prev.filter((gen) => gen.jobId !== jobId);
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Update a generation's status (to sync with main polling)
  const updateGeneration = useCallback(
    (jobId: string, status: JobStatus) => {
      setOngoingGenerations((prev) => {
        const updated = prev.map((gen) => {
          if (gen.jobId === jobId) {
            return { ...gen, lastStatus: status };
          }
          return gen;
        });
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Clear all generations
  const clearAll = useCallback(() => {
    setOngoingGenerations([]);
    saveToStorage([]);
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    isPollingRef.current = false;
  }, [saveToStorage]);

  // Initialize on mount
  useEffect(() => {
    const loaded = loadFromStorage();
    if (loaded.length > 0) {
      pollAllStatuses(loaded);
    }

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [loadFromStorage, pollAllStatuses]);

  // Get progress percentage for display
  const getProgress = useCallback((generation: OngoingGeneration): number => {
    const status = generation.lastStatus?.status;
    if (!status) return 0;

    switch (status) {
      case "pending":
        return 5;
      case "queued":
        return 10;
      case "processing": {
        // Calculate progress based on processing steps
        const progress = generation.lastStatus?.progress;
        if (progress) {
          // Try to extract percentage from progress text first
          const percentMatch = progress.match(/(\d+)%/);
          if (percentMatch) {
            return Math.min(95, Math.max(15, parseInt(percentMatch[1])));
          }

          // Calculate progress based on current step (11 total steps)
          const progressLower = progress.toLowerCase();
          let stepProgress = 15; // Base progress for processing

          // Map each step to progress percentage (15% to 95%)
          if (
            progressLower.includes("generating audio") ||
            progressLower.includes("processing audio generation")
          ) {
            stepProgress = 20; // Step 1/11
          } else if (
            progressLower.includes("✅ audio generated for") ||
            progressLower.includes("audio generated for") ||
            progressLower.includes("audio generated successfully")
          ) {
            stepProgress = 25; // Step 1.5/11 - Audio generation completed, moving to video
          } else if (
            progressLower.includes("processing video") ||
            progressLower.includes("concatenating")
          ) {
            stepProgress = 30; // Step 2/11
          } else if (
            progressLower.includes("adding background music") ||
            progressLower.includes("background music")
          ) {
            stepProgress = 40; // Step 3/11
          } else if (
            (progressLower.includes("uploading") &&
              progressLower.includes("lipsync")) ||
            progressLower.includes("uploading audio for lipsync") ||
            progressLower.includes("uploading video for lipsync") ||
            progressLower.includes("uploading for lipsync") ||
            progressLower.includes("upload for lipsync") ||
            progressLower.includes("uploading video and audio for lipsync")
          ) {
            stepProgress = 50; // Step 4/11
          } else if (
            progressLower.includes("lipsync processing") ||
            progressLower.includes("processing lipsync") ||
            progressLower.includes("starting lipsync")
          ) {
            stepProgress = 60; // Step 5/11
          } else if (
            progressLower.includes("downloading result") ||
            progressLower.includes("lipsync processing completed") ||
            progressLower.includes("downloading lipsync result")
          ) {
            stepProgress = 70; // Step 6/11
          } else if (
            progressLower.includes("finalizing") ||
            progressLower.includes("video finalized")
          ) {
            stepProgress = 75; // Step 7/11
          } else if (
            progressLower.includes("adding outro") ||
            progressLower.includes("outro added")
          ) {
            stepProgress = 80; // Step 8/11
          } else if (
            progressLower.includes("saving locally") ||
            progressLower.includes("video saved locally")
          ) {
            stepProgress = 85; // Step 9/11
          } else if (
            progressLower.includes("uploading to s3") ||
            progressLower.includes("upload progress") ||
            progressLower.includes("uploading final video")
          ) {
            stepProgress = 90; // Step 10/11
          }

          return Math.min(95, stepProgress);
        }
        return 15; // Base processing progress
      }
      case "completed":
        return 100;
      case "failed":
        return 0;
      default:
        return 0;
    }
  }, []);

  // Get status color for display
  const getStatusColor = useCallback((status?: string): string => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "queued":
        return "text-yellow-400";
      case "processing":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  }, []);

  return {
    ongoingGenerations,
    addGeneration,
    removeGeneration,
    updateGeneration,
    clearAll,
    getProgress,
    getStatusColor,
    pollAllStatuses: () => pollAllStatuses(ongoingGenerations),
  };
};
