import React from 'react';
import { Box } from '@mui/material';
import TranslationProgress from '../../../components/common/TranslationProgress';
import TranslationResult from '../../../components/common/TranslationResult';
import TranslationError from '../../../components/common/TranslationError';
import { useTranslation } from '../../../contexts/TranslationContext';

const OutputPanel: React.FC = () => {
  const { isTranslating, resultState, uiState } = useTranslation();

  const handleDownload = React.useCallback(() => {
    // 다운로드 로직은 BaseTranslator에 남아있으므로, 여기서는 호출만 가정합니다.
    // 실제 구현에서는 BaseTranslator의 다운로드 함수를 Context 등을 통해 호출해야 합니다.
    if (resultState.singleFileBlob && resultState.singleFileName) {
      const url = URL.createObjectURL(resultState.singleFileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resultState.singleFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (resultState.zipBlob) {
      const url = URL.createObjectURL(resultState.zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'translated_files.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [resultState]);

  const renderProgressInfo = React.useMemo(() => {
    if (!isTranslating) return null;

    const progressText = uiState.progressMessage;

    return (
      <TranslationProgress
        current={uiState.translationProgress}
        total={100}
        message={progressText}
      />
    );
  }, [isTranslating, uiState]);

  const renderResult = React.useMemo(() => {
    if (!resultState.translationResult) return null;

    return resultState.translationResult.isError ? (
      <TranslationError error={resultState.translationResult.text} />
    ) : (
      <TranslationResult
        result={resultState.translationResult.text}
        onDownload={handleDownload}
        downloadDisabled={!resultState.translationResult.text}
      />
    );
  }, [resultState.translationResult, handleDownload]);

  return (
    <Box>
      {renderProgressInfo}
      {renderResult}
    </Box>
  );
};

export default OutputPanel;
