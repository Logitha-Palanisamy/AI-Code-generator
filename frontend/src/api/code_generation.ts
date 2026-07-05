/**
 * Code generation API functions
 */

import client from "./client";

export interface CodeGenerationRequest {
  description: string;
  language: string;
  framework?: string;
}

export interface CodeGenerationResponse {
  success: boolean;
  filename?: string;
  language?: string;
  code?: string;
  description?: string;
  dependencies?: string[];
  error?: string;
}

export interface CodeRefineRequest {
  code: string;
  feedback: string;
  language: string;
}

export async function generateCode(
  request: CodeGenerationRequest
): Promise<CodeGenerationResponse> {
  const response = await client.post<CodeGenerationResponse>(
    "/code-generation/generate",
    request
  );

  return response.data;
}

export async function refineCode(
  request: CodeRefineRequest
): Promise<{ success: boolean; code?: string; changes?: string; error?: string }> {
  const response = await client.post<{
    success: boolean;
    code?: string;
    changes?: string;
    error?: string;
  }>("/code-generation/refine", request);

  return response.data;
}

export async function generateMultiLanguage(
  description: string,
  languages: string[]
): Promise<{ success: boolean; results: Record<string, CodeGenerationResponse> }> {
  const response = await client.post<{
    success: boolean;
    results: Record<string, CodeGenerationResponse>;
  }>("/code-generation/generate-multi", {
    description,
    languages,
  });

  return response.data;
}
