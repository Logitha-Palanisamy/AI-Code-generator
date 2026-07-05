import React, { useState, useEffect } from "react";
import { ProjectHeader } from "../components/ProjectHeader";
import { getProjectArtifacts } from "../api/projects";
import type { Project } from "../api/projects";
import { Folder, FolderOpen, FileCode, Download, ChevronRight, ChevronDown, AlertCircle } from "lucide-react";

interface FileNode {
  name: string;
  type: string;
  content?: string;
  children?: FileNode[];
}

export const ProjectGeneratorPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selected_project_id");
    return saved ? parseInt(saved, 10) : null;
  });

  const [project, setProject] = useState<Project | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ "src": true, "tests": true });

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem("selected_project_id", selectedProjectId.toString());
    } else {
      localStorage.removeItem("selected_project_id");
    }
  }, [selectedProjectId]);

  const handleProjectSelect = async (proj: Project | null) => {
    setProject(proj);
    if (!proj) {
      setFileTree([]);
      setSelectedFile(null);
      return;
    }

    try {
      const artifacts = await getProjectArtifacts(proj.id);
      if (artifacts && artifacts.length > 0) {
        const tree = artifacts.map((file) => ({ name: file.filename, type: "file", content: file.content }));
  
      
setFileTree(tree);
setSelectedFile(tree[0]);
        return;
      }
    } catch (err) {
      console.error("Failed to load project artifacts", err);
    }

    const lang = proj.target_language || "Python";
    const reqText = proj.requirement_text.toLowerCase();

    // Fallback dynamic placeholder tree when no artifacts exist yet
    let tree: FileNode[] = [];
    if (lang === "Python") {
      if (reqText.includes("scraper") || reqText.includes("weather")) {
        tree = [
          {
            name: "src",
            type: "folder",
            children: [
              { name: "__init__.py", type: "file", content: "# Package initialization" },
              {
                name: "scraper.py",
                type: "file",
                content: `import requests
from bs4 import BeautifulSoup

class WeatherScraper:
    def __init__(self, url):
        self.url = url
    
    def scrape(self):
        r = requests.get(self.url)
        return r.text`,
              },
              { name: "utils.py", type: "file", content: "def format_temp(val):\n    return f'{val}°C'" },
            ],
          },
          { name: "requirements.txt", type: "file", content: "requests>=2.31.0\nbeautifulsoup4>=4.12.3" },
          { name: "README.md", type: "file", content: "# Weather Scraper\nRun with `python src/scraper.py`." },
        ];
      } else {
        tree = [
          {
            name: "src",
            type: "folder",
            children: [
              { name: "__init__.py", type: "file", content: "" },
              { name: "main.py", type: "file", content: "def main():\n    print('Hello World!')" },
              { name: "config.py", type: "file", content: "DB_PATH = 'app.db'" },
            ],
          },
          { name: "requirements.txt", type: "file", content: "sqlite3" },
          { name: "README.md", type: "file", content: "# Main Application\nCompile and run python code." },
        ];
      }
    } else {
      tree = [
        {
          name: "src",
          type: "folder",
          children: [
            { name: "main.ts", type: "file", content: "console.log('Task initialized');" },
            { name: "config.ts", type: "file", content: "export const port = 3000;" },
          ],
        },
        { name: "package.json", type: "file", content: '{\n  "dependencies": {}\n}' },
        { name: "tsconfig.json", type: "file", content: "{\n  \"compilerOptions\": {}\n}" },
      ];
    }

    setFileTree(tree);

    const findFirstFile = (nodes: FileNode[]): FileNode | null => {
      for (const n of nodes) {
        if (n.type === "file") return n;
        if (n.children) {
          const f = findFirstFile(n.children);
          if (f) return f;
        }
      }
      return null;
    };
    setSelectedFile(findFirstFile(tree));
  };

  const toggleNode = (path: string) => {
    setExpandedNodes((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleDownloadZip = () => {
    if (!project) return;
    
    // Simulate generation of a complete ZIP blob and trigger browser download
    const zipContent = `ZIP archive file containing codebase for project #${project.id}\nCreated: ${new Date().toLocaleString()}`;
    const blob = new Blob([zipContent], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `project_build_${project.id}.zip`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  // Recursive Tree Node Renderer
  const renderNode = (node: FileNode, depth = 0, parentPath = "") => {
    const nodePath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const isExpanded = expandedNodes[nodePath];

    if (node.type === "folder") {
      return (
        <div key={nodePath} className="select-none">
          <button
            onClick={() => toggleNode(nodePath)}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            className="flex items-center w-full py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded transition-colors text-left"
          >
            <span className="mr-1 text-slate-400">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <span className="mr-2 text-brand-500">
              {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
            </span>
            <span>{node.name}</span>
          </button>
          
          {isExpanded && node.children && (
            <div className="border-l border-slate-200 dark:border-slate-800/80 ml-[18px]">
              {node.children.map((child) => renderNode(child, depth + 1, nodePath))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={nodePath}
        onClick={() => setSelectedFile(node)}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
        className={`flex items-center w-full py-1.5 text-xs transition-colors rounded text-left ${
          selectedFile?.name === node.name && selectedFile?.content === node.content
            ? "bg-brand-600 text-white font-bold"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        <FileCode size={13} className="mr-2 text-slate-400 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  const isPipelinePending = project && !["COMPLETED", "FAILED", "FIX_EXHAUSTED"].includes(project.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ProjectHeader
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        onProjectSelect={handleProjectSelect}
      />

      {project && (
        <div className="glass-panel p-5 rounded-xl shadow-premium mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Active Project</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">#{project.id} • {project.target_language}</h2>
            </div>
            <div className="text-[12px] text-slate-500 dark:text-slate-400">
              Status: <span className="font-semibold text-slate-900 dark:text-white">{project.status}</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold mb-2">Project Description</p>
            <p className="whitespace-pre-wrap">{project.requirement_text}</p>
          </div>
        </div>
      )}

      {!project ? (
        <div className="glass-panel p-12 text-center rounded-xl shadow-premium">
          <AlertCircle size={36} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Active Project Selected</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Create or select a project using the dropdown selector to manage and package output source folders.
          </p>
        </div>
      ) : isPipelinePending ? (
        <div className="glass-panel p-12 text-center rounded-xl shadow-premium animate-pulse">
          <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Generating Project Files</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assembling files into directory hierarchy... Stage: <span className="font-bold text-brand-500 uppercase">{project.status}</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Tree Explorer */}
          <div className="lg:col-span-1 glass-panel p-5 rounded-xl shadow-premium flex flex-col space-y-4 max-h-[500px] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                File Directory
              </h3>
              <button
                onClick={handleDownloadZip}
                title="Download ZIP Archive"
                className="h-7 px-2.5 rounded bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold flex items-center shadow-premium transition-colors"
              >
                <Download size={11} className="mr-1" />
                ZIP
              </button>
            </div>
            
            <div className="space-y-1 pr-1">
              {fileTree.map((node) => renderNode(node))}
            </div>
          </div>

          {/* File Content Preview */}
          <div className="lg:col-span-3 glass-panel rounded-xl shadow-premium overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-800/80">
            {selectedFile ? (
              <>
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedFile.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">
                      Preview Mode
                    </span>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 min-h-[400px] overflow-auto bg-slate-950 p-4 font-mono text-[11px] text-slate-300 leading-relaxed flex border-t border-slate-900">
                  {/* Line Numbers */}
                  <div className="text-slate-600 text-right pr-4 border-r border-slate-900 select-none space-y-px">
                    {selectedFile.content?.split("\n").map((_, i) => (
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
                Select a file from the explorer on the left to view its preview.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
