import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import JSZip from 'jszip';

// 상태 인터페이스 정의
export interface FileState {
  selectedFiles: File[] | null;
}

// 번역 타입 enum
export enum TranslationType {
  Text = 'text',
  Json = 'json',
  Csv = 'csv',
}

export interface TranslationResultState {
  translationResult: {
    text: string;
    isError: boolean;
  } | null;
  zipBlob: Blob | null;
  singleFileBlob: Blob | null;
  singleFileName: string | null;
}

export interface UIState {
  dragActive: boolean;
  copied: boolean;
  snackbarOpen: boolean;
  snackbarMessage: string;
  translationProgress: number;
  currentFileIndex: number;
  showJsonSettings: boolean;
  progressMessage: string;
}

// TranslationContext 인터페이스 정의
interface TranslationContextType {
  // 상태
  translationType: TranslationType;
  isTranslating: boolean;
  fileState: FileState;
  resultState: TranslationResultState;
  uiState: UIState;
  isConfigValid: boolean;

  // 함수
  setTranslationType: (type: TranslationType) => void;
  setIsTranslating: (isTranslating: boolean) => void;
  setFileState: (state: FileState) => void;
  setResultState: React.Dispatch<React.SetStateAction<TranslationResultState>>;
  setUIState: React.Dispatch<React.SetStateAction<UIState>>;
  setIsConfigValid: (isValid: boolean) => void;

  // 공통 함수
  showSnackbar: (message: string) => void;
  handleClearFiles: () => void;
  showTranslationResult: (
    zip?: JSZip,
    hasError?: boolean,
    fileResults?: { name: string; success: boolean; message?: string }[],
    successCount?: number,
    errorCount?: number
  ) => Promise<void>;
}

// Context 생성
const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// TranslationProvider 컴포넌트
export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 상태 정의
  const [translationType, setTranslationType] = useState<TranslationType>(TranslationType.Json);
  const [isTranslating, setIsTranslating] = useState(false);
  const [fileState, setFileState] = useState<FileState>({
    selectedFiles: null,
  });
  const [resultState, setResultState] = useState<TranslationResultState>({
    translationResult: null,
    zipBlob: null,
    singleFileBlob: null,
    singleFileName: null,
  });
  const [uiState, setUIState] = useState<UIState>({
    dragActive: false,
    copied: false,
    snackbarOpen: false,
    snackbarMessage: '',
    translationProgress: 0,
    currentFileIndex: 0,
    showJsonSettings: false,
    progressMessage: '',
  });
  const [isConfigValid, setIsConfigValid] = useState(true);

  // 스낵바 표시 함수
  const showSnackbar = useCallback((message: string) => {
    setUIState((prev) => ({
      ...prev,
      snackbarOpen: true,
      snackbarMessage: message,
    }));

    // 3초 후 스낵바 닫기
    setTimeout(() => {
      setUIState((prev) => ({
        ...prev,
        snackbarOpen: false,
      }));
    }, 3000);
  }, []);

  // 파일 삭제 핸들러
  const handleClearFiles = useCallback(() => {
    setFileState({ selectedFiles: null });
    setResultState({
      translationResult: null,
      zipBlob: null,
      singleFileBlob: null,
      singleFileName: null,
    });

    // UI 상태 초기화
    setUIState((prev) => ({
      ...prev,
      dragActive: false,
      translationProgress: 0,
      currentFileIndex: 0,
      progressMessage: '',
    }));
  }, []);

  // 번역 결과 표시 함수
  const showTranslationResult = useCallback(
    async (
      zip?: JSZip,
      hasError?: boolean,
      fileResults?: { name: string; success: boolean; message?: string }[],
      successCount?: number,
      errorCount?: number
    ) => {
      // 텍스트 모드인 경우 별도 처리 없이 리턴
      if (translationType === TranslationType.Text) {
        return;
      }

      // 파일 모드인 경우 기존 로직 사용
      if (
        !zip ||
        fileResults === undefined ||
        successCount === undefined ||
        errorCount === undefined
      ) {
        return;
      }

      let resultText = '';

      if (successCount > 0) {
        resultText += `성공적으로 처리된 파일: ${successCount}개\n\n`;
      }

      if (errorCount > 0) {
        resultText += `번역 실패한 파일: ${errorCount}개\n\n`;
      }

      // 파일별 상세 결과
      resultText += '파일별 결과:\n';
      for (const result of fileResults) {
        resultText += `${result.name}: ${result.success ? '성공' : '실패'}`;
        if (!result.success && result.message) {
          resultText += ` (${result.message})`;
        }
        resultText += '\n';
      }

      try {
        const filesInZip = Object.keys(zip.files);
        const numFilesInZip = filesInZip.length;

        if (numFilesInZip === 1) {
          // 파일이 하나일 경우
          const fileName = filesInZip[0];
          const fileEntry = zip.file(fileName);
          if (fileEntry) {
            const fileBlob = await fileEntry.async('blob');
            setResultState({
              translationResult: { text: resultText, isError: hasError || false },
              zipBlob: null,
              singleFileBlob: fileBlob,
              singleFileName: fileName,
            });
          } else {
            throw new Error(`ZIP에서 파일 '${fileName}'을 찾을 수 없습니다.`);
          }
        } else if (numFilesInZip > 1) {
          // 파일이 여러 개일 경우 ZIP 생성
          const blob = await zip.generateAsync({ type: 'blob' });
          setResultState({
            translationResult: { text: resultText, isError: hasError || false },
            zipBlob: blob,
            singleFileBlob: null,
            singleFileName: null,
          });
        } else {
          throw new Error('번역 결과가 없습니다.');
        }
      } catch (error) {
        console.error('번역 결과 처리 오류:', error);
        showSnackbar(
          `번역 결과 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        );
      }
    },
    [showSnackbar, translationType]
  );

  // Context 값 구성
  const value = {
    translationType,
    isTranslating,
    fileState,
    resultState,
    uiState,
    isConfigValid,
    setTranslationType,
    setIsTranslating,
    setFileState,
    setResultState,
    setUIState,
    setIsConfigValid,
    showSnackbar,
    handleClearFiles,
    showTranslationResult,
  };

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

// 커스텀 훅
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
