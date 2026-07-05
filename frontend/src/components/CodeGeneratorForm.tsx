import React, { useState } from "react";
import { generateCode, refineCode, type CodeGenerationRequest, type CodeGenerationResponse } from "../api/code_generation";
import { Loader, AlertCircle, CheckCircle, Copy, Check } from "lucide-react";

interface CodeGeneratorFormProps {
  onCodeGenerated?: (request: CodeGenerationRequest, result: CodeGenerationResponse) => void;
  initialResult?: CodeGenerationResponse | null;
  initialDescription?: string;
  initialLanguage?: string;
  initialFramework?: string;
}

const LANGUAGES = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C#",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Swift",
];

const FRAMEWORKS: Record<string, string[]> = {
  Python: ["FastAPI", "Django", "Flask", "Celery", "None"],
  JavaScript: ["Express", "React", "Next.js", "Vue", "None"],
  TypeScript: ["Express", "React", "Next.js", "NestJS", "None"],
  Java: ["Spring Boot", "Spring MVC", "Hibernate", "None"],
  "C#": ["ASP.NET", "Entity Framework", "None"],
  Go: ["Gin", "Echo", "Fiber", "None"],
  Rust: ["Actix", "Rocket", "Tokio", "None"],
};

export const CodeGeneratorForm: React.FC<CodeGeneratorFormProps> = ({
  onCodeGenerated,
  initialResult,
  initialDescription,
  initialLanguage,
  initialFramework,
}) => {
  const [description, setDescription] = useState(initialDescription || "");
  const [language, setLanguage] = useState(initialLanguage || "Python");
  const [framework, setFramework] = useState<string>(initialFramework || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeGenerationResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState("");
  const [refining, setRefining] = useState(false);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const request: CodeGenerationRequest = {
        description,
        language,
        framework: framework && framework !== "None" ? framework : undefined,
      };

      const response = await generateCode(request);

      if (response.success && response.code) {
        setResult(response);
        onCodeGenerated?.(request, response);
      } else {
        setError(response.error || "Failed to generate code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRefineCode = async () => {
    if (!result?.code) return;

    setRefining(true);
    setError(null);

    try {
      const response = await refineCode({
        code: result.code,
        feedback: refineFeedback,
        language: result.language || language,
      });

      if (response.success && response.code) {
        setResult((prev) => ({
          ...prev!,
          code: response.code,
        }));
        setRefineFeedback("");
      } else {
        setError(response.error || "Failed to refine code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setRefining(false);
    }
  };

  const handleCopyCode = () => {
    if (result?.code) {
      navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const availableFrameworks = FRAMEWORKS[language] || [];

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <div className="glass-panel p-6 rounded-xl shadow-premium space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Generate Code from Description</h2>

        <form onSubmit={handleGenerateCode} className="space-y-4">
          {/* Description Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the code you want to generate. Be as specific as possible..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              Example: "Create a function that validates email addresses and returns true or false"
            </p>
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Programming Language
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setFramework("");
                }}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={loading}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Framework Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Framework (Optional)
              </label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={loading}
              >
                <option value="">Select framework...</option>
                {availableFrameworks.map((fw) => (
                  <option key={fw} value={fw}>
                    {fw}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start space-x-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">Error</p>
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="submit"
            disabled={loading || !description.trim()}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                <span>Generating Code...</span>
              </>
            ) : (
              <span>Generate Code</span>
            )}
          </button>
        </form>
      </div>

      {/* Generated Code Display */}
      {result && result.success && result.code && (
        <div className="glass-panel p-6 rounded-xl shadow-premium space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Generated Code</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{result.filename}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg font-semibold text-sm flex items-center space-x-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-green-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Preview */}
          <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <pre className="p-4 font-mono text-sm text-slate-300 leading-relaxed">
                <code>{result.code}</code>
              </pre>
            </div>
          </div>

          {/* Description */}
          {result.description && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{result.description}</p>
            </div>
          )}

          {/* Dependencies */}
          {result.dependencies && result.dependencies.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Required Dependencies</p>
              <div className="flex flex-wrap gap-2">
                {result.dependencies.map((dep, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 text-xs font-semibold rounded"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Refine Code Section */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Refine Code</h4>
            <div className="space-y-3">
              <textarea
                value={refineFeedback}
                onChange={(e) => setRefineFeedback(e.target.value)}
                placeholder="Provide feedback or improvements you'd like to make (e.g., 'Add more error handling', 'Optimize for performance', 'Add type hints')"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={3}
                disabled={refining}
              />
              <button
                onClick={handleRefineCode}
                disabled={refining || !refineFeedback.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
              >
                {refining ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Refining...</span>
                  </>
                ) : (
                  <span>Refine Code</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
