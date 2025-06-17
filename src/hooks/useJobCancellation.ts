import { useCallback } from "react";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/use-toast";

interface VideoConfig {
  mode: "single" | "host_guest_host";
  duration: 30 | 60;
  selectedHost: string;
  selectedGuest?: string;
}

interface UseJobCancellationProps {
  config: VideoConfig | null;
  currentJobId: string | null;
  hasRefunded: boolean;
  onCancel: () => void; // Callback to reset generation state
}

export const useJobCancellation = ({
  config,
  currentJobId,
  hasRefunded,
  onCancel,
}: UseJobCancellationProps) => {
  const utils = api.useUtils();

  // refund mutation for fallback
  const refundCreditsMutation = api.users.refundCredits.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Credits Refunded",
          description: `${data.refundAmount} credits have been refunded to your account.`,
        });
        utils.users.checkCredits.invalidate();
        utils.users.getCreditBalance.invalidate();
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

  // cancel current job and refund credits
  const cancelCurrentJob = useCallback(async () => {
    if (!currentJobId || !config) return;

    console.log(`User manually cancelling job ${currentJobId}`);

    // Trigger refund for cancelled job
    if (!hasRefunded) {
      try {
        const response = await fetch("/api/cleanup-stale-jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: currentJobId,
            duration: config.duration,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            toast({
              title: "Job Cancelled & Credits Refunded",
              description: `${result.refundAmount} credits have been refunded. You can try again.`,
            });
            // invalidate credit queries to refresh the balance
            await utils.users.checkCredits.invalidate();
            await utils.users.getCreditBalance.invalidate();
          } else {
            console.log("Cleanup API couldn't refund:", result.error);
            // Fall back to the original tRPC mutation
            refundCreditsMutation.mutate({
              jobId: currentJobId,
              duration: config.duration,
              reason: "User cancelled job due to connection issues",
            });
          }
        } else {
          // Fall back to the original tRPC mutation
          refundCreditsMutation.mutate({
            jobId: currentJobId,
            duration: config.duration,
            reason: "User cancelled job due to connection issues",
          });
        }
      } catch (error) {
        console.error("Error cancelling job:", error);
        // Fall back to the original tRPC mutation
        refundCreditsMutation.mutate({
          jobId: currentJobId,
          duration: config.duration,
          reason: "User cancelled job due to connection issues",
        });
      }
    }

    // Call the callback to reset generation state
    onCancel();
  }, [
    currentJobId,
    config,
    hasRefunded,
    refundCreditsMutation,
    utils,
    onCancel,
  ]);

  return {
    cancelCurrentJob,
    isRefunding: refundCreditsMutation.isPending,
  };
};
