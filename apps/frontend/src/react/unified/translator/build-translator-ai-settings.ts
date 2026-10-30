import { AiTranslatorConfig } from '@/react/types/config';
import { TranslatorAiSettingsDto } from '@/react/api/generated/models/TranslatorAiSettingsDto';
import type { SourceLanguage, TargetLanguage } from '@apps/common/dist/language';

const toDtoSourceLanguage = (language: SourceLanguage): TranslatorAiSettingsDto.sourceLanguage =>
  language as unknown as TranslatorAiSettingsDto.sourceLanguage;

const toDtoTargetLanguage = (language: TargetLanguage): TranslatorAiSettingsDto.targetLanguage =>
  language as unknown as TranslatorAiSettingsDto.targetLanguage;

const parseCustomJsonObject = (value: string): Record<string, unknown> => {
  const quotedTemplateValues = value.replace(
    /(^|[:,]|\[)\s*(\$MAX_TOKEN|\$JSON_SCHEMA|\$API_KEY|\$MODEL_NAME|\$MODEL)(?=\s*[,}\]])/gm,
    '$1"$2"'
  );
  const parsed: unknown = JSON.parse(quotedTemplateValues);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Custom request settings must be a JSON object.');
  }
  return parsed as Record<string, unknown>;
};

const parseCustomHeaders = (value: string): Record<string, string> => {
  const parsed = parseCustomJsonObject(value);
  if (Object.values(parsed).some((headerValue) => typeof headerValue !== 'string')) {
    throw new Error('Custom HTTP header values must be strings.');
  }
  return parsed as Record<string, string>;
};

export const buildTranslatorAiSettings = (config: AiTranslatorConfig): TranslatorAiSettingsDto => {
  const normalizedThinkingLevel = config.thinkingLevel?.trim();
  return {
    modelProvider: config.modelProvider,
    sourceLanguage: toDtoSourceLanguage(config.sourceLanguage),
    targetLanguage: toDtoTargetLanguage(config.targetLanguage),
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    customModelConfig: {
      modelName: config.customModelConfig.modelName,
      requestsPerMinute: config.customModelConfig.requestsPerMinute,
      maxOutputTokenCount: config.customModelConfig.maxOutputTokenCount,
      maxInputCharacterCount: config.customModelConfig.maxInputCharacterCount ?? 0,
      maxConcurrentRequests: Math.max(1, config.customModelConfig.maxConcurrentRequests ?? 1),
    },
    ...(config.modelProvider !== TranslatorAiSettingsDto.modelProvider.OPENAI_COMPATIBLE
      ? {
          useThinking: config.useThinking,
          setThinkingBudget: config.setThinkingBudget,
          thinkingBudget: config.thinkingBudget,
          ...(normalizedThinkingLevel ? { thinkingLevel: normalizedThinkingLevel } : {}),
        }
      : {}),
    ...(config.modelProvider === TranslatorAiSettingsDto.modelProvider.OPENAI_COMPATIBLE
      ? {
          customHeaders: config.customHeaders ? parseCustomHeaders(config.customHeaders) : {},
          customBody: config.customBody ? parseCustomJsonObject(config.customBody) : {},
        }
      : {}),
  };
};
