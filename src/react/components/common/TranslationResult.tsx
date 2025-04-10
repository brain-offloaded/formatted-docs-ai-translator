import React, { useCallback } from 'react';
import { Box, Paper, Typography, Button, Tooltip, Stack } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslation } from '../../contexts/TranslationContext';

interface TranslationResultProps {
  result: string;
  onDownload?: () => void;
  downloadDisabled?: boolean;
}

const TranslationResult: React.FC<TranslationResultProps> = ({
  result,
  onDownload,
  downloadDisabled = false,
}) => {
  const { showSnackbar } = useTranslation();

  // 결과 텍스트 복사 핸들러
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result).then(
      () => {
        showSnackbar('번역 결과가 클립보드에 복사되었습니다.');
      },
      (err) => {
        console.error('클립보드 복사 실패:', err);
        showSnackbar('클립보드 복사에 실패했습니다.');
      }
    );
  }, [result, showSnackbar]);

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight="medium">
          번역 결과
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="복사하기" placement="top">
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
              sx={{ minWidth: 'auto', py: 0.5 }}
            >
              복사
            </Button>
          </Tooltip>
        </Stack>
      </Box>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          maxHeight: '300px',
          overflow: 'auto',
          backgroundColor: '#f8f9fa',
        }}
      >
        <Typography
          variant="body1"
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'inherit',
            margin: 0,
          }}
        >
          {result}
        </Typography>
      </Paper>
      {onDownload && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={onDownload}
            disabled={downloadDisabled}
            sx={{ minWidth: '150px' }}
          >
            다운로드
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default TranslationResult;
