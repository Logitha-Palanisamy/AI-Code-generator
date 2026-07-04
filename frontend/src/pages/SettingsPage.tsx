import React, { useState, useEffect } from "react";
import { getSettings, updateSettings } from "../api/projects";
import type { Setting } from "../api/projects";
import { Eye, EyeOff, Save, CheckCircle2, Sliders, AlertCircle } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const [, setSettings] = useState<Setting | null>(null);
  const [theme, setTheme] = useState("dark");
  const [preferredModel, setPreferredModel] = useState("claude-3-5-sonnet");
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);
  const [personalApiKey, setPersonalApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      setTheme(data.theme);
      setPreferredModel(data.preferred_model);
      setTimeoutSeconds(data.timeout_seconds);
      setPersonalApiKey(data.personal_api_key || "");
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const payload: Partial<Setting> = {
        theme,
        preferred_model: preferredModel,
        timeout_seconds: timeoutSeconds,
        personal_api_key: personalApiKey.trim() || null
      };

      const updated = await updateSettings(payload);
      setSettings(updated);
      setSaveStatus("success");
      
      // Update global body theme instantly if changed
      const body = document.body;
      if (theme === "dark") {
        body.classList.add("dark");
      } else {
        body.classList.remove("dark");
      }
      
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">
          System Preferences
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage visual styling themes, sandbox parameters, and API configuration credentials.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visual Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* General settings panel */}
          <div className="glass-panel p-6 rounded-xl shadow-premium space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Sliders size={14} className="mr-1.5 text-brand-500" />
              General Preferences
            </h3>

            {/* Visual Theme Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Visual Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "dark", label: "Midnight Dark (Recommended)" },
                  { key: "light", label: "Clean Light" }
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTheme(t.key)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                      theme === t.key
                        ? "bg-brand-600 text-white border-brand-600 shadow-premium"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white/30 dark:bg-slate-950/20 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Overrides Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Preferred AI Language Model
              </label>
              <select
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 px-3 py-2.5 text-xs outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
              >
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (High Accuracy)</option>
                <option value="claude-3-haiku">Claude 3 Haiku (Fast Generation)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (Balanced)</option>
              </select>
            </div>

            {/* Sandbox execution timeouts */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Sandbox Run Timeout Limit</span>
                <span className="font-mono text-brand-500 font-bold">{timeoutSeconds} seconds</span>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                step="5"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Limits maximum execution runtime of isolated sandbox scripts to prevent infinite loops.
              </span>
            </div>
          </div>

          {/* Secure API key overrides */}
          <div className="glass-panel p-6 rounded-xl shadow-premium space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Sliders size={14} className="mr-1.5 text-brand-500" />
              API Key Overrides
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Personal Anthropic API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={personalApiKey}
                  onChange={(e) => setPersonalApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 pl-3 pr-10 py-2.5 text-xs outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Optional credentials. If provided, the generation pipeline will run under your developer quota limits.
              </span>
            </div>
          </div>
        </div>

        {/* Info & Save Actions */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-xl shadow-premium space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Configuration Audit
              </h3>
              
              <div className="space-y-3 text-xs text-slate-500">
                <p>
                  Saving these parameters writes overrides directly to your account SQL record database.
                </p>
                <p>
                  Theme parameters sync directly with your web browser local state and system elements.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800/80">
              {saveStatus === "success" && (
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-500">
                  <CheckCircle2 size={16} />
                  <span>Settings successfully saved</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center space-x-2 text-xs font-semibold text-rose-500">
                  <AlertCircle size={16} />
                  <span>Failed to save preferences</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white py-2.5 text-xs font-bold shadow-premium transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSaving ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
