import React from 'react';
import { Button, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TranslationError from '../common/TranslationError';
import type { TranslationResultState } from '@/react/contexts/TranslationContext';
import TranslationReportSummary from '../common/TranslationReportSummary';

interface ImageTranslationResultProps {
  resultState: TranslationResultState;
  shouldShowDownloadButton: boolean;
  handleDownload: () => void;
  openInAdvancedViewer: (zipBlob: Blob) => void;
}

export const ImageTranslationResult: React.FC<ImageTranslationResultProps> = ({
  resultState,
  shouldShowDownloadButton,
  handleDownload,
  openInAdvancedViewer,
}) => {
  if (!resultState.translationResult) {
    return null;
  }

  if (
    resultState.translationResult.isError &&
    (!resultState.report || resultState.report.success === 0)
  ) {
    return <TranslationError error={resultState.translationResult.text} />;
  }

  if (!resultState.report) {
    return null;
  }

  const headerActions =
    shouldShowDownloadButton && resultState.report.success > 0 ? (
      <>
        {resultState.zipBlob && (
          <Tooltip title="고급 뷰어에서 보기" placement="top">
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => openInAdvancedViewer(resultState.zipBlob as Blob)}
            >
              고급 뷰어
            </Button>
          </Tooltip>
        )}
        <Tooltip title="번역된 이미지 다운로드" placement="top">
          <span>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              ZIP 다운로드
            </Button>
          </span>
        </Tooltip>
      </>
    ) : undefined;

  return <TranslationReportSummary report={resultState.report} headerActions={headerActions} />;
};
