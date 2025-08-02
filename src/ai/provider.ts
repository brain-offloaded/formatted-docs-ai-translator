export const enum ModelProvider {
  GOOGLE = 'Google',
}

export const getProviderUrl = (provider: ModelProvider, customUrl?: string): string => {
  if (customUrl) return customUrl;
  switch (provider) {
    case ModelProvider.GOOGLE:
      return 'https://generativelanguage.googleapis.com/v1beta';
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};
