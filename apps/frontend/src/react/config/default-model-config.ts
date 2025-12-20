import type { TranslatorModelConfigDto } from '@/react/api/generated/models/TranslatorModelConfigDto';
export type AiModelName = TranslatorModelConfigDto['modelName'];

const normalizeNonNegativeInteger = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  if (value < 0) {
    return fallback;
  }

  return Math.floor(value);
};

const normalizeMinOneInteger = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  if (value < 1) {
    return fallback;
  }

  return Math.floor(value);
};

export const getDefaultModelConfig = (options?: {
  modelName?: string;
  requestsPerMinute?: number;
  maxOutputTokenCount?: number;
  maxConcurrentRequests?: number;
}): TranslatorModelConfigDto => {
  return {
    modelName: (typeof options?.modelName === 'string' ? options.modelName : '') as AiModelName,
    requestsPerMinute: normalizeNonNegativeInteger(options?.requestsPerMinute, 0),
    maxOutputTokenCount: normalizeNonNegativeInteger(options?.maxOutputTokenCount, 0),
    maxConcurrentRequests: normalizeMinOneInteger(options?.maxConcurrentRequests, 1),
  };
};
