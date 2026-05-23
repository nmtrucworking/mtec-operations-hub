import type { ApiResponse } from './api';

export const unwrapApiData = <T,>(response: ApiResponse<any>): T | undefined => {
  const payload = response?.data;

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T | undefined;
};

export const unwrapApiList = <T,>(
  response: ApiResponse<any>,
  fallbackKey?: string
): T[] => {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) {
      return payload.data as T[];
    }

    if (
      fallbackKey &&
      payload.data &&
      typeof payload.data === 'object' &&
      Array.isArray(payload.data[fallbackKey])
    ) {
      return payload.data[fallbackKey] as T[];
    }

    if (fallbackKey && Array.isArray(payload[fallbackKey])) {
      return payload[fallbackKey] as T[];
    }
  }

  return [];
};
