import LaunchIcon from '@mui/icons-material/Launch';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  type AlertColor,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { CopyButton } from '../../components/common/CopyButton';
import { IpcChannel } from '@apps/common/dist/ipc/ipc-channel';
import { ipcClient } from '@/react/ipc/ipcClient';
import { useTranslation } from 'react-i18next';
import { CancelablePromise, DbService } from '@/react/api/generated';
import type { GetDbPathResponseDto } from '@/react/api/generated';

const BugReportPanel: React.FC = () => {
  const { t } = useTranslation();
  const [dbPath, setDbPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');
  const bugReportUrl = 'https://github.com/brain-offloaded/formatted-docs-ai-translator/issues';

  useEffect(() => {
    let isMounted = true;
    let request: CancelablePromise<GetDbPathResponseDto> | null = null;

    const fetchDbPath = async () => {
      try {
        setIsLoading(true);
        request = DbService.dbControllerGetDbPath();
        const { path } = await request;
        if (isMounted) {
          setDbPath(path);
          setError(null);
        }
      } catch (error) {
        console.error(t('bugReport.dbPathError'), error);
        if (isMounted) {
          setError(t('bugReport.dbPathErrorUser'));
          setDbPath('');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDbPath();
    return () => {
      isMounted = false;
      request?.cancel?.();
    };
  }, [t]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (message: string, severity: AlertColor = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleOpenUrl = async (url: string) => {
    try {
      const result = await ipcClient.invoke(IpcChannel.OpenExternalUrl, {
        url,
      });
      if (!result || !result.success) {
        console.error(t('bugReport.openLinkError'), result?.message);
        showSnackbar(t('bugReport.openLinkError'), 'error');
      }
    } catch (error) {
      console.error(t('bugReport.openLinkError'), error);
      showSnackbar(t('bugReport.openLinkError'), 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('bugReport.guideTitle')}
          </Typography>
          <Typography variant="body1">{t('bugReport.guideMessage')}</Typography>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('bugReport.linkTitle')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              value={bugReportUrl}
              InputProps={{ readOnly: true }}
              size="small"
            />
            <CopyButton targetValue={bugReportUrl} title={t('bugReport.copyLink')} size="medium" />
            <Tooltip title={t('bugReport.openInBrowser')}>
              <Button
                variant="outlined"
                color="primary"
                sx={{ minWidth: 40, width: 40, height: 40, p: 0 }}
                onClick={() => handleOpenUrl(bugReportUrl)}
              >
                <LaunchIcon />
              </Button>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('bugReport.dbPathTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('bugReport.dbPathMessage')}
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                value={dbPath}
                InputProps={{ readOnly: true }}
                size="small"
              />
              <CopyButton targetValue={dbPath} title={t('bugReport.copyPath')} size="medium" />
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BugReportPanel;
