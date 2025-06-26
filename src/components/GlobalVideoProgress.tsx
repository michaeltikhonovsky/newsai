"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCw,
  Clock,
  AlertTriangle,
  X,
  Video,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { PiQueue } from "react-icons/pi";
import { useGlobalVideoProgressContext } from "@/components/providers/GlobalVideoProgressProvider";
import { useRouter } from "next/navigation";

export const GlobalVideoProgress = () => {
  const { ongoingGenerations, getProgress, removeGeneration } =
    useGlobalVideoProgressContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navigateToProject = (jobId?: string) => {
    // if jobid provided go to that project
    if (jobId) {
      router.push(`/project/script?jobId=${jobId}&showStatus=true`);
    } else if (ongoingGenerations.length > 0) {
      const firstGeneration = ongoingGenerations[0];
      router.push(
        `/project/script?jobId=${firstGeneration.jobId}&showStatus=true`
      );
    } else {
      router.push("/project/config");
    }
  };

  const handleQueueButtonClick = () => {
    if (isMobile) {
      setIsHovered(!isHovered);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "pending":
      case "queued":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "processing":
        return <RotateCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pending":
      case "queued":
        return "border-yellow-400 bg-yellow-400/10";
      case "processing":
        return "border-blue-400 bg-blue-400/10";
      case "failed":
        return "border-red-400 bg-red-400/10";
      default:
        return "border-gray-400 bg-gray-400/10";
    }
  };

  const hasOngoingJobs = ongoingGenerations.length > 0;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Floating Icon - Always visible now */}
        <motion.div
          className={`
            w-14 h-14 rounded-xl cursor-pointer
            flex items-center justify-center
            shadow-lg hover:shadow-xl
            transition-all duration-200
            hover:scale-105
            relative border-1
            bg-black hover:bg-black/50 border-gray-600
            
          `}
          onClick={handleQueueButtonClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PiQueue
            className={`w-6 h-6 ${
              hasOngoingJobs ? "text-white" : "text-gray-400"
            }`}
          />

          {/* iOS-style Notification Badge - Only show when there are ongoing jobs */}
          {hasOngoingJobs && (
            <motion.div
              className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center px-1 shadow-sm"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {ongoingGenerations.length}
            </motion.div>
          )}
        </motion.div>

        {/* Hover Panel */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-16 sm:bottom-0 right-8 sm:right-16 w-72 sm:w-80 md:w-96 bg-black border border-gray-600 rounded-lg shadow-xl max-w-[calc(100vw-2rem)]"
            >
              <div className="p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <PiQueue className="w-4 h-4" />
                    Generation Queue
                  </h3>
                  <span className="text-xs text-gray-400">
                    {hasOngoingJobs
                      ? `${ongoingGenerations.length} active`
                      : "No active jobs"}
                  </span>
                </div>

                {hasOngoingJobs ? (
                  // Show ongoing jobs as before
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {ongoingGenerations.map((generation) => (
                      <div
                        key={generation.jobId}
                        className="bg-black border border-gray-600 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">
                              {generation.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusIcon(generation.lastStatus?.status)}
                              <span className="text-xs text-gray-400 capitalize">
                                {generation.lastStatus?.status || "Starting..."}
                                {generation.lastStatus?.queuePosition && (
                                  <span className="ml-1">
                                    (#{generation.lastStatus.queuePosition})
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGeneration(generation.jobId);
                            }}
                            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <motion.div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgress(generation)}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>

                        {/* Status Message */}
                        {generation.lastStatus?.progress && (
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {generation.lastStatus.progress}
                          </p>
                        )}

                        {/* Time Info */}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            Started:{" "}
                            {new Date(
                              generation.startedAt
                            ).toLocaleTimeString()}
                          </span>
                          <span>{getProgress(generation)}%</span>
                        </div>
                        <div
                          className="group flex items-center gap-2 cursor-pointer transition-colors"
                          onClick={() => {
                            navigateToProject(generation.jobId);
                            handleQueueButtonClick();
                          }}
                        >
                          <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                            Navigate to full status page
                          </span>
                          <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-300 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show "no ongoing jobs" state
                  <div className="space-y-3">
                    <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-300">
                            No ongoing generations
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            All video generations are complete
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="group flex items-center justify-center gap-2 cursor-pointer transition-colors p-2 rounded-lg hover:bg-gray-800/50"
                      onClick={() => {
                        navigateToProject();
                        handleQueueButtonClick();
                      }}
                    >
                      <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                        Start a new generation
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-300 transition-colors" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
