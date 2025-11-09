import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface TranslationProgressProps {
  completed: number;
  total: number;
  failed: number;
  cancelled?: number;
  message?: string;
}

const TranslationProgress: React.FC<TranslationProgressProps> = ({
  completed,
  total,
  failed,
  cancelled = 0,
  message,
}) => {
  const { t } = useTranslation();
  const cancelledCount = Math.max(cancelled, 0);
  const finished = Math.max(completed, 0);
  const successCount = Math.max(finished - cancelledCount, 0);
  const progress = total > 0 ? ((finished + failed) / total) * 100 : 0;

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {message || t('translation.progressMessage')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {`${finished}/${total}`}
          </Typography>
          {failed > 0 && (
            <Typography variant="body2" color="error">
              {`${t('translation.failCount')}: ${failed}`}
            </Typography>
          )}
          {cancelledCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {`${t('translation.successCount')}: ${successCount}`}
            </Typography>
          )}
          {cancelledCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {`${t('translation.cancelCount')}: ${cancelledCount}`}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {`${Math.round(progress)}%`}
          </Typography>
        </Box>
      </Box>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
};

export default TranslationProgress;
