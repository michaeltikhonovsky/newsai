"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, FileText, Loader2 } from "lucide-react";

type ScriptField = keyof {
  singleCharacterText: string;
  host1Text: string;
  guest1Text: string;
  host2Text: string;
};

interface VideoConfig {
  mode: "single" | "host_guest_host";
  duration: 30 | 60;
  selectedHost: string;
  selectedGuest?: string;
}

interface Scripts {
  singleCharacterText: string;
  host1Text: string;
  guest1Text: string;
  host2Text: string;
}

interface ScriptInputFormProps {
  config: VideoConfig;
  scripts: Scripts;
  isGenerating: boolean;
  canProceed: boolean;
  onScriptChange: (field: ScriptField, value: string) => void;
  onGenerate: () => void;
  getCharacterCount: (field: ScriptField) => number;
  getCharacterLimit: (field: ScriptField) => number;
  isOverLimit: (field: ScriptField) => boolean;
}

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
  scripts: Scripts;
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

export const ScriptInputForm = ({
  config,
  scripts,
  isGenerating,
  canProceed,
  onScriptChange,
  onGenerate,
  getCharacterCount,
  getCharacterLimit,
  isOverLimit,
}: ScriptInputFormProps) => {
  return (
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
            handleScriptChange={onScriptChange}
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
              handleScriptChange={onScriptChange}
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
              handleScriptChange={onScriptChange}
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
              handleScriptChange={onScriptChange}
              getCharacterCount={getCharacterCount}
              getCharacterLimit={getCharacterLimit}
              isOverLimit={isOverLimit}
            />
          </div>
        )}

        {/* continue button */}
        <div className="pt-6 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {canProceed
                ? "✅ Script and credits ready for generation"
                : "⚠️ Complete all script fields and ensure sufficient credits to continue"}
            </div>
            <Button
              className="btn-primary px-8 py-3"
              onClick={onGenerate}
              disabled={!canProceed || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "$ Generate Video →"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
