import { apiCall, ApiResponse } from './api';

export interface AITemplate {
  id: string;
  name: string;
  description: string;
  code: string; // e.g., 'BM-MTEC-HC-03'
}

export interface AIProcessContextRequest {
  source: 'file' | 'link';
  content: string;
}

export interface AIProcessContextResponse {
  message: string;
  extractedLength: number;
  preview: string;
}

export interface AIExportRequest {
  content: string;
  templateId?: string;
  title: string;
}

export interface AIGenerateRequest {
  prompt: string;
  context?: string;
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
  const response = await apiCall<any>('/api/v1/ai/templates', { method: 'GET' }, token);

  if (!response.data) {
    return response as ApiResponse<AITemplate[]>;
  }

  const payload = response.data as any;
  const rawItems = payload?.data ?? payload;
  const items = Array.isArray(rawItems) ? rawItems : [];

  return {
    ...response,
    data: items.map((item: any) => ({
      id: String(item?.id ?? ''),
      name: String(item?.name ?? ''),
      description: String(item?.description ?? ''),
      code: String(item?.code ?? item?.id ?? '')
    }))
  };
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
  const response = await apiCall<any>('/api/v1/ai/process-context', {
    method: 'POST',
    body: JSON.stringify(data)
  }, token);

  if (!response.data) {
    return response as ApiResponse<AIProcessContextResponse>;
  }

  const payload = response.data as any;
  const body = payload?.data ?? payload;

  return {
    ...response,
    data: {
      message: String(body?.message ?? ''),
      extractedLength: Number(body?.extractedLength ?? 0),
      preview: String(body?.preview ?? '')
    }
  };
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
