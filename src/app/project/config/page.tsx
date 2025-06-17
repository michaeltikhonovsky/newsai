"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, Check, Users, User, Clock } from "lucide-react";

// Character definitions
interface Character {
  id: string;
  name: string;
  initials: string;
  avatar: string;
}

interface HostGuestPair {
  id: string;
  name: string;
  folder: string;
  hostCharacterId: string;
  guestCharacterId: string;
}

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

const hostGuestPairs: HostGuestPair[] = [
  {
    id: "pair1",
    name: "LH RE LH",
    folder: "LH_RE_LH",
    hostCharacterId: "lh",
    guestCharacterId: "RE",
  },
  {
    id: "pair2",
    name: "AC RE AC",
    folder: "AC_RE_AC",
    hostCharacterId: "AC",
    guestCharacterId: "RE",
  },
  {
    id: "pair3",
    name: "LH HW LH",
    folder: "LH_HW_LH",
    hostCharacterId: "lh",
    guestCharacterId: "HW",
  },
  {
    id: "pair4",
    name: "AC HW AC",
    folder: "AC_HW_AC",
    hostCharacterId: "AC",
    guestCharacterId: "HW",
  },
];

const CharacterCard = ({
  character,
  isSelected,
  onSelect,
  type,
}: {
  character: Character;
  isSelected: boolean;
  onSelect: (id: string) => void;
  type: "host" | "guest";
}) => (
  <motion.div
    className="relative cursor-pointer flex flex-col items-center"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onSelect(character.id)}
  >
    <div
      className={`w-20 h-20 rounded-full border-2 transition-all relative overflow-hidden ${
        isSelected
          ? "border-indigo-400"
          : "border-gray-600 hover:border-gray-500"
      }`}
    >
      <Image
        src={character.avatar}
        alt={character.name}
        className="w-full h-full object-cover"
        width={80}
        height={80}
      />
    </div>

    <div className="mt-2 w-32">
      <p className="text-sm font-mono text-gray-300 text-center leading-tight">
        {character.name}
      </p>
    </div>
  </motion.div>
);

export default function ProjectConfigPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "host_guest_host">("single");
  const [duration, setDuration] = useState<30 | 60>(30);
  const [selectedHost, setSelectedHost] = useState<string>("");
  const [selectedGuest, setSelectedGuest] = useState<string>("");

  const handleModeChange = (newMode: "single" | "host_guest_host") => {
    setMode(newMode);
    setSelectedHost("");
    setSelectedGuest("");
  };

  const handleDurationChange = (newDuration: 30 | 60) => {
    setDuration(newDuration);
  };

  const handleHostSelect = (hostId: string) => {
    setSelectedHost(hostId);
  };

  const handleGuestSelect = (guestId: string) => {
    setSelectedGuest(guestId);
  };

  const canProceed =
    mode === "single" ? selectedHost : selectedHost && selectedGuest;

  const handleContinue = () => {
    const config: VideoConfig = {
      mode,
      duration,
      selectedHost,
      selectedGuest: mode === "host_guest_host" ? selectedGuest : undefined,
      singleCharacterText: "",
      host1Text: "",
      guest1Text: "",
      host2Text: "",
    };

    // Store config in localStorage or pass to next page
    localStorage.setItem("videoConfig", JSON.stringify(config));

    // Navigate to script input page
    router.push("/project/script");
  };

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
              <h1 className="header-text">PROJECT CONFIG</h1>
            </div>
            <p className="text-lg text-gray-400">
              {">"} Configure your news clip settings and select your anchors.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Mode Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Mode Selection Card */}
              <Card className="bg-gray-900/60 border border-gray-700">
                <CardHeader>
                  <CardTitle className="font-mono text-gray-200 flex items-center gap-3">
                    Mode Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Single Host Mode */}
                  <motion.div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      mode === "single"
                        ? "border-indigo-400 bg-indigo-500/10"
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    }`}
                    onClick={() => handleModeChange("single")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <User
                        className={`w-6 h-6 ${
                          mode === "single"
                            ? "text-indigo-400"
                            : "text-gray-400"
                        }`}
                      />
                      <div>
                        <h3
                          className={`font-mono font-bold ${
                            mode === "single"
                              ? "text-indigo-200"
                              : "text-gray-300"
                          }`}
                        >
                          Single Host
                        </h3>
                        <p className="text-sm text-gray-500">
                          One anchor presents the entire news segment
                        </p>
                      </div>
                      {mode === "single" && (
                        <div className="ml-auto">
                          <Check className="w-5 h-5 text-indigo-400" />
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Host + Guest Mode */}
                  <motion.div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      mode === "host_guest_host"
                        ? "border-indigo-400 bg-indigo-500/10"
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    }`}
                    onClick={() => handleModeChange("host_guest_host")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <Users
                        className={`w-6 h-6 ${
                          mode === "host_guest_host"
                            ? "text-indigo-400"
                            : "text-gray-400"
                        }`}
                      />
                      <div>
                        <h3
                          className={`font-mono font-bold ${
                            mode === "host_guest_host"
                              ? "text-indigo-200"
                              : "text-gray-300"
                          }`}
                        >
                          Host + Guest
                        </h3>
                        <p className="text-sm text-gray-500">
                          Host introduces, guest speaks, host concludes
                        </p>
                      </div>
                      {mode === "host_guest_host" && (
                        <div className="ml-auto">
                          <Check className="w-5 h-5 text-indigo-400" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>

              {/* Duration Selection Card */}
              <Card className="bg-gray-900/60 border border-gray-700">
                <CardHeader>
                  <CardTitle className="font-mono text-gray-200 flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    Duration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 30 Second Option */}
                  <motion.div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      duration === 30
                        ? "border-indigo-400 bg-indigo-500/10"
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    }`}
                    onClick={() => handleDurationChange(30)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-mono ${
                          duration === 30
                            ? "border-indigo-400 text-indigo-400"
                            : "border-gray-500 text-gray-400"
                        }`}
                      >
                        30
                      </div>
                      <div>
                        <h3
                          className={`font-mono font-bold ${
                            duration === 30
                              ? "text-indigo-200"
                              : "text-gray-300"
                          }`}
                        >
                          30 Seconds (10 credits)
                        </h3>
                        <p className="text-sm text-gray-500">
                          Quick news bite (~400 characters)
                        </p>
                      </div>
                      {duration === 30 && (
                        <div className="ml-auto">
                          <Check className="w-5 h-5 text-indigo-400" />
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* 60 Second Option */}
                  <motion.div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      duration === 60
                        ? "border-indigo-400 bg-indigo-500/10"
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    }`}
                    onClick={() => handleDurationChange(60)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-mono ${
                          duration === 60
                            ? "border-indigo-400 text-indigo-400"
                            : "border-gray-500 text-gray-400"
                        }`}
                      >
                        60
                      </div>
                      <div>
                        <h3
                          className={`font-mono font-bold ${
                            duration === 60
                              ? "text-indigo-200"
                              : "text-gray-300"
                          }`}
                        >
                          60 Seconds (20 credits)
                        </h3>
                        <p className="text-sm text-gray-500">
                          Detailed news segment (~800 characters)
                        </p>
                      </div>
                      {duration === 60 && (
                        <div className="ml-auto">
                          <Check className="w-5 h-5 text-indigo-400" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - Character Selection */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-gray-900/60 border border-gray-700">
                <CardHeader>
                  <CardTitle className="font-mono text-gray-200">
                    Character Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hosts Selection */}
                  <div>
                    <h3 className="font-mono text-indigo-200 mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Hosts:
                    </h3>
                    <div className="flex gap-4 flex-wrap">
                      {hosts.map((host) => (
                        <CharacterCard
                          key={host.id}
                          character={host}
                          isSelected={selectedHost === host.id}
                          onSelect={handleHostSelect}
                          type="host"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Guests Selection - Only show in host+guest mode */}
                  {mode === "host_guest_host" && (
                    <div>
                      <h3 className="font-mono text-indigo-200 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Guests:
                      </h3>
                      <div className="flex gap-4 flex-wrap">
                        {guests.map((guest) => (
                          <CharacterCard
                            key={guest.id}
                            character={guest}
                            isSelected={selectedGuest === guest.id}
                            onSelect={handleGuestSelect}
                            type="guest"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Configuration Display */}
                  {(selectedHost || selectedGuest) && (
                    <div className="mt-6 p-4 bg-gray-800/50 border border-gray-600 rounded-lg">
                      <h4 className="font-mono text-gray-300 mb-2">
                        Selected Configuration:
                      </h4>
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>
                          Mode:{" "}
                          <span className="text-indigo-300">
                            {mode === "single" ? "Single Host" : "Host + Guest"}
                          </span>
                        </p>
                        <p>
                          Duration:{" "}
                          <span className="text-indigo-300">
                            {duration} seconds
                          </span>
                        </p>
                        {selectedHost && (
                          <p>
                            Host:{" "}
                            <span className="text-indigo-300">
                              {hosts.find((h) => h.id === selectedHost)?.name}
                            </span>
                          </p>
                        )}
                        {mode === "host_guest_host" && selectedGuest && (
                          <p>
                            Guest:{" "}
                            <span className="text-indigo-300">
                              {guests.find((g) => g.id === selectedGuest)?.name}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Continue Button */}
              <motion.div
                className="mt-6 flex justify-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Button
                  className="btn-primary px-8 py-3"
                  onClick={handleContinue}
                  disabled={!canProceed}
                >
                  $ Continue to Script →
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
