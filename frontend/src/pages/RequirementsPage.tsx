import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../api/projects";
import type { Project } from "../api/projects";
import { Play, Sparkles, Terminal, Layers, ArrowRight } from "lucide-react";
import { getAccessToken } from "../api/client";

export const RequirementsPage: React.FC = () => {
  const [requirementText, setRequirementText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Python");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [, setActiveProject] = useState<Project | null>(null);
  
  const [wsLogs, setWsLogs] = useState<Array<{ stage: string; message: string; timestamp: string; isError?: boolean }>>([]);
  const [currentStage, setCurrentStage] = useState<string>("INIT");
  const socketRef = useRef<WebSocket | null>(null);

  // Suggested Prompts
  const suggestions = [
    "Build a CLI Task Manager with local SQLite storage",
    "Write a high-performance Redis cache helper with TTL support",
    "Create a Weather web scraper that stores results in JSON"
  ];

  const handleApplySuggestion = (text: string) => {
    setRequirementText(text);
  };

  const handleStartPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRequirement = requirementText.trim();

    if (!trimmedRequirement) {
      setFormError("Please provide a requirements description.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    setWsLogs([]);
    setCurrentStage("INIT");

    try {
      const project = await createProject(trimmedRequirement, targetLanguage);
      setActiveProject(project);
      // Persist selected project id so CodeGeneratorPage will pick it up
      try {
        localStorage.setItem("selected_project_id", String(project.id));
      } catch {}
      // Navigate to the code generator so user can inspect generated artifacts
      navigate("/code-generator");
      setWsLogs((prev) => [
        ...prev,
        {
          stage: "INIT",
          message: `Starting ${targetLanguage} generation pipeline for: ${trimmedRequirement}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      connectWebSocket(project.id);
    } catch (err: any) {
      console.error("Failed to start pipeline", err);
      const detail = err?.response?.data?.detail || err?.message || "Failed to start requirements parsing.";
      setFormError(String(detail));
      setIsSubmitting(false);
    }
  };

  const navigate = useNavigate();

  const connectWebSocket = (projectId: number) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const token = getAccessToken();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/project/${projectId}?token=${token}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected for project", projectId);
      setWsLogs((prev) => [
        ...prev,
        { stage: "INIT", message: "WebSocket connection established. Waiting for pipeline...", timestamp: new Date().toISOString() }
      ]);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WS update:", data);
        
        setCurrentStage(data.stage);
        setWsLogs((prev) => [
          ...prev,
          {
            stage: data.stage,
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            isError: !!data.error
          }
        ]);

        if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "FIX_EXHAUSTED") {
          setIsSubmitting(false);
          setWsLogs((prev) => [
            ...prev,
            {
              stage: data.status,
              message: data.status === "COMPLETED" ? "Generation completed successfully." : "Generation ended with a failure state.",
              timestamp: data.timestamp || new Date().toISOString(),
              isError: data.status !== "COMPLETED",
            },
          ]);
          socket.close();
        }
      } catch (err) {
        console.error("Failed to parse socket message", err);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error", err);
      setWsLogs((prev) => [
        ...prev,
        { stage: "ERROR", message: "WebSocket pipeline sync encountered connection issues.", timestamp: new Date().toISOString(), isError: true }
      ]);
    };

    socket.onclose = () => {
      console.log("WebSocket closed for project", projectId);
    };
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const pipelineStages = [
    { key: "INIT", label: "Initialize" },
    { key: "ANALYZING", label: "Deconstruct Spec" },
    { key: "GENERATING_CODE", label: "Compile Code" },
    { key: "REVIEWING", label: "Security Review" },
    { key: "GENERATING_TESTS", label: "Write Tests" },
    { key: "EXECUTING_TESTS", label: "Execute sandbox" },
    { key: "COMPLETED", label: "Completed" }
  ];

  const getStageStatus = (stageKey: string) => {
    const stageOrder = ["INIT", "ANALYZING", "GENERATING_CODE", "REVIEWING", "GENERATING_TESTS", "EXECUTING_TESTS", "COMPLETED"];
    const currentIndex = stageOrder.indexOf(currentStage === "AUTO_FIXING" ? "EXECUTING_TESTS" : currentStage);
    const targetIndex = stageOrder.indexOf(stageKey);

    if (currentStage === "FAILED" || currentStage === "FIX_EXHAUSTED") {
      if (stageKey === "COMPLETED") return "failed";
    }

    if (currentIndex > targetIndex) return "completed";
    if (currentIndex === targetIndex) return "active";
    return "pending";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        {/* Requirement Form */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="glass-panel p-6 rounded-xl shadow-premium space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-brand-600/10 text-brand-600 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Define Specifications
              </h3>
            </div>
            
            <form onSubmit={handleStartPipeline} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Project Description
                </label>
                <textarea
                  value={requirementText}
                  onChange={(e) => setRequirementText(e.target.value)}
                  className="w-full h-32 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 p-3 text-xs outline-none focus:border-brand-500 dark:focus:border-brand-500 text-slate-800 dark:text-slate-200 resize-none transition-colors"
                  placeholder="Describe your project, database connections, schemas, CLI parameters, endpoints..."
                  disabled={isSubmitting}
                />

                {formError && (
                  <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-500 dark:text-red-400">
                    {formError}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Target Programming Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Python", "TypeScript", "Go"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setTargetLanguage(lang)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        targetLanguage === lang
                          ? "bg-brand-600 text-white border-brand-600 shadow-premium"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white/30 dark:bg-slate-950/20 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                      disabled={isSubmitting}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !requirementText.trim()}
                className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white py-2.5 text-xs font-bold shadow-premium transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white mr-2" />
                ) : (
                  <Play size={14} />
                )}
                <span>{isSubmitting ? `Initializing in ${targetLanguage}...` : `Initialize in ${targetLanguage}`}</span>
              </button>
            </form>
          </div>

          {/* Prompt Suggestions */}
          {!isSubmitting && (
            <div className="glass-panel p-6 rounded-xl shadow-premium space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Need Inspiration?
              </h4>
              <div className="space-y-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplySuggestion(s)}
                    className="flex items-center justify-between w-full text-left p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 hover:border-brand-500/20 hover:bg-brand-500/5 transition-all group"
                  >
                    <span className="text-xs text-slate-600 dark:text-slate-300 group-hover:text-brand-500 truncate pr-2">
                      {s}
                    </span>
                    <ArrowRight size={12} className="text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Build Console & Pipeline Progress */}
        <div className="w-full md:w-1/2 space-y-6">
          {/* Progress Tracker */}
          <div className="glass-panel p-6 rounded-xl shadow-premium">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center">
              <Layers size={16} className="text-brand-500 mr-2" />
              Pipeline Execution Status
            </h3>
            
            <div className="space-y-4">
              {pipelineStages.map((stage) => {
                const status = getStageStatus(stage.key);
                return (
                  <div key={stage.key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                        status === "completed"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : status === "active"
                          ? "bg-brand-600 text-white border-brand-600 shadow-premium animate-pulse"
                          : status === "failed"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
                      }`}>
                        {status === "completed" ? "✓" : "•"}
                      </div>
                      <span className={`text-xs font-semibold ${
                        status === "active"
                          ? "text-brand-500 dark:text-brand-400"
                          : status === "completed"
                          ? "text-slate-700 dark:text-slate-300"
                          : "text-slate-400"
                      }`}>
                        {stage.label}
                      </span>
                    </div>

                    {status === "active" && (
                      <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded font-bold animate-pulse uppercase">
                        Running
                      </span>
                    )}
                    {stage.key === "EXECUTING_TESTS" && currentStage === "AUTO_FIXING" && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold animate-pulse uppercase">
                        Auto Healing
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Terminal logs */}
          <div className="glass-panel p-6 rounded-xl shadow-premium space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Terminal size={14} className="mr-1.5" />
                Live Build Logs
              </span>
              <span className="text-[9px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 rounded px-1.5 py-0.5">
                WebSocket Connected
              </span>
            </div>

            <div className="h-60 rounded-lg bg-slate-950 p-4 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-2 border border-slate-900">
              {wsLogs.length === 0 ? (
                <div className="text-slate-600 italic">Waiting to spin up project container...</div>
              ) : (
                wsLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-slate-500 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={log.isError ? "text-rose-400" : log.stage === "AUTO_FIXING" ? "text-amber-400" : "text-brand-400"}>
                      [{log.stage}]
                    </span>
                    <span className="text-slate-200 whitespace-pre-wrap">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
