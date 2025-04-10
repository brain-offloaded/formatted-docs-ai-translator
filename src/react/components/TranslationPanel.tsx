import React, { useCallback } from 'react';
import { Box, Card, CardContent, Typography, Divider, Snackbar } from '@mui/material';
import { TranslationType, useTranslation } from '../contexts/TranslationContext';
import {
  getTranslatorComponent,
  getTranslationTypeLabel,
} from '../constants/TranslationTypeMapping';
import ExamplePresetSelector from './translation/ExamplePresetSelector';
import TranslationTypeSelector from './common/TranslationTypeSelector';

export default function TranslationPanel(): React.ReactElement {
  // Context에서 상태와 함수 가져오기
  const { translationType, setTranslationType, handleClearFiles, uiState, setResultState } =
    useTranslation();

  // 번역 타입 변경 핸들러
  const handleTranslationTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newType = e.target.value as TranslationType;
      setTranslationType(newType);
      // 파일 선택 초기화
      handleClearFiles();
      // 결과 초기화
      setResultState({
        translationResult: null,
        zipBlob: null,
        singleFileBlob: null,
        singleFileName: null,
      });
    },
    [setTranslationType, handleClearFiles, setResultState]
  );

  // TranslationType에 따라 적절한 컴포넌트 가져오기
  const TranslatorComponent = getTranslatorComponent(translationType);

  return (
    <Box sx={{ position: 'relative' }}>
      <Card sx={{ borderRadius: '12px', p: 2 }}>
        <CardContent>
          <Typography variant="h6" mb={2} fontWeight="medium">
            {getTranslationTypeLabel(translationType)}
          </Typography>
          <Divider sx={{ my: 2 }} />

          {/* 프리셋 선택기 */}
          <ExamplePresetSelector />

          {/* 번역 유형 선택 */}
          <Box sx={{ mb: 2 }}>
            <TranslationTypeSelector
              selectedType={translationType}
              onChange={handleTranslationTypeChange}
            />

            {/* 선택된 번역 유형에 따라 적절한 컴포넌트 렌더링 */}
            <TranslatorComponent />
          </Box>
        </CardContent>
      </Card>
      <Snackbar
        open={uiState.snackbarOpen}
        autoHideDuration={4000}
        message={uiState.snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
