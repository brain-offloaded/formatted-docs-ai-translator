import React, { useCallback, useState, useMemo } from 'react';
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
  // Context에서 상태와 함수 가져오기 - 필요한 것만 선택적으로 가져옵니다
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
  // 설정 패널 표시 여부 상태 관리
  const [showSettings, setShowSettings] = useState(false);

  // 옵션 변경 핸들러 - 메모이제이션
  const handleOptionsChange = useCallback((options: BaseParseOptionsDto) => {
    setParserOptions((prevOptions) => {
      // 이전 옵션과 새 옵션이 동일하면 상태 업데이트 방지
      if (JSON.stringify(prevOptions) === JSON.stringify(options)) {
        return prevOptions;
      }
      return options;
    });
  }, []);

  // 설정 토글 핸들러 - 메모이제이션
  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  // 번역 타입 변경 핸들러 - 메모이제이션
  const handleTranslationTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newType = e.target.value as TranslationType;
      if (newType === translationType) return; // 변경이 없으면 처리하지 않음

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
    [setTranslationType, handleClearFiles, setResultState, translationType]
  );

  // TranslationType에 따라 적절한 컴포넌트 가져오기 - 메모이제이션
  const { TranslatorComponent, OptionComponent } = useMemo(
    () => getTranslatorWithOptions<typeof translationType>(translationType),
    [translationType]
  );

  // 번역 타입 라벨 - 메모이제이션
  const translationTypeLabel = useMemo(
    () => getTranslationTypeLabel(translationType),
    [translationType]
  );

  return (
    <Box sx={{ position: 'relative' }}>
      <Card sx={{ borderRadius: '12px', p: 2 }}>
        <CardContent>
          <Typography variant="h6" mb={2} fontWeight="medium">
            {translationTypeLabel}
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
                label={translationTypeLabel + ' 옵션'}
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
