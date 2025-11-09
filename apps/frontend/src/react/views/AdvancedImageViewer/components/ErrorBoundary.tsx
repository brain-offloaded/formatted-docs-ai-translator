import React from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<WithTranslation>, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 최소한 콘솔로는 노출하여 원인을 빠르게 파악
    console.error('[AdvancedImageViewer ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'black',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            textAlign: 'center',
          }}
        >
          <div>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t('advancedImageViewer.errorBoundary.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {this.state.error?.message || t('advancedImageViewer.errorBoundary.unknown')}
            </Typography>
          </div>
        </Box>
      );
    }
    return this.props.children;
  }
}

const ErrorBoundaryWithTranslation = withTranslation()(ErrorBoundary);

export { ErrorBoundaryWithTranslation as ErrorBoundary };
