import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useGlobalVideoProgressContext } from "@/components/providers/GlobalVideoProgressProvider";

interface PendingJob {
  jobId: string;
  title: string;
  startedAt: string;
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

export const usePendingJobsCheck = () => {
  const { addGeneration } = useGlobalVideoProgressContext();

  useEffect(() => {
    const checkPendingJobs = async () => {
      try {
        const pendingJobs: PendingJob[] = JSON.parse(
          localStorage.getItem("pendingJobs") || "[]"
        );

        if (pendingJobs.length === 0) return;

        console.log(
          `🔍 Checking ${pendingJobs.length} pending jobs on startup...`
        );

        const stillPendingJobs: PendingJob[] = [];

        for (const job of pendingJobs) {
          try {
            // Check job status
            const response = await fetch(`/api/status/${job.jobId}`);

            if (response.ok) {
              const status = await response.json();

              if (status.status === "completed") {
                // job completed
                console.log(
                  `✅ Job ${job.jobId} completed while user was away`
                );

                // Clean up job config since it's completed
                removeJobConfig(job.jobId);
              } else if (status.status === "failed") {
                // job failed
                console.log(`❌ Job ${job.jobId} failed while user was away`);

                // Clean up job config since it failed
                removeJobConfig(job.jobId);
              } else {
                // Job still processing - add to global tracker and keep in localStorage
                addGeneration(job.jobId, job.title);
                stillPendingJobs.push(job);

                console.log(
                  `⏳ Job ${job.jobId} still processing - added to global tracker`
                );
              }
            } else {
              // Can't get status - assume still pending and add to tracker
              addGeneration(job.jobId, job.title);
              stillPendingJobs.push(job);
              console.warn(
                `⚠️ Could not get status for job ${job.jobId} - assuming still pending`
              );
            }
          } catch (error) {
            // Error checking job - assume still pending and add to tracker
            addGeneration(job.jobId, job.title);
            stillPendingJobs.push(job);
            console.error(`❌ Error checking job ${job.jobId}:`, error);
          }

          // Small delay between checks
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Update localStorage with only still-pending jobs
        localStorage.setItem("pendingJobs", JSON.stringify(stillPendingJobs));

        // Clean up sessionStorage if no more pending jobs
        if (stillPendingJobs.length === 0) {
          sessionStorage.removeItem("shownCompletions");
        }

        if (stillPendingJobs.length > 0) {
          console.log(
            `📋 ${stillPendingJobs.length} jobs still pending - global polling will take over`
          );
        }
      } catch (error) {
        console.error("❌ Error checking pending jobs:", error);
      }
    };

    // Check pending jobs on mount
    checkPendingJobs();
  }, [addGeneration]);
};
