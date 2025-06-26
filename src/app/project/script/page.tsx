"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { useVideoGeneration } from "@/hooks/useVideoGeneration";
import { VideoGenerationStatus } from "@/components/VideoGenerationStatus";
import { ScriptInputForm } from "@/components/ScriptInputForm";
import type {
  VideoConfig,
  Scripts,
  ScriptField,
  ProcessingStep,
  GenerateVideoRequest,
} from "@/types/video";
import { hosts, guests, getHostName, getGuestName } from "@/lib/characters";
import {
  ArrowLeft,
  Settings,
  Clock,
  User,
  Users,
  Coins,
  Music,
} from "lucide-react";

const CHARACTER_LIMITS = {
  30: 550,
  60: 1100,
};

const getProcessingSteps = (
  currentProgress?: string,
  config?: VideoConfig,
  previousStepIndex?: number
): ProcessingStep[] => {
  // Base steps that apply to both modes
  let steps = [
    { key: "audio", label: "Generate Audio" },
    { key: "video", label: "Process Video Footage" },
    { key: "music", label: "Add Background Music" },
    { key: "upload", label: "Upload for Lipsync" },
    { key: "lipsync", label: "Lipsync Processing" },
    { key: "lipsync_download", label: "Download Lipsync Result" },
    { key: "finalize", label: "Finalize Video" },
    { key: "outro", label: "Add Outro" },
    { key: "save_local", label: "Save Video Locally" },
    { key: "upload_s3", label: "Upload to Cloud" },
    { key: "complete", label: "Processing Complete" },
  ];

  // For multi-character mode, use single audio step
  if (config?.mode === "host_guest_host") {
    steps = [
      { key: "audio", label: "Generate Audio" },
      { key: "concatenate", label: "Concatenate Video Segments" },
      { key: "music", label: "Add Background Music" },
      { key: "upload", label: "Upload for Lipsync" },
      { key: "lipsync", label: "Lipsync Processing" },
      { key: "lipsync_download", label: "Download Lipsync Result" },
      { key: "finalize", label: "Finalize Video" },
      { key: "outro", label: "Add Outro" },
      { key: "save_local", label: "Save Video Locally" },
      { key: "upload_s3", label: "Upload to Cloud" },
      { key: "complete", label: "Processing Complete" },
    ];
  }

  if (!currentProgress) {
    return steps.map((step) => ({ ...step, completed: false, current: false }));
  }

  const progress = currentProgress.toLowerCase();

  // Determine current step based on progress text
  let currentStepIndex = -1;

  // Check for specific progress indicators to determine current step
  // Order matters - check more specific patterns first to avoid false matches

  // Completion check first (most specific)
  if (
    progress.includes("video processing completed successfully") ||
    progress.includes("processing completed successfully") ||
    (progress.includes("completed successfully") &&
      !progress.includes("outro") &&
      !progress.includes("finalized"))
  ) {
    currentStepIndex = 10; // complete
  }
  // Final S3 upload (very specific to avoid confusion with early uploads)
  else if (
    progress.includes("uploading final video to s3") ||
    (progress.includes("upload progress") && !progress.includes("lipsync")) ||
    progress.includes("uploading final video to s3 completed")
  ) {
    currentStepIndex = 9; // upload_s3
  }
  // Local save
  else if (
    progress.includes("video saved locally") ||
    progress.includes("saved locally")
  ) {
    currentStepIndex = 8; // save_local
  }
  // Outro processing
  else if (
    progress.includes("adding outro") ||
    progress.includes("outro added")
  ) {
    currentStepIndex = 7; // outro
  }
  // Video finalization
  else if (
    progress.includes("finalizing video") ||
    progress.includes("video finalized")
  ) {
    currentStepIndex = 6; // finalize
  }
  // Lipsync download (check for completed first with more specific match)
  else if (
    progress.includes("lipsync processing completed, downloading result") ||
    progress.includes("downloading result") ||
    progress.includes("download lipsync result")
  ) {
    currentStepIndex = 5; // lipsync_download
  }
  // Lipsync processing (more specific check to avoid false matches)
  else if (
    progress.includes("lipsync processing in progress") ||
    progress.includes("starting lipsync processing") ||
    (progress.includes("lipsync") &&
      progress.includes("processing") &&
      !progress.includes("completed") &&
      !progress.includes("downloading"))
  ) {
    currentStepIndex = 4; // lipsync
  }
  // Early uploads (for lipsync processing - be very specific)
  else if (
    (progress.includes("uploading") && progress.includes("lipsync")) ||
    progress.includes("uploading video for lipsync") ||
    progress.includes("uploading audio for lipsync")
  ) {
    currentStepIndex = 3; // upload
  }
  // Background music
  else if (
    progress.includes("adding background music") ||
    progress.includes("background music")
  ) {
    currentStepIndex = 2; // music
  }
  // Concatenation (multi-character mode)
  else if (progress.includes("concatenating")) {
    currentStepIndex = 1; // concatenate
  }
  // Audio generation (simplified for both single audio steps and multi-character audio)
  else if (
    progress.includes("generating audio") ||
    progress.includes("processing audio generation") ||
    (progress.includes("generating audio for") &&
      (progress.includes("introduction") ||
        progress.includes("main segment") ||
        progress.includes("conclusion") ||
        progress.includes("host") ||
        progress.includes("guest")))
  ) {
    currentStepIndex = 0; // audio
  }

  // For single character mode, adjust step indices
  if (config?.mode === "single") {
    // Use the same reverse order logic for single mode
    if (
      progress.includes("video processing completed successfully") ||
      progress.includes("processing completed successfully") ||
      (progress.includes("completed successfully") &&
        !progress.includes("outro") &&
        !progress.includes("finalized"))
    ) {
      currentStepIndex = 10; // complete
    } else if (
      progress.includes("uploading final video to s3") ||
      (progress.includes("upload progress") && !progress.includes("lipsync")) ||
      progress.includes("uploading final video to s3 completed")
    ) {
      currentStepIndex = 9; // upload_s3
    } else if (
      progress.includes("video saved locally") ||
      progress.includes("saved locally")
    ) {
      currentStepIndex = 8; // save_local
    } else if (
      progress.includes("adding outro") ||
      progress.includes("outro added")
    ) {
      currentStepIndex = 7; // outro
    } else if (
      progress.includes("finalizing video") ||
      progress.includes("video finalized")
    ) {
      currentStepIndex = 6; // finalize
    } else if (
      progress.includes("lipsync processing completed, downloading result") ||
      progress.includes("downloading result") ||
      progress.includes("download lipsync result")
    ) {
      currentStepIndex = 5; // lipsync_download
    } else if (
      progress.includes("lipsync processing in progress") ||
      progress.includes("starting lipsync processing") ||
      (progress.includes("lipsync") &&
        progress.includes("processing") &&
        !progress.includes("completed") &&
        !progress.includes("downloading"))
    ) {
      currentStepIndex = 4; // lipsync
    } else if (
      (progress.includes("uploading") && progress.includes("lipsync")) ||
      progress.includes("uploading video for lipsync") ||
      progress.includes("uploading audio for lipsync")
    ) {
      currentStepIndex = 3; // upload
    } else if (
      progress.includes("adding background music") ||
      progress.includes("background music")
    ) {
      currentStepIndex = 2; // music
    } else if (progress.includes("processing video")) {
      currentStepIndex = 1; // video
    } else if (
      progress.includes("generating audio") ||
      progress.includes("processing audio generation")
    ) {
      currentStepIndex = 0; // audio
    }
  }

  // Check if generation is fully completed
  const isFullyCompleted =
    progress.includes("video processing completed successfully") ||
    progress.includes("completed successfully") ||
    progress.toLowerCase().includes("video generation completed");

  return steps.map((step, index) => {
    let completed = false;
    let current = false;

    if (isFullyCompleted) {
      // If video processing is fully completed, mark all steps as completed
      completed = true;
      current = false;
    } else if (currentStepIndex >= 0) {
      // Ensure we never go backward - use the higher of current or previous step
      const actualStepIndex =
        previousStepIndex !== undefined
          ? Math.max(currentStepIndex, previousStepIndex)
          : currentStepIndex;

      // If we found a current step, mark all previous steps as completed
      completed = index < actualStepIndex;
      current = index === actualStepIndex;
    } else {
      // Fallback to text-based detection for edge cases
      current =
        progress.includes(step.label.toLowerCase()) ||
        (step.key === "audio" &&
          (progress.includes("generating audio") ||
            progress.includes("processing audio generation") ||
            (progress.includes("generating audio for") &&
              (progress.includes("introduction") ||
                progress.includes("main segment") ||
                progress.includes("conclusion") ||
                progress.includes("host") ||
                progress.includes("guest"))))) ||
        (step.key === "lipsync" &&
          (progress.includes("lipsync processing in progress") ||
            progress.includes("starting lipsync processing") ||
            (progress.includes("lipsync") &&
              progress.includes("processing") &&
              !progress.includes("completed") &&
              !progress.includes("downloading")))) ||
        (step.key === "lipsync_download" &&
          (progress.includes("lipsync processing completed") ||
            progress.includes("downloading result") ||
            progress.includes("download lipsync result"))) ||
        (step.key === "finalize" &&
          (progress.includes("finalizing video") ||
            progress.includes("video finalized"))) ||
        (step.key === "outro" &&
          (progress.includes("adding outro") ||
            progress.includes("outro added"))) ||
        (step.key === "save_local" &&
          (progress.includes("video saved locally") ||
            progress.includes("saved locally"))) ||
        (step.key === "upload_s3" &&
          (progress.includes("uploading final video to s3") ||
            progress.includes("upload progress") ||
            progress.includes("uploading final video to s3 completed") ||
            (progress.includes("uploading") && progress.includes("s3")))) ||
        (step.key === "complete" &&
          (progress.includes("video processing completed successfully") ||
            progress.includes("processing completed successfully") ||
            progress.includes("completed successfully")));
    }

    return { ...step, completed, current };
  });
};

function ProjectScriptPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [scripts, setScripts] = useState<Scripts>({
    singleCharacterText: "",
    host1Text: "",
    guest1Text: "",
    host2Text: "",
  });
  const [lastStepIndex, setLastStepIndex] = useState<number>(-1);

  // Use the video generation hook
  const generation = useVideoGeneration(config, (jobId: string) => {
    // Save project to localStorage when completed
    saveCompletedProject(jobId);
  });

  const { data: completedVideos } = api.videos.getRecentVideos.useQuery(
    undefined,
    {
      enabled:
        generation.jobStatus?.status === "completed" &&
        !!generation.currentJobId,
      refetchInterval: false,
    }
  );

  const currentVideoS3Url = completedVideos?.find(
    (video) => video.jobId === generation.currentJobId
  )?.s3Url;

  // Credit checks
  const { data: creditCheck } = api.users.checkCredits.useQuery(
    { duration: config?.duration || 30 },
    { enabled: !!config }
  );

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem("videoConfig");
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      // Load any existing scripts
      setScripts({
        singleCharacterText: parsedConfig.singleCharacterText || "",
        host1Text: parsedConfig.host1Text || "",
        guest1Text: parsedConfig.guest1Text || "",
        host2Text: parsedConfig.host2Text || "",
      });
    } else {
      // Redirect back to config if no config found
      router.push("/project/config");
    }
  }, [router]);

  // Save completed project to localStorage
  const saveCompletedProject = (jobId: string) => {
    if (!config) return;

    try {
      const project = {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `News Video - ${new Date().toLocaleDateString()}`,
        mode: config.mode,
        selectedHost: config.selectedHost,
        selectedGuest: config.selectedGuest,
        duration: config.duration || 30,
        createdAt: new Date().toISOString(),
        jobId: jobId,
        singleCharacterText: scripts.singleCharacterText,
        host1Text: scripts.host1Text,
        guest1Text: scripts.guest1Text,
        host2Text: scripts.host2Text,
      };

      // Get existing projects
      const existingProjects = localStorage.getItem("completedProjects");
      const projects = existingProjects ? JSON.parse(existingProjects) : [];

      // Add new project
      projects.push(project);

      // Keep only the last 5 projects (newest first)
      const sortedProjects = projects.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const limitedProjects = sortedProjects.slice(0, 5);

      // Save back to localStorage
      localStorage.setItem(
        "completedProjects",
        JSON.stringify(limitedProjects)
      );

      console.log("Project saved to localStorage:", project);
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Warning",
        description:
          "Video generated successfully but failed to save to project library.",
        variant: "destructive",
      });
    }
  };

  // Download video
  const downloadVideo = async () => {
    if (!generation.jobStatus?.jobId) return;

    try {
      // Use direct S3 URL if available & fallback to API proxy
      const downloadUrl =
        currentVideoS3Url || `/api/video/${generation.jobStatus.jobId}`;

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `news-video-${generation.jobStatus.jobId}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Error downloading video:", err);
      toast({
        title: "Download Failed",
        description: `Failed to download video: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const handleScriptChange = (field: ScriptField, value: string) => {
    const limit = CHARACTER_LIMITS[config?.duration || 30];

    let fieldLimit = limit;
    if (config?.mode === "host_guest_host") {
      if (field === "host1Text" || field === "host2Text") {
        fieldLimit = Math.floor(limit * 0.3); // 30% each for host segments
      } else if (field === "guest1Text") {
        fieldLimit = Math.floor(limit * 0.4); // 40% for guest segment
      }
    }

    if (value.length <= fieldLimit) {
      setScripts((prev) => ({ ...prev, [field]: value }));
    }
  };

  const getCharacterCount = (field: ScriptField) => {
    return scripts[field].length;
  };

  const getCharacterLimit = (field: ScriptField) => {
    if (!config) return 0;

    const limit = CHARACTER_LIMITS[config.duration];
    if (config.mode === "single") {
      return limit;
    }

    // Host+guest mode limits
    if (field === "host1Text" || field === "host2Text") {
      return Math.floor(limit * 0.3); // 30% each for host segments
    } else if (field === "guest1Text") {
      return Math.floor(limit * 0.4); // 40% for guest segment
    }

    return limit;
  };

  const isOverLimit = (field: ScriptField) => {
    return getCharacterCount(field) > getCharacterLimit(field);
  };

  const canProceed = () => {
    if (!config) return false;

    // Check script requirements
    const scriptsValid =
      config.mode === "single"
        ? scripts.singleCharacterText.trim().length > 0 &&
          !isOverLimit("singleCharacterText")
        : scripts.host1Text.trim().length > 0 &&
          scripts.guest1Text.trim().length > 0 &&
          scripts.host2Text.trim().length > 0 &&
          !isOverLimit("host1Text") &&
          !isOverLimit("guest1Text") &&
          !isOverLimit("host2Text");

    // Check credit requirements
    const hasEnoughCredits = creditCheck?.hasEnoughCredits ?? false;

    return scriptsValid && hasEnoughCredits;
  };

  const isVideoGenerationComplete = (): boolean => {
    const result = !!(
      generation.jobStatus?.status === "completed" &&
      generation.jobStatus?.progress &&
      (generation.jobStatus.progress
        .toLowerCase()
        .includes("video processing completed successfully") ||
        generation.jobStatus.progress
          .toLowerCase()
          .includes("completed successfully") ||
        generation.jobStatus.progress
          .toLowerCase()
          .includes("video generation completed") ||
        generation.jobStatus.progress
          .toLowerCase()
          .includes("generation completed"))
    );

    console.log("isVideoGenerationComplete check:", {
      status: generation.jobStatus?.status,
      progress: generation.jobStatus?.progress,
      result: result,
    });

    return result;
  };

  // Wrapper for getProcessingSteps to handle type compatibility
  const getProcessingStepsWrapper = (
    currentProgress?: string | undefined,
    config?: any
  ): ProcessingStep[] => {
    return getProcessingSteps(currentProgress, config, lastStepIndex);
  };

  // Update the last step index when progress changes
  useEffect(() => {
    if (generation.jobStatus?.progress && config) {
      const steps = getProcessingSteps(
        generation.jobStatus.progress,
        config,
        lastStepIndex
      );
      const currentStep = steps.find((step) => step.current);
      if (currentStep) {
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > lastStepIndex) {
          setLastStepIndex(currentIndex);
        }
      }
    }
  }, [generation.jobStatus?.progress, config, lastStepIndex]);

  // Check if we're coming from the floating icon with a jobId to restore generation state
  useEffect(() => {
    const jobId = searchParams.get("jobId");
    const showStatus = searchParams.get("showStatus");

    if (
      jobId &&
      showStatus === "true" &&
      !generation.isGenerating &&
      !generation.jobStatus
    ) {
      // Use the restore functionality if available
      if (generation.restoreFromJobId) {
        generation.restoreFromJobId(jobId);
      }

      // Clear the query parameters to clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, generation]);

  const handleGenerate = async () => {
    if (!config) return;

    // Reset step tracking for new generation
    setLastStepIndex(-1);

    const requestBody: GenerateVideoRequest = {
      mode: config.mode,
      selectedHost: config.selectedHost,
      selectedGuest: config.selectedGuest,
      duration: config.duration,
      singleCharacterText:
        config.mode === "single" ? scripts.singleCharacterText : undefined,
      host1Text:
        config.mode === "host_guest_host" ? scripts.host1Text : undefined,
      guest1Text:
        config.mode === "host_guest_host" ? scripts.guest1Text : undefined,
      host2Text:
        config.mode === "host_guest_host" ? scripts.host2Text : undefined,
      enableMusic: config.enableMusic,
    };

    await generation.startGeneration(requestBody);
  };

  const handleContinue = () => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      ...scripts,
    };

    // Save updated config
    localStorage.setItem("videoConfig", JSON.stringify(updatedConfig));

    // Start video generation
    handleGenerate();
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-indigo-200 font-mono">
          Loading configuration...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <Navbar />
      <main className="flex-1">
        <div className="container-custom py-12">
          {/* Header */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white"
                disabled={generation.isGenerating}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="header-text">SCRIPT INPUT</h1>
            </div>
            <p className="text-lg text-gray-400">
              {">"} Write your news script within the character limits for your{" "}
              {config.duration}-second clip.
            </p>
          </motion.div>

          {/* Show centered layout when generating, grid layout otherwise */}
          {generation.isGenerating || generation.jobStatus ? (
            /* Centered layout for video generation */
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Background generation info */}
                {(generation.isGenerating ||
                  generation.jobStatus?.status === "pending" ||
                  generation.jobStatus?.status === "queued" ||
                  generation.jobStatus?.status === "processing") && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 text-center"
                  >
                    <p className="text-sm text-gray-400 bg-blue-500/10 border border-blue-400/30 rounded-lg px-4 py-3 mb-3">
                      💡 Generation will continue in the background. Feel free
                      to leave this page and come back later as the lipsync
                      process can sometimes take up to 10 minutes.
                    </p>
                  </motion.div>
                )}
                <VideoGenerationStatus
                  jobStatus={generation.jobStatus}
                  config={config}
                  hasRefunded={generation.hasRefunded}
                  consecutiveErrors={generation.consecutiveErrors}
                  currentJobId={generation.currentJobId}
                  isGenerating={generation.isGenerating}
                  s3Url={currentVideoS3Url}
                  onBack={() => router.push("/dashboard")}
                  onDownload={downloadVideo}
                  onReset={generation.resetGeneration}
                  getHostName={getHostName}
                  getGuestName={getGuestName}
                  getProcessingSteps={getProcessingStepsWrapper}
                  isVideoGenerationComplete={() => isVideoGenerationComplete()}
                />
              </motion.div>
            </div>
          ) : (
            /* Grid layout for script input */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Configuration Summary */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-gray-900/60 border border-gray-700 sticky top-6">
                  <CardHeader>
                    <CardTitle className="font-mono text-gray-200 flex items-center gap-3">
                      <Settings className="w-5 h-5" />
                      Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          {config.mode === "single" ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                          <span className="text-gray-300">
                            {config.mode === "single"
                              ? "Single Host"
                              : "Host + Guest"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-gray-300">
                            {config.duration} seconds
                          </span>
                        </div>
                        <div className="text-gray-300">
                          <span className="text-indigo-300">Host:</span>{" "}
                          {getHostName(config.selectedHost)}
                        </div>
                        {config.mode === "host_guest_host" &&
                          config.selectedGuest && (
                            <div className="text-gray-300">
                              <span className="text-indigo-300">Guest:</span>{" "}
                              {getGuestName(config.selectedGuest)}
                            </div>
                          )}
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          <span className="text-gray-300">
                            Music: {config.enableMusic ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-lg p-4">
                      <h4 className="font-mono text-indigo-200 mb-2 text-sm">
                        Character Limits:
                      </h4>
                      <div className="text-xs text-indigo-300 space-y-1">
                        {config.mode === "single" ? (
                          <p>
                            Total: {CHARACTER_LIMITS[config.duration]}{" "}
                            characters
                          </p>
                        ) : (
                          <>
                            <p>
                              Host Intro:{" "}
                              {Math.floor(
                                CHARACTER_LIMITS[config.duration] * 0.3
                              )}{" "}
                              characters
                            </p>
                            <p>
                              Guest:{" "}
                              {Math.floor(
                                CHARACTER_LIMITS[config.duration] * 0.4
                              )}{" "}
                              characters
                            </p>
                            <p>
                              Host Outro:{" "}
                              {Math.floor(
                                CHARACTER_LIMITS[config.duration] * 0.3
                              )}{" "}
                              characters
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
                      <h4 className="font-mono text-yellow-200 mb-2 text-sm flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        Credit Requirements:
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-yellow-300">Cost:</span>
                          <span className="text-yellow-200 font-bold">
                            {creditCheck?.requiredCredits || 0} credits
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-yellow-300">Your Balance:</span>
                          <span className="text-yellow-200 font-bold">
                            {creditCheck?.userCredits || 0} credits
                          </span>
                        </div>
                        {creditCheck && !creditCheck.hasEnoughCredits && (
                          <div className="text-xs text-red-400 font-mono">
                            ⚠️ Need {creditCheck.shortfall} more credits
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => router.push("/project/config")}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full"
                        disabled={generation.isGenerating}
                      >
                        $ Modify Config
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Script input */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="lg:col-span-2"
              >
                <ScriptInputForm
                  config={config}
                  scripts={scripts}
                  isGenerating={generation.isGenerating}
                  canProceed={canProceed()}
                  onScriptChange={handleScriptChange}
                  onGenerate={handleContinue}
                  getCharacterCount={getCharacterCount}
                  getCharacterLimit={getCharacterLimit}
                  isOverLimit={isOverLimit}
                />
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProjectScriptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-pulse text-indigo-200 font-mono">
            Loading...
          </div>
        </div>
      }
    >
      <ProjectScriptPageContent />
    </Suspense>
  );
}
