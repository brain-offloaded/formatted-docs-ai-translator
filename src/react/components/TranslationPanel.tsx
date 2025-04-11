import React, { useCallback, useState } from 'react';
import { Box, Card, CardContent, Typography, Divider, Snackbar } from '@mui/material';
import { TranslationType, useTranslation } from '../contexts/TranslationContext';
import {
  getTranslatorWithOptions,
  getTranslationTypeLabel,
} from '../constants/TranslationTypeMapping';
import ExamplePresetSelector from './translation/ExamplePresetSelector';
import TranslationTypeSelector from './common/TranslationTypeSelector';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';

export default function TranslationPanel(): React.ReactElement {
  // Context에서 상태와 함수 가져오기
  const {
    translationType,
    setTranslationType,
    handleClearFiles,
    uiState,
    setResultState,
    isTranslating,
  } = useTranslation();

  // 옵션 상태 관리
  const [parserOptions, setParserOptions] = useState<BaseParseOptionsDto | null>(null);
  // 설정 패널 표시 여부 상태 관리 (상태 끌어올리기)
  const [showSettings, setShowSettings] = useState(false);

  // 옵션 변경 핸들러
  const handleOptionsChange = useCallback((options: BaseParseOptionsDto) => {
    setParserOptions(options);
  }, []);

  // 설정 토글 핸들러
  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

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
      // 옵션 초기화
      setParserOptions(null);
      // 설정 패널도 초기화
      setShowSettings(false);
    },
    [setTranslationType, handleClearFiles, setResultState]
  );

  // TranslationType에 따라 적절한 컴포넌트 가져오기
  const { TranslatorComponent, OptionComponent } =
    getTranslatorWithOptions<typeof translationType>(translationType);

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

            {/* 옵션 컴포넌트 렌더링 */}
            {OptionComponent && (
              <OptionComponent
                isTranslating={isTranslating}
                onOptionsChange={handleOptionsChange}
                initialOptions={parserOptions || undefined}
                translationType={translationType}
                label={getTranslationTypeLabel(translationType) + ' 옵션'}
                showSettings={showSettings}
                onToggleSettings={toggleSettings}
              />
            )}

            {/* 번역기 컴포넌트 렌더링 - 옵션은 props로 전달 */}
            <TranslatorComponent key={translationType} parserOptions={parserOptions} />
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
