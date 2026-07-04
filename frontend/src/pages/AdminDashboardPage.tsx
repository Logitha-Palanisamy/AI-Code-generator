import React, { useState, useEffect } from "react";
import { getAdminUsers, updateUserRole, getAIUsageLogs, getSystemLogs } from "../api/projects";
import type { User, AIUsageLog, SystemLog } from "../api/projects";
import { Users, Activity, Terminal, ShieldAlert, RefreshCw } from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [aiLogs, setAiLogs] = useState<AIUsageLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<"users" | "ai" | "logs">("users");
  const [isLoading, setIsLoading] = useState(true);
  const [logFilter, setLogFilter] = useState("ALL");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "users") {
        const data = await getAdminUsers();
        setUsers(data);
      } else if (activeTab === "ai") {
        const data = await getAIUsageLogs();
        setAiLogs(data);
      } else if (activeTab === "logs") {
        const data = await getSystemLogs();
        setSystemLogs(data);
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab, refreshTrigger]);

  const handleRoleToggle = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "registered_user" : "admin";
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    try {
      await updateUserRole(userId, newRole);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Role update failed", err);
      alert("Failed to update user role.");
    }
  };

  // AI Usage summary metrics calculations
  const totalTokens = aiLogs.reduce((acc, log) => acc + log.input_tokens + log.output_tokens, 0);
  const totalCost = aiLogs.reduce((acc, log) => acc + log.estimated_cost, 0);
  const avgLatency = aiLogs.length > 0 
    ? Math.round(aiLogs.reduce((acc, log) => acc + log.latency_ms, 0) / aiLogs.length) 
    : 0;

  // Filter system logs by severity levels
  const filteredSystemLogs = systemLogs.filter((log) => {
    if (logFilter === "ALL") return true;
    return log.level === logFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit flex items-center">
            <ShieldAlert className="text-rose-500 mr-2" size={22} />
            Admin Operations Panel
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor registered users, inspect token usage logs, and parse active telemetry feeds.
          </p>
        </div>
        
        <button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-500 bg-white/50 dark:bg-slate-900/30 transition-all"
        >
          <RefreshCw size={12} className="mr-1.5" />
          Refresh
        </button>
      </div>

      {/* Tabs list selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80">
        {[
          { key: "users", label: "User Management", icon: Users },
          { key: "ai", label: "AI Usage Analytics", icon: Activity },
          { key: "logs", label: "System Telemetry Logs", icon: Terminal }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px ${
                activeTab === tab.key
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content panel */}
      <div className="glass-panel p-6 rounded-xl shadow-premium">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading operations records...</div>
        ) : activeTab === "users" ? (
          /* User Management Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400">
                  <th className="pb-3 font-semibold">User Info</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Access Privilege</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {users.map((u) => (
                  <tr key={u.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
                        {u.username[0].toUpperCase()}
                      </div>
                      <span>{u.username}</span>
                    </td>
                    <td className="py-3.5 font-medium">{u.email}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === "admin"
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        u.is_active
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>
                        {u.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        className="inline-flex items-center justify-center h-7 px-2.5 rounded border border-slate-200 dark:border-slate-800 hover:border-brand-500/30 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-brand-500 bg-white/50 dark:bg-slate-900/30 transition-all"
                      >
                        Change Privilege
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === "ai" ? (
          /* AI Cost Analytics Dashboard */
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accumulated Token Volume</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white block mt-0.5">{totalTokens.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Total Cost</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white block mt-0.5">${totalCost.toFixed(4)}</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Model Latency</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white block mt-0.5">{avgLatency} ms</span>
              </div>
            </div>

            {/* Logs List Table */}
            <div className="overflow-x-auto pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Model Requests</h3>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400">
                    <th className="pb-3 font-semibold">Pipeline Stage</th>
                    <th className="pb-3 font-semibold">Model Used</th>
                    <th className="pb-3 font-semibold">Tokens (In / Out)</th>
                    <th className="pb-3 font-semibold">Estimated Cost</th>
                    <th className="pb-3 font-semibold">Latency</th>
                    <th className="pb-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                  {aiLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 font-bold uppercase text-brand-500">{log.stage}</td>
                      <td className="py-3 font-medium">{log.model}</td>
                      <td className="py-3 font-mono">{log.input_tokens} / {log.output_tokens}</td>
                      <td className="py-3 font-mono font-bold">${log.estimated_cost.toFixed(4)}</td>
                      <td className="py-3 font-mono">{log.latency_ms} ms</td>
                      <td className="py-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* System Telemetry Logs Console */
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "INFO", "WARNING", "ERROR"].map((level) => (
                <button
                  key={level}
                  onClick={() => setLogFilter(level)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                    logFilter === level
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-premium"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/30 hover:border-slate-300"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Scrollable logs terminal */}
            <div className="rounded-lg bg-slate-950 p-5 font-mono text-[10px] text-slate-300 h-96 overflow-y-auto space-y-2 border border-slate-900 select-text leading-relaxed">
              {filteredSystemLogs.length === 0 ? (
                <div className="text-slate-600 italic">No telemetry logs match the filter criteria.</div>
              ) : (
                filteredSystemLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                    <span className={`font-bold ${
                      log.level === "ERROR" 
                        ? "text-rose-500" 
                        : log.level === "WARNING" 
                        ? "text-amber-500" 
                        : "text-emerald-500"
                    }`}>
                      [{log.level}]
                    </span>
                    <span className="text-slate-400 font-semibold select-none">[{log.logger}]</span>
                    <span className="text-slate-100">{log.event}</span>
                    {log.project_id && <span className="text-brand-500 font-bold select-none">[proj_id: {log.project_id}]</span>}
                    <span className="text-slate-600 select-none">({log.correlation_id})</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
