import React, { cloneElement, isValidElement } from 'react';
import { FormControl, FormHelperText, FormLabel, Stack, Typography } from '@mui/material';

interface FormControlProps {
  id?: string;
  'aria-labelledby'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-errormessage'?: string;
}

interface FormFieldProps {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

/**
 * 접근성과 일관된 스타일을 보장하는 MUI 기반 폼 필드 래퍼
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  children,
  className,
  required = false,
  error = false,
  helperText,
}) => {
  const childWithProps = isValidElement(children)
    ? cloneElement(children as React.ReactElement<FormControlProps>, {
        id,
        'aria-labelledby': `${id}-label`,
        'aria-required': required,
        'aria-invalid': error,
        ...(error && helperText ? { 'aria-errormessage': `${id}-error` } : {}),
      })
    : children;

  return (
    <FormControl className={className} required={required} error={error} fullWidth sx={{ gap: 1 }}>
      <FormLabel id={`${id}-label`} htmlFor={id} sx={{ fontWeight: 600 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography component="span">{label}</Typography>
          {required && (
            <Typography component="span" color="error.main" aria-hidden="true">
              *
            </Typography>
          )}
        </Stack>
      </FormLabel>

      {childWithProps}

      {helperText && (
        <FormHelperText
          id={error ? `${id}-error` : undefined}
          sx={{ margin: 0 }}
          aria-live={error ? 'assertive' : 'polite'}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default FormField;
