import { AiTranslatorConfig } from '@/react/types/config';
import { TranslatorAiSettingsDto } from '@/react/api/generated/models/TranslatorAiSettingsDto';
import type { SourceLanguage, TargetLanguage } from '@apps/common/dist/language';

const toDtoSourceLanguage = (language: SourceLanguage): TranslatorAiSettingsDto.sourceLanguage =>
  language as unknown as TranslatorAiSettingsDto.sourceLanguage;

const toDtoTargetLanguage = (language: TargetLanguage): TranslatorAiSettingsDto.targetLanguage =>
  language as unknown as TranslatorAiSettingsDto.targetLanguage;

export const buildTranslatorAiSettings = (config: AiTranslatorConfig): TranslatorAiSettingsDto => {
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
      maxConcurrentRequests: config.customModelConfig.maxConcurrentRequests,
    },
    useThinking: config.useThinking,
    setThinkingBudget: config.setThinkingBudget,
    thinkingBudget: config.thinkingBudget,
  };
};
