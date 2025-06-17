import { useState, useRef, useCallback } from "react";
import { api } from "@/trpc/react";
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

interface VideoConfig {
  mode: "single" | "host_guest_host";
  duration: 30 | 60;
  selectedHost: string;
  selectedGuest?: string;
}

export const useVideoGeneration = (
  config: VideoConfig | null,
  onSuccess?: (jobId: string) => void
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [hasRefunded, setHasRefunded] = useState(false);
  const [pollingStartTime, setPollingStartTime] = useState<number | null>(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const consecutiveErrorsRef = useRef(0);

  // tRPC utils for invalidating queries
  const utils = api.useUtils();

  // refund mutation
  const refundCreditsMutation = api.users.refundCredits.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Credits Refunded",
          description: `${data.refundAmount} credits have been refunded to your account.`,
        });
        // invalidate credit queries to refresh the balance
        utils.users.checkCredits.invalidate();
        utils.users.getCreditBalance.invalidate();
      } else {
        console.log("Refund already processed:", data.error);
      }
    },
    onError: (error) => {
      console.error("Error refunding credits:", error);
      toast({
        title: "Refund Failed",
        description: "Failed to refund credits. Please contact support.",
        variant: "destructive",
      });
    },
  });

  // centralized failure handling with automatic refunds
  const handleJobFailure = useCallback(
    async (jobId: string, errorMessage: string) => {
      // automatically refund credits for failed jobs
      if (!hasRefunded && config) {
        setHasRefunded(true);

        // For network errors, try the cleanup API as a fallback
        if (errorMessage.includes("Connection failed")) {
          try {
            const response = await fetch("/api/cleanup-stale-jobs", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                jobId: jobId,
                duration: config.duration,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                toast({
                  title: "Credits Refunded",
                  description: `${result.refundAmount} credits have been refunded due to connection issues.`,
                });
                // invalidate credit queries to refresh the balance
                await utils.users.checkCredits.invalidate();
                await utils.users.getCreditBalance.invalidate();
              } else {
                console.log("Cleanup API couldn't refund:", result.error);
                // Fall back to the original tRPC mutation
                refundCreditsMutation.mutate({
                  jobId: jobId,
                  duration: config.duration,
                  reason: errorMessage,
                });
              }
            } else {
              // Fall back to the original tRPC mutation
              refundCreditsMutation.mutate({
                jobId: jobId,
                duration: config.duration,
                reason: errorMessage,
              });
            }
          } catch (cleanupError) {
            console.error("Cleanup API failed, using fallback:", cleanupError);
            // Fall back to the original tRPC mutation
            refundCreditsMutation.mutate({
              jobId: jobId,
              duration: config.duration,
              reason: errorMessage,
            });
          }
        } else {
          // For non-network errors, use the original tRPC mutation
          refundCreditsMutation.mutate({
            jobId: jobId,
            duration: config.duration,
            reason: errorMessage,
          });
        }
      }

      toast({
        title: "Video Generation Failed",
        description:
          errorMessage + " You can modify your script and try again.",
        variant: "destructive",
      });

      // Reset UI back to script input
      setIsGenerating(false);
      setJobStatus(null);
      setCurrentJobId(null);
      setPollingStartTime(null);
      setConsecutiveErrors(0);
      consecutiveErrorsRef.current = 0;
    },
    [hasRefunded, config, refundCreditsMutation, utils]
  );

  // enhanced poll job status with timeout and network error handling
  const pollJobStatus = useCallback(
    async (jobId: string, retryCount: number = 0) => {
      try {
        const response = await fetch(`/api/status/${jobId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const status: JobStatus = await response.json();
        setJobStatus(status);
        setConsecutiveErrors(0); // reset error counter on success
        consecutiveErrorsRef.current = 0;

        // Check for timeout (15 minutes max)
        const now = Date.now();
        const maxDurationMs = 15 * 60 * 1000; // 15 minutes
        if (pollingStartTime && now - pollingStartTime > maxDurationMs) {
          console.warn(`Job ${jobId} timed out after 15 minutes`);
          handleJobFailure(jobId, "Job timed out after 15 minutes");
          return;
        }

        if (
          status.status === "pending" ||
          status.status === "queued" ||
          status.status === "processing"
        ) {
          setTimeout(() => pollJobStatus(jobId, 0), 1000);
        } else if (status.status === "failed") {
          handleJobFailure(jobId, status.error || "Video generation failed");
        } else if (status.status === "completed") {
          toast({
            title: "Video Generated Successfully!",
            description: "Your news video is ready to download.",
          });
          setIsGenerating(false);

          // Call the success callback if provided
          if (onSuccess) {
            onSuccess(jobId);
          }
        }
      } catch (err: any) {
        console.error("Error polling job status:", err);
        const newConsecutiveErrors = consecutiveErrorsRef.current + 1;
        console.log(
          `Setting consecutive errors to: ${newConsecutiveErrors} (was ${consecutiveErrorsRef.current})`
        );

        setConsecutiveErrors(newConsecutiveErrors);
        consecutiveErrorsRef.current = newConsecutiveErrors;

        // If we've had too many consecutive errors (5+ failures), consider the job failed
        if (newConsecutiveErrors >= 5) {
          console.warn(
            `Job ${jobId} failed after ${newConsecutiveErrors} consecutive network errors`
          );
          handleJobFailure(
            jobId,
            `Connection failed after multiple attempts: ${err.message}`
          );
          return;
        }

        // Exponential backoff for retries
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // max 10 seconds
        console.log(
          `Retrying in ${backoffDelay}ms (attempt ${
            retryCount + 1
          }), consecutive errors: ${newConsecutiveErrors}`
        );

        setTimeout(() => pollJobStatus(jobId, retryCount + 1), backoffDelay);
      }
    },
    [pollingStartTime, handleJobFailure, onSuccess]
  );

  // start video generation
  const startGeneration = useCallback(
    async (requestBody: any) => {
      if (!config) return { success: false, error: "No configuration found" };

      setIsGenerating(true);
      setJobStatus(null);
      setHasRefunded(false);
      setPollingStartTime(Date.now());
      setConsecutiveErrors(0);
      consecutiveErrorsRef.current = 0;
      setCurrentJobId(null);

      try {
        const response = await fetch(`/api/generate-video`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const result = await response.json();

        // invalidate credit queries immediately to reflect the deducted credits
        await utils.users.checkCredits.invalidate();
        await utils.users.getCreditBalance.invalidate();

        // start polling for status
        setCurrentJobId(result.jobId);
        pollJobStatus(result.jobId);

        return { success: true, jobId: result.jobId };
      } catch (err: any) {
        console.error("Error generating video:", err);
        toast({
          title: "Failed to Start Generation",
          description: `Failed to start video generation: ${err.message}`,
          variant: "destructive",
        });
        setIsGenerating(false);
        return { success: false, error: err.message };
      }
    },
    [config, pollJobStatus, utils]
  );

  // reset generation state
  const resetGeneration = useCallback(() => {
    setIsGenerating(false);
    setJobStatus(null);
    setHasRefunded(false);
    setPollingStartTime(null);
    setConsecutiveErrors(0);
    consecutiveErrorsRef.current = 0;
    setCurrentJobId(null);
  }, []);

  return {
    // State
    isGenerating,
    jobStatus,
    hasRefunded,
    consecutiveErrors,
    currentJobId,
    pollingStartTime,

    // Actions
    startGeneration,
    resetGeneration,
    handleJobFailure,

    // Utils
    utils,
  };
};
