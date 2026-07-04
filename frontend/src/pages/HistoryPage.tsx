import React, { useState, useEffect } from "react";
import { getProjects, deleteProject, createProject } from "../api/projects";
import type { Project } from "../api/projects";
import { Trash2, ArrowUpRight, Search, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HistoryPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load project history", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleInspect = (projectId: number) => {
    localStorage.setItem("selected_project_id", projectId.toString());
    navigate("/code-generator");
  };

  const handleDelete = async (projectId: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(projectId);
      fetchHistory();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleClone = async (proj: Project) => {
    try {
      const cloned = await createProject(proj.requirement_text, proj.target_language);
      localStorage.setItem("selected_project_id", cloned.id.toString());
      navigate("/requirements");
    } catch (err) {
      console.error("Cloning failed", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "FAILED":
      case "FIX_EXHAUSTED":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      case "CREATED":
      case "ANALYZING":
      case "GENERATING_CODE":
      case "REVIEWING":
      case "GENERATING_TESTS":
      case "EXECUTING_TESTS":
      case "AUTO_FIXING":
        return "bg-brand-500/10 text-brand-400 border border-brand-500/20 animate-pulse";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  // Filter history list
  const filteredProjects = projects.filter((p) =>
    p.requirement_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.target_language.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">
            Workspace History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Query past code execution tasks and replication pipelines.
          </p>
        </div>
      </div>

      {/* Search Filter Panel */}
      <div className="glass-panel p-4 rounded-xl shadow-premium flex items-center space-x-3 border border-slate-200/50 dark:border-slate-800/80 bg-white/30 dark:bg-slate-950/20">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Filter logs by requirements, languages, status badges..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-xs outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
        />
      </div>

      {/* Main Table Panel */}
      <div className="glass-panel p-6 rounded-xl shadow-premium space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading past project runs...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800/80 text-xs text-slate-500">
            No projects match the query parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-xs text-slate-400">
                  <th className="pb-3 font-semibold">Requirement Specifications</th>
                  <th className="pb-3 font-semibold">Language</th>
                  <th className="pb-3 font-semibold">Build Status</th>
                  <th className="pb-3 font-semibold">Created Date</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                {filteredProjects.map((proj) => (
                  <tr key={proj.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                    <td className="py-4 font-semibold text-slate-800 dark:text-white max-w-sm truncate pr-4">
                      {proj.requirement_text}
                    </td>
                    <td className="py-4 capitalize font-medium">{proj.target_language}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${getStatusColor(proj.status)}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500">
                      {new Date(proj.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => handleInspect(proj.id)}
                        title="Inspect Code"
                        className="inline-flex items-center justify-center h-7 px-2.5 rounded border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-brand-500 bg-white/50 dark:bg-slate-900/30 transition-all"
                      >
                        Inspect <ArrowUpRight size={11} className="ml-1" />
                      </button>
                      <button
                        onClick={() => handleClone(proj)}
                        title="Replicate Task Prompt"
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 text-slate-600 dark:text-slate-400 hover:text-brand-500 bg-white/50 dark:bg-slate-900/30 transition-all"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={() => handleDelete(proj.id)}
                        title="Delete Build"
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 text-slate-600 dark:text-slate-400 hover:text-rose-500 bg-white/50 dark:bg-slate-900/30 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
