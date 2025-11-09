export const calculateDefaultMaxInputTokenCount = ({
  useThinking,
  maxInputTokenCount,
  maxOutputTokenCount,
}: {
  useThinking: boolean;
  maxInputTokenCount?: number;
  maxOutputTokenCount: number;
}): number => {
  if (maxInputTokenCount) return maxInputTokenCount;
  if (useThinking) {
    return Math.floor(maxOutputTokenCount / 4);
  }
  return Math.floor(maxOutputTokenCount / 2);
};
