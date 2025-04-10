import React from 'react';
import { Button, Box } from '@mui/material';
import { Translate as TranslateIcon } from '@mui/icons-material';

interface TranslationButtonProps {
  isTranslating: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

const TranslationButton: React.FC<TranslationButtonProps> = ({
  isTranslating,
  isDisabled,
  onClick,
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
      <Button
        variant="contained"
        color="primary"
        size="large"
        startIcon={<TranslateIcon />}
        onClick={onClick}
        disabled={isDisabled}
        sx={{
          py: 1.5,
          minWidth: '150px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {isTranslating ? '번역 중...' : '번역하기'}
      </Button>
    </Box>
  );
};

export default TranslationButton;
