import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Code,
  FolderCode,
  Eye,
  Terminal,
  Beaker,
  BookOpen,
  History,
  Settings,
  User as UserIcon,
  ShieldAlert,
  LogOut,
  Sun,
  Moon,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark"); // Default dark as approved

  // Synchronize CSS class with theme state
  useEffect(() => {
    const body = document.body;
    if (theme === "dark") {
      body.classList.add("dark");
    } else {
      body.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Sidebar navigation menu items
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Requirements", path: "/requirements", icon: FileText },
    { name: "Code Generator", path: "/code-generator", icon: Code },
    { name: "Project Generator", path: "/project-generator", icon: FolderCode },
    { name: "Code Review", path: "/code-review", icon: Eye },
    { name: "Execute Code", path: "/execute", icon: Terminal },
    { name: "Unit Tests", path: "/unit-tests", icon: Beaker },
    { name: "Documentation", path: "/documentation", icon: BookOpen },
    { name: "History", path: "/history", icon: History },
    { name: "Profile", path: "/profile", icon: UserIcon },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  // Insert Admin options conditionally
  if (user?.role === "admin") {
    menuItems.push({ name: "Admin Dashboard", path: "/admin", icon: ShieldAlert });
  }

  // Get human readable title of current active route
  const getPageTitle = () => {
    const currentPath = location.pathname;
    if (currentPath.startsWith("/admin")) return "Admin Dashboard";
    const found = menuItems.find((item) => item.path === currentPath);
    return found ? found.name : "Code Agent";
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-100 dark:bg-[#0c142c] dark:border-r dark:border-slate-800">
      <div>
        {/* Logo and collapse toggle */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-lg">
              Ω
            </div>
            {!isSidebarCollapsed && (
              <span className="text-md font-bold tracking-tight bg-gradient-to-r from-brand-400 to-white bg-clip-text text-transparent">
                CODE AGENT
              </span>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1 px-2 py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === "/admin" && location.pathname.startsWith("/admin"));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-brand-600 text-white shadow-premium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon className={`h-5 w-5 ${isSidebarCollapsed ? "mx-auto" : "mr-3"}`} />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Card Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                  {user?.full_name || user?.username}
                </span>
                <span className="text-[10px] text-slate-500 capitalize">{user?.role?.replace("_", " ")}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#070b19] dark:text-slate-100 bg-premium-gradient">
      {/* Desktop Sidebar wrapper */}
      <aside className={`hidden md:block transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/60 backdrop-blur-sm">
          <div className="w-64 animate-slide-in h-full">
            <SidebarContent />
          </div>
          <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}

      {/* Application Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/75 px-4 dark:border-slate-800 dark:bg-[#0a0f24]/75 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 font-outfit">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Profile Pill */}
            <div className="flex items-center space-x-2 rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {user?.username}
              </span>
            </div>
          </div>
        </header>

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
