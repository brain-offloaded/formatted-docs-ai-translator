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
    return Math.floor(maxOutputTokenCount / 6);
  }
  return Math.floor(maxOutputTokenCount / 1.5);
};
