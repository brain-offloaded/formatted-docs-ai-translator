import type { TranslatorModelConfigDto } from '@/react/api/generated/models/TranslatorModelConfigDto';
export type AiModelName = TranslatorModelConfigDto['modelName'];

export const getDefaultModelConfig = (options?: {
  modelName?: string;
  requestsPerMinute?: number;
  maxOutputTokenCount?: number;
  maxConcurrentRequests?: number;
}): TranslatorModelConfigDto => {
  return {
    modelName: (options?.modelName || '') as AiModelName,
    requestsPerMinute: options?.requestsPerMinute || 0,
    maxOutputTokenCount: options?.maxOutputTokenCount || 0,
    maxConcurrentRequests: options?.maxConcurrentRequests || 1,
  };
};
