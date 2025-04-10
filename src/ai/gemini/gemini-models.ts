import {
  CommonModelConfig,
  generateValidModelPredicate,
  ThinkableModelPredicate,
} from '../common/model-config';

export enum GeminiModel {
  FLASH_EXP = 'gemini-2.0-flash-exp-image-generation',
  FLASH_THINKING_EXP = 'gemini-2.0-flash-thinking-exp-01-21',
  GEMINI_PRO_2_POINT_5_EXP = 'gemini-2.5-pro-exp-03-25',
}

export type GeminiModelConfig = CommonModelConfig<GeminiModel>;

export const getGeminiDefaultRequestsPerMinuteByModel = ({
  modelName,
  requestsPerMinute,
}: {
  modelName: GeminiModel;
  requestsPerMinute?: number;
}) => {
  if (requestsPerMinute) return requestsPerMinute;

  switch (modelName) {
    case GeminiModel.FLASH_EXP:
      return 10;
    case GeminiModel.GEMINI_PRO_2_POINT_5_EXP:
      return 5;
    case GeminiModel.FLASH_THINKING_EXP:
      return 10;
    default:
      return 10;
  }
};

export const getGeminiDefaultMaxOutputTokenCountByModel = ({
  modelName,
  maxOutputTokenCount,
}: {
  modelName: GeminiModel;
  maxOutputTokenCount?: number;
}) => {
  if (maxOutputTokenCount) return maxOutputTokenCount;

  switch (modelName) {
    case GeminiModel.FLASH_EXP:
      return 8192;
    case GeminiModel.GEMINI_PRO_2_POINT_5_EXP:
      return 16384;
    case GeminiModel.FLASH_THINKING_EXP:
      return 16384;
    default:
      return 8192;
  }
};

const getGeminiDefaultMaxInputTokenCountByModelAndMaxOutputTokenCount = (
  modelName: GeminiModel,
  maxOutputTokenCount: number
) => {
  if (isThinkableGemini(modelName)) {
    return Math.floor(maxOutputTokenCount / 4);
  }
  return maxOutputTokenCount;
};

export const getGeminiDefaultMaxInputTokenCountByModel = ({
  modelName,
  maxInputTokenCount,
  maxOutputTokenCount,
}: {
  modelName: GeminiModel;
  maxInputTokenCount?: number;
  maxOutputTokenCount?: number;
}) => {
  if (maxInputTokenCount) return maxInputTokenCount;

  return getGeminiDefaultMaxInputTokenCountByModelAndMaxOutputTokenCount(
    modelName,
    getGeminiDefaultMaxOutputTokenCountByModel({ modelName, maxOutputTokenCount })
  );
};

export const getGeminiModelDescription = (modelName: GeminiModel) => {
  switch (modelName) {
    case GeminiModel.FLASH_EXP:
      return '가장 빠른 모델, 간단한 작업에 적합';
    case GeminiModel.GEMINI_PRO_2_POINT_5_EXP:
      return '가장 강력한 모델, 정확한 번역 품질';
    case GeminiModel.FLASH_THINKING_EXP:
      return '가벼운 추론 모델, 적당한 수준의 번역';
    default:
      return '';
  }
};

export const isThinkableGemini: ThinkableModelPredicate<GeminiModel> = (modelName: GeminiModel) => {
  return (
    modelName === GeminiModel.FLASH_THINKING_EXP ||
    modelName === GeminiModel.GEMINI_PRO_2_POINT_5_EXP
  );
};

export const isValidGemini = generateValidModelPredicate(GeminiModel);
