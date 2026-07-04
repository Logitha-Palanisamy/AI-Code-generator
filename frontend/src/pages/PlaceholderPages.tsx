import React from "react";
import {
  FileText,
  Code,
  FolderCode,
  Eye,
  Terminal,
  Beaker,
  BookOpen,
  History as HistoryIcon,
  User,
  Settings as SettingsIcon,
  ShieldAlert,
  Loader,
} from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  details: string[];
}

const PagePlaceholder: React.FC<PlaceholderProps> = ({ title, description, icon: Icon, details }) => {
  return (
    <div className="glass-panel p-8 rounded-2xl shadow-premium max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center">
          <Icon size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white font-outfit">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-slate-800/80" />

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Module Implementation Plan (Phase {details[0]})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {details.slice(1).map((detail, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 p-4 flex items-start space-x-3"
            >
              <div className="h-5 w-5 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 rounded-lg bg-slate-100/50 dark:bg-slate-900/40 p-3 justify-center border border-slate-200/10">
        <Loader size={12} className="animate-spin text-brand-500" />
        <span>Skeleton UI active. Full integration will occur in Build Order Step {title.includes("Requirements") ? "4" : title.includes("Code") ? "5" : title.includes("Project") ? "6" : title.includes("Review") ? "7" : title.includes("Execute") ? "8" : title.includes("Tests") ? "9" : title.includes("Doc") ? "10" : "11"}.</span>
      </div>
    </div>
  );
};

export const RequirementsPage = () => (
  <PagePlaceholder
    title="Requirement Analyzer"
    description="Deconstruct raw text goals into structured input/output parameters, libraries, constraints, and proposed architectures."
    icon={FileText}
    details={[
      "4",
      "Input natural language prompt (e.g. 'Build a CLI Task Manager')",
      "AI extraction of functional/non-functional requirements",
      "Architecture suggestions, file structure blueprint planning",
      "Interactive feedback loop to clarify ambiguities before code generation"
    ]}
  />
);

export const CodeGeneratorPage = () => (
  <PagePlaceholder
    title="Code Generator"
    description="Autonomous file-by-file code generation matching PEP8 style standards, docstrings, and custom architectural layouts."
    icon={Code}
    details={[
      "5",
      "Generates fully functional code blocks based on analyzer layout blueprint",
      "Extensible to multiple languages (Python, TS, Go, etc.)",
      "Appends structured docstrings and types to all components",
      "Bypasses stubs - ensures runnable functions are packaged"
    ]}
  />
);

export const ProjectGeneratorPage = () => (
  <PagePlaceholder
    title="Project Generator"
    description="Assemble generated project files into a hierarchical directory tree and package for download."
    icon={FolderCode}
    details={[
      "6",
      "Maintains virtual file-tree representing project folders",
      "Enables download of entire package as zipped project",
      "Enables browser preview of separate file contents",
      "Provides structured metadata headers for each compiled codebase"
    ]}
  />
);

export const CodeReviewPage = () => (
  <PagePlaceholder
    title="Code Reviewer & Bug Detector"
    description="Performs automated static checking and AI-assisted safety reviews, highlighting line-level improvements."
    icon={Eye}
    details={[
      "7",
      "Line-by-line linting and bug severity classifications",
      "Quality scores (maintainability, complexity, readability)",
      "Highlights vulnerable patterns (SQL injection, unsafe permissions)",
      "Suggests structural optimization fixes dynamically"
    ]}
  />
);

export const ExecuteCodePage = () => (
  <PagePlaceholder
    title="Sandbox Execution Console"
    description="Executes code in isolated Docker environments with hard CPU, memory, and timeout parameters."
    icon={Terminal}
    details={[
      "8",
      "Spins up ephemeral Docker container per execution run",
      "Streams stdout/stderr in real-time over WebSocket channels",
      "Limits memory (512MB default) and CPU cores (1.0 default) to prevent infinite loops",
      "Isolates local network stack to secure host node"
    ]}
  />
);

export const UnitTestsPage = () => (
  <PagePlaceholder
    title="Unit Test Runner"
    description="Generates comprehensive pytest unit tests and drives the autonomous self-healing code fix loop."
    icon={Beaker}
    details={[
      "9",
      "Generates isolated unit tests matching generated code logic",
      "Executes tests in Docker sandbox and parses outputs into JSON",
      "Runs bounded self-healing loop (re-feeding failures to prompt optimizer)",
      "Enforces a maximum threshold of 3 self-repair attempts before notification"
    ]}
  />
);

export const DocumentationPage = () => (
  <PagePlaceholder
    title="Documentation Generator"
    description="Autogenerates detailed project READMEs, API descriptions, installation scripts, and user manuals."
    icon={BookOpen}
    details={[
      "10",
      "Creates structural index matching code design",
      "Documents API routes, schemas, settings, and database configurations",
      "Supports markdown copy-to-clipboard actions",
      "Supports export of finalized documentation packages as PDF files"
    ]}
  />
);

export const HistoryPage = () => (
  <PagePlaceholder
    title="Project History"
    description="Search, filter, delete, and duplicate past pipeline generation runs."
    icon={HistoryIcon}
    details={[
      "11",
      "Logs project meta details, requirements prompt, and current status",
      "Paginates historical build logs for quick queries",
      "Enables replication/cloning of existing build parameters",
      "Stores run durations and success rate metrics for aggregation"
    ]}
  />
);

export const ProfilePage = () => (
  <PagePlaceholder
    title="User Profile"
    description="View account specifications and monitor personal pipeline usage statistics."
    icon={User}
    details={[
      "11",
      "Manage name, email, password strength updates",
      "Track total generation counts and project distributions",
      "Display current role and environment tier permissions",
      "Manage session revocation controls"
    ]}
  />
);

export const SettingsPage = () => (
  <PagePlaceholder
    title="System Settings"
    description="Manage styling themes, model parameters, execution sandbox limits, and API keys."
    icon={SettingsIcon}
    details={[
      "11",
      "Theme toggle switches (dark, light, automatic system defaults)",
      "Model overrides (preferred Anthropic Sonnet, Haiku, or custom model entries)",
      "Personal API keys to override default developer quota models",
      "Sandbox execution configurations (timeout duration sliders, memory limits)"
    ]}
  />
);

export const AdminDashboardPage = () => (
  <PagePlaceholder
    title="Admin Operations"
    description="Manage user roles, audit project builds, view system logs, and inspect AI costs."
    icon={ShieldAlert}
    details={[
      "11",
      "Deactivate/activate registered users and manage permission assignments",
      "Structured log viewer reading application telemetry logs in real-time",
      "AI Usage logs displaying input/output token counts, latency, and costs",
      "Sandbox pool status monitoring"
    ]}
  />
);
