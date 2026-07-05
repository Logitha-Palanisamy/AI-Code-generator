import React, { useState, useEffect } from "react";
import { getAccessToken } from "../api/client";
import { createProject, getProjectArtifacts, getProjectDetails, saveProjectArtifact } from "../api/projects";
import { ProjectHeader } from "../components/ProjectHeader";
import { CodeGeneratorForm } from "../components/CodeGeneratorForm";
import type { Project } from "../api/projects";

import { FileCode, AlertCircle, Copy, Check } from "lucide-react";

const CODE_GENERATOR_CACHE_KEY = "code_generator_cache";

const loadCachedGeneratedFiles = (projectId: number) => {
  try {
    const raw = localStorage.getItem(CODE_GENERATOR_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as Record<string, { filename: string; content: string }[]>;
    return cache[String(projectId)] || null;
  } catch {
    return null;
  }
};

const saveCachedGeneratedFiles = (projectId: number, files: { filename: string; content: string }[]) => {
  try {
    const raw = localStorage.getItem(CODE_GENERATOR_CACHE_KEY);
    const cache = raw ? (JSON.parse(raw) as Record<string, { filename: string; content: string }[]>) : {};
    cache[String(projectId)] = files;
    localStorage.setItem(CODE_GENERATOR_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore localStorage failures
  }
};

// Predefined gorgeous templates for realistic mock files
const mockFilesByLanguage: Record<string, Record<string, { filename: string; content: string }[]>> = {
  Python: {
    scraper: [
      {
        filename: "main.py",
        content: `import json
import requests
from bs4 import BeautifulSoup
from typing import List, Dict

class WeatherScraper:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    def fetch_page(self) -> str:
        """Fetches the HTML content of the target url."""
        response = requests.get(self.base_url, headers=self.headers)
        response.raise_for_status()
        return response.text

    def parse_weather(self, html: str) -> List[Dict[str, str]]:
        """Parses weather listings from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        results = []
        # Find weather cards/listings
        for card in soup.find_all("div", class_="weather-card"):
            city = card.find("h2", class_="city").text.strip()
            temp = card.find("span", class_="temp").text.strip()
            cond = card.find("p", class_="condition").text.strip()
            results.append({
                "city": city,
                "temperature": temp,
                "condition": cond
            })
        return results

    def save_results(self, data: List[Dict[str, str]], filepath: str) -> None:
        """Saves parsed listings as structured JSON."""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    url = "https://example-weather-forecast-site.com"
    scraper = WeatherScraper(url)
    try:
        print("Fetching weather details...")
        html = scraper.fetch_page()
        data = scraper.parse_weather(html)
        scraper.save_results(data, "weather.json")
        print(f"Scrape completed successfully. Saved {len(data)} cities to weather.json")
    except Exception as exc:
        print(f"Scraper execution failed: {exc}")
`
      },
      {
        filename: "requirements.txt",
        content: `requests>=2.31.0
beautifulsoup4>=4.12.3
urllib3>=2.2.1
`
      }
    ],
    task: [
      {
        filename: "main.py",
        content: `import argparse
import sys
from database import TaskDatabase

def parse_args():
    parser = argparse.ArgumentParser(description="CLI Task Management System")
    subparsers = parser.add_subparsers(dest="command", help="Available operations")

    # Add Command
    add_parser = subparsers.add_parser("add", help="Add a new task")
    add_parser.add_argument("title", type=str, help="Title of the task")
    add_parser.add_argument("--desc", type=str, default="", help="Description of the task")

    # Complete Command
    complete_parser = subparsers.add_parser("complete", help="Mark task as complete")
    complete_parser.add_argument("id", type=int, help="Task database ID")

    # List Command
    subparsers.add_parser("list", help="List all pending tasks")
    return parser.parse_args()

def main():
    args = parse_args()
    db = TaskDatabase("tasks.db")
    
    if args.command == "add":
        task_id = db.add_task(args.title, args.desc)
        print(f"Task successfully added. Created ID: {task_id}")
    elif args.command == "complete":
        success = db.complete_task(args.id)
        if success:
            print(f"Task ID {args.id} marked as complete.")
        else:
            print(f"Task ID {args.id} not found or already completed.", file=sys.stderr)
    elif args.command == "list":
        tasks = db.list_active_tasks()
        if not tasks:
            print("No active tasks found.")
        else:
            print(f"{'ID':<5} | {'Title':<20} | {'Description'}")
            print("-" * 50)
            for t in tasks:
                print(f"{t[0]:<5} | {t[1]:<20} | {t[2]}")
    else:
        print("Run with -h/--help to see list of valid arguments.")

if __name__ == "__main__":
    main()
`
      },
      {
        filename: "database.py",
        content: `import sqlite3
from typing import List, Tuple

class TaskDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    completed INTEGER DEFAULT 0
                )
            """)
            conn.commit()

    def add_task(self, title: str, description: str) -> int:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO tasks (title, description) VALUES (?, ?)",
                (title, description)
            )
            conn.commit()
            return cursor.lastrowid

    def complete_task(self, task_id: int) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE tasks SET completed = 1 WHERE id = ? AND completed = 0",
                (task_id,)
            )
            conn.commit()
            return cursor.rowcount > 0

    def list_active_tasks(self) -> List[Tuple[int, str, str]]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, title, description FROM tasks WHERE completed = 0")
            return cursor.fetchall()
`
      }
    ],
    general: [
      {
        filename: "main.py",
        content: `from typing import List
from database import DatabaseConnection

class DataProcessor:
    def __init__(self, db_path: str):
        self.db = DatabaseConnection(db_path)

    def calculate_total(self, items: List[dict]) -> float:
        """Calculates total transaction value, verifying positive floats."""
        total = 0.0
        for item in items:
            # Bug simulation on first run (fixed by healing: total = total + max(0.0, float(item.get("value", 0))))
            total = total + float(item.get("value", 0))
        return total

    def process_records(self) -> List[dict]:
        records = self.db.fetch_records()
        valid_records = [r for r in records if r.get("active")]
        return valid_records

if __name__ == "__main__":
    processor = DataProcessor("app.db")
    txs = [{"id": 1, "value": 50.0}, {"id": 2, "value": 50.0}]
    total = processor.calculate_total(txs)
    print(f"Processed total: {total}")
`
      },
      {
        filename: "database.py",
        content: `import sqlite3
from typing import List, Dict

class DatabaseConnection:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def fetch_records(self) -> List[Dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM items")
            return [dict(row) for row in cursor.fetchall()]
`
      }
    ]
  },
  TypeScript: {
    general: [
      {
        filename: "index.ts",
        content: `import { Database } from "./database";

interface Item {
  id: number;
  value: number;
  active: boolean;
}

export class DataProcessor {
  private db: Database;

  constructor(dbPath: string) {
    self.db = new Database(dbPath);
  }

  public calculateTotal(items: Item[]): number {
    let total = 0;
    for (const item of items) {
      total += item.value;
    }
    return total;
  }
}
`
      },
      {
        filename: "database.ts",
        content: `export class Database {
  constructor(private path: string) {}

  public fetchRecords(): any[] {
    return [
      { id: 1, value: 100, active: true },
      { id: 2, value: 200, active: false }
    ];
  }
}
`
      }
    ]
  },
  Go: {
    general: [
      {
        filename: "main.go",
        content: `package main

import (
	"fmt"
)

type Item struct {
	ID    int
	Value float64
}

func CalculateTotal(items []Item) float64 {
	total := 0.0
	for _, item := range items {
		total += item.Value
	}
	return total
}

func main() {
	items := []Item{
		{ID: 1, Value: 10.5},
		{ID: 2, Value: 24.8},
	}
	fmt.Printf("Total value: %f\\n", CalculateTotal(items))
}
`
      }
    ]
  }
};

export const CodeGeneratorPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selected_project_id");
    return saved ? parseInt(saved, 10) : null;
  });

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<{ filename: string; content: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ filename: string; content: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [projectRefresh, setProjectRefresh] = useState(0);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem("selected_project_id", selectedProjectId.toString());
    } else {
      localStorage.removeItem("selected_project_id");
    }
  }, [selectedProjectId]);

  const handleProjectSelect = (proj: Project | null) => {
    setProject(proj);
    if (!proj) {
      setFiles([]);
      setSelectedFile(null);
      return;
    }

    const cachedFiles = loadCachedGeneratedFiles(proj.id);
    if (cachedFiles && cachedFiles.length > 0) {
      setFiles(cachedFiles);
      setSelectedFile(cachedFiles[0]);
    }

    // Try to load real generated artifacts first (if any)
    (async () => {
      try {
        const artifacts = await getProjectArtifacts(proj.id);
        if (artifacts && artifacts.length > 0) {
          setFiles(artifacts);
          setSelectedFile(artifacts[0]);
          saveCachedGeneratedFiles(proj.id, artifacts);
          return;
        }
      } catch (err) {
        // ignore and fall back to templates
      }
    })();

    // Determine template based on requirement text and language
    const lang = proj.target_language || "Python";
    const reqText = proj.requirement_text.toLowerCase();
    
    let templateCategory = "general";
    if (reqText.includes("scraper") || reqText.includes("weather")) {
      templateCategory = "scraper";
    } else if (reqText.includes("task") || reqText.includes("cli") || reqText.includes("manager")) {
      templateCategory = "task";
    }

    const langTemplates = mockFilesByLanguage[lang] || mockFilesByLanguage["Python"];
    const fileTemplates = langTemplates[templateCategory] || langTemplates["general"] || [];

    if (!cachedFiles || cachedFiles.length === 0) {
      setFiles(fileTemplates);
      if (fileTemplates.length > 0) {
        setSelectedFile(fileTemplates[0]);
      } else {
        setSelectedFile(null);
      }
    }
  };

  // WebSocket for live pipeline events and artifact refreshes
  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    let cancelled = false;
    const syncProjectState = async () => {
      try {
        const latestProject = await getProjectDetails(selectedProjectId);
        if (cancelled) return;
        setProject((prev) => (prev && prev.id === latestProject.id ? { ...prev, ...latestProject } : latestProject));

        if (["COMPLETED", "CODE_GENERATED", "REVIEWED", "TESTS_GENERATED", "EXECUTING_TESTS", "AUTO_FIXING"].includes(latestProject.status)) {
          try {
            const artifacts = await getProjectArtifacts(selectedProjectId);
            if (!cancelled && artifacts && artifacts.length > 0) {
              setFiles(artifacts);
              setSelectedFile(artifacts[0]);
            }
          } catch (err) {
            console.error("Failed to refresh project artifacts", err);
          }
        }
      } catch (err) {
        console.error("Failed to refresh project status", err);
      }
    };

    syncProjectState();
    const intervalId = window.setInterval(syncProjectState, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedProjectId]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    const projectId = project?.id;
    if (!projectId) return;

    const token = getAccessToken();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/project/${projectId}?token=${token}`;

    try {
      socket = new WebSocket(wsUrl);
    } catch (err) {
      console.error("Failed to open WebSocket for code generator", err);
      return;
    }

    socket.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        // If code was generated or pipeline completed, fetch artifacts
        if (data.stage === "GENERATING_CODE" || data.status === "CODE_GENERATED" || data.status === "COMPLETED") {
          try {
            const artifacts = await getProjectArtifacts(projectId);
            if (artifacts && artifacts.length > 0) {
              setFiles(artifacts);
              setSelectedFile(artifacts[0]);
              saveCachedGeneratedFiles(projectId, artifacts);
            }
          } catch (err) {
            console.error("Failed to fetch project artifacts", err);
          }
        }
        // Also update project status shown in header
        if (data.status) {
          setProject((prev) => (prev ? { ...prev, status: data.status } : prev));
        }
      } catch (err) {
        console.error("Error parsing WS message", err);
      }
    };

    socket.onerror = (e) => console.error("CodeGenerator WS error", e);
    socket.onopen = () => console.log("CodeGenerator WS connected", projectId);
    socket.onclose = () => console.log("CodeGenerator WS closed", projectId);

    return () => {
      if (socket) socket.close();
    };
  }, [project?.id]);

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPipelinePending = project && !["COMPLETED", "FAILED", "FIX_EXHAUSTED"].includes(project.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Code Generator Form - Always Visible */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Code Generator</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Generate production-ready code from natural language descriptions powered by Claude AI
        </p>
        <CodeGeneratorForm
          onCodeGenerated={async (request, result) => {
            try {
              const newProject = await createProject(request.description, request.language);
              setSelectedProjectId(newProject.id);
              setProject(newProject);
              setProjectRefresh((prev) => prev + 1);

              const extMap: Record<string, string> = {
                Python: "py",
                JavaScript: "js",
                TypeScript: "ts",
                Java: "java",
                "C#": "cs",
                Go: "go",
              };

              const filename = `generated.${extMap[request.language] || "txt"}`;
              const content = result.code || "";
              const generatedFiles = [{ filename, content }];
              setFiles(generatedFiles);
              setSelectedFile({ filename, content });
              saveCachedGeneratedFiles(newProject.id, generatedFiles);

              await saveProjectArtifact(newProject.id, filename, content);
            } catch (err) {
              console.error("Failed to create project from generated code", err);
            }
          }}
        />
      </div>

      {/* Project-Based Code Generator */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Project Code Generator</h2>
        <ProjectHeader
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          onProjectSelect={handleProjectSelect}
          refreshTrigger={projectRefresh}
        />

        {!project ? (
          <div className="glass-panel p-12 text-center rounded-xl shadow-premium mt-6">
            <AlertCircle size={36} className="mx-auto text-slate-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Active Project Selected</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Create a project or select an existing one using the dropdown to inspect the compiled codebase.
            </p>
          </div>
        ) : isPipelinePending ? (
          <div className="glass-panel p-12 text-center rounded-xl shadow-premium animate-pulse mt-6">
            <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Pipeline Execution in Progress</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Generating code components... Current Stage: <span className="font-bold text-brand-500 uppercase">{project.status}</span>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
            {/* File List / Tabs */}
            <div className="lg:col-span-1 glass-panel p-5 rounded-xl shadow-premium space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <FileCode size={14} className="mr-1.5 text-brand-500" />
                Generated Components
              </h3>
            
            <div className="space-y-1.5">
              {files.map((file) => (
                <button
                  key={file.filename}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-2 ${
                    selectedFile?.filename === file.filename
                      ? "bg-brand-600 text-white shadow-premium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <FileCode size={13} />
                  <span className="truncate">{file.filename}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-3 glass-panel rounded-xl shadow-premium overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-800/80">
            {selectedFile ? (
              <>
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedFile.filename}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold uppercase tracking-wide">
                      Read Only
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="h-7 px-2.5 rounded border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-brand-500 flex items-center space-x-1 bg-white dark:bg-slate-900/40 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check size={11} className="text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Editor Content */}
                <div className="flex-1 min-h-[400px] overflow-auto bg-slate-950 p-4 font-mono text-[11px] text-slate-300 leading-relaxed flex border-t border-slate-900">
                  {/* Line Numbers */}
                  <div className="text-slate-600 text-right pr-4 border-r border-slate-900 select-none space-y-px">
                    {selectedFile.content.split("\n").map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  {/* Actual Code */}
                  <pre className="pl-4 overflow-x-auto w-full select-text whitespace-pre text-slate-200">
                    <code>{selectedFile.content}</code>
                  </pre>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                Select a file on the left to review its generated content.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
