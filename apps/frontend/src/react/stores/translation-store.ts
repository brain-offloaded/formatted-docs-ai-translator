import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand';
import type { SetStateAction } from 'react';
import type {
  FileState,
  TranslationResultState,
  UIState,
} from '@/react/contexts/translation/types';
import { TranslationType } from '@/react/contexts/translation/types';

export const createInitialFileState = (): FileState => ({
  selectedFiles: null,
});

export const createInitialResultState = (): TranslationResultState => ({
  translationResult: null,
  report: null,
  zipBlob: null,
  singleFileBlob: null,
  singleFileName: null,
  imageResult: null,
});

export const createInitialUIState = (): UIState => ({
  copied: false,
  snackbarOpen: false,
  snackbarMessage: '',
  translationProgress: 0,
  currentFileIndex: 0,
  showJsonSettings: false,
  progressMessage: '',
  completed: 0,
  totalJobs: 0,
  failed: 0,
  cancelled: 0,
});

interface TranslationStoreState {
  translationType: TranslationType;
  isTranslating: boolean;
  fileState: FileState;
  resultState: TranslationResultState;
  uiState: UIState;
  isConfigValid: boolean;
}

interface TranslationStoreActions {
  setTranslationType: (type: TranslationType) => void;
  setIsTranslating: (isTranslating: boolean) => void;
  setFileState: (updater: SetStateAction<FileState>) => void;
  resetFileState: () => void;
  setResultState: (updater: SetStateAction<TranslationResultState>) => void;
  resetResultState: () => void;
  setUIState: (updater: SetStateAction<UIState>) => void;
  resetUIState: () => void;
  setIsConfigValid: (isValid: boolean) => void;
}

export type TranslationStore = TranslationStoreState & TranslationStoreActions;

const applySetStateAction = <T>(current: T, updater: SetStateAction<T>): T =>
  typeof updater === 'function' ? (updater as (prev: T) => T)(current) : updater;

const shallowEqualObject = <T extends object>(left: T, right: T): boolean => {
  if (left === right) {
    return true;
  }

  const leftKeys = Object.keys(left) as Array<keyof T>;
  const rightKeys = Object.keys(right) as Array<keyof T>;
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
};

export const createTranslationStore = (
  initialState?: Partial<TranslationStoreState>
): StoreApi<TranslationStore> =>
  createStore<TranslationStore>((set) => ({
    translationType: initialState?.translationType ?? TranslationType.Text,
    isTranslating: initialState?.isTranslating ?? false,
    fileState: initialState?.fileState ?? createInitialFileState(),
    resultState: initialState?.resultState ?? createInitialResultState(),
    uiState: initialState?.uiState ?? createInitialUIState(),
    isConfigValid: initialState?.isConfigValid ?? true,
    setTranslationType: (type) => set({ translationType: type }),
    setIsTranslating: (isTranslating) => set({ isTranslating }),
    setFileState: (updater) =>
      set((state) => ({
        fileState: applySetStateAction(state.fileState, updater),
      })),
    resetFileState: () => set({ fileState: createInitialFileState() }),
    setResultState: (updater) =>
      set((state) => ({
        resultState: applySetStateAction(state.resultState, updater),
      })),
    resetResultState: () => set({ resultState: createInitialResultState() }),
    setUIState: (updater) =>
      set((state) => {
        const nextUIState = applySetStateAction(state.uiState, updater);
        if (shallowEqualObject(state.uiState, nextUIState)) {
          return state;
        }

        return {
          uiState: nextUIState,
        };
      }),
    resetUIState: () => set({ uiState: createInitialUIState() }),
    setIsConfigValid: (isValid) => set({ isConfigValid: isValid }),
  }));
