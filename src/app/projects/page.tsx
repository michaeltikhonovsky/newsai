"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
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

interface SavedProject {
  id: string;
  title: string;
  mode: "single" | "host_guest_host";
  selectedHost: string;
  selectedGuest?: string;
  duration: 30 | 60;
  createdAt: string;
  jobId: string;
  videoUrl?: string; // For future use if videos are hosted
  thumbnail?: string; // For future use
  singleCharacterText?: string;
  host1Text?: string;
  guest1Text?: string;
  host2Text?: string;
}

const hosts: { [key: string]: string } = {
  lh: "Lester Holt",
  AC: "Anderson Cooper",
};

const guests: { [key: string]: string } = {
  RE: "Richard Engel",
  HW: "Holly Williams",
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    try {
      const savedProjects = localStorage.getItem("completedProjects");
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        // Sort by creation date, newest first
        const sortedProjects = parsedProjects.sort(
          (a: SavedProject, b: SavedProject) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setProjects(sortedProjects);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: "Error Loading Projects",
        description: "Failed to load your saved projects.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = (projectId: string) => {
    try {
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);
      localStorage.setItem(
        "completedProjects",
        JSON.stringify(updatedProjects)
      );

      toast({
        title: "Project Deleted",
        description: "Project has been removed from your library.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    }
  };

  const downloadVideo = async (project: SavedProject) => {
    try {
      const response = await fetch(`${API_BASE_URL}/video/${project.jobId}`);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProjectPreview = (project: SavedProject) => {
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
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
            <p className="text-lg text-gray-400">
              {">"} View and manage your completed video projects.
            </p>
          </motion.div>

          {/* Projects Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {projects.length === 0 ? (
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
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="bg-gray-900/60 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="font-mono text-gray-200 text-lg mb-2">
                            {project.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <Calendar className="w-3 h-3" />
                            {formatDate(project.createdAt)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProject(project.id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Project Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {project.mode === "single" ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Users className="w-3 h-3" />
                          )}
                          <span>
                            {project.mode === "single"
                              ? "Single Host"
                              : "Host + Guest"}
                          </span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{project.duration}s</span>
                        </div>
                        <div className="text-xs text-gray-300">
                          <span className="text-indigo-300">Host:</span>{" "}
                          {hosts[project.selectedHost] || project.selectedHost}
                          {project.selectedGuest && (
                            <>
                              {" • "}
                              <span className="text-indigo-300">
                                Guest:
                              </span>{" "}
                              {guests[project.selectedGuest] ||
                                project.selectedGuest}
                            </>
                          )}
                        </div>
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

                      {/* Actions */}
                      <div className="flex gap-2">
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
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
