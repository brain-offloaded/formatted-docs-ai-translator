import React, { useMemo } from 'react';
import { Box, useTheme, TextField } from '@mui/material';
import TranslationButton from '../common/TranslationButton';
import TranslationProgress from '../common/TranslationProgress';
import TranslationResult from '../common/TranslationResult';
import TranslationError from '../common/TranslationError';
import FileUploader from '../common/FileUploader';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';
import { useTranslator, UseTranslatorResult } from '../../hooks/useTranslator';
import { TranslationType } from '@/react/contexts/TranslationContext';

// 번역기 옵션 인터페이스 - UI 관련 설정만 포함
export interface BaseTranslatorOptions {
  // 번역기 설정
  inputLabel: string;
  inputPlaceholder: string;

  // 유효성 검증
  validateInput?: (input: string | File[]) => boolean;

  // 번역 타입
  translationType: string;

  // 입력 필드 설정
  inputFieldRows?: number;

  // 파일 업로더 설정
  fileExtension?: string;
  fileLabel?: string;
}

export interface BaseTranslatorProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> {
  options: BaseTranslatorOptions;
  translationType: TranslationType;
  formatOutput?: (output: string, isFileMode: boolean) => string;
  // 옵션 관련 props
  parserOptions?: T | null;
  // 프롬프트 프리셋 내용 추가
  promptPresetContent?: string;
  // 슬롯 props
  renderHeader?: (props: UseTranslatorResult) => React.ReactNode;
  renderResult?: (props: UseTranslatorResult) => React.ReactNode;
}

// 모든 번역기 컴포넌트가 공유하는 공통 Props 타입 정의
export interface CustomTranslatorProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> {
  parserOptions?: T | null;
}

export function BaseTranslator<T extends BaseParseOptionsDto = BaseParseOptionsDto>({
  options: initialOptions,
  translationType,
  ...props
}: BaseTranslatorProps<T>): React.ReactElement {
  const theme = useTheme();

  const translatorProps = useTranslator({
    initialOptions,
    translationType,
    ...props,
  });

  const {
    input,
    handleInputChange,
    handleFileChange,
    handleClearFilesLocal,
    isTranslating,
    isTranslateButtonDisabled,
    handleTranslate,
    handleCancel,
    resultState,
    uiState,
    handleDownload,
    shouldShowDownloadButton,
    currentIsFileInput,
  } = translatorProps;

  // 텍스트 입력 렌더링 - 메모이제이션
  const renderTextInput = useMemo(() => {
    return (
      <Box sx={{ my: 2 }}>
        <TextField
          label={initialOptions.inputLabel}
          multiline
          fullWidth
          rows={initialOptions.inputFieldRows || 10}
          value={input as string}
          onChange={(e) => handleInputChange(e.target.value as string)}
          placeholder={initialOptions.inputPlaceholder}
          disabled={isTranslating}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor:
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
              },
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
        />
      </Box>
    );
  }, [
    input,
    initialOptions.inputLabel,
    initialOptions.inputFieldRows,
    initialOptions.inputPlaceholder,
    isTranslating,
    theme.palette.mode,
    theme.palette.primary.main,
    handleInputChange,
  ]);

  // 파일 입력 렌더링 - 메모이제이션
  const renderFileInput = useMemo(() => {
    // input 상태(File[])를 직접 사용
    const selectedFiles = Array.isArray(input) ? (input as File[]) : [];

    return (
      <FileUploader
        isDisabled={isTranslating}
        selectedFiles={selectedFiles}
        onFileChange={handleFileChange}
        onClearFiles={handleClearFilesLocal}
        fileExtension={initialOptions.fileExtension}
        label={initialOptions.fileLabel}
      />
    );
  }, [
    input,
    initialOptions.fileExtension,
    initialOptions.fileLabel,
    isTranslating,
    handleFileChange,
    handleClearFilesLocal,
  ]);

  // 진행 정보 렌더링
  const renderProgressInfo = useMemo(() => {
    if (!isTranslating) return null;

    // 파일 처리 진행 정보 (File[] 길이 사용)
    return (
      <TranslationProgress
        completed={uiState.completed}
        total={uiState.totalJobs}
        failed={uiState.failed}
        cancelled={uiState.cancelled}
        message={uiState.progressMessage}
      />
    );
  }, [isTranslating, uiState]);

  // 결과 렌더링
  const renderDefaultResult = useMemo(() => {
    if (!resultState.translationResult) return null;

    return resultState.translationResult.isError ? (
      <TranslationError error={resultState.translationResult.text} />
    ) : (
      <TranslationResult
        result={resultState.translationResult.text}
        report={resultState.report || null}
        onDownload={shouldShowDownloadButton ? handleDownload : undefined}
        downloadDisabled={!resultState.translationResult.text}
      />
    );
  }, [resultState.translationResult, resultState.report, shouldShowDownloadButton, handleDownload]);

  return (
    <>
      {/* 헤더 렌더링 */}
      {props.renderHeader
        ? props.renderHeader(translatorProps)
        : currentIsFileInput
          ? renderFileInput
          : renderTextInput}

      {/* 번역 버튼 */}
      <TranslationButton
        isTranslating={isTranslating}
        isDisabled={isTranslateButtonDisabled}
        onClick={handleTranslate}
        onCancel={handleCancel}
      />

      {/* 진행 정보 */}
      {renderProgressInfo}

      {/* 결과 표시 */}
      {props.renderResult ? props.renderResult(translatorProps) : renderDefaultResult}
    </>
  );
}
