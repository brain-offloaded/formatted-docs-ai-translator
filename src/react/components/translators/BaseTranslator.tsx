import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Box, useTheme, TextField } from '@mui/material';
import { TranslationType, useTranslation } from '../../contexts/TranslationContext';
import { useConfigStore } from '../../config/config-store';
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
import { BaseParseOptionsDto } from '@/nest/parser/dto/options/base-parse-options.dto';
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
  // 채널 설정 - 파일 모드와 문자열 모드 통합
  parseChannel?: IpcChannel;
  translateChannel?: IpcChannel;
  applyChannel?: IpcChannel;
  formatOutput?: (output: string, isFileMode: boolean) => string;
  // 옵션 관련 props
  parserOptions?: T | null;
  // 프롬프트 프리셋 내용 추가
  promptPresetContent?: string;
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

export function BaseTranslator<T extends BaseParseOptionsDto = BaseParseOptionsDto>({
  options: initialOptions,
  parseChannel,
  translateChannel = IpcChannel.TranslateTextArray,
  applyChannel,
  formatOutput = defaultFormatOutput,
  parserOptions,
  promptPresetContent, // 구조 분해 할당에 추가
}: BaseTranslatorProps<T>): React.ReactElement {
  const theme = useTheme();
  const aiProvider = useConfigStore((state) => state.aiProvider);
  const sourceLanguage = useConfigStore((state) => state.sourceLanguage);
  const customModelConfig = useConfigStore((state) => state.customModelConfig);
  const apiKey = useConfigStore((state) => state.apiKey);
  const lastPresetName = useConfigStore((state) => state.lastPresetName);
  const useThinking = useConfigStore((state) => state.useThinking);
  const thinkingBudget = useConfigStore((state) => state.thinkingBudget);
  const setThinkingBudget = useConfigStore((state) => state.setThinkingBudget);

  const config: TranslatorConfig = useMemo(
    () => ({
      aiProvider,
      sourceLanguage,
      customModelConfig,
      apiKey,
      lastPresetName,
      useThinking,
      thinkingBudget,
      setThinkingBudget,
    }),
    [
      aiProvider,
      sourceLanguage,
      customModelConfig,
      apiKey,
      lastPresetName,
      useThinking,
      thinkingBudget,
      setThinkingBudget,
    ]
  );

  // 이전 입력값 참조 저장용 ref
  const prevInputRef = useRef<string | File[]>([]); // 초기값을 빈 배열로 변경
  const prevParserOptionsRef = useRef<T | null>(null);

  // 현재 파일 입력 모드인지 확인 (parserOptions의 isFile 값으로 결정) - 메모이제이션
  const currentIsFileInput = useMemo(() => parserOptions?.isFile || false, [parserOptions?.isFile]);

  // 입력 상태 초기화 (파일 모드일 때 File[] 사용)
  const [input, setInput] = useState<string | File[]>(currentIsFileInput ? [] : '');

  // isFile 변경 시 입력 초기화
  useEffect(() => {
    // parserOptions가 달라진 경우에만 입력 초기화
    if (
      prevParserOptionsRef.current?.isFile !== parserOptions?.isFile ||
      JSON.stringify(prevParserOptionsRef.current) !== JSON.stringify(parserOptions)
    ) {
      setInput(currentIsFileInput ? [] : '');
      // null은 허용하지만 undefined는 허용하지 않도록 수정
      if (parserOptions !== undefined) {
        prevParserOptionsRef.current = parserOptions;
      }
    }
  }, [currentIsFileInput, parserOptions]);

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

  // 유효성 검증 함수 - 메모이제이션
  const validateInput = useMemo(
    () =>
      initialOptions.validateInput ||
      getDefaultValidatorByMode(initialOptions.translationType as TranslationType),
    [initialOptions.validateInput, initialOptions.translationType]
  );

  // 입력 변경 핸들러 - File[] 타입 처리 추가
  const handleInputChange = useCallback((value: string | File[]) => {
    setInput((prevInput) => {
      // 배열(File[])이면 길이와 파일 이름 비교 (더 정확한 비교 가능)
      if (Array.isArray(value) && Array.isArray(prevInput)) {
        if (
          value.length === prevInput.length &&
          value.every(
            (file, index) =>
              file.name === prevInput[index].name && file.size === prevInput[index].size
          )
        ) {
          return prevInput;
        }
      } else if (
        typeof value === 'string' &&
        typeof prevInput === 'string' &&
        value === prevInput
      ) {
        // 문자열이면 단순 비교
        return prevInput;
      }

      prevInputRef.current = value;
      return value;
    });
  }, []);

  // 파일 입력 변경 핸들러 - File[] 직접 사용
  const handleFileChange = useCallback(
    (files: File[] | null) => {
      const newFiles = files || [];
      // 이전 입력값(File[])과 비교
      if (
        Array.isArray(prevInputRef.current) &&
        newFiles.length === prevInputRef.current.length &&
        newFiles.every(
          (file, index) =>
            file.name === (prevInputRef.current as File[])[index].name &&
            file.size === (prevInputRef.current as File[])[index].size
        )
      ) {
        return;
      }
      handleInputChange(newFiles);
    },
    [handleInputChange]
  );

  // 파일 삭제 핸들러 - 빈 File[] 전달
  const handleClearFilesLocal = useCallback(() => {
    handleInputChange([]);
    handleClearFiles();
  }, [handleInputChange, handleClearFiles]);

  // 번역 버튼 활성화 여부 계산 - 메모이제이션
  const isTranslateButtonDisabled = useMemo(() => {
    if (isTranslating) return true;
    if (!isConfigValid) return true;
    return !validateInput(input);
  }, [isTranslating, isConfigValid, validateInput, input]);

  // parseInput 함수 - 메모이제이션
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

  // translateContent 함수 - 메모이제이션
  const translateContent = useCallback(
    async (
      parsedContent: BaseParseResponseDto<unknown>,
      config: TranslatorConfig
    ): Promise<InvokeFunctionResponse<IpcChannel.TranslateTextArray>> => {
      const translatePayload: InvokeFunctionRequest<IpcChannel.TranslateTextArray> = {
        config,
        textPaths: parsedContent.targets,
        sourceFilePath: '',
        promptPresetContent: promptPresetContent || '', // promptPresetContent prop을 직접 사용 (undefined인 경우 빈 문자열)
      };
      return (await window.electron.ipcRenderer.invoke(
        translateChannel,
        translatePayload
      )) as InvokeFunctionResponse<IpcChannel.TranslateTextArray>;
    },
    [translateChannel, promptPresetContent] // 의존성 배열에 promptPresetContent 추가
  );

  // applyTranslation 함수 - 메모이제이션
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

  // 번역 처리 함수 - 메모이제이션
  const handleTranslate = useCallback(async () => {
    if (isTranslating) return;

    try {
      setIsTranslating(true);

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
        const files = input as File[]; // File[]로 타입 단언
        const totalFiles = files.length;
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
          const file = files[i]; // File 객체 사용
          const filePath = file.path; // 백엔드 전송용 경로 추출

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

            // 현재 파일 경로만 포함하는 입력 객체 생성
            const singleFileInput = filePath; // 백엔드에는 경로 전달
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
              singleFileInput, // 백엔드에는 경로 전달
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
              const originalFileName = file.name; // File 객체에서 이름 사용

              // 단일 파일인 경우를 위해 결과 저장
              if (totalFiles === 1) {
                singleFileResult = result;
                singleFileName = originalFileName;
              }

              // 원본 파일 이름을 그대로 사용
              zip.file(originalFileName, result);
            }

            // 성공 결과 기록
            fileResults.push({ name: file.name, success: true }); // File 객체에서 이름 사용
            successCount++;
          } catch (error) {
            console.error(`파일 '${file.name}' 번역 중 오류:`, error); // File 객체에서 이름 사용
            // 오류 결과 기록
            fileResults.push({
              name: file.name, // File 객체에서 이름 사용
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
    config,
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

  // 결과 다운로드 핸들러
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

  // 다운로드 버튼 표시 여부 - 메모이제이션
  const shouldShowDownloadButton = useMemo(() => currentIsFileInput, [currentIsFileInput]);

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
        dragActive={uiState.dragActive}
        setDragActive={(active) => setUIState((prev) => ({ ...prev, dragActive: active }))}
      />
    );
  }, [
    input,
    initialOptions.fileExtension,
    initialOptions.fileLabel,
    isTranslating,
    handleFileChange,
    handleClearFilesLocal,
    uiState.dragActive,
    setUIState,
  ]);

  // 진행 정보 렌더링
  const renderProgressInfo = useMemo(() => {
    if (!isTranslating) return null;

    // 파일 처리 진행 정보 (File[] 길이 사용)
    const progressText = currentIsFileInput
      ? `${uiState.progressMessage} (${uiState.currentFileIndex + 1}/${Array.isArray(input) ? input.length : 0})`
      : uiState.progressMessage;

    return (
      <TranslationProgress
        current={uiState.translationProgress}
        total={100}
        message={progressText}
      />
    );
  }, [isTranslating, currentIsFileInput, uiState, input]);

  // 결과 렌더링
  const renderResult = useMemo(() => {
    if (!resultState.translationResult) return null;

    return resultState.translationResult.isError ? (
      <TranslationError error={resultState.translationResult.text} />
    ) : (
      <TranslationResult
        result={resultState.translationResult.text}
        onDownload={shouldShowDownloadButton ? handleDownload : undefined}
        downloadDisabled={!resultState.translationResult.text}
      />
    );
  }, [resultState.translationResult, shouldShowDownloadButton, handleDownload]);

  return (
    <>
      {/* 입력 컨트롤 렌더링 - 조건부로 직접 적절한 컴포넌트 렌더링 */}
      {currentIsFileInput ? renderFileInput : renderTextInput}

      {/* 번역 버튼 */}
      <TranslationButton
        isTranslating={isTranslating}
        isDisabled={isTranslateButtonDisabled}
        onClick={handleTranslate}
      />

      {/* 진행 정보 */}
      {renderProgressInfo}

      {/* 결과 표시 */}
      {renderResult}
    </>
  );
}
