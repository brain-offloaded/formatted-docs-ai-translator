import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface TranslationErrorProps {
  error: string;
}

const TranslationError: React.FC<TranslationErrorProps> = ({ error }) => {
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
        <AlertTitle>오류 발생</AlertTitle>
        {error}
      </Alert>
    </Box>
  );
};

export default TranslationError;
