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

/**
 * Get available document templates
 */
export const getAITemplates = async (token?: string): Promise<ApiResponse<AITemplate[]>> => {
  return apiCall<AITemplate[]>('/ai/templates', {}, token);
};

/**
 * Process context for AI generation
 */
export const processAIContext = async (data: AIProcessContextRequest, token?: string): Promise<ApiResponse<AIProcessContextResponse>> => {
  return apiCall<AIProcessContextResponse>('/ai/process-context', {
    method: 'POST',
    body: JSON.stringify(data)
  }, token);
};

/**
 * Export AI generated content to DOCX
 */
export const exportAIDocument = async (data: AIExportRequest, token?: string): Promise<ApiResponse<{ downloadUrl: string }>> => {
  return apiCall<{ downloadUrl: string }>('/ai/export-document', {
    method: 'POST',
    body: JSON.stringify(data)
  }, token);
};
