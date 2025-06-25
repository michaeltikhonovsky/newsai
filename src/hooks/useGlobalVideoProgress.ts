import { useState, useEffect, useCallback, useRef } from "react";

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

const STORAGE_KEY = "ongoing_generations";
const POLL_INTERVAL = 3000; // 3 seconds

export const useGlobalVideoProgress = () => {
  const [ongoingGenerations, setOngoingGenerations] = useState<
    OngoingGeneration[]
  >([]);
  const [isVisible, setIsVisible] = useState(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Load ongoing generations from localStorage
  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const generations = JSON.parse(stored) as OngoingGeneration[];
        // Filter out generations older than 2 hours (cleanup)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const active = generations.filter(
          (gen) => new Date(gen.startedAt) > twoHoursAgo
        );
        setOngoingGenerations(active);
        return active;
      }
    } catch (error) {
      console.error("Error loading ongoing generations:", error);
    }
    return [];
  }, []);

  // Save to localStorage
  const saveToStorage = useCallback((generations: OngoingGeneration[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(generations));
    } catch (error) {
      console.error("Error saving ongoing generations:", error);
    }
  }, []);

  // Poll status for all ongoing generations
  const pollAllStatuses = useCallback(
    async (generations: OngoingGeneration[]) => {
      if (isPollingRef.current || generations.length === 0) return;

      isPollingRef.current = true;

      try {
        const statusPromises = generations.map(async (gen) => {
          try {
            const response = await fetch(`/api/status/${gen.jobId}`, {
              headers: { "Cache-Control": "no-cache" },
            });
            if (response.ok) {
              const status: JobStatus = await response.json();
              return { ...gen, lastStatus: status };
            }
            return gen;
          } catch (error) {
            console.error(`Error polling status for ${gen.jobId}:`, error);
            return gen;
          }
        });

        const updatedGenerations = await Promise.all(statusPromises);

        // Remove completed or failed generations
        const stillActive = updatedGenerations.filter((gen) => {
          const status = gen.lastStatus?.status;
          return status !== "completed" && status !== "failed";
        });

        setOngoingGenerations(stillActive);
        saveToStorage(stillActive);

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

      // Force visibility immediately after state update
      setTimeout(() => setIsVisible(true), 0);
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

  // Update visibility based on active generations
  useEffect(() => {
    setIsVisible(ongoingGenerations.length > 0);
  }, [ongoingGenerations]);

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
            (progressLower.includes("completed") &&
              progressLower.includes("uploading") &&
              progressLower.includes("lipsync"))
          ) {
            stepProgress = 50; // Step 4/11 - Upload phase (including completed uploads)
          } else if (
            (progressLower.includes("lipsync processing in progress") ||
              progressLower.includes("starting lipsync processing")) &&
            !progressLower.includes("uploading") &&
            !progressLower.includes("completed")
          ) {
            stepProgress = 60; // Step 5/11 - Only actual lipsync processing
          } else if (
            progressLower.includes("lipsync processing completed") ||
            progressLower.includes("downloading result")
          ) {
            stepProgress = 70; // Step 6/11
          } else if (
            progressLower.includes("finalizing video") ||
            progressLower.includes("video finalized")
          ) {
            stepProgress = 80; // Step 7/11
          } else if (
            progressLower.includes("adding outro") ||
            progressLower.includes("outro added")
          ) {
            stepProgress = 85; // Step 8/11
          } else if (
            progressLower.includes("video saved locally") ||
            progressLower.includes("saved locally")
          ) {
            stepProgress = 90; // Step 9/11
          } else if (
            progressLower.includes("uploading final video to s3") ||
            progressLower.includes("upload progress")
          ) {
            stepProgress = 95; // Step 10/11
          } else if (
            progressLower.includes("video processing completed") ||
            progressLower.includes("processing completed successfully")
          ) {
            stepProgress = 100; // Step 11/11
          }

          return stepProgress;
        }
        return 15; // Default processing progress if no specific step detected
      }
      case "completed":
        return 100;
      case "failed":
        return 100;
      default:
        return 0;
    }
  }, []);

  return {
    ongoingGenerations,
    isVisible,
    addGeneration,
    removeGeneration,
    updateGeneration,
    clearAll,
    getProgress,
  };
};
