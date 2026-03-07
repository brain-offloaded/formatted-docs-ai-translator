import { isStrictFailureMessage } from '@/react/unified/applier/strict-failure';

interface TranslationItemLike {
  success: boolean;
  message?: string;
}

interface AggregatedTranslationResultLike {
  name: string;
  success: boolean;
  items: TranslationItemLike[];
}

interface DeriveFileTranslationOutcomeParams {
  aggregated: AggregatedTranslationResultLike[];
  strictFailureAbortMessage: string;
}

export const deriveFileTranslationOutcome = ({
  aggregated,
  strictFailureAbortMessage,
}: DeriveFileTranslationOutcomeParams) => {
  const hasStrictFailure = aggregated.some((group) =>
    group.items.some((item) => !item.success && isStrictFailureMessage(item.message))
  );

  const total = aggregated.length;
  const success = aggregated.filter((group) => group.success).length;
  const fail = total - success;
  const isFatalError = hasStrictFailure || (fail === total && total > 0);

  const items = aggregated.map((group) => {
    const errorMessage = group.items
      .map((item) => item.message?.trim())
      .filter((message): message is string => !!message && message.length > 0)
      .join('\n');

    return {
      name: group.name,
      success: group.success,
      errorMessage: group.success
        ? undefined
        : errorMessage || (hasStrictFailure ? strictFailureAbortMessage : undefined),
    };
  });

  return {
    hasStrictFailure,
    total,
    success,
    fail,
    isFatalError,
    items,
  };
};
