import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Autocomplete, Box, Button, Stack, TextField, Typography } from '@mui/material';
import type { CacheTagSummaryDto } from '@/react/api/generated';

interface CacheTagDeleteModalProps {
  tag: CacheTagSummaryDto;
  cacheTags: CacheTagSummaryDto[];
  onSubmit: (action: {
    mode: 'cascade' | 'reassign' | 'skip';
    targetTagId?: number;
  }) => Promise<void>;
  onClose: () => void;
}

export const CacheTagDeleteModal: React.FC<CacheTagDeleteModalProps> = ({
  tag,
  cacheTags,
  onSubmit,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableTargets = useMemo(
    () => cacheTags.filter((candidate) => candidate.id !== tag.id),
    [cacheTags, tag.id]
  );

  const handleSkip = () => {
    onClose();
  };

  const runAction = async (mode: 'cascade' | 'reassign', targetTagId?: number) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({ mode, targetTagId });
      onClose();
    } catch (error) {
      const fallbackMessage =
        error instanceof Error ? error.message : t('cacheTag.deleteErrorFallback');
      setErrorMessage(fallbackMessage);
      setIsSubmitting(false);
    }
  };

  const handleCascade = () => {
    void runAction('cascade');
  };

  const handleReassign = () => {
    if (selectedTargetId == null) {
      return;
    }
    void runAction('reassign', selectedTargetId);
  };

  const translationCountText = t('cacheTag.linkedTranslationCount', {
    count: tag.translationCount,
  });

  return (
    <Stack spacing={3} sx={{ minWidth: { xs: 0, sm: 320 } }}>
      <Stack spacing={1}>
        <Typography variant="h6" component="h4">
          {t('cacheTag.deleteConfirmTitle', { tagName: tag.name })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {translationCountText}
        </Typography>
      </Stack>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('cacheTag.deleteCascadeDescription')}
        </Typography>
        <Button variant="contained" color="error" onClick={handleCascade} disabled={isSubmitting}>
          {t('cacheTag.deleteCascadeAction')}
        </Button>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('cacheTag.deleteReassignDescription')}
        </Typography>
        <Autocomplete
          options={availableTargets}
          value={availableTargets.find((tagOption) => tagOption.id === selectedTargetId) ?? null}
          onChange={(_, value) => setSelectedTargetId(value?.id ?? null)}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder={t('cacheTag.deleteSelectPlaceholder')}
            />
          )}
          noOptionsText={t('cacheTag.deleteNoOtherTag')}
          disabled={isSubmitting || availableTargets.length === 0}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReassign}
            disabled={isSubmitting || selectedTargetId == null || availableTargets.length === 0}
          >
            {t('cacheTag.deleteReassignAction')}
          </Button>
        </Box>
      </Stack>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="text" onClick={handleSkip} disabled={isSubmitting}>
          {t('cacheTag.deleteSkipAction')}
        </Button>
      </Box>
    </Stack>
  );
};

export default CacheTagDeleteModal;
