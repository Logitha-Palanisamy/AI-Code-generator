import React from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  CheckCircle,
  FileCode2,
  Cpu,
  RefreshCw,
  DollarSign,
  Plus,
  Play,
  Settings,
  ArrowUpRight,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  // Stat Card Definitions
  const stats = [
    { name: "Total Projects", value: "14", change: "+2 this week", icon: Layers, color: "text-brand-500 bg-brand-500/10" },
    { name: "Successful Builds", value: "11", change: "78.5% rate", icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10" },
    { name: "Lines of Code", value: "24,850", change: "Python, TS, Go", icon: FileCode2, color: "text-indigo-500 bg-indigo-500/10" },
    { name: "Sandbox Runs", value: "98", change: "Avg 4.8s time", icon: Cpu, color: "text-teal-500 bg-teal-500/10" },
    { name: "Auto-Fix Cleared", value: "19", change: "86% recovery", icon: RefreshCw, color: "text-amber-500 bg-amber-500/10" },
    { name: "Est. Cost Saved", value: "$342.10", change: "vs manual API", icon: DollarSign, color: "text-rose-500 bg-rose-500/10" },
  ];

  // Mock Active Pipelines
  const activePipelines = [
    { id: 1, name: "Student Management API", lang: "Python", stage: "TESTS_PASSED", time: "2 mins ago" },
    { id: 2, name: "Task Tracker SPA", lang: "TypeScript", stage: "AUTO_FIXING", time: "Just now" },
    { id: 3, name: "Redis Caching Utility", lang: "Go", stage: "COMPLETED", time: "1 hour ago" },
    { id: 4, name: "Weather Web Scraper", lang: "Python", stage: "GENERATING_CODE", time: "5 mins ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">
            Development Overview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor autonomous code generation runs and execution health.
          </p>
        </div>
        <Link
          to="/requirements"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-premium hover:bg-brand-700 transition-all duration-150"
        >
          <Plus size={16} className="mr-1.5" />
          Create New Project
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="glass-panel p-5 rounded-xl shadow-premium flex items-center space-x-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color} border border-slate-200/10`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-slate-400 block tracking-wider uppercase">
                  {stat.name}
                </span>
                <span className="text-2xl font-bold text-slate-800 dark:text-white leading-none block mt-0.5">
                  {stat.value}
                </span>
                <span className="text-[10px] font-medium text-slate-500 mt-1 block">
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Pipeline logs & Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipelines status table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl shadow-premium space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Active Build Pipelines
            </h3>
            <Link to="/history" className="text-xs font-semibold text-brand-500 hover:underline inline-flex items-center">
              View All <ArrowUpRight size={14} className="ml-0.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                  <th className="pb-3 font-semibold">Project Name</th>
                  <th className="pb-3 font-semibold">Language</th>
                  <th className="pb-3 font-semibold">Pipeline Stage</th>
                  <th className="pb-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                {activePipelines.map((pipe) => (
                  <tr key={pipe.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 font-medium text-slate-800 dark:text-white">
                      {pipe.name}
                    </td>
                    <td className="py-3.5">{pipe.lang}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                        pipe.stage === "COMPLETED" || pipe.stage === "TESTS_PASSED"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : pipe.stage === "AUTO_FIXING"
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                          : "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                      }`}>
                        {pipe.stage}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">{pipe.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-panel p-6 rounded-xl shadow-premium space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Quick Operations
          </h3>
          <div className="space-y-3">
            <Link
              to="/requirements"
              className="flex items-center w-full rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-3 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 hover:border-brand-500/30 transition-all group"
            >
              <div className="h-9 w-9 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center mr-3 shrink-0">
                <Plus size={18} />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-500 block">
                  Define Requirements
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Launch the parsing AI to analyze a spec doc.
                </span>
              </div>
            </Link>

            <Link
              to="/execute"
              className="flex items-center w-full rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-3 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 hover:border-brand-500/30 transition-all group"
            >
              <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center mr-3 shrink-0">
                <Play size={16} />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-500 block">
                  Interactive Console
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Monitor live stdout streams inside container.
                </span>
              </div>
            </Link>

            <Link
              to="/settings"
              className="flex items-center w-full rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-3 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 hover:border-brand-500/30 transition-all group"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center mr-3 shrink-0">
                <Settings size={16} />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-500 block">
                  Configure Settings
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Change preferred model and resource limits.
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
