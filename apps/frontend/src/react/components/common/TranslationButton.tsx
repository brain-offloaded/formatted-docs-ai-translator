import React from 'react';
import { Button, Box } from '@mui/material';
import { Translate as TranslateIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface TranslationButtonProps {
  isTranslating: boolean;
  isDisabled: boolean;
  onClick: () => void;
  onCancel: () => void;
}

const TranslationButton: React.FC<TranslationButtonProps> = ({
  isTranslating,
  isDisabled,
  onClick,
  onCancel,
}) => {
  const { t } = useTranslation();
  if (isTranslating) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          size="large"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          sx={{
            py: 1.5,
            minWidth: '150px',
          }}
        >
          {t('common.cancel')}
        </Button>
      </Box>
    );
  }

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
        {t('translation.translate')}
      </Button>
    </Box>
  );
};

export default TranslationButton;
