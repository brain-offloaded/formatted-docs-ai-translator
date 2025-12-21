import React, { createContext, useContext, useMemo, useRef, ReactNode } from 'react';
import type JSZip from 'jszip';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand';
import { useConfigStore } from '../config/config-store';
import type { TranslationJobManager } from '../services/job-manager/TranslationJobManager';
import { TranslationType } from './translation/types';
import type { FileState, TranslationResultState, UIState } from './translation/types';
import { createTranslationStore, TranslationStore } from '@/react/stores/translation-store';
import { useTranslationController } from './translation/useTranslationController';

interface TranslationContextType {
  translationType: TranslationType;
  isTranslating: boolean;
  fileState: FileState;
  resultState: TranslationResultState;
  uiState: UIState;
  isConfigValid: boolean;
  setTranslationType: (type: TranslationType) => void;
  setIsTranslating: (isTranslating: boolean) => void;
  setFileState: React.Dispatch<React.SetStateAction<FileState>>;
  setResultState: React.Dispatch<React.SetStateAction<TranslationResultState>>;
  setUIState: React.Dispatch<React.SetStateAction<UIState>>;
  setIsConfigValid: (isValid: boolean) => void;
  showSnackbar: (message: string) => void;
  handleClearFiles: () => void;
  showTranslationResult: (
    zip?: JSZip,
    hasError?: boolean,
    fileResults?: { name: string; success: boolean; message?: string }[],
    successCount?: number,
    errorCount?: number
  ) => Promise<void>;
  getJobManager: () => TranslationJobManager<File | string>;
  cancelTranslation: () => void;
  isJobManagerActive: () => boolean;
  resetJobManager: () => void;
}

interface TranslationContextInternal {
  store: StoreApi<TranslationStore>;
  showSnackbar: (message: string) => void;
  handleClearFiles: () => void;
  showTranslationResult: (
    zip?: JSZip,
    hasError?: boolean,
    fileResults?: { name: string; success: boolean; message?: string }[],
    successCount?: number,
    errorCount?: number
  ) => Promise<void>;
  getJobManager: () => TranslationJobManager<File | string>;
  cancelTranslation: () => void;
  isJobManagerActive: () => boolean;
  resetJobManager: () => void;
}

const TranslationContext = createContext<TranslationContextInternal | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storeRef = useRef<StoreApi<TranslationStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createTranslationStore();
  }
  const store = storeRef.current;
  if (!store) {
    throw new Error('Translation store 초기화에 실패했습니다.');
  }

  const customModelConfig = useConfigStore((state) => state.customModelConfig);
  const maxConcurrentRequests = customModelConfig?.maxConcurrentRequests ?? 1;
  const concurrencyLimit = Math.max(1, maxConcurrentRequests);

  const {
    getJobManager,
    cancelTranslation,
    isJobManagerActive,
    resetJobManager,
    showSnackbar,
    handleClearFiles,
    showTranslationResult,
  } = useTranslationController({ store, concurrencyLimit });

  const contextValue = useMemo<TranslationContextInternal>(
    () => ({
      store,
      showSnackbar,
      handleClearFiles,
      showTranslationResult,
      getJobManager,
      cancelTranslation,
      isJobManagerActive,
      resetJobManager,
    }),
    [
      store,
      showSnackbar,
      handleClearFiles,
      showTranslationResult,
      getJobManager,
      cancelTranslation,
      isJobManagerActive,
      resetJobManager,
    ]
  );

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }

  const storeState = useStore(context.store, (state) => state);

  return {
    translationType: storeState.translationType,
    isTranslating: storeState.isTranslating,
    fileState: storeState.fileState,
    resultState: storeState.resultState,
    uiState: storeState.uiState,
    isConfigValid: storeState.isConfigValid,
    setTranslationType: storeState.setTranslationType,
    setIsTranslating: storeState.setIsTranslating,
    setFileState: storeState.setFileState,
    setResultState: storeState.setResultState,
    setUIState: storeState.setUIState,
    setIsConfigValid: storeState.setIsConfigValid,
    showSnackbar: context.showSnackbar,
    handleClearFiles: context.handleClearFiles,
    showTranslationResult: context.showTranslationResult,
    getJobManager: context.getJobManager,
    cancelTranslation: context.cancelTranslation,
    isJobManagerActive: context.isJobManagerActive,
    resetJobManager: context.resetJobManager,
  };
};

export type { TranslationResultState, FileState, UIState } from './translation/types';
export { TranslationType } from './translation/types';
