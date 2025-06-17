"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Settings,
  FileText,
  Clock,
  User,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  Play,
  Home,
} from "lucide-react";

interface VideoConfig {
  mode: "single" | "host_guest_host";
  duration: 30 | 60;
  selectedHost: string;
  selectedGuest?: string;
  singleCharacterText: string;
  host1Text: string;
  guest1Text: string;
  host2Text: string;
}

interface Character {
  id: string;
  name: string;
  initials: string;
  avatar: string;
}

const hosts: Character[] = [
  {
    id: "lh",
    name: "Lester Holt",
    initials: "LH",
    avatar: "/avatars/LH-headshot.jpg",
  },
  {
    id: "AC",
    name: "Anderson Cooper",
    initials: "AC",
    avatar: "/avatars/AC-headshot.png",
  },
];

const guests: Character[] = [
  {
    id: "RE",
    name: "Richard Engel",
    initials: "RE",
    avatar: "/avatars/RE-headshot.webp",
  },
  {
    id: "HW",
    name: "Holly Williams",
    initials: "HW",
    avatar: "/avatars/HW-headshot.webp",
  },
];

const CHARACTER_LIMITS = {
  30: 400,
  60: 800,
};

interface GenerateVideoRequest {
  mode: "single" | "host_guest_host";
  selectedHost: string;
  selectedGuest?: string;
  singleCharacterText?: string;
  host1Text?: string;
  guest1Text?: string;
  host2Text?: string;
}

interface JobStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ScriptField = keyof {
  singleCharacterText: string;
  host1Text: string;
  guest1Text: string;
  host2Text: string;
};

interface ProcessingStep {
  label: string;
  completed: boolean;
  current: boolean;
}

const getProcessingSteps = (
  currentProgress?: string,
  config?: VideoConfig
): ProcessingStep[] => {
  // Base steps that apply to both modes
  let steps = [
    { key: "audio", label: "Generate Audio" },
    { key: "video", label: "Process Video Footage" },
    { key: "music", label: "Add Background Music" },
    { key: "upload", label: "Upload for Lipsync" },
    { key: "lipsync", label: "Lipsync Processing" },
    { key: "finalize", label: "Normalize Video" },
    { key: "outro", label: "Add Outro" },
    { key: "save", label: "Save Final Video" },
  ];

  // For multi-character mode, we need to show multiple audio generation steps
  if (config?.mode === "host_guest_host") {
    steps = [
      { key: "audio_host1", label: "Generate Host Intro Audio" },
      { key: "audio_guest", label: "Generate Guest Audio" },
      { key: "audio_host2", label: "Generate Host Outro Audio" },
      { key: "concatenate", label: "Concatenate Video Segments" },
      { key: "music", label: "Add Background Music" },
      { key: "upload", label: "Upload for Lipsync" },
      { key: "lipsync", label: "Lipsync Processing" },
      { key: "finalize", label: "Normalize Video" },
      { key: "outro", label: "Add Outro" },
      { key: "save", label: "Save Final Video" },
    ];
  }

  if (!currentProgress) {
    return steps.map((step) => ({ ...step, completed: false, current: false }));
  }

  const progress = currentProgress.toLowerCase();

  // Determine current step based on progress text
  let currentStepIndex = -1;

  // Check for specific progress indicators to determine current step
  if (
    (progress.includes("generating audio for") &&
      progress.includes("introduction")) ||
    (progress.includes("generating audio for") &&
      progress.includes("host") &&
      progress.includes("intro"))
  ) {
    currentStepIndex = 0; // audio_host1
  } else if (
    (progress.includes("generating audio for") &&
      progress.includes("main segment")) ||
    (progress.includes("generating audio for") && progress.includes("guest"))
  ) {
    currentStepIndex = 1; // audio_guest
  } else if (
    (progress.includes("generating audio for") &&
      progress.includes("conclusion")) ||
    (progress.includes("generating audio for") &&
      progress.includes("host") &&
      progress.includes("outro"))
  ) {
    currentStepIndex = 2; // audio_host2
  } else if (progress.includes("processing audio generation")) {
    // For generic "processing audio generation" messages, check context
    if (progress.includes("✅") && progress.includes("introduction")) {
      currentStepIndex = 1; // Host intro done, moving to guest
    } else if (progress.includes("✅") && progress.includes("main segment")) {
      currentStepIndex = 2; // Guest done, moving to host outro
    } else {
      currentStepIndex = 0; // Default to first step if unclear
    }
  } else if (progress.includes("concatenating")) {
    currentStepIndex = 3; // concatenate
  } else if (
    progress.includes("adding background music") ||
    progress.includes("background music")
  ) {
    currentStepIndex = 4; // music
  } else if (progress.includes("uploading") && !progress.includes("lipsync")) {
    currentStepIndex = 5; // upload
  } else if (progress.includes("lipsync")) {
    currentStepIndex = 6; // lipsync
  } else if (progress.includes("normalizing") || progress.includes("finaliz")) {
    currentStepIndex = 7; // finalize
  } else if (progress.includes("outro")) {
    currentStepIndex = 8; // outro
  } else if (
    progress.includes("saving") ||
    progress.includes("saved") ||
    progress.includes("completed successfully") ||
    progress.includes("video processing completed")
  ) {
    currentStepIndex = 9; // save
  }

  // For single character mode, adjust step indices
  if (config?.mode === "single") {
    if (
      progress.includes("generating audio") ||
      progress.includes("processing audio generation")
    ) {
      currentStepIndex = 0; // audio
    } else if (progress.includes("processing video")) {
      currentStepIndex = 1; // video
    } else if (
      progress.includes("adding background music") ||
      progress.includes("background music")
    ) {
      currentStepIndex = 2; // music
    } else if (
      progress.includes("uploading") &&
      !progress.includes("lipsync")
    ) {
      currentStepIndex = 3; // upload
    } else if (progress.includes("lipsync")) {
      currentStepIndex = 4; // lipsync
    } else if (
      progress.includes("normalizing") ||
      progress.includes("finaliz")
    ) {
      currentStepIndex = 5; // finalize
    } else if (progress.includes("outro")) {
      currentStepIndex = 6; // outro
    } else if (
      progress.includes("saving") ||
      progress.includes("saved") ||
      progress.includes("completed successfully") ||
      progress.includes("video processing completed")
    ) {
      currentStepIndex = 7; // save
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
      // If we found a current step, mark all previous steps as completed
      completed = index < currentStepIndex;
      current = index === currentStepIndex;
    } else {
      // Fallback to text-based detection for edge cases
      current =
        progress.includes(step.label.toLowerCase()) ||
        (step.key === "audio_host1" &&
          ((progress.includes("generating audio for") &&
            (progress.includes("introduction") ||
              (progress.includes("host") && progress.includes("intro")))) ||
            (progress.includes("processing audio generation") &&
              index === 0))) ||
        (step.key === "audio_guest" &&
          ((progress.includes("generating audio for") &&
            (progress.includes("main segment") ||
              progress.includes("guest"))) ||
            (progress.includes("processing audio generation") &&
              index === 1))) ||
        (step.key === "audio_host2" &&
          ((progress.includes("generating audio for") &&
            (progress.includes("conclusion") ||
              (progress.includes("host") && progress.includes("outro")))) ||
            (progress.includes("processing audio generation") &&
              index === 2))) ||
        (step.key === "lipsync" && progress.includes("lipsync processing")) ||
        (step.key === "audio" &&
          (progress.includes("generating audio") ||
            progress.includes("processing audio generation")));
    }

    return { ...step, completed, current };
  });
};

const ScriptInput = ({
  field,
  label,
  placeholder,
  description,
  scripts,
  handleScriptChange,
  getCharacterCount,
  getCharacterLimit,
  isOverLimit,
}: {
  field: ScriptField;
  label: string;
  placeholder: string;
  description: string;
  scripts: {
    singleCharacterText: string;
    host1Text: string;
    guest1Text: string;
    host2Text: string;
  };
  handleScriptChange: (field: ScriptField, value: string) => void;
  getCharacterCount: (field: ScriptField) => number;
  getCharacterLimit: (field: ScriptField) => number;
  isOverLimit: (field: ScriptField) => boolean;
}) => {
  const count = getCharacterCount(field);
  const limit = getCharacterLimit(field);
  const isOver = isOverLimit(field);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-mono text-indigo-200 text-sm font-bold">
          {label}
        </label>
        <div
          className={`text-xs font-mono ${
            isOver ? "text-red-400" : "text-gray-400"
          }`}
        >
          {count}/{limit}
        </div>
      </div>
      <Textarea
        placeholder={placeholder}
        value={scripts[field]}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          handleScriptChange(field, e.target.value)
        }
        className={`min-h-[120px] bg-gray-800/50 border font-mono text-sm resize-none ${
          isOver
            ? "border-red-400 focus:border-red-400"
            : "border-gray-600 focus:border-indigo-400"
        } text-gray-200 placeholder-gray-500`}
      />
      <p className="text-xs text-gray-500">{description}</p>
      {isOver && (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle className="w-3 h-3" />
          Script exceeds character limit
        </div>
      )}
    </div>
  );
};

export default function ProjectScriptPage() {
  const router = useRouter();
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [scripts, setScripts] = useState({
    singleCharacterText: "",
    host1Text: "",
    guest1Text: "",
    host2Text: "",
  });

  // API state
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  const getHostName = (hostId: string) => {
    const host = hosts.find((h) => h.id === hostId);
    return host ? host.name : hostId;
  };

  const getGuestName = (guestId: string) => {
    const guest = guests.find((g) => g.id === guestId);
    return guest ? guest.name : guestId;
  };

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

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const status: JobStatus = await response.json();
      setJobStatus(status);

      // Continue polling if job is still in progress
      if (status.status === "pending" || status.status === "processing") {
        setTimeout(() => pollJobStatus(jobId), 1000); // Poll every 1 second for more responsive updates
      } else if (status.status === "failed") {
        toast({
          title: "Video Generation Failed",
          description: status.error || "Video generation failed",
          variant: "destructive",
        });
        setIsGenerating(false);
      } else if (status.status === "completed") {
        // Save project to localStorage
        saveCompletedProject(jobId);

        toast({
          title: "Video Generated Successfully!",
          description: "Your news video is ready to download.",
        });
        setIsGenerating(false);
      }
    } catch (err: any) {
      console.error("Error polling job status:", err);
      toast({
        title: "Connection Error",
        description: `Failed to check job status: ${err.message}`,
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  // Generate video
  const generateVideo = async () => {
    if (!config) return;

    setIsGenerating(true);
    setJobStatus(null);

    try {
      const requestBody: GenerateVideoRequest = {
        mode: config.mode,
        selectedHost: config.selectedHost,
        selectedGuest: config.selectedGuest,
        singleCharacterText:
          config.mode === "single" ? scripts.singleCharacterText : undefined,
        host1Text:
          config.mode === "host_guest_host" ? scripts.host1Text : undefined,
        guest1Text:
          config.mode === "host_guest_host" ? scripts.guest1Text : undefined,
        host2Text:
          config.mode === "host_guest_host" ? scripts.host2Text : undefined,
      };

      const response = await fetch(`${API_BASE_URL}/generate-video`, {
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

      // Start polling for status updates
      pollJobStatus(result.jobId);
    } catch (err: any) {
      console.error("Error generating video:", err);
      toast({
        title: "Failed to Start Generation",
        description: `Failed to start video generation: ${err.message}`,
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

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

      // Save back to localStorage
      localStorage.setItem("completedProjects", JSON.stringify(projects));

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
    if (!jobStatus?.jobId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/video/${jobStatus.jobId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `news-video-${jobStatus.jobId}.mp4`;
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

    // For host+guest mode, split the character limit between segments
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

    if (config.mode === "single") {
      return (
        scripts.singleCharacterText.trim().length > 0 &&
        !isOverLimit("singleCharacterText")
      );
    } else {
      return (
        scripts.host1Text.trim().length > 0 &&
        scripts.guest1Text.trim().length > 0 &&
        scripts.host2Text.trim().length > 0 &&
        !isOverLimit("host1Text") &&
        !isOverLimit("guest1Text") &&
        !isOverLimit("host2Text")
      );
    }
  };

  const isVideoGenerationComplete = () => {
    const result =
      jobStatus?.status === "completed" &&
      jobStatus?.progress &&
      (jobStatus.progress
        .toLowerCase()
        .includes("video processing completed successfully") ||
        jobStatus.progress.toLowerCase().includes("completed successfully") ||
        jobStatus.progress
          .toLowerCase()
          .includes("video generation completed") ||
        jobStatus.progress.toLowerCase().includes("generation completed"));

    // Debug logging
    console.log("isVideoGenerationComplete check:", {
      status: jobStatus?.status,
      progress: jobStatus?.progress,
      result: result,
    });

    return result;
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
    generateVideo();
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
                disabled={isGenerating}
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
                    </div>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-lg p-4">
                    <h4 className="font-mono text-indigo-200 mb-2 text-sm">
                      Character Limits:
                    </h4>
                    <div className="text-xs text-indigo-300 space-y-1">
                      {config.mode === "single" ? (
                        <p>
                          Total: {CHARACTER_LIMITS[config.duration]} characters
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

                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/project/config")}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full"
                      disabled={isGenerating}
                    >
                      Modify Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Script Input or Generation Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-2"
            >
              {/* Show Video Preview when fully complete */}
              {isVideoGenerationComplete() ? (
                <Card className="bg-gray-900/60 border border-gray-700">
                  <CardHeader>
                    <CardTitle className="font-mono text-gray-200 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Video Ready!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                      <div className="text-center space-y-4">
                        <div className="bg-black rounded-lg aspect-video border border-gray-700 overflow-hidden">
                          <video
                            controls
                            className="w-full h-full object-cover"
                            preload="metadata"
                            onError={() => {
                              console.error("Video failed to load");
                            }}
                          >
                            <source
                              src={`${API_BASE_URL}/video/${jobStatus?.jobId}`}
                              type="video/mp4"
                            />
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center space-y-3">
                                <Play className="w-16 h-16 text-gray-400 mx-auto" />
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

                    {/* Action Buttons */}
                    <div className="pt-6 border-t border-gray-700">
                      <div className="flex justify-between items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => router.push("/dashboard")}
                          className="border-gray-600 text-gray-300 hover:bg-gray-800 flex-1"
                        >
                          <Home className="w-4 h-4 mr-2" />
                          Go to Dashboard
                        </Button>

                        <Button
                          className="btn-primary px-8 py-3 flex-1"
                          onClick={downloadVideo}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Video
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : isGenerating || jobStatus ? (
                <Card className="bg-gray-900/60 border border-gray-700">
                  <CardHeader>
                    <CardTitle className="font-mono text-gray-200 flex items-center gap-3">
                      {jobStatus?.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : jobStatus?.status === "failed" ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      )}
                      {jobStatus?.status === "completed"
                        ? "Video Generation Complete"
                        : jobStatus?.status === "failed"
                        ? "Video Generation Failed"
                        : "Generating Video"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {jobStatus && (
                      <div className="space-y-6">
                        {/* Status Overview */}
                        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {jobStatus.status === "pending" && (
                                <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
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
                                </h3>
                                <p className="text-sm text-gray-400">
                                  Job ID: {jobStatus.jobId}
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-400">
                              <p>
                                Started:{" "}
                                {new Date(jobStatus.createdAt).toLocaleString()}
                              </p>
                              <p>
                                Updated:{" "}
                                {new Date(jobStatus.updatedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Current Progress */}
                          {jobStatus.progress && (
                            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  {jobStatus.status === "processing" && (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                  )}
                                  {jobStatus.status === "pending" && (
                                    <Clock className="w-4 h-4 text-yellow-400" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-mono text-gray-200 font-medium mb-2">
                                    Current Progress:
                                  </h4>
                                  <p className="text-gray-300 break-words mb-3">
                                    {jobStatus.progress}
                                  </p>

                                  {/* Character Context */}
                                  {config && (
                                    <div className="flex gap-2 flex-wrap">
                                      {config.mode === "single" ? (
                                        <span className="text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full text-sm">
                                          {getHostName(config.selectedHost)}
                                        </span>
                                      ) : (
                                        <>
                                          <span className="text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full text-sm">
                                            Host:{" "}
                                            {getHostName(config.selectedHost)}
                                          </span>
                                          {config.selectedGuest && (
                                            <span className="text-green-300 bg-green-500/20 px-3 py-1 rounded-full text-sm">
                                              Guest:{" "}
                                              {getGuestName(
                                                config.selectedGuest
                                              )}
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

                          {/* Error Display */}
                          {jobStatus.status === "failed" && jobStatus.error && (
                            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-mono text-red-300 font-medium mb-2">
                                    Error Details:
                                  </h4>
                                  <p className="text-red-200 break-words">
                                    {jobStatus.error}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Processing Steps */}
                        {(jobStatus.status === "processing" ||
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

                        {/* Action Buttons */}
                        <div className="pt-6 border-t border-gray-700">
                          <div className="flex justify-between items-center">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsGenerating(false);
                                setJobStatus(null);
                              }}
                              className="border-gray-600 text-gray-300 hover:bg-gray-800"
                              disabled={
                                isGenerating &&
                                jobStatus?.status === "processing"
                              }
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              {jobStatus?.status === "completed"
                                ? "Create New Video"
                                : "Back to Script"}
                            </Button>

                            {jobStatus?.status === "completed" && (
                              <Button
                                className="btn-primary px-8 py-3"
                                onClick={downloadVideo}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download Video
                              </Button>
                            )}

                            {jobStatus?.status === "failed" && (
                              <Button
                                className="btn-primary px-8 py-3"
                                onClick={generateVideo}
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
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Original Script Input */
                <Card className="bg-gray-900/60 border border-gray-700">
                  <CardHeader>
                    <CardTitle className="font-mono text-gray-200 flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      News Script
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {config.mode === "single" ? (
                      <ScriptInput
                        field="singleCharacterText"
                        label="HOST SCRIPT"
                        placeholder="Enter the complete news script for your anchor..."
                        description="The entire news segment will be presented by a single host."
                        scripts={scripts}
                        handleScriptChange={handleScriptChange}
                        getCharacterCount={getCharacterCount}
                        getCharacterLimit={getCharacterLimit}
                        isOverLimit={isOverLimit}
                      />
                    ) : (
                      <div className="space-y-6">
                        <ScriptInput
                          field="host1Text"
                          label="HOST INTRODUCTION"
                          placeholder="Good evening, I'm here with..."
                          description="Host introduces the topic and guest (~30% of total time)."
                          scripts={scripts}
                          handleScriptChange={handleScriptChange}
                          getCharacterCount={getCharacterCount}
                          getCharacterLimit={getCharacterLimit}
                          isOverLimit={isOverLimit}
                        />

                        <ScriptInput
                          field="guest1Text"
                          label="GUEST SEGMENT"
                          placeholder="Thank you for having me. Today I want to discuss..."
                          description="Guest presents their main content (~40% of total time)."
                          scripts={scripts}
                          handleScriptChange={handleScriptChange}
                          getCharacterCount={getCharacterCount}
                          getCharacterLimit={getCharacterLimit}
                          isOverLimit={isOverLimit}
                        />

                        <ScriptInput
                          field="host2Text"
                          label="HOST CONCLUSION"
                          placeholder="Thank you for that insight. That's all for today..."
                          description="Host wraps up the segment (~30% of total time)."
                          scripts={scripts}
                          handleScriptChange={handleScriptChange}
                          getCharacterCount={getCharacterCount}
                          getCharacterLimit={getCharacterLimit}
                          isOverLimit={isOverLimit}
                        />
                      </div>
                    )}

                    {/* Continue Button */}
                    <div className="pt-6 border-t border-gray-700">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                          {canProceed()
                            ? "✅ Script ready for generation"
                            : "⚠️ Complete all script fields to continue"}
                        </div>
                        <Button
                          className="btn-primary px-8 py-3"
                          onClick={handleContinue}
                          disabled={!canProceed() || isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate Video →"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
