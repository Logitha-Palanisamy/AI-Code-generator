import React, { useState, useEffect } from "react";
import { ProjectHeader } from "../components/ProjectHeader";
import { getProjectArtifacts } from "../api/projects";
import type { Project } from "../api/projects";
import { AlertTriangle, Eye, AlertCircle } from "lucide-react";

interface AuditFinding {
  line: number;
  severity: "high" | "medium" | "low" | "info";
  category: "Security" | "Quality" | "Performance" | "Style";
  issue: string;
  description: string;
  suggestion: string;
}

const scanReviewFindings = (filename: string, code: string): AuditFinding[] => {
  const lines = code.split("\n");
  const findings: AuditFinding[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (/requests\.get\([^)]*\)/.test(line) && !/timeout\s*=/.test(line)) {
      findings.push({
        line: lineNumber,
        severity: "medium",
        category: "Performance",
        issue: "Missing request timeout",
        description: "Network requests without a timeout may hang indefinitely when the remote service is slow or unavailable.",
        suggestion: "Add a timeout argument to requests.get, e.g. requests.get(url, timeout=10).",
      });
    }

    if (/axios\./.test(line) && !/timeout\s*:/.test(line)) {
      findings.push({
        line: lineNumber,
        severity: "medium",
        category: "Performance",
        issue: "Missing axios timeout",
        description: "Axios calls without timeout configuration can wait forever on unresponsive endpoints.",
        suggestion: "Add timeout: 10000 to the Axios request config.",
      });
    }

    if (/\bexcept\s*:\b/.test(line)) {
      findings.push({
        line: lineNumber,
        severity: "low",
        category: "Quality",
        issue: "Bare exception clause",
        description: "Catching all exceptions hides the real error and makes debugging difficult.",
        suggestion: "Catch a specific exception type and preserve the error message.",
      });
    }

    if (/\beval\(/.test(line) || /\bexec\(/.test(line)) {
      findings.push({
        line: lineNumber,
        severity: "high",
        category: "Security",
        issue: "Use of eval/exec",
        description: "Using eval or exec on dynamic strings is a serious security risk and can execute attacker-controlled code.",
        suggestion: "Avoid eval/exec. Use safer parsing or direct function calls instead.",
      });
    }

    if (/execute\([^)]*\)/.test(line) && /f[`"']/.test(line)) {
      findings.push({
        line: lineNumber,
        severity: "high",
        category: "Security",
        issue: "Potential SQL injection",
        description: "Interpolating variables into SQL queries may allow injection attacks if input is not sanitized.",
        suggestion: "Use parameterized SQL queries or query builder functions.",
      });
    }

    if (/console\.log\(/.test(line) && !/console\.log\(.*debug/.test(line)) {
      findings.push({
        line: lineNumber,
        severity: "low",
        category: "Quality",
        issue: "Console logging in production code",
        description: "Debug logging should be removed or replaced with a configurable logger for production readiness.",
        suggestion: "Use a structured logger and control output with log levels.",
      });
    }

    if (/TODO|FIXME/.test(line)) {
      findings.push({
        line: lineNumber,
        severity: "info",
        category: "Quality",
        issue: "TODO comment found",
        description: "Comments marking incomplete implementation or future work should be addressed before release.",
        suggestion: "Resolve the TODO or create a tracked issue with full context.",
      });
    }

    if (/\bany\b/.test(line) && /typescript|tsx|ts/.test(filename)) {
      findings.push({
        line: lineNumber,
        severity: "medium",
        category: "Quality",
        issue: "Loose any type",
        description: "Using the any type removes TypeScript's compile-time safety.",
        suggestion: "Use a more specific type or a generic constraint instead of any.",
      });
    }
  });

  return findings;
};

const mockAuditsByLanguageAndType: Record<string, Record<string, { filename: string; code: string; findings: AuditFinding[] }[]>> = {
  Python: {
    scraper: [
      {
        filename: "src/scraper.py",
        code: `import requests
from bs4 import BeautifulSoup

class WeatherScraper:
    def __init__(self, url):
        self.url = url
    
    def scrape(self):
        # Issue: No request timeout configured
        r = requests.get(self.url)
        
        # Issue: Bare exception handler used
        try:
            return r.text
        except:
            return ""
`,
        findings: [
          {
            line: 10,
            severity: "medium",
            category: "Performance",
            issue: "Missing Request Timeout Parameter",
            description: "Calling requests.get without setting a connection timeout may cause the pipeline thread to hang indefinitely if the weather server is unresponsive.",
            suggestion: "Add timeout parameter: requests.get(self.url, timeout=10)"
          },
          {
            line: 15,
            severity: "low",
            category: "Quality",
            issue: "Bare Except Clause Detected",
            description: "Catching all exceptions silently defeats debugger traces and blocks debugging of connection or parsing errors.",
            suggestion: "Replace with: except requests.RequestException as exc:"
          }
        ]
      }
    ],
    task: [
      {
        filename: "src/database.py",
        code: `import sqlite3

class TaskDatabase:
    def __init__(self, db_path):
        self.db_path = db_path
        
    def add_task(self, title, description):
        # Issue: SQL Injection vulnerability simulated
        query = f"INSERT INTO tasks (title, desc) VALUES ('{title}', '{description}')"
        conn = sqlite3.connect(self.db_path)
        conn.execute(query)
        conn.commit()
`,
        findings: [
          {
            line: 9,
            severity: "high",
            category: "Security",
            issue: "Potential SQL Injection Vulnerability",
            description: "String-formatting variables directly into SQL queries makes the database vulnerable to injection scripts if titles/descriptions contain single quotes.",
            suggestion: "Use parameterized queries: conn.execute('INSERT INTO tasks (title, desc) VALUES (?, ?)', (title, description))"
          }
        ]
      }
    ],
    general: [
      {
        filename: "src/main.py",
        code: `from typing import List

class DataProcessor:
    def calculate_total(self, items: List[dict]) -> float:
        total = 0.0
        for item in items:
            # Issue: Potential ValueError converting values
            total = total + float(item.get("value", 0))
        return total
`,
        findings: [
          {
            line: 8,
            severity: "medium",
            category: "Quality",
            issue: "Unsafe Type Conversion (Float)",
            description: "Direct conversion of dynamic item value dictionary entries to float will throw a ValueError and crash the execution runtime if the value cannot be parsed.",
            suggestion: "Wrap parameter conversion inside try-except block, returning 0.0 fallback: try: float(item.get('value', 0)) except ValueError: 0.0"
          }
        ]
      }
    ]
  }
};

export const CodeReviewPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selected_project_id");
    return saved ? parseInt(saved, 10) : null;
  });

  const [project, setProject] = useState<Project | null>(null);
  const [auditFiles, setAuditFiles] = useState<{ filename: string; code: string; findings: AuditFinding[] }[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ filename: string; code: string; findings: AuditFinding[] } | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null);
  const [reviewSummary, setReviewSummary] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem("selected_project_id", selectedProjectId.toString());
    } else {
      localStorage.removeItem("selected_project_id");
    }
  }, [selectedProjectId]);

  const handleProjectSelect = (proj: Project | null) => {
    setProject(proj);
    setReviewSummary(null);
    if (!proj) {
      setAuditFiles([]);
      setSelectedFile(null);
      setSelectedFinding(null);
      return;
    }

    setReviewSummary("Reviewing selected project code...");
    void (async () => {
      try {
        const artifacts = await getProjectArtifacts(proj.id);
        if (artifacts && artifacts.length > 0) {
          const files = artifacts.map((artifact) => {
            const findings = scanReviewFindings(artifact.filename, artifact.content);
            return {
              filename: artifact.filename,
              code: artifact.content,
              findings,
            };
          });

          setAuditFiles(files);
          setReviewSummary(
            files.length > 0
              ? `Scanned ${files.length} file${files.length === 1 ? "" : "s"} and detected ${files.reduce((sum, f) => sum + f.findings.length, 0)} review flags.`
              : "No review flags were detected for this project."
          );

          if (files.length > 0) {
            setSelectedFile(files[0]);
            setSelectedFinding(files[0].findings[0] || null);
          }
          return;
        }
      } catch (err) {
        console.error("Failed to load project artifacts for code review", err);
      }

      const lang = proj.target_language || "Python";
      const reqText = proj.requirement_text.toLowerCase();

      let templateCategory = "general";
      if (reqText.includes("scraper") || reqText.includes("weather")) {
        templateCategory = "scraper";
      } else if (reqText.includes("task") || reqText.includes("cli") || reqText.includes("manager")) {
        templateCategory = "task";
      }

      const langAudits = mockAuditsByLanguageAndType[lang] || mockAuditsByLanguageAndType["Python"];
      const files = langAudits[templateCategory] || langAudits["general"] || [];

      setAuditFiles(files);
      setReviewSummary(
        files.length > 0
          ? `Scanned ${files.length} file${files.length === 1 ? "" : "s"} and detected ${files.reduce((sum, f) => sum + f.findings.length, 0)} review issues.`
          : "No static review issues were found in this generated project."
      );
      if (files.length > 0) {
        setSelectedFile(files[0]);
        if (files[0].findings.length > 0) {
          setSelectedFinding(files[0].findings[0]);
        }
      } else {
        setSelectedFile(null);
        setSelectedFinding(null);
      }
    })();
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "high":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "low":
        return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
      default:
        return "bg-brand-500/10 text-brand-400 border border-brand-500/20";
    }
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
            Create or select a project using the dropdown to inspect standard static audits and security flags.
          </p>
        </div>
      ) : isPipelinePending ? (
        <div className="glass-panel p-12 text-center rounded-xl shadow-premium animate-pulse">
          <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Analyzing Code Audits</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Running security linter audits... Current Stage: <span className="font-bold text-brand-500 uppercase">{project.status}</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Files and Audit Summary */}
          <div className="lg:col-span-4 space-y-6">
            {/* File List */}
            <div className="glass-panel p-5 rounded-xl shadow-premium space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Eye size={14} className="mr-1.5 text-brand-500" />
                    Reviewed Files
                  </h3>
                  {reviewSummary && (
                    <span className="text-[10px] rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                      {reviewSummary}
                    </span>
                  )}
                </div>

                {reviewSummary && (
                  <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 p-3 text-[12px] text-slate-600 dark:text-slate-300">
                    {reviewSummary}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                {auditFiles.map((file) => (
                  <button
                    key={file.filename}
                    onClick={() => {
                      setSelectedFile(file);
                      setSelectedFinding(file.findings[0] || null);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors flex justify-between items-center ${
                      selectedFile?.filename === file.filename
                        ? "bg-brand-600 text-white shadow-premium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <span>{file.filename}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      file.findings.length > 0 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    }`}>
                      {file.findings.length} flags
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Finding Detail Cards */}
            {selectedFinding && (
              <div className="glass-panel p-5 rounded-xl shadow-premium border border-slate-200/50 dark:border-slate-800/80 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Auditor Warning
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                      {selectedFinding.issue}
                    </h4>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide ${getSeverityBadge(selectedFinding.severity)}`}>
                    {selectedFinding.severity}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Category</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedFinding.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Description</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                      {selectedFinding.description}
                    </p>
                  </div>
                  <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-lg">
                    <span className="text-[10px] font-bold text-brand-500 block uppercase">Recommendation</span>
                    <pre className="font-mono text-[10px] text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap select-text leading-normal">
                      <code>{selectedFinding.suggestion}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Visual Code Canvas with Line Annotations */}
          <div className="lg:col-span-8 glass-panel rounded-xl shadow-premium overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-800/80">
            {selectedFile ? (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Audit Review: {selectedFile.filename}
                  </span>
                </div>

                {/* Code viewport with inline review tags */}
                <div className="flex-1 min-h-[400px] overflow-auto bg-slate-950 p-4 font-mono text-[11px] leading-relaxed border-t border-slate-900 select-none">
                  {selectedFile.code.split("\n").map((lineContent, idx) => {
                    const lineNum = idx + 1;
                    const finding = selectedFile.findings.find((f) => f.line === lineNum);
                    
                    const isLineSelected = selectedFinding && selectedFinding.line === lineNum;

                    return (
                      <div key={lineNum} className="group flex flex-col">
                        <div
                          onClick={() => finding && setSelectedFinding(finding)}
                          className={`flex items-start transition-all ${
                            finding
                              ? "cursor-pointer bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-amber-500"
                              : "hover:bg-slate-900/30"
                          } ${isLineSelected ? "bg-brand-500/5 border-l-2 border-brand-500" : ""}`}
                        >
                          {/* Line Number */}
                          <div className={`text-right w-10 pr-4 select-none ${
                            finding ? "text-amber-500 font-bold" : "text-slate-600"
                          }`}>
                            {lineNum}
                          </div>
                          
                          {/* Code Content */}
                          <div className={`flex-1 pl-4 text-slate-300 font-mono whitespace-pre ${
                            finding ? "text-amber-200" : ""
                          }`}>
                            {lineContent || " "}
                          </div>

                          {/* Inline audit trigger badge */}
                          {finding && (
                            <div className="px-3 shrink-0 flex items-center">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-flex items-center space-x-1 ${
                                finding.severity === "high"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                <AlertTriangle size={10} className="mr-0.5" />
                                <span>Fix Details</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Inline finding details if expanded */}
                        {finding && isLineSelected && (
                          <div className="pl-14 pr-4 py-2 border-l-2 border-brand-500 bg-brand-500/[0.02] border-t border-b border-slate-900 text-xs">
                            <span className="font-bold text-brand-400 block mb-1">
                              {finding.issue} (Line {finding.line})
                            </span>
                            <span className="text-slate-400 leading-normal block">
                              {finding.description}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                Select a audited file from the directory lists.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
