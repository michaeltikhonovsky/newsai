"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import {
  ArrowLeft,
  Video,
  Download,
  Trash2,
  Calendar,
  User,
  Users,
  Clock,
  Plus,
} from "lucide-react";

// Use the database video type instead of SavedProject
type VideoRecord = {
  id: number;
  title: string;
  mode: string;
  selectedHost: string | null;
  selectedGuest?: string | null;
  duration: number;
  createdAt: Date;
  jobId: string;
  s3Url: string | null;
  singleCharacterText?: string | null;
  host1Text?: string | null;
  guest1Text?: string | null;
  host2Text?: string | null;
};

const hosts: { [key: string]: string } = {
  lh: "Lester Holt",
  AC: "Anderson Cooper",
};

const guests: { [key: string]: string } = {
  RE: "Richard Engel",
  HW: "Holly Williams",
};

export default function ProjectsPage() {
  const router = useRouter();
  const [videoStates, setVideoStates] = useState<{
    [key: string]: {
      isLoading: boolean;
      error: string | null;
      hasLoaded: boolean;
    };
  }>({});

  // Fetch videos from database
  const {
    data: videos = [],
    isLoading,
    refetch,
  } = api.videos.getRecentVideos.useQuery();

  const deleteProject = (projectId: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Videos automatically expire after 24 hours.",
    });
  };

  const downloadVideo = async (project: VideoRecord) => {
    try {
      // Use direct S3 URL for download
      if (!project.s3Url) {
        throw new Error("Video URL not available");
      }

      const response = await fetch(project.s3Url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/[^a-z0-9]/gi, "_")}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: "Your video is being downloaded.",
      });
    } catch (error: any) {
      console.error("Error downloading video:", error);
      toast({
        title: "Download Failed",
        description: `Failed to download video: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProjectPreview = (project: VideoRecord) => {
    if (project.mode === "single") {
      return (
        project.singleCharacterText?.substring(0, 100) + "..." ||
        "No preview available"
      );
    } else {
      return (
        project.host1Text?.substring(0, 100) + "..." || "No preview available"
      );
    }
  };

  const initializeVideoState = (projectId: string) => {
    if (!videoStates[projectId]) {
      setVideoStates((prev) => ({
        ...prev,
        [projectId]: {
          isLoading: false,
          error: null as string | null,
          hasLoaded: false,
        },
      }));
    }
  };

  const handleVideoError = (projectId: string, error: string) => {
    setVideoStates((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], error, isLoading: false },
    }));
  };

  const handleVideoLoadStart = (projectId: string) => {
    setVideoStates((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], isLoading: true, error: null },
    }));
  };

  const handleVideoLoadedData = (projectId: string) => {
    setVideoStates((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], isLoading: false, hasLoaded: true },
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-indigo-200 font-mono">
          Loading projects...
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="header-text">MY PROJECTS</h1>
              </div>
              <Button
                onClick={() => router.push("/project/config")}
                className="btn-primary hidden md:flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
            <p className="text-lg text-gray-400">
              {">"} View and manage your completed video projects from the past
              24 hours.
            </p>
          </motion.div>

          {/* Projects Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {videos.length === 0 ? (
              <div className="text-center py-16">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-mono text-gray-200 mb-2">
                  No Projects Yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Create your first news video to see it here.
                </p>
                <Button
                  onClick={() => router.push("/project/config")}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((project) => {
                  const projectIdStr = project.id.toString();
                  initializeVideoState(projectIdStr);
                  const videoState = videoStates[projectIdStr] || {
                    isLoading: false,
                    error: null,
                    hasLoaded: false,
                  };

                  return (
                    <Card
                      key={project.id}
                      className="bg-gray-900/60 border border-gray-700 hover:border-gray-600 transition-colors flex flex-col h-full"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                              <Calendar className="w-3 h-3" />
                              {formatDate(project.createdAt)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProject(projectIdStr)}
                            className="text-gray-400 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1 justify-between">
                        <div className="space-y-4">
                          {/* Video Preview */}
                          <div className="relative bg-gray-800/50 border border-gray-600 rounded overflow-hidden">
                            {videoState.error ? (
                              <div className="aspect-video flex items-center justify-center bg-gray-800">
                                <div className="text-center text-gray-400">
                                  <Video className="w-8 h-8 mx-auto mb-2" />
                                  <p className="text-xs">Video unavailable</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <video
                                  id={`video-${projectIdStr}`}
                                  className="w-full aspect-video object-cover"
                                  controls={true}
                                  muted={false}
                                  preload="auto"
                                  playsInline
                                  webkit-playsinline="true"
                                  onLoadStart={() =>
                                    handleVideoLoadStart(projectIdStr)
                                  }
                                  onLoadedData={() =>
                                    handleVideoLoadedData(projectIdStr)
                                  }
                                  onError={(e) => {
                                    console.error(
                                      `Video load failed for project ${projectIdStr}:`,
                                      e
                                    );
                                    handleVideoError(
                                      projectIdStr,
                                      "Failed to load video"
                                    );
                                  }}
                                >
                                  {/* Use direct S3 url*/}
                                  <source
                                    src={project.s3Url!}
                                    type="video/mp4"
                                  />
                                  Your browser does not support the video tag.
                                </video>

                                {/* Loading overlay */}
                                {videoState.isLoading && (
                                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                                    <div className="text-center text-gray-400">
                                      <div className="w-6 h-6 animate-spin border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                                      <p className="text-xs">Loading...</p>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Script Preview */}
                          <div className="bg-gray-800/50 border border-gray-600 rounded p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              Script Preview:
                            </p>
                            <p className="text-xs text-gray-300 font-mono leading-relaxed">
                              {getProjectPreview(project)}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => downloadVideo(project)}
                            className="btn-primary flex-1"
                            size="sm"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
