import { ThinkableModelPredicate } from './common/model-config';
import {
  GeminiModel,
  GeminiModelConfig,
  getGeminiDefaultMaxInputTokenCountByModel,
  getGeminiDefaultMaxOutputTokenCountByModel,
  getGeminiDefaultRequestsPerMinuteByModel,
  getGeminiModelDescription,
  isThinkableGemini,
  isValidGemini,
} from './gemini/gemini-models';

export enum AiProvider {
  GOOGLE = 'Google',
}

export const AiModelName = {
  ...GeminiModel,
} as const;

export type AiModelName = (typeof AiModelName)[keyof typeof AiModelName];

export enum ModelCategory {
  GEMINI = 'gemini',
}

export type ModelConfig = GeminiModelConfig;

export interface ModelConfigs {
  [ModelCategory.GEMINI]: GeminiModelConfig;
}

export const isThinkableModel: ThinkableModelPredicate<AiModelName> = (modelName: AiModelName) => {
  if (isValidGemini(modelName)) {
    return isThinkableGemini(modelName);
  }
  return false;
};

export const getModelDescription = (model: AiModelName) => {
  if (isValidGemini(model)) {
    return getGeminiModelDescription(model);
  }

  return '설명이 작성되지 않은 모델입니다.';
};

export const getDefaultModelName = (modelName?: AiModelName) => {
  if (modelName) return modelName;

  return AiModelName.FLASH_EXP;
};

export const getDefaultRequestsPerMinuteByModel = (
  modelName: AiModelName,
  requestsPerMinute?: number
) => {
  if (isValidGemini(modelName)) {
    return getGeminiDefaultRequestsPerMinuteByModel({
      modelName,
      requestsPerMinute,
    });
  }

  throw new Error(`Default requests per minute is not supported for model: ${modelName}`);
};

export const getDefaultMaxOutputTokenCountByModel = (
  modelName: AiModelName,
  maxOutputTokenCount?: number
) => {
  if (isValidGemini(modelName)) {
    return getGeminiDefaultMaxOutputTokenCountByModel({
      modelName,
      maxOutputTokenCount,
    });
  }

  throw new Error(`Default max output token count is not supported for model: ${modelName}`);
};

export const getDefaultMaxInputTokenCountByModel = ({
  modelName,
  maxInputTokenCount,
  maxOutputTokenCount,
}: {
  modelName: AiModelName;
  maxInputTokenCount?: number;
  maxOutputTokenCount?: number;
}) => {
  if (isValidGemini(modelName)) {
    return getGeminiDefaultMaxInputTokenCountByModel({
      modelName,
      maxInputTokenCount,
      maxOutputTokenCount,
    });
  }

  throw new Error(`Default max input token count is not supported for model: ${modelName}`);
};

export const getDefaultModelConfig = ({
  modelName: modelNameOverride,
  requestsPerMinute: requestsPerMinuteOverride,
  maxOutputTokenCount: maxOutputTokenCountOverride,
}: {
  modelName?: AiModelName;
  requestsPerMinute?: number;
  maxOutputTokenCount?: number;
} = {}) => {
  const modelName = getDefaultModelName(modelNameOverride);
  const requestsPerMinute = getDefaultRequestsPerMinuteByModel(
    modelName,
    requestsPerMinuteOverride
  );
  const maxOutputTokenCount = getDefaultMaxOutputTokenCountByModel(
    modelName,
    maxOutputTokenCountOverride
  );
  return {
    modelName: modelName,
    requestsPerMinute,
    maxOutputTokenCount,
  };
};
