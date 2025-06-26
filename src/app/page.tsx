"use client";

import { Button } from "@/components/ui/button";
import { IoVideocamOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [demoVideoState, setDemoVideoState] = useState({
    isPlaying: false,
    isMuted: false,
    isLoading: false,
    error: null as string | null,
    showControls: false,
    hasLoaded: false,
  });

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const handleCreateClick = () => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    } else {
      setIsAuthDialogOpen(true);
    }
  };

  const toggleDemoVideoPlay = () => {
    const videoElement = document.getElementById(
      "demo-video"
    ) as HTMLVideoElement;
    if (!videoElement) return;

    if (videoElement.paused) {
      videoElement.play();
      setDemoVideoState((prev) => ({ ...prev, isPlaying: true }));
    } else {
      videoElement.pause();
      setDemoVideoState((prev) => ({ ...prev, isPlaying: false }));
    }
  };

  const toggleDemoVideoMute = () => {
    const videoElement = document.getElementById(
      "demo-video"
    ) as HTMLVideoElement;
    if (!videoElement) return;

    videoElement.muted = !videoElement.muted;
    setDemoVideoState((prev) => ({ ...prev, isMuted: videoElement.muted }));
  };

  const handleDemoVideoError = (error: string) => {
    setDemoVideoState((prev) => ({ ...prev, error, isLoading: false }));
  };

  const handleDemoVideoLoadStart = () => {
    setDemoVideoState((prev) => ({ ...prev, isLoading: true, error: null }));
  };

  const handleDemoVideoLoadedData = () => {
    setDemoVideoState((prev) => ({
      ...prev,
      isLoading: false,
      hasLoaded: true,
    }));
  };

  const handleVideoClick = () => {
    setDemoVideoState((prev) => ({
      ...prev,
      showControls: !prev.showControls,
    }));
  };

  const handleVideoTouch = () => {
    setDemoVideoState((prev) => ({ ...prev, showControls: true }));
    // Hide controls after 3 seconds
    setTimeout(() => {
      setDemoVideoState((prev) => ({ ...prev, showControls: false }));
    }, 3000);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Header */}
      <Navbar />

      {/* Main Section */}
      <main className="flex-1">
        <div className="container-custom grid grid-cols-1 md:grid-cols-2 gap-12 py-16 md:py-24">
          <motion.div
            className="flex flex-col justify-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <div className="space-y-6">
              <motion.div variants={fadeIn} transition={{ duration: 0.6 }}>
                <div className="header-text mb-1">
                  GENERATE <br />
                  NEWS CLIPS <br />
                  WITH AI
                </div>
              </motion.div>

              <motion.p
                className="text-lg max-w-md"
                style={{ color: "#AAAAAA" }}
                variants={fadeIn}
                transition={{ duration: 0.6 }}
              >
                {">"} Create realistic news broadcasts with our lipsync
                technology.
              </motion.p>

              <motion.div variants={fadeIn} transition={{ duration: 0.6 }}>
                <Button
                  className="btn-primary mt-4 w-fit"
                  onClick={handleCreateClick}
                >
                  {isLoaded && isSignedIn ? "$ Dashboard" : "$ Start Creating"}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Video Demo */}
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative w-full max-w-lg aspect-video rounded-lg border border-gray-800 overflow-hidden">
              {demoVideoState.error ? (
                <div className="aspect-video flex items-center justify-center bg-gray-800">
                  <div className="text-center text-gray-400 p-4">
                    <IoVideocamOutline className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs mb-2">Video unavailable</p>
                    <p className="text-xs text-gray-500">
                      Try refreshing the page or check your connection
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    id="demo-video"
                    className="w-full h-full object-cover cursor-pointer"
                    controls={false}
                    muted={demoVideoState.isMuted}
                    preload="auto"
                    playsInline
                    webkit-playsinline="true"
                    onClick={handleVideoClick}
                    onTouchStart={handleVideoTouch}
                    onLoadStart={handleDemoVideoLoadStart}
                    onLoadedData={handleDemoVideoLoadedData}
                    onError={() => handleDemoVideoError("Failed to load video")}
                    onEnded={() => {
                      setDemoVideoState((prev) => ({
                        ...prev,
                        isPlaying: false,
                      }));
                    }}
                  >
                    <source src="/demos/demo1.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Loading overlay */}
                  {demoVideoState.isLoading && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <div className="w-8 h-8 animate-spin border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-sm">Loading preview...</p>
                      </div>
                    </div>
                  )}

                  {/* Mobile "Tap to play" overlay when video hasn't loaded */}
                  {isMobile &&
                    !demoVideoState.hasLoaded &&
                    !demoVideoState.isLoading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center text-white">
                          <IoVideocamOutline className="w-12 h-12 mx-auto mb-3" />
                          <p className="text-lg font-medium">Tap to play</p>
                        </div>
                      </div>
                    )}

                  {/* Video Controls Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/30 transition-opacity duration-200 flex items-center justify-center ${
                      demoVideoState.showControls
                        ? "opacity-100"
                        : "opacity-0 hover:opacity-100 md:opacity-0"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDemoVideoPlay();
                        }}
                        className="bg-black/60 text-white hover:bg-black/80 p-2"
                        disabled={demoVideoState.isLoading}
                      >
                        {demoVideoState.isLoading ? (
                          <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        ) : demoVideoState.isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDemoVideoMute();
                        }}
                        className="bg-black/60 text-white hover:bg-black/80 p-2"
                      >
                        {demoVideoState.isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Always visible on mobile controls */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 md:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleDemoVideoPlay}
                      className="bg-black/60 text-white hover:bg-black/80 p-2"
                      disabled={demoVideoState.isLoading}
                    >
                      {demoVideoState.isLoading ? (
                        <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      ) : demoVideoState.isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleDemoVideoMute}
                      className="bg-black/60 text-white hover:bg-black/80 p-2"
                    >
                      {demoVideoState.isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-md">
                    <h3 className="text-sm font-bold text-white">
                      NEWSAI DEMO
                    </h3>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="py-16" style={{ background: "#1A1A1A" }}>
          <div className="container-custom">
            <motion.h2
              className="text-3xl font-bold mb-12 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              &lt;Features/&gt;
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.3,
                  },
                },
              }}
            >
              {/* Feature 1 */}
              <motion.div
                className="p-6 rounded-lg border border-gray-800"
                style={{ background: "#0F0F0F" }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
              >
                <div
                  className="mb-4 inline-block p-3 rounded-lg"
                  style={{ background: "#1A1A1A" }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M3 12C3 12 6 5 12 5C18 5 21 12 21 12C21 12 18 19 12 19C6 19 3 12 3 12Z"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {">"} AI powered Lipsync
                </h3>
                <p style={{ color: "#AAAAAA" }}>
                  Perfect synchronization between audio and video for realistic
                  news presentations.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                className="p-6 rounded-lg border border-gray-800"
                style={{ background: "#0F0F0F" }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
              >
                <div
                  className="mb-4 inline-block p-3 rounded-lg"
                  style={{ background: "#1A1A1A" }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12L10 17L20 7"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{">"} High Quality</h3>
                <p style={{ color: "#AAAAAA" }}>
                  Crystal clear 4K video output with professional grade audio
                  processing.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                className="p-6 rounded-lg border border-gray-800"
                style={{ background: "#0F0F0F" }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
              >
                <div
                  className="mb-4 inline-block p-3 rounded-lg"
                  style={{ background: "#1A1A1A" }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 6V12L16 14"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{">"} Fast Rendering</h3>
                <p style={{ color: "#AAAAAA" }}>
                  Generate news clips in minutes, not hours, with our optimized
                  pipeline.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Auth Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <AuthDialog />
      </Dialog>

      {/* Footer */}
      <motion.footer
        className="border-t border-gray-800 py-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="container-custom text-center"
          style={{ color: "#AAAAAA" }}
        >
          <p>© 2025 NewsAI. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
}
