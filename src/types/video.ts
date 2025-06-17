export interface VideoConfig {
  mode: "single" | "host_guest_host";
  duration: 30 | 60;
  selectedHost: string;
  selectedGuest?: string;
  singleCharacterText: string;
  host1Text: string;
  guest1Text: string;
  host2Text: string;
}

export interface JobStatus {
  jobId: string;
  status: "pending" | "queued" | "processing" | "completed" | "failed";
  progress?: string;
  error?: string;
  queuePosition?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Scripts {
  singleCharacterText: string;
  host1Text: string;
  guest1Text: string;
  host2Text: string;
}

export type ScriptField = keyof Scripts;

export interface ProcessingStep {
  label: string;
  completed: boolean;
  current: boolean;
}

export interface GenerateVideoRequest {
  mode: "single" | "host_guest_host";
  selectedHost: string;
  selectedGuest?: string;
  duration: 30 | 60;
  singleCharacterText?: string;
  host1Text?: string;
  guest1Text?: string;
  host2Text?: string;
}

export interface Character {
  id: string;
  name: string;
  initials: string;
  avatar: string;
}
