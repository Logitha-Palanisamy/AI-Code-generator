import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { MainLayout } from "../layouts/MainLayout";

// Import page components
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
import { RequirementsPage } from "../pages/RequirementsPage";
import { CodeGeneratorPage } from "../pages/CodeGeneratorPage";
import { ProjectGeneratorPage } from "../pages/ProjectGeneratorPage";
import { CodeReviewPage } from "../pages/CodeReviewPage";
import { ExecuteCodePage } from "../pages/ExecuteCodePage";
import { UnitTestsPage } from "../pages/UnitTestsPage";
import { DocumentationPage } from "../pages/DocumentationPage";
import { HistoryPage } from "../pages/HistoryPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SettingsPage } from "../pages/SettingsPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";


export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Secure Auth Guarded Pages */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/requirements" element={<RequirementsPage />} />
        <Route path="/code-generator" element={<CodeGeneratorPage />} />
        <Route path="/project-generator" element={<ProjectGeneratorPage />} />
        <Route path="/code-review" element={<CodeReviewPage />} />
        <Route path="/execute" element={<ExecuteCodePage />} />
        <Route path="/unit-tests" element={<UnitTestsPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Admin Gated Pages */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
