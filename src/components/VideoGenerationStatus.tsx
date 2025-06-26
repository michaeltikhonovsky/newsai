"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Settings,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  Home,
  AlertCircle,
  X,
} from "lucide-react";
import { useJobCancellation } from "@/hooks/useJobCancellation";

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

interface ProcessingStep {
  label: string;
  completed: boolean;
  current: boolean;
}

interface VideoGenerationStatusProps {
  jobStatus: JobStatus | null;
  config: VideoConfig | null;
  hasRefunded: boolean;
  consecutiveErrors: number;
  currentJobId: string | null;
  isGenerating: boolean;
  s3Url?: string | null;
  onBack: () => void;
  onDownload: () => void;
  onReset: () => void;
  getHostName: (hostId: string) => string;
  getGuestName: (guestId: string) => string;
  getProcessingSteps: (
    currentProgress?: string,
    config?: VideoConfig
  ) => ProcessingStep[];
  isVideoGenerationComplete: () => boolean;
}

export const VideoGenerationStatus = ({
  jobStatus,
  config,
  hasRefunded,
  consecutiveErrors,
  currentJobId,
  isGenerating,
  s3Url,
  onBack,
  onDownload,
  onReset,
  getHostName,
  getGuestName,
  getProcessingSteps,
  isVideoGenerationComplete,
}: VideoGenerationStatusProps) => {
  const [connectionWarningDismissed, setConnectionWarningDismissed] =
    useState(false);

  const { cancelCurrentJob } = useJobCancellation({
    config,
    currentJobId,
    hasRefunded,
    onCancel: onReset,
  });

  // Reset dismissed state if errors clear up
  useEffect(() => {
    if (consecutiveErrors === 0) {
      setConnectionWarningDismissed(false);
    }
  }, [consecutiveErrors]);

  // Show video preview when fully complete
  if (isVideoGenerationComplete()) {
    return (
      <Card className="bg-gray-900/60 border border-gray-700">
        <CardHeader>
          <CardTitle className="font-mono text-gray-200 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Video Ready!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg">
            <div className="text-center space-y-4">
              <div className="bg-black rounded-lg aspect-video border border-gray-700 overflow-hidden">
                <video
                  controls
                  className="w-full h-full object-cover"
                  preload="auto"
                  onError={(e) => {
                    console.error("Video failed to load:", e);
                    // Try to reload the video source
                    const video = e.target as HTMLVideoElement;
                    if (video.src && !video.dataset.retried) {
                      video.dataset.retried = "true";
                      setTimeout(() => {
                        video.load();
                      }, 1000);
                    }
                  }}
                  onLoadStart={() => {
                    // Reset retry flag when starting to load
                    const video = document.querySelector(
                      "video"
                    ) as HTMLVideoElement;
                    if (video) {
                      delete video.dataset.retried;
                    }
                  }}
                >
                  {/* use direct S3 url if available & fallback to api proxy if not */}
                  <source
                    src={s3Url || `/api/video/${jobStatus?.jobId}`}
                    type="video/mp4"
                  />
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <Download className="w-16 h-16 text-gray-400 mx-auto" />
                      <p className="text-gray-400 font-mono">
                        Video preview unavailable
                      </p>
                      <p className="text-sm text-gray-500">
                        Your video is ready to download
                      </p>
                    </div>
                  </div>
                </video>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3">
              <Button
                variant="outline"
                onClick={onBack}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 flex-1 w-full sm:w-auto"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>

              <Button
                className="btn-primary px-6 py-3 flex-1 w-full sm:w-auto"
                onClick={onDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show generation progress/status
  return (
    <Card className="bg-gray-900/60 border border-gray-700">
      <CardHeader>
        <CardTitle className="font-mono text-gray-200 flex items-center gap-3">
          {jobStatus?.status === "completed" ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : jobStatus?.status === "failed" ? (
            <XCircle className="w-5 h-5 text-red-400" />
          ) : jobStatus?.status === "queued" ? (
            <Clock className="w-5 h-5 text-yellow-400" />
          ) : (
            ""
          )}
          {jobStatus?.status === "completed"
            ? "Video Generation Complete"
            : jobStatus?.status === "failed"
            ? "Video Generation Failed"
            : jobStatus?.status === "queued"
            ? `In Queue${
                jobStatus.queuePosition
                  ? ` - Position #${jobStatus.queuePosition}`
                  : ""
              }`
            : "Generating Video"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {jobStatus ? (
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {jobStatus.status === "pending" && (
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
                  )}
                  {jobStatus.status === "queued" && (
                    <Clock className="w-6 h-6 text-yellow-400" />
                  )}
                  {jobStatus.status === "processing" && (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  )}
                  {jobStatus.status === "completed" && (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                  {jobStatus.status === "failed" && (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200 capitalize">
                      {jobStatus.status}
                      {jobStatus.status === "queued" &&
                        jobStatus.queuePosition && (
                          <span className="ml-2 text-yellow-400 font-normal">
                            - Position #{jobStatus.queuePosition}
                          </span>
                        )}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Job ID: {jobStatus.jobId}
                    </p>
                  </div>
                </div>
                <div className="hidden md:block text-right text-sm text-gray-400">
                  <p>
                    Started: {new Date(jobStatus.createdAt).toLocaleString()}
                  </p>
                  <p>
                    Updated: {new Date(jobStatus.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Current Progress */}
              {(jobStatus.progress || jobStatus.status === "queued") && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {jobStatus.status === "processing" && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      )}
                      {jobStatus.status === "pending" && (
                        <Clock className="w-4 h-4 text-yellow-400" />
                      )}
                      {jobStatus.status === "queued" && (
                        <Clock className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-mono text-gray-200 font-medium mb-2">
                        {jobStatus.status === "queued"
                          ? "Queue Status:"
                          : "Current Progress:"}
                      </h4>
                      {jobStatus.status === "queued" ? (
                        <div className="space-y-2">
                          <p className="text-gray-300 break-words">
                            {jobStatus.progress ||
                              "Waiting in queue for processing..."}
                          </p>
                          {jobStatus.queuePosition && (
                            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-200 font-medium">
                                  Queue Position: #{jobStatus.queuePosition}
                                </span>
                              </div>
                              <p className="text-xs text-yellow-300 mt-1">
                                Your video will start processing when it reaches
                                the front of the queue.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-300 break-words mb-3">
                          {jobStatus.progress}
                        </p>
                      )}

                      {/* Character context */}
                      {config && (
                        <div className="flex gap-2 flex-wrap">
                          {config.mode === "single" ? (
                            <span className="text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full text-sm">
                              {getHostName(config.selectedHost)}
                            </span>
                          ) : (
                            <>
                              <span className="text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full text-sm">
                                Host: {getHostName(config.selectedHost)}
                              </span>
                              {config.selectedGuest && (
                                <span className="text-green-300 bg-green-500/20 px-3 py-1 rounded-full text-sm">
                                  Guest: {getGuestName(config.selectedGuest)}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error display */}
              {jobStatus.status === "failed" && jobStatus.error && (
                <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-mono text-red-300 font-medium mb-2">
                        Error Details:
                      </h4>
                      <p className="text-red-200 break-words mb-3">
                        {jobStatus.error}
                      </p>
                      {hasRefunded && (
                        <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-300 text-sm font-medium">
                              Credits Automatically Refunded
                            </span>
                          </div>
                          <p className="text-green-200 text-xs mt-1">
                            {config?.duration === 30 ? "10" : "20"} credits have
                            been returned to your account.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Connection status warning - only show for significant issues */}
            {consecutiveErrors >= 3 &&
              consecutiveErrors < 5 &&
              !connectionWarningDismissed && (
                <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-mono text-yellow-300 font-medium mb-2">
                          {consecutiveErrors === 3
                            ? "Network Hiccup"
                            : "Connection Issues"}
                        </h4>
                        <p className="text-yellow-200 text-sm mb-3">
                          {consecutiveErrors === 3
                            ? "Temporary network delay detected. Don't worry - your video is still processing normally."
                            : `Having trouble connecting to the server (${consecutiveErrors}/5 failures). Your video continues processing - this only affects status updates.`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelCurrentJob}
                        className="border-yellow-400/50 text-yellow-300 hover:bg-yellow-500/20 flex-shrink-0"
                      >
                        Cancel & Refund
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConnectionWarningDismissed(true)}
                        className="text-yellow-400 hover:bg-yellow-500/20 p-1 h-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            {/* Processing steps */}
            {(jobStatus.status === "queued" ||
              jobStatus.status === "processing" ||
              jobStatus.status === "completed") && (
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                <h4 className="font-mono text-gray-200 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Processing Pipeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getProcessingSteps(
                    jobStatus.progress,
                    config || undefined
                  ).map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                        step.completed
                          ? "bg-green-500/20 border border-green-400/30 text-green-300"
                          : step.current
                          ? "bg-blue-500/20 border border-blue-400/30 text-blue-300"
                          : "bg-gray-700/50 border border-gray-600 text-gray-500"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      ) : step.current ? (
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0" />
                      )}
                      <span className="font-mono text-sm font-medium">
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-6 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    onReset();
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  disabled={isGenerating && jobStatus?.status === "processing"}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {jobStatus?.status === "completed"
                    ? "Create New Video"
                    : "Back to Script"}
                </Button>

                {jobStatus?.status === "completed" && (
                  <Button
                    className="btn-primary px-8 py-3"
                    onClick={onDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Video
                  </Button>
                )}

                {jobStatus?.status === "failed" && (
                  <Button
                    className="btn-primary px-8 py-3"
                    onClick={onReset}
                    disabled={isGenerating}
                  >
                    <Loader2
                      className={`w-4 h-4 mr-2 ${
                        isGenerating ? "animate-spin" : ""
                      }`}
                    />
                    Retry Generation
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Initial loading state when generation just started */
          <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200">
                      Starting Generation
                    </h3>
                    <p className="text-sm text-gray-400">
                      Initializing video generation process...
                    </p>
                  </div>
                </div>
              </div>

              {/* Character context */}
              {config && (
                <div className="flex gap-2 flex-wrap">
                  {config.mode === "single" ? (
                    <span className="text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full text-sm">
                      {getHostName(config.selectedHost)}
                    </span>
                  ) : (
                    <>
                      <span className="text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full text-sm">
                        Host: {getHostName(config.selectedHost)}
                      </span>
                      {config.selectedGuest && (
                        <span className="text-green-300 bg-green-500/20 px-3 py-1 rounded-full text-sm">
                          Guest: {getGuestName(config.selectedGuest)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Initial processing steps */}
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
              <h4 className="font-mono text-gray-200 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Processing Pipeline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getProcessingSteps(undefined, config || undefined).map(
                  (step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-500"
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0" />
                      <span className="font-mono text-sm font-medium">
                        {step.label}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
