import React, { useCallback } from 'react';
import { Box, Paper, Typography, Button, Tooltip, Stack } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslation } from '../../contexts/TranslationContext';
import { useTranslation as useI18n } from 'react-i18next';
import ImageResultViewer from './ImageResultViewer';
import TranslationReportSummary from './TranslationReportSummary';
import type { ImageOcrTranslationResultDto } from '@/react/api/generated/models/ImageOcrTranslationResultDto';
import type { TranslationResultState } from '@/react/contexts/TranslationContext';

// 타입 가드 함수
const isImageResult = (result: unknown): result is ImageOcrTranslationResultDto => {
  return (
    typeof result === 'object' &&
    result !== null &&
    'ocr_result' in result &&
    'translated_result' in result
  );
};

type TranslationReport = TranslationResultState['report'];

interface TranslationResultProps {
  result: string | ImageOcrTranslationResultDto;
  onDownload?: () => void;
  downloadDisabled?: boolean;
  report?: TranslationReport;
}

const TranslationResult: React.FC<TranslationResultProps> = ({
  result,
  onDownload,
  downloadDisabled = false,
  report,
}) => {
  const { showSnackbar, fileState } = useTranslation();
  const { t } = useI18n();

  const handleCopy = useCallback(() => {
    const textToCopy = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        showSnackbar(t('translationResult.copySuccess'));
      },
      (err) => {
        console.error('클립보드 복사 실패:', err);
        showSnackbar(t('translationResult.copyFailed'));
      }
    );
  }, [result, showSnackbar, t]);

  if (isImageResult(result)) {
    const file = fileState.selectedFiles?.[0];
    if (!file) {
      return <Typography>이미지 파일을 찾을 수 없습니다.</Typography>;
    }

    return (
      <ImageResultViewer
        file={file}
        ocrResult={result.ocr_result}
        translatedResult={result.translated_result}
      />
    );
  }

  if (report) {
    const headerActions = (
      <>
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
        {onDownload && report.success > 0 && (
          <Tooltip title="번역된 결과 다운로드" placement="top">
            <span>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={onDownload}
                disabled={downloadDisabled}
                sx={{ minWidth: 'auto', py: 0.5 }}
              >
                ZIP
              </Button>
            </span>
          </Tooltip>
        )}
      </>
    );

    return <TranslationReportSummary report={report} headerActions={headerActions} />;
  }

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
          {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
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
