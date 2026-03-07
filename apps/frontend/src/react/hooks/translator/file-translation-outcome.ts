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
  const groupOutcomes = aggregated.map((group) => {
    const hasGroupStrictFailure = group.items.some(
      (item) => !item.success && isStrictFailureMessage(item.message)
    );
    return {
      ...group,
      hasGroupStrictFailure,
    };
  });

  const hasStrictFailure = groupOutcomes.some((group) => group.hasGroupStrictFailure);
  const total = groupOutcomes.length;
  const success = groupOutcomes.filter((group) => group.success).length;
  const fail = total - success;
  const isFatalError = hasStrictFailure || (fail === total && total > 0);

  const items = groupOutcomes.map((group) => {
    const errorMessages = group.items
      .map((item) => item.message?.trim())
      .filter((message): message is string => !!message && message.length > 0);
    const errorMessage =
      errorMessages.join('\n') ||
      (group.hasGroupStrictFailure ? strictFailureAbortMessage : undefined);

    return {
      name: group.name,
      success: group.success,
      errorMessage: group.success ? undefined : errorMessage,
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
