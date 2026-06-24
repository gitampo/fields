import { ApiErrorBody } from '../types';

export const API_URL =
  ((globalThis as { process?: { env?: Record<string, string> } }).process?.env?.EXPO_PUBLIC_API_URL as string | undefined) ||
  'http://10.0.2.2:3000';

export const getApiErrorMessage = (status: number, body: ApiErrorBody): string => {
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    return body.errors.join('\n');
  }
  if (body.message) {
    return body.message;
  }
  return `Request failed (${status})`;
};
