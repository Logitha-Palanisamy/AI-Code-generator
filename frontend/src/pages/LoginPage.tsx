import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Lock, User as UserIcon, AlertCircle } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirection target from route guarding triggers
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError("Please fill in all credentials");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(usernameOrEmail, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Authentication failed. Check your credentials.";
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b19] bg-premium-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white font-extrabold text-2xl shadow-premium mb-3">
            Ω
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access the autonomous build dashboard
          </p>
        </div>

        {/* Login Panel */}
        <div className="glass-panel p-8 rounded-2xl shadow-premium">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center space-x-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-500 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username/Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="usernameOrEmail">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <UserIcon size={16} />
                </div>
                <input
                  id="usernameOrEmail"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0c142c] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:focus:border-brand-500 text-slate-800 dark:text-slate-100 transition-colors"
                  placeholder="name@example.com or username"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-[11px] font-medium text-brand-500 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0c142c] pl-10 pr-10 py-2.5 text-sm outline-none focus:border-brand-500 dark:focus:border-brand-500 text-slate-800 dark:text-slate-100 transition-colors"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-premium hover:bg-brand-700 transition-all duration-150 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Redirection link */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-brand-500 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
