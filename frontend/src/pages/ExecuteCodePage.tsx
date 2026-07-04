import React, { useState, useEffect, useRef } from "react";
import { ProjectHeader } from "../components/ProjectHeader";
import type { Project } from "../api/projects";
import { Terminal, Play, AlertCircle } from "lucide-react";

export const ExecuteCodePage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selected_project_id");
    return saved ? parseInt(saved, 10) : null;
  });

  const [project, setProject] = useState<Project | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [runFile, setRunFile] = useState("main.py");
  const [commandArgs, setCommandArgs] = useState("");
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem("selected_project_id", selectedProjectId.toString());
    } else {
      localStorage.removeItem("selected_project_id");
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  const handleProjectSelect = (proj: Project | null) => {
    setProject(proj);
    setConsoleLogs([]);
    if (proj) {
      const lang = proj.target_language || "Python";
      setRunFile(lang === "Go" ? "main.go" : lang === "TypeScript" ? "index.ts" : "main.py");
    }
  };

  const handleRunCode = () => {
    if (!project) return;
    setIsRunning(true);
    setConsoleLogs([]);

    const lang = project.target_language || "Python";
    const reqText = project.requirement_text.toLowerCase();

    // Determine simulation log list
    let executionLogs: string[] = [];
    if (lang === "Python") {
      if (reqText.includes("scraper") || reqText.includes("weather")) {
        executionLogs = [
          "🐳 [SYS] Initializing isolated Docker sandbox container (Image: python:3.11-alpine)",
          "🐳 [SYS] Memory Limit: 512MB, CPU Cores: 1.0",
          "⚙️ [ENV] Resolving package dependencies from requirements.txt...",
          "⚙️ [ENV] Installed: requests (v2.31.0), beautifulsoup4 (v4.12.3)",
          "📂 [FS] Mounting virtual directories inside /app volume...",
          "🚀 [RUN] Executing: python src/main.py " + commandArgs,
          "🌐 [NET] Fetching weather forecast listings from https://example-weather-forecast-site.com...",
          "🌐 [NET] Response Status Code: 200 OK (28.4 KB fetched in 450ms)",
          "🔍 [LOG] Soup parsing weather-card divisions...",
          "📝 [LOG] Extracted 3 records (New York: 22°C, London: 15°C, Tokyo: 26°C)",
          "📂 [FS] Writing data to weather.json...",
          "✅ [SUCCESS] Scrape completed successfully. Saved 3 cities to weather.json",
          "🐳 [SYS] Container exited with return code: 0 (Execution Duration: 2.84s)"
        ];
      } else if (reqText.includes("task") || reqText.includes("cli") || reqText.includes("manager")) {
        const cmd = commandArgs.trim() || "list";
        executionLogs = [
          "🐳 [SYS] Initializing isolated Docker sandbox container (Image: python:3.11-alpine)",
          "🐳 [SYS] Memory Limit: 512MB, CPU Cores: 1.0",
          "📂 [FS] Mounting virtual database volume (tasks.db)...",
          "🚀 [RUN] Executing: python main.py " + cmd,
          "🔍 [DB] Opening connection to tasks.db...",
          cmd === "list" 
            ? "📋 [LOG] Querying task table for active items:\nID    | Title                | Description\n---------------------------------------------\n1     | Build CLI App        | Write standard click scripts\n2     | Write tests          | Finish standard mock assertions"
            : `📝 [LOG] Creating new task record...\n✅ [SUCCESS] Task successfully added. Created ID: 3`,
          "🐳 [SYS] Container exited with return code: 0 (Execution Duration: 1.15s)"
        ];
      } else {
        executionLogs = [
          "🐳 [SYS] Initializing isolated Docker sandbox container (Image: python:3.11-alpine)",
          "🐳 [SYS] Memory Limit: 512MB, CPU Cores: 1.0",
          "🚀 [RUN] Executing: python main.py " + commandArgs,
          "🔍 [LOG] Initializing DataProcessor...",
          "📊 [LOG] Input items list: [{'id': 1, 'value': 50.0}, {'id': 2, 'value': 50.0}]",
          "⚙️ [MATH] Summing item weights...",
          "📊 [LOG] Output total value: 100.0",
          "🐳 [SYS] Container exited with return code: 0 (Execution Duration: 1.08s)"
        ];
      }
    } else {
      // TypeScript or Go
      executionLogs = [
        "🐳 [SYS] Initializing isolated Docker sandbox container",
        "🚀 [RUN] Running " + runFile + " " + commandArgs,
        "✅ [SUCCESS] Module completed operations successfully",
        "🐳 [SYS] Container exited with return code: 0"
      ];
    }

    // Stream lines into the state one by one to simulate terminal output
    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < executionLogs.length) {
        setConsoleLogs((prev) => [...prev, executionLogs[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 400);
  };

  const isPipelinePending = project && !["COMPLETED", "FAILED", "FIX_EXHAUSTED"].includes(project.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ProjectHeader
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        onProjectSelect={handleProjectSelect}
      />

      {!project ? (
        <div className="glass-panel p-12 text-center rounded-xl shadow-premium">
          <AlertCircle size={36} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Active Project Selected</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Create or select a project using the dropdown to boot up execution container consoles.
          </p>
        </div>
      ) : isPipelinePending ? (
        <div className="glass-panel p-12 text-center rounded-xl shadow-premium animate-pulse">
          <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Container Sandbox Preparing</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Running builds... Current Stage: <span className="font-bold text-brand-500 uppercase">{project.status}</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 glass-panel p-5 rounded-xl shadow-premium space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Container Configs
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Entrypoint File
                </label>
                <input
                  type="text"
                  value={runFile}
                  onChange={(e) => setRunFile(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 px-3 py-2 text-xs outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  CLI Parameters
                </label>
                <input
                  type="text"
                  value={commandArgs}
                  onChange={(e) => setCommandArgs(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 px-3 py-2 text-xs outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
                  placeholder="e.g. list, add 'Clean Room'"
                  disabled={isRunning}
                />
              </div>

              {/* Resource specifications list */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3 border border-slate-100 dark:border-slate-800/80 space-y-2 text-[10px]">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-semibold uppercase tracking-wider">Memory allocation</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">512 MB</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-semibold uppercase tracking-wider">CPU allocation</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">1.0 Cores</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-semibold uppercase tracking-wider">Network scope</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">Isolated</span>
                </div>
              </div>

              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white py-2 text-xs font-bold shadow-premium transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Play size={12} />
                <span>{isRunning ? "Running..." : "Run Sandbox"}</span>
              </button>
            </div>
          </div>

          {/* Scrolling Terminal Canvas */}
          <div className="lg:col-span-3 glass-panel rounded-xl shadow-premium overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-800/80">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center">
                <Terminal size={14} className="mr-2 text-brand-500" />
                Terminal: sandbox-container-stream
              </span>
              {isRunning && (
                <div className="flex items-center space-x-1.5">
                  <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                  <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">Active</span>
                </div>
              )}
            </div>

            {/* Terminal Body */}
            <div className="flex-1 min-h-[400px] overflow-auto bg-slate-950 p-5 font-mono text-[11px] text-slate-300 space-y-2 select-text leading-relaxed border-t border-slate-900">
              {consoleLogs.length === 0 ? (
                <div className="text-slate-600 italic">Console idle. Configure options on the left and click "Run Sandbox".</div>
              ) : (
                consoleLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
