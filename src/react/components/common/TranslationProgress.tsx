import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface TranslationProgressProps {
  current: number;
  total: number;
  message?: string;
}

const TranslationProgress: React.FC<TranslationProgressProps> = ({
  current,
  total,
  message = '번역 진행 중...',
}) => {
  const progress = (current / total) * 100;

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
      </Box>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
};

export default TranslationProgress;
