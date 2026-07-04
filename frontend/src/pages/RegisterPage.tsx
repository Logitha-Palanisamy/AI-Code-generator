import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live password validations matching backend criteria
  const passwordCriteria = {
    length: password.length >= 8,
    digit: anyDigit(password),
    letter: anyLetter(password),
    match: password === confirmPassword && password.length > 0
  };

  function anyDigit(str: string) {
    return /\d/.test(str);
  }

  function anyLetter(str: string) {
    return /[a-zA-Z]/.test(str);
  }

  const isPasswordValid = passwordCriteria.length && passwordCriteria.digit && passwordCriteria.letter;
  const isFormValid = email && username && isPasswordValid && passwordCriteria.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError("Please satisfy all password and form criteria");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await register(email, username, fullName || null, password, confirmPassword);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || "Invalid input data");
      } else {
        setError(detail || "Registration failed. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b19] bg-premium-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white font-extrabold text-2xl shadow-premium mb-3">
            Ω
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
            Create Account
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build software with autonomous pipelines
          </p>
        </div>

        {/* Register Panel */}
        <div className="glass-panel p-8 rounded-2xl shadow-premium">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 dark:text-red-400 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-500 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Mail size={15} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0c142c] pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-500 dark:focus:border-brand-500 text-slate-800 dark:text-slate-100 transition-colors"
                  placeholder="name@example.com"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Username & FullName Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0c142c] px-3 py-2 text-sm outline-none focus:border-brand-500 dark:focus:border-brand-500 text-slate-800 dark:text-slate-100 transition-colors"
                  placeholder="john_doe"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0c142c] px-3 py-2 text-sm outline-none focus:border-brand-500 dark:focus:border-brand-500 text-slate-800 dark:text-slate-100 transition-colors"
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0c142c] pl-10 pr-10 py-2 text-sm outline-none focus:border-brand-500 dark:focus:border-brand-500 text-slate-800 dark:text-slate-100 transition-colors"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0c142c] px-3 py-2 text-sm outline-none focus:border-brand-500 dark:focus:border-brand-500 text-slate-800 dark:text-slate-100 transition-colors"
                placeholder="••••••••"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Password validation indicators */}
            {password.length > 0 && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/10 space-y-1.5 text-[11px]">
                <div className="flex items-center space-x-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${passwordCriteria.length ? "bg-emerald-500" : "bg-red-500"}`}></div>
                  <span className={passwordCriteria.length ? "text-emerald-500" : "text-slate-400"}>At least 8 characters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${passwordCriteria.letter ? "bg-emerald-500" : "bg-red-500"}`}></div>
                  <span className={passwordCriteria.letter ? "text-emerald-500" : "text-slate-400"}>Contains at least one letter</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${passwordCriteria.digit ? "bg-emerald-500" : "bg-red-500"}`}></div>
                  <span className={passwordCriteria.digit ? "text-emerald-500" : "text-slate-400"}>Contains at least one number</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${passwordCriteria.match ? "bg-emerald-500" : "bg-red-500"}`}></div>
                  <span className={passwordCriteria.match ? "text-emerald-500" : "text-slate-400"}>Passwords match</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-premium hover:bg-brand-700 disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Redirection link */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-500 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
