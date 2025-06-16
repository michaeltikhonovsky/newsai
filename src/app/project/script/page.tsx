"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import {
  ArrowLeft,
  Settings,
  FileText,
  Clock,
  User,
  Users,
  AlertCircle,
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

type ScriptField = keyof {
  singleCharacterText: string;
  host1Text: string;
  guest1Text: string;
  host2Text: string;
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

  const handleContinue = () => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      ...scripts,
    };

    // Save updated config
    localStorage.setItem("videoConfig", JSON.stringify(updatedConfig));

    // Navigate to project creation
    router.push("/project/create");
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
                    >
                      Modify Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Script Input */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-2"
            >
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
                        disabled={!canProceed()}
                      >
                        Create Video →
                      </Button>
                    </div>
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
