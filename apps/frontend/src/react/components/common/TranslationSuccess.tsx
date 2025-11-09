import React from 'react';
import { Alert, AlertTitle } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';

interface TranslationSuccessProps {
  message: string;
}

const TranslationSuccess: React.FC<TranslationSuccessProps> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>
      <AlertTitle>{t('translation.translationComplete')}</AlertTitle>
      {message}
    </Alert>
  );
};

export default TranslationSuccess;
