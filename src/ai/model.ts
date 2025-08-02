export type AiModelName = string;

export interface ModelConfig {
  modelName: AiModelName;
  requestsPerMinute: number;
  maxOutputTokenCount: number;
}

export const calculateDefaultMaxInputTokenCount = ({
  useThinking,
  maxInputTokenCount,
  maxOutputTokenCount,
}: {
  useThinking: boolean;
  maxInputTokenCount?: number;
  maxOutputTokenCount: number;
}) => {
  if (maxInputTokenCount) return maxInputTokenCount;
  if (useThinking) {
    return Math.floor(maxOutputTokenCount / 4);
  }
  return maxOutputTokenCount;
};

// 기본 모델 설정을 생성하는 함수 (직접 입력용)
export const getDefaultModelConfig = (options?: {
  modelName?: string;
  requestsPerMinute?: number;
  maxOutputTokenCount?: number;
}): ModelConfig => {
  return {
    modelName: (options?.modelName || '') as AiModelName,
    requestsPerMinute: options?.requestsPerMinute || 0,
    maxOutputTokenCount: options?.maxOutputTokenCount || 0,
  };
};
