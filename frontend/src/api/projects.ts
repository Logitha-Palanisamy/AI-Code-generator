import client from "./client";

export interface PipelineRun {
  id: number;
  project_id: number;
  stage: string;
  status: string;
  error: string | null;
  attempt_number: number;
  started_at: string;
  finished_at: string | null;
}

export interface Project {
  id: number;
  user_id: number;
  status: string;
  requirement_text: string;
  target_language: string;
  complexity: string | null;
  created_at: string;
  updated_at: string;
  pipeline_runs: PipelineRun[];
}

export interface Setting {
  id: number;
  user_id: number;
  theme: string;
  preferred_model: string;
  timeout_seconds: number;
  personal_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIUsageLog {
  id: number;
  user_id: number;
  project_id: number | null;
  provider: string;
  model: string;
  stage: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  latency_ms: number;
  timestamp: string;
}

export interface SystemLog {
  timestamp: string;
  level: string;
  logger: string;
  event: string;
  correlation_id: string;
  [key: string]: any;
}

// Project APIs
export const getProjects = async () => {
  const res = await client.get<Project[]>("/projects");
  return res.data;
};

export const createProject = async (requirementText: string, targetLanguage: string) => {
  const res = await client.post<Project>("/projects", {
    requirement_text: requirementText,
    target_language: targetLanguage,
  });
  return res.data;
};

export const getProjectDetails = async (id: number) => {
  const res = await client.get<Project>(`/projects/${id}`);
  return res.data;
};

export const getProjectArtifacts = async (id: number) => {
  const res = await client.get<{ files: { filename: string; content: string }[] }>(`/projects/${id}/artifacts`);
  return res.data.files;
};

export const deleteProject = async (id: number) => {
  const res = await client.delete(`/projects/${id}`);
  return res.data;
};

export const rebuildProject = async (id: number) => {
  const res = await client.post<Project>(`/projects/${id}/rebuild`);
  return res.data;
};

// Settings APIs
export const getSettings = async () => {
  const res = await client.get<Setting>("/settings");
  return res.data;
};

export const updateSettings = async (settingsData: Partial<Setting>) => {
  const res = await client.put<Setting>("/settings", settingsData);
  return res.data;
};

// Admin APIs
export const getAdminUsers = async () => {
  const res = await client.get<User[]>("/admin/users");
  return res.data;
};

export const updateUserRole = async (userId: number, newRole: string) => {
  const res = await client.put<User>(`/admin/users/${userId}/role?new_role=${newRole}`);
  return res.data;
};

export const getAIUsageLogs = async () => {
  const res = await client.get<AIUsageLog[]>("/admin/ai-usage");
  return res.data;
};

export const getSystemLogs = async () => {
  const res = await client.get<SystemLog[]>("/admin/system-logs");
  return res.data;
};
