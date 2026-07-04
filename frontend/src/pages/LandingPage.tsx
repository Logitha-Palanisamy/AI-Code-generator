import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Code2, Terminal, FileText, ShieldCheck } from "lucide-react";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b19] bg-premium-gradient flex flex-col justify-between">
      {/* Header bar */}
      <header className="max-w-7xl mx-auto w-full px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-lg">
            Ω
          </div>
          <span className="font-extrabold text-slate-800 dark:text-slate-100 font-outfit">
            CODE AGENT
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-premium hover:bg-brand-700 transition-all duration-150"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <main className="max-w-7xl mx-auto px-6 py-20 flex-grow flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 rounded-full border border-brand-200 dark:border-brand-900/50 bg-brand-50/50 dark:bg-brand-950/20 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
            <span>v1.0.0 Alpha Release</span>
            <ArrowRight size={12} />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-outfit leading-tight">
            Autonomous Software <br />
            <span className="bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent">
              Development Agent
            </span>
          </h2>
          <p className="text-md text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0">
            Describe your software requirements in plain English. The agent autonomously analyzes specifications, structures project files, generates code, runs isolated sandboxed test suites, auto-fixes issues, and outputs complete documented projects.
          </p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-premium hover:bg-brand-700 transition-all duration-150"
            >
              Start Building Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Grid / Demo View */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-xl shadow-premium space-y-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
              <FileText size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">1. Requirement Analyzer</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Parses requirements to define inputs, constraints, architecture structure, and dependencies.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl shadow-premium space-y-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Code2 size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">2. Generator Core</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generates complete modular source code with strict type-hinting, PEP8 formatting, and docstrings.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl shadow-premium space-y-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
              <Terminal size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">3. Isolated Sandbox</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Runs execution scripts and unit tests within isolated Docker containers with resource caps.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl shadow-premium space-y-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">4. Self-Healing Loops</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detects runtime crashes or test failures, feed logs back to the LLM, and refines code dynamically.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <span>© {new Date().getFullYear()} Code Generation Agent. Built with FastAPI, Celery, and React.</span>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-slate-300">Architecture</a>
          <a href="#" className="hover:text-slate-300">Sandbox Isolation</a>
          <a href="#" className="hover:text-slate-300">API Docs</a>
        </div>
      </footer>
    </div>
  );
};
