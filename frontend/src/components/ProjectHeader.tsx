import React, { useEffect, useState } from "react";
import { getProjects, rebuildProject, deleteProject } from "../api/projects";
import type { Project } from "../api/projects";
import { Trash2, RefreshCw, ChevronDown, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectHeaderProps {
  onProjectSelect: (project: Project | null) => void;
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number | null) => void;
  refreshTrigger?: number;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  onProjectSelect,
  selectedProjectId,
  setSelectedProjectId,
  refreshTrigger = 0,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProjectList = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
      
      // Select the project
      let activeProj: Project | null = null;
      if (selectedProjectId) {
        activeProj = data.find((p) => p.id === selectedProjectId) || null;
      }
      
      if (!activeProj && data.length > 0) {
        activeProj = data[0]; // fallback to latest
      }

      if (activeProj) {
        setSelectedProjectId(activeProj.id);
        setSelectedProject(activeProj);
        onProjectSelect(activeProj);
      } else {
        setSelectedProjectId(null);
        setSelectedProject(null);
        onProjectSelect(null);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  useEffect(() => {
    fetchProjectList();
  }, [selectedProjectId, refreshTrigger]);

  const handleSelect = (project: Project) => {
    setSelectedProjectId(project.id);
    setSelectedProject(project);
    onProjectSelect(project);
    setIsOpen(false);
  };

  const handleRebuild = async () => {
    if (!selectedProject) return;
    setIsActionLoading(true);
    try {
      const updated = await rebuildProject(selectedProject.id);
      handleSelect(updated);
    } catch (err) {
      console.error("Rebuild failed", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    if (!confirm("Are you sure you want to delete this project?")) return;
    setIsActionLoading(true);
    try {
      await deleteProject(selectedProject.id);
      setSelectedProjectId(null);
      fetchProjectList();
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
      case "FAILED":
      case "FIX_EXHAUSTED":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/20";
      case "CREATED":
      case "ANALYZING":
      case "GENERATING_CODE":
      case "REVIEWING":
      case "GENERATING_TESTS":
      case "EXECUTING_TESTS":
      case "AUTO_FIXING":
        return "bg-brand-500/15 text-brand-400 border border-brand-500/20 animate-pulse";
      default:
        return "bg-slate-500/15 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div className="glass-panel p-4 rounded-xl shadow-premium mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      {/* Dropdown Selector */}
      <div className="relative w-full md:w-auto">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Active Workspace Project
        </label>
        
        {projects.length === 0 ? (
          <button
            onClick={() => navigate("/requirements")}
            className="flex items-center space-x-2 text-xs font-semibold text-brand-500 hover:text-brand-400"
          >
            <span>No projects found. Create one first!</span>
          </button>
        ) : (
          <div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-between w-full md:w-80 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-500/30 transition-all outline-none"
            >
              <div className="flex items-center space-x-2 truncate">
                <Layers size={14} className="text-brand-500" />
                <span className="truncate">
                  {selectedProject ? selectedProject.requirement_text : "Select a project"}
                </span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="absolute left-0 mt-1.5 w-full md:w-80 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c142c] shadow-premium z-50 py-1 max-h-60 overflow-y-auto">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`flex items-center justify-between w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors ${
                      p.id === selectedProject?.id ? "text-brand-500 font-bold bg-brand-500/5" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate pr-4">{p.requirement_text}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
                      {p.target_language}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Status Info & Actions */}
      {selectedProject && (
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Metadata */}
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Language
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">
                {selectedProject.target_language}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Status
              </span>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 mt-0.5 text-[10px] font-bold tracking-wide ${getStatusColor(selectedProject.status)}`}>
                {selectedProject.status}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-auto md:ml-0">
            <button
              onClick={handleRebuild}
              disabled={isActionLoading}
              title="Restart Pipeline Run"
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-500 bg-white/50 dark:bg-slate-900/30 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={`mr-1.5 ${isActionLoading ? "animate-spin" : ""}`} />
              Re-Run
            </button>
            <button
              onClick={handleDelete}
              disabled={isActionLoading}
              title="Delete Project"
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 text-slate-600 dark:text-slate-400 hover:text-rose-500 bg-white/50 dark:bg-slate-900/30 transition-all disabled:opacity-50"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
