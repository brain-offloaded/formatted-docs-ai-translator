import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTranslation } from 'react-i18next';

interface TranslationErrorProps {
  error: string;
}

const TranslationError: React.FC<TranslationErrorProps> = ({ error }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ mt: 2 }}>
      <Alert
        severity="error"
        icon={<ErrorOutlineIcon />}
        sx={{
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle>{t('common.errorOccurred')}</AlertTitle>
        {error}
      </Alert>
    </Box>
  );
};

export default TranslationError;
