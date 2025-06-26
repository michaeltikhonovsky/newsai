"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { IoVideocamOutline } from "react-icons/io5";
import { api } from "@/trpc/react";

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState({ firstName: "", lastName: "" });

  // Get user data from database
  const { data: dbUser } = api.users.getUser.useQuery(undefined, {
    enabled: isLoaded && isSignedIn,
  });

  // Get recent videos from database
  const { data: videos, isLoading: videosLoading } =
    api.videos.getRecentVideos.useQuery(undefined, {
      enabled: isLoaded && isSignedIn,
    });

  const projectCount = videos?.length || 0;

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (dbUser) {
      setUserData({
        firstName: dbUser.firstName || "",
        lastName: dbUser.lastName || "",
      });
    }
  }, [dbUser]);

  const handleCreateProject = () => {
    router.push("/project/config");
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <Navbar />
      <main className="flex-1">
        <div className="container-custom py-12">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="header-text mb-4">DASHBOARD</h1>
            <p className="text-lg" style={{ color: "#AAAAAA" }}>
              {">"} Hi, {userData.firstName || "User"}. Ready to create some
              clips?
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div
              className="p-6 rounded-lg border border-gray-800"
              style={{ background: "#0F0F0F" }}
            >
              <div
                className="mb-4 inline-block p-3 rounded-lg"
                style={{ background: "#1A1A1A" }}
              >
                <IoVideocamOutline style={{ height: 32, width: 32 }} />
              </div>
              <h3 className="text-xl font-bold mb-2">{">"} New Project</h3>
              <p style={{ color: "#AAAAAA" }} className="mb-6">
                Start creating a news clip from scratch.
              </p>
              <Button className="btn-primary" onClick={handleCreateProject}>
                $ Create New Project
              </Button>
            </div>

            <div
              className="p-6 rounded-lg border border-gray-800"
              style={{ background: "#0F0F0F" }}
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
              <h3 className="text-xl font-bold mb-2">{">"} Recent Projects</h3>
              <p style={{ color: "#AAAAAA" }} className="mb-6">
                {projectCount === 0
                  ? "You haven't created any projects yet. Start by creating a new one."
                  : `You have ${projectCount} completed project${
                      projectCount === 1 ? "" : "s"
                    }. View and manage your projects from the past 24 hours here.`}
              </p>
              <Button
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800"
                onClick={() => router.push("/projects")}
              >
                $ View All Projects {projectCount > 0 && `(${projectCount})`}
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <motion.footer
        className="border-t border-gray-800 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
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
