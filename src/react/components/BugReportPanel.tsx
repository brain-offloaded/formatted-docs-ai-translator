import LaunchIcon from '@mui/icons-material/Launch';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Tooltip,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { CopyButton } from './common/CopyButton';
import { IpcChannel } from '../../nest/common/ipc.channel';
const BugReportPanel: React.FC = () => {
  const [dbPath, setDbPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const bugReportUrl = 'https://github.com/leejs1030/formatted-docs-ai-translator/issues';

  useEffect(() => {
    const fetchDbPath = async () => {
      try {
        setIsLoading(true);
        const path = await window.electron.ipcRenderer.invoke(IpcChannel.GetDbPath);
        setDbPath(path);
        setError(null);
      } catch (error) {
        console.error('데이터베이스 경로를 가져오는 중 오류가 발생했습니다:', error);
        setError(
          '데이터베이스 경로를 가져올 수 없습니다. 애플리케이션이 올바르게 실행 중인지 확인해주세요.'
        );
        setDbPath('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDbPath();
  }, []);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleOpenUrl = (url: string) => {
    try {
      window.electron.shell.openExternal(url);
    } catch (error) {
      console.error('링크를 외부 브라우저에서 열지 못했습니다:', error);
      showSnackbar('링크를 외부 브라우저에서 열지 못했습니다.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            버그 제보 안내
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            애플리케이션에서 문제가 발생한 경우, 아래 링크를 통해 GitHub 이슈를 생성해 주세요. 문제
            상황을 자세히 설명하고, 가능하다면 아래 데이터베이스 파일을 첨부해 주시면 문제 해결에 큰
            도움이 됩니다.
          </Typography>
        </CardContent>
      </Card>

      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>
          버그 제보 링크
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={bugReportUrl}
            InputProps={{ readOnly: true }}
            size="small"
          />
          <CopyButton targetValue={bugReportUrl} title="링크 복사" size="medium" />
          <Tooltip title="브라우저에서 열기">
            <Button
              variant="outlined"
              color="primary"
              sx={{ ml: 1, minWidth: '40px', width: '40px', height: '40px', p: 0 }}
              onClick={() => handleOpenUrl(bugReportUrl)}
            >
              <LaunchIcon />
            </Button>
          </Tooltip>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>
          데이터베이스 파일 위치
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          문제 해결을 위해 아래 위치의 데이터베이스 파일을 첨부해 주세요.
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="outlined"
              value={dbPath}
              InputProps={{ readOnly: true }}
              size="small"
            />
            <CopyButton targetValue={dbPath} title="경로 복사" size="medium" />
          </Box>
        )}
      </Paper>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BugReportPanel;
