import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useGlobalVideoProgressContext } from "@/components/providers/GlobalVideoProgressProvider";

interface PendingJob {
  jobId: string;
  title: string;
  startedAt: string;
}

export const usePendingJobsCheck = () => {
  const { addGeneration } = useGlobalVideoProgressContext();

  useEffect(() => {
    const checkPendingJobs = async () => {
      try {
        const pendingJobs: PendingJob[] = JSON.parse(
          localStorage.getItem("pendingJobs") || "[]"
        );

        if (pendingJobs.length === 0) return;

        console.log(`🔍 Checking ${pendingJobs.length} pending jobs...`);

        const stillPendingJobs: PendingJob[] = [];

        for (const job of pendingJobs) {
          try {
            // Check job status
            const response = await fetch(`/api/status/${job.jobId}`);

            if (response.ok) {
              const status = await response.json();

              if (status.status === "completed") {
                // Job completed - show notification only if not already shown
                const shownCompletions = JSON.parse(
                  sessionStorage.getItem("shownCompletions") || "[]"
                );
                if (!shownCompletions.includes(job.jobId)) {
                  toast({
                    title: "Video Generation Complete! 🎉",
                    description: `"${job.title}" has finished generating. Check your Projects page to view it.`,
                  });

                  // Mark this job as having shown a completion toast
                  shownCompletions.push(job.jobId);
                  sessionStorage.setItem(
                    "shownCompletions",
                    JSON.stringify(shownCompletions)
                  );
                }

                console.log(
                  `✅ Job ${job.jobId} completed while user was away`
                );
              } else if (status.status === "failed") {
                // Job failed - show notification
                toast({
                  title: "Video Generation Failed",
                  description: `"${job.title}" failed to generate. You may retry from the script page.`,
                  variant: "destructive",
                });

                console.log(`❌ Job ${job.jobId} failed while user was away`);
              } else {
                // Job still processing - add to queue and keep in localStorage
                addGeneration(job.jobId, job.title);
                stillPendingJobs.push(job);

                console.log(
                  `⏳ Job ${job.jobId} still processing - added to queue`
                );
              }
            } else {
              // Can't get status - assume still pending
              stillPendingJobs.push(job);
              console.warn(`⚠️ Could not get status for job ${job.jobId}`);
            }
          } catch (error) {
            // Error checking job - assume still pending
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
          console.log(`📋 ${stillPendingJobs.length} jobs still pending`);
        }
      } catch (error) {
        console.error("❌ Error checking pending jobs:", error);
      }
    };

    // Check pending jobs on mount
    checkPendingJobs();
  }, [addGeneration]);
};
