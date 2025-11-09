import { ModelProvider } from '@/nest/translator/common/dto/translator-settings.dto';

export const getProviderUrl = (provider: ModelProvider, customUrl?: string): string => {
  if (customUrl) return customUrl;
  switch (provider) {
    case ModelProvider.GOOGLE:
      return 'https://generativelanguage.googleapis.com/v1beta';
    case ModelProvider.VERTEX_AI:
      return ''; // Vertex AI doesn't need a base URL as it's handled by the SDK
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};
