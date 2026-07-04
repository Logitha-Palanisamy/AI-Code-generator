import React, { useEffect, useState } from "react";
import { getProjects } from "../api/projects";
import { useAuth } from "../context/AuthContext";
import { Shield, Calendar, Activity, CheckCircle, Award } from "lucide-react";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    successfulRuns: 0,
    averageRate: 0,
    totalFailed: 0
  });

  useEffect(() => {
    const loadProfileStats = async () => {
      try {
        const data = await getProjects();
        const total = data.length;
        const success = data.filter((p) => p.status === "COMPLETED").length;
        const failed = data.filter((p) => ["FAILED", "FIX_EXHAUSTED"].includes(p.status)).length;
        const rate = total > 0 ? Math.round((success / total) * 100) : 0;
        
        setStats({
          totalProjects: total,
          successfulRuns: success,
          averageRate: rate,
          totalFailed: failed
        });
      } catch (err) {
        console.error("Failed to load profile metrics", err);
      }
    };
    loadProfileStats();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">
          Account Profile
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Inspect personal permissions and aggregate project execution statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Detail Card */}
        <div className="md:col-span-1 glass-panel p-6 rounded-xl shadow-premium flex flex-col items-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20 text-brand-500 font-bold border border-brand-500/30 text-2xl shadow-premium">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          
          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[200px]">
              {user?.full_name || user?.username}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
              {user?.username}
            </span>
          </div>

          <hr className="w-full border-slate-100 dark:border-slate-800/80" />

          {/* Details list */}
          <div className="w-full space-y-3 text-xs">
            <div className="flex items-center space-x-2.5 text-slate-600 dark:text-slate-400">
              <Shield size={14} className="text-brand-500 shrink-0" />
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Access Role</span>
                <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{user?.role?.replace("_", " ")}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5 text-slate-600 dark:text-slate-400">
              <Calendar size={14} className="text-brand-500 shrink-0" />
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Registered</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "July 2026"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate Statistics Panel */}
        <div className="md:col-span-2 space-y-6">
          {/* Metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-xl shadow-premium flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center border border-brand-500/20">
                <Activity size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Runs</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white block mt-0.5">{stats.totalProjects}</span>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-xl shadow-premium flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Success Runs</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white block mt-0.5">{stats.successfulRuns}</span>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-xl shadow-premium flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center border border-teal-500/20">
                <Award size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Build Rate</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white block mt-0.5">{stats.averageRate}%</span>
              </div>
            </div>
          </div>

          {/* Sandbox Distribution */}
          <div className="glass-panel p-6 rounded-xl shadow-premium space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sandbox Generation Distribution
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Successful Pipeline Runs</span>
                  <span>{stats.successfulRuns} of {stats.totalProjects} ({stats.averageRate}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${stats.averageRate}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Failed Pipeline Runs</span>
                  <span>{stats.totalFailed} of {stats.totalProjects} ({stats.totalProjects > 0 ? Math.round((stats.totalFailed / stats.totalProjects) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${stats.totalProjects > 0 ? (stats.totalFailed / stats.totalProjects) * 100 : 0}%` }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
