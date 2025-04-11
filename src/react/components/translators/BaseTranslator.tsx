import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Box, useTheme, TextField } from '@mui/material';
import { TranslationType, useTranslation } from '../../contexts/TranslationContext';
import { ConfigStore } from '../../config/config-store';
import { TranslatorConfig } from '../../../types/config';
import TranslationButton from '../common/TranslationButton';
import TranslationProgress from '../common/TranslationProgress';
import TranslationResult from '../common/TranslationResult';
import TranslationError from '../common/TranslationError';
import FileUploader from '../common/FileUploader';
import JSZip from 'jszip';
import { InvokeFunctionRequest, InvokeFunctionResponse } from '@/types/electron';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { TranslatedTextPath } from '@/types/common';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';
import { BaseParseRequestDto } from '@/nest/parser/dto/request/base-parse-request.dto';
import { BaseApplyRequestDto } from '@/nest/parser/dto/request/base-apply-request.dto';
import { BaseParseResponseDto } from '@/nest/parser/dto/response/base-parse-response.dto';
import { BaseApplyResponseDto } from '@/nest/parser/dto/response/base-apply-response.dto';
import { getDefaultValidatorByMode } from '../../constants/TranslationTypeMapping';

// 번역기 옵션 인터페이스 - UI 관련 설정만 포함
export interface BaseTranslatorOptions {
  // 번역기 설정
  inputLabel: string;
  inputPlaceholder: string;

  // 유효성 검증
  validateInput?: (input: string | string[]) => boolean;

  // 번역 타입
  translationType: TranslationType;

  // 입력 필드 설정
  inputFieldRows?: number;

  // 파일 업로더 설정
  fileExtension?: string;
  fileLabel?: string;
}

export interface BaseTranslatorProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> {
  options: BaseTranslatorOptions;
  // 채널 설정 - 파일 모드와 문자열 모드 통합
  parseChannel?: IpcChannel;
  translateChannel?: IpcChannel;
  applyChannel?: IpcChannel;
  formatOutput?: (output: string, isFileMode: boolean) => string;
  // 옵션 관련 props
  parserOptions?: T | null;
}

// 모든 번역기 컴포넌트가 공유하는 공통 Props 타입 정의
export interface CustomTranslatorProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> {
  parserOptions?: T | null;
}

// 기본 출력 포맷 함수
const defaultFormatOutput = (output: string, isFileMode: boolean): string => {
  if (isFileMode) {
    return '파일 번역이 완료되었습니다. 다운로드 버튼을 클릭하여 결과를 받으세요.';
  } else {
    return output;
  }
};

// BaseTranslator 컴포넌트를 React.memo로 감싸기
export const BaseTranslator = React.memo(function BaseTranslator<
  T extends BaseParseOptionsDto = BaseParseOptionsDto,
>({
  options: initialOptions,
  parseChannel,
  translateChannel = IpcChannel.TranslateTextArray,
  applyChannel,
  formatOutput = defaultFormatOutput,
  parserOptions,
}: BaseTranslatorProps<T>): React.ReactElement {
  const theme = useTheme();
  const configStore = ConfigStore.getInstance();

  // 내부 옵션 상태
  const [options] = useState(initialOptions);

  // 현재 파일 입력 모드인지 확인 (parserOptions의 isFile 값으로 결정)
  const currentIsFileInput = useMemo(() => parserOptions?.isFile || false, [parserOptions]);

  // 입력 상태 초기화
  const [input, setInput] = useState<string | string[]>(currentIsFileInput ? [] : '');

  // isFile 변경 시 입력 초기화
  useEffect(() => {
    setInput(currentIsFileInput ? [] : '');
  }, [currentIsFileInput]);

  // Context에서 상태와 함수 가져오기
  const {
    isTranslating,
    setIsTranslating,
    resultState,
    setResultState,
    uiState,
    setUIState,
    isConfigValid,
    showSnackbar,
    handleClearFiles,
  } = useTranslation();

  // 유효성 검증 함수
  const validateInput = useMemo(
    () => options.validateInput || getDefaultValidatorByMode(options.translationType),
    [options.validateInput, options.translationType]
  );

  // 입력 변경 핸들러
  const handleInputChange = useCallback((value: string | string[]) => {
    setInput(value);
  }, []);

  // 파일 입력 변경 핸들러
  const handleFileChange = useCallback(
    (files: File[] | null) => {
      // 파일 경로 배열로 변환하거나 저장하는 로직을 구현
      // 여기서는 간단하게 파일명 배열을 사용
      const filePaths = files ? files.map((file) => file.path) : [];
      handleInputChange(filePaths as string[]);
    },
    [handleInputChange]
  );

  // 파일 삭제 핸들러
  const handleClearFilesLocal = useCallback(() => {
    handleInputChange([] as unknown as string[]);
    handleClearFiles();
  }, [handleInputChange, handleClearFiles]);

  // 번역 버튼 활성화 여부 계산
  const isTranslateButtonDisabled = useMemo(() => {
    if (isTranslating) return true;
    if (!isConfigValid) return true;
    return !validateInput(input);
  }, [isTranslating, isConfigValid, validateInput, input]);

  const parseInput = useCallback(
    async (input: string, config: TranslatorConfig): Promise<BaseParseResponseDto<unknown>> => {
      // parserOptions가 없는 경우 최소한의 기본 옵션 사용
      const effectiveOptions =
        parserOptions ||
        ({ sourceLanguage: config.sourceLanguage, isFile: currentIsFileInput } as T);
      const parsePayload: BaseParseRequestDto<T> = {
        content: input,
        options: {
          ...effectiveOptions,
          sourceLanguage: config.sourceLanguage, // 항상 최신 sourceLanguage 사용
        },
      };

      if (!parseChannel) {
        throw new Error('파싱 채널이 정의되지 않았습니다.');
      }

      return (await window.electron.ipcRenderer.invoke(
        parseChannel,
        parsePayload
      )) as BaseParseResponseDto<unknown>;
    },
    [parseChannel, parserOptions, currentIsFileInput]
  );

  const translateContent = useCallback(
    async (
      parsedContent: BaseParseResponseDto<unknown>,
      config: TranslatorConfig
    ): Promise<InvokeFunctionResponse<IpcChannel.TranslateTextArray>> => {
      const translatePayload: InvokeFunctionRequest<IpcChannel.TranslateTextArray> = {
        config,
        textPaths: parsedContent.targets,
        sourceFilePath: '',
      };
      return (await window.electron.ipcRenderer.invoke(
        translateChannel,
        translatePayload
      )) as InvokeFunctionResponse<IpcChannel.TranslateTextArray>;
    },
    [translateChannel]
  );

  const applyTranslation = useCallback(
    async (
      input: string,
      translatedContent: TranslatedTextPath<unknown>[],
      config: TranslatorConfig
    ): Promise<BaseApplyResponseDto> => {
      // parserOptions가 없는 경우 최소한의 기본 옵션 사용
      const effectiveOptions = parserOptions || ({ sourceLanguage: config.sourceLanguage } as T);
      const applyPayload: BaseApplyRequestDto<unknown, T> = {
        content: input,
        translatedTextPaths: translatedContent,
        options: {
          ...effectiveOptions,
          sourceLanguage: config.sourceLanguage, // 항상 최신 sourceLanguage 사용
        },
      };

      if (!applyChannel) {
        throw new Error('적용 채널이 정의되지 않았습니다.');
      }

      return (await window.electron.ipcRenderer.invoke(
        applyChannel,
        applyPayload
      )) as BaseApplyResponseDto;
    },
    [applyChannel, parserOptions]
  );

  // 번역 처리 함수
  const handleTranslate = useCallback(async () => {
    if (isTranslating) return;

    try {
      setIsTranslating(true);
      const config = configStore.getConfig();

      // 입력 유효성 검사
      if (!validateInput(input)) {
        throw new Error('유효하지 않은 입력입니다.');
      }

      // 진행 상태 초기화
      setUIState((prev) => ({
        ...prev,
        translationProgress: 0,
        progressMessage: '번역 준비 중...',
      }));

      // 파일 모드인 경우 다중 파일 처리
      if (currentIsFileInput) {
        const filePaths = input as string[];
        const totalFiles = filePaths.length;
        const fileResults: { name: string; success: boolean; message?: string }[] = [];
        let successCount = 0;
        let errorCount = 0;

        // 단일 파일 처리를 위해 변수 추가
        let singleFileResult: string | null = null;
        let singleFileName: string | null = null;

        // 최종 결과를 저장할 JSZip 객체 생성
        const zip = new JSZip();

        // 각 파일을 반복 처리
        for (let i = 0; i < totalFiles; i++) {
          const filePath = filePaths[i];

          // 현재 처리 중인 파일 인덱스와 파일명 업데이트
          setUIState((prev) => ({
            ...prev,
            currentFileIndex: i,
            translationProgress: (i / totalFiles) * 100,
            progressMessage: `파일 처리 중 (${i + 1}/${totalFiles}): ${filePath}`,
          }));

          try {
            // 1단계: 입력 파싱
            setUIState((prev) => ({
              ...prev,
              progressMessage: `파일 분석 중 (${i + 1}/${totalFiles}): ${filePath}`,
            }));

            // 현재 파일만 포함하는 입력 객체 생성
            const singleFileInput = filePath;
            const parseResponse = await parseInput(singleFileInput, config);

            if (!parseResponse.success) {
              throw new Error(parseResponse.message || '파일 분석 중 오류가 발생했습니다.');
            }

            // 2단계: 번역 수행
            setUIState((prev) => ({
              ...prev,
              progressMessage: `번역 중 (${i + 1}/${totalFiles}): ${filePath}`,
            }));

            const translateResponse = await translateContent(parseResponse, config);

            if (!translateResponse.success) {
              throw new Error(translateResponse.message || '번역 중 오류가 발생했습니다.');
            }

            // 3단계: 번역 결과 적용
            setUIState((prev) => ({
              ...prev,
              progressMessage: `번역 적용 중 (${i + 1}/${totalFiles}): ${filePath}`,
            }));

            const applyResponse = await applyTranslation(
              singleFileInput,
              translateResponse.translatedTextPaths,
              config
            );

            if (!applyResponse.success) {
              throw new Error(applyResponse.message || '번역 적용 중 오류가 발생했습니다.');
            }

            const result = applyResponse.result;

            // 결과를 zip에 추가
            if (result && typeof result === 'string') {
              // 문자열 결과일 경우
              // 파일 경로에서 파일 이름만 추출 (경로 구분자 / 또는 \ 이후의 마지막 부분)
              const originalFileName = filePath.split(/[/\\]/).pop() || filePath;

              // 단일 파일인 경우를 위해 결과 저장
              if (totalFiles === 1) {
                singleFileResult = result;
                singleFileName = originalFileName;
              }

              // 원본 파일 이름을 그대로 사용
              zip.file(originalFileName, result);
            }

            // 성공 결과 기록
            fileResults.push({ name: filePath, success: true });
            successCount++;
          } catch (error) {
            console.error(`파일 '${filePath}' 번역 중 오류:`, error);
            // 오류 결과 기록
            fileResults.push({
              name: filePath,
              success: false,
              message: error instanceof Error ? error.message : '알 수 없는 오류',
            });
            errorCount++;
          }
        }

        // 최종 zip 파일 생성 (다중 파일용)
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // 단일 파일 처리
        let singleFileBlob = null;
        if (singleFileResult && singleFileName) {
          singleFileBlob = new Blob([singleFileResult], { type: 'application/octet-stream' });
        }

        // 번역 결과 요약 메시지 생성
        let resultSummary = `처리된 파일: ${totalFiles}개\n`;
        resultSummary += `성공: ${successCount}개, 실패: ${errorCount}개\n\n`;
        resultSummary += '파일별 결과:\n';

        for (const result of fileResults) {
          resultSummary += `${result.name}: ${result.success ? '성공' : '실패'}`;
          if (!result.success && result.message) {
            resultSummary += ` (오류: ${result.message})`;
          }
          resultSummary += '\n';
        }

        // 결과 상태 설정
        setResultState({
          translationResult: {
            text: resultSummary,
            isError: errorCount > 0,
          },
          zipBlob: zipBlob,
          singleFileBlob: singleFileBlob,
          singleFileName: singleFileName,
        });

        // 최종 진행 상태 업데이트
        setUIState((prev) => ({
          ...prev,
          translationProgress: 100,
          progressMessage: '번역 완료',
        }));

        showSnackbar(`${totalFiles}개 파일 중 ${successCount}개 번역 완료, ${errorCount}개 실패`);
      } else {
        // 기존 단일 입력 처리 로직
        // 1단계: 입력 파싱
        setUIState((prev) => ({
          ...prev,
          translationProgress: 20,
          progressMessage: '입력 분석 중...',
        }));

        const parseResponse = await parseInput(input as string, config);

        if (!parseResponse.success) {
          throw new Error(parseResponse.message || '입력 분석 중 오류가 발생했습니다.');
        }

        // 2단계: 번역 수행
        setUIState((prev) => ({
          ...prev,
          translationProgress: 40,
          progressMessage: '번역 중...',
        }));

        const translateResponse = await translateContent(parseResponse, config);

        if (!translateResponse.success) {
          throw new Error(translateResponse.message || '번역 중 오류가 발생했습니다.');
        }

        // 3단계: 번역 결과 적용
        setUIState((prev) => ({
          ...prev,
          translationProgress: 70,
          progressMessage: '번역 적용 중...',
        }));

        const applyResponse = await applyTranslation(
          input as string,
          translateResponse.translatedTextPaths,
          config
        );
        if (!applyResponse.success) {
          throw new Error(applyResponse.message || '번역 적용 중 오류가 발생했습니다.');
        }

        // 4단계: 결과 설정
        setUIState((prev) => ({
          ...prev,
          translationProgress: 90,
          progressMessage: '결과 생성 중...',
        }));

        // 결과 포맷팅
        const formattedResult = formatOutput(applyResponse.result as string, currentIsFileInput);

        // 결과 설정
        setResultState({
          translationResult: {
            text: formattedResult,
            isError: false,
          },
          zipBlob: null,
          singleFileBlob: null,
          singleFileName: null,
        });

        setUIState((prev) => ({
          ...prev,
          translationProgress: 100,
          progressMessage: '번역 완료',
        }));

        showSnackbar('번역이 완료되었습니다.');
      }
    } catch (error) {
      console.error('번역 오류:', error);
      setResultState({
        translationResult: {
          text: `오류가 발생했습니다: ${(error as Error).message}`,
          isError: true,
        },
        zipBlob: null,
        singleFileBlob: null,
        singleFileName: null,
      });
    } finally {
      setIsTranslating(false);
    }
  }, [
    isTranslating,
    input,
    configStore,
    setUIState,
    setResultState,
    setIsTranslating,
    showSnackbar,
    validateInput,
    parseInput,
    translateContent,
    applyTranslation,
    formatOutput,
    currentIsFileInput,
  ]);

  // 단일 파일 추출 및 다운로드 함수 제거
  // 대신 더 간단한 파일 다운로드 함수만 유지
  const downloadFile = useCallback(
    (blob: Blob, fileName: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar(`'${fileName}' 파일 다운로드가 시작되었습니다.`);
    },
    [showSnackbar]
  );

  // 결과 다운로드 핸들러 전체 수정
  const handleDownload = useCallback(async () => {
    if (!resultState.translationResult || resultState.translationResult.isError) {
      return;
    }

    try {
      // 파일 번역이 아닌 경우 다운로드를 지원하지 않음
      if (!currentIsFileInput) {
        showSnackbar('파일 번역만 다운로드를 지원합니다.');
        return;
      }

      // 단일 파일인 경우 직접 다운로드
      if (resultState.singleFileBlob && resultState.singleFileName) {
        downloadFile(resultState.singleFileBlob, resultState.singleFileName);
        return;
      }

      // 다중 파일인 경우 zip으로 다운로드
      if (resultState.zipBlob) {
        downloadFile(resultState.zipBlob, 'translated_files.zip');
        return;
      }

      showSnackbar('다운로드할 파일이 없습니다.');
    } catch (error) {
      console.error('다운로드 오류:', error);
      showSnackbar('다운로드 중 오류가 발생했습니다.');
    }
  }, [resultState, showSnackbar, currentIsFileInput, downloadFile]);

  // 다운로드 버튼 표시 여부
  const shouldShowDownloadButton = useMemo(() => currentIsFileInput, [currentIsFileInput]);

  // 렌더링 - 텍스트 입력
  const renderTextInput = useCallback(() => {
    return (
      <Box sx={{ my: 2 }}>
        <TextField
          label={options.inputLabel}
          multiline
          fullWidth
          rows={options.inputFieldRows || 10}
          value={input as string}
          onChange={(e) => handleInputChange(e.target.value as string)}
          placeholder={options.inputPlaceholder}
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
    options,
    isTranslating,
    theme.palette.mode,
    theme.palette.primary.main,
    handleInputChange,
  ]);

  // 렌더링 - 파일 입력
  const renderFileInput = useCallback(() => {
    return (
      <>
        {/* 파일 업로더 */}
        <FileUploader
          isDisabled={isTranslating}
          selectedFiles={
            Array.isArray(input) ? (input as string[]).map((path) => new File([], path)) : []
          }
          onFileChange={handleFileChange}
          onClearFiles={handleClearFilesLocal}
          fileExtension={options.fileExtension || '.json'}
          label={options.fileLabel || 'JSON 파일'}
          dragActive={uiState.dragActive}
          setDragActive={(active) => setUIState((prev) => ({ ...prev, dragActive: active }))}
        />
      </>
    );
  }, [
    options,
    isTranslating,
    input,
    handleFileChange,
    handleClearFilesLocal,
    uiState.dragActive,
    setUIState,
  ]);

  // 알맞은 입력 컨트롤 선택
  const renderInputControl = useMemo(() => {
    return currentIsFileInput ? renderFileInput() : renderTextInput();
  }, [currentIsFileInput, renderFileInput, renderTextInput]);

  // 렌더링 - 진행 정보
  const renderProgressInfo = useCallback(() => {
    if (!isTranslating) return null;

    // 파일 처리 진행 정보
    const progressText = currentIsFileInput
      ? `${uiState.progressMessage} (${uiState.currentFileIndex + 1}/${Array.isArray(input) ? input.length : 0})`
      : uiState.progressMessage;

    return (
      <>
        <TranslationProgress
          current={uiState.translationProgress}
          total={100}
          message={progressText}
        />
      </>
    );
  }, [isTranslating, currentIsFileInput, uiState, input]);

  return (
    <>
      {/* 입력 컨트롤 렌더링 */}
      {renderInputControl}

      {/* 번역 버튼 */}
      <TranslationButton
        isTranslating={isTranslating}
        isDisabled={isTranslateButtonDisabled}
        onClick={handleTranslate}
      />

      {/* 진행 정보 */}
      {renderProgressInfo()}

      {/* 결과 표시 */}
      {resultState.translationResult &&
        (resultState.translationResult.isError ? (
          <TranslationError error={resultState.translationResult.text} />
        ) : (
          <TranslationResult
            result={resultState.translationResult.text}
            onDownload={shouldShowDownloadButton ? handleDownload : undefined}
            downloadDisabled={!resultState.translationResult.text}
          />
        ))}
    </>
  );
});

// Optional: Add display name for better debugging
// BaseTranslator.displayName = 'BaseTranslator';
