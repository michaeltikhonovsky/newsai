"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, Settings, PlayCircle } from "lucide-react";

interface VideoConfig {
  mode: "single" | "host_guest_host";
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

export default function ProjectCreatePage() {
  const router = useRouter();
  const [config, setConfig] = useState<VideoConfig | null>(null);

  // Helper functions to get full names
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
      setConfig(JSON.parse(savedConfig));
    } else {
      // Redirect back to config if no config found
      router.push("/project/config");
    }
  }, [router]);

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
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="header-text">CREATE PROJECT</h1>
            </div>
            <p className="text-lg text-gray-400">
              {">"} Create your news clip with the selected configuration.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-gray-900/60 border border-gray-700">
                <CardHeader>
                  <CardTitle className="font-mono text-gray-200 flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    Configuration Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300">
                        <span className="text-indigo-300">Mode:</span>{" "}
                        {config.mode === "single"
                          ? "Single Host"
                          : "Host + Guest"}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-indigo-300">Host:</span>{" "}
                        {getHostName(config.selectedHost)}
                      </p>
                      {config.mode === "host_guest_host" &&
                        config.selectedGuest && (
                          <p className="text-gray-300">
                            <span className="text-indigo-300">Guest:</span>{" "}
                            {getGuestName(config.selectedGuest)}
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/project/config")}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Modify Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Project Creation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-gray-900/60 border border-gray-700">
                <CardHeader>
                  <CardTitle className="font-mono text-gray-200 flex items-center gap-3">
                    <PlayCircle className="w-5 h-5" />
                    Ready to Create
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">🎬</div>
                    <h3 className="text-xl font-mono text-gray-200">
                      Your project is ready!
                    </h3>
                    <p className="text-gray-400">
                      This is where the actual project creation functionality
                      would be implemented. The configuration has been saved and
                      can be used to generate the video.
                    </p>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-lg p-4">
                    <h4 className="font-mono text-indigo-200 mb-2">
                      Next Steps:
                    </h4>
                    <ul className="text-sm text-indigo-300 space-y-1">
                      <li>• Add script input functionality</li>
                      <li>• Implement video generation pipeline</li>
                      <li>• Add preview capabilities</li>
                      <li>• Connect to processing backend</li>
                    </ul>
                  </div>

                  <div className="text-center">
                    <Button className="btn-primary px-8 py-3" disabled>
                      Start Generation (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
