import { apiCall, ApiResponse } from './api';

export interface AITemplate {
  id: string;
  name: string;
  description: string;
  code: string; // e.g., 'BM-MTEC-HC-03'
}

export interface AIProcessContextRequest {
  text?: string;
  fileUrl?: string;
  link?: string;
}

export interface AIProcessContextResponse {
  contextId: string;
  summary: string;
  extractedData: any;
}

export interface AIExportRequest {
  content: string;
  templateId?: string;
  title: string;
}

export interface AIGenerateRequest {
  prompt: string;
  contextId?: string;
  templateId?: string;
}

export interface AIGenerateResponse {
  text: string;
  logId: string;
  provider: string;
  status: string;
}

/**
 * Get available document templates
 */
export const getAITemplates = async (token?: string): Promise<ApiResponse<AITemplate[]>> => {
  return apiCall<AITemplate[]>('/api/v1/ai/templates', {}, token);
};

/**
 * Generate AI Insight
 */
export const generateAIInsight = async (data: { prompt: string }, token?: string): Promise<ApiResponse<AIGenerateResponse>> => {
  return apiCall<AIGenerateResponse>('/api/v1/ai/generate-insight', {
    method: 'POST',
    body: JSON.stringify(data)
  }, token);
};

/**
 * Generate AI Draft
 */
export const generateAIDraft = async (data: AIGenerateRequest, token?: string): Promise<ApiResponse<AIGenerateResponse>> => {
  return apiCall<AIGenerateResponse>('/api/v1/ai/generate-draft', {
    method: 'POST',
    body: JSON.stringify(data)
  }, token);
};

/**
 * Process context for AI generation
 */
export const processAIContext = async (data: AIProcessContextRequest, token?: string): Promise<ApiResponse<AIProcessContextResponse>> => {
  return apiCall<AIProcessContextResponse>('/api/v1/ai/process-context', {
    method: 'POST',
    body: JSON.stringify(data)
  }, token);
};

/**
 * Export AI generated content to DOCX
 */
export const exportAIDocument = async (data: AIExportRequest, token?: string): Promise<ApiResponse<{ downloadUrl: string }>> => {
  return apiCall<{ downloadUrl: string }>('/api/v1/ai/export-document', {
    method: 'POST',
    body: JSON.stringify(data)
  }, token);
};
