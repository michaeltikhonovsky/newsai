"use client";

import { createContext, useContext, ReactNode } from "react";
import { useGlobalVideoProgress } from "@/hooks/useGlobalVideoProgress";

interface OngoingGeneration {
  jobId: string;
  title: string;
  startedAt: string;
  lastStatus?: {
    jobId: string;
    status: "pending" | "queued" | "processing" | "completed" | "failed";
    progress?: string;
    error?: string;
    queuePosition?: number;
    createdAt: string;
    updatedAt: string;
  };
}

interface GlobalVideoProgressContextType {
  ongoingGenerations: OngoingGeneration[];
  isVisible: boolean;
  addGeneration: (jobId: string, title: string) => void;
  removeGeneration: (jobId: string) => void;
  updateGeneration: (
    jobId: string,
    status: {
      jobId: string;
      status: "pending" | "queued" | "processing" | "completed" | "failed";
      progress?: string;
      error?: string;
      queuePosition?: number;
      createdAt: string;
      updatedAt: string;
    }
  ) => void;
  clearAll: () => void;
  getProgress: (generation: OngoingGeneration) => number;
}

const GlobalVideoProgressContext = createContext<
  GlobalVideoProgressContextType | undefined
>(undefined);

export const useGlobalVideoProgressContext = () => {
  const context = useContext(GlobalVideoProgressContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalVideoProgressContext must be used within a GlobalVideoProgressProvider"
    );
  }
  return context;
};

interface GlobalVideoProgressProviderProps {
  children: ReactNode;
}

export const GlobalVideoProgressProvider = ({
  children,
}: GlobalVideoProgressProviderProps) => {
  const {
    ongoingGenerations,
    isVisible,
    addGeneration,
    removeGeneration,
    updateGeneration,
    clearAll,
    getProgress,
  } = useGlobalVideoProgress();

  const value = {
    ongoingGenerations,
    isVisible,
    addGeneration,
    removeGeneration,
    updateGeneration,
    clearAll,
    getProgress,
  };

  return (
    <GlobalVideoProgressContext.Provider value={value}>
      {children}
    </GlobalVideoProgressContext.Provider>
  );
};
