import React from 'react';
import { Alert, AlertTitle } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface TranslationSuccessProps {
  message: string;
}

const TranslationSuccess: React.FC<TranslationSuccessProps> = ({ message }) => {
  return (
    <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>
      <AlertTitle>번역 완료</AlertTitle>
      {message}
    </Alert>
  );
};

export default TranslationSuccess;
