export enum AiProvider {
  GOOGLE = 'Google',
}

// 사전정의된 모델 enum 제거 - 직접입력만 지원
export type AiModelName = string;

export enum ModelCategory {
  GEMINI = 'gemini',
}

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
