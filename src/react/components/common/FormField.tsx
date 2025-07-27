import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

export const FormField: React.FC<TextFieldProps> = (props) => {
  return <TextField fullWidth variant="outlined" margin="normal" {...props} />;
};
