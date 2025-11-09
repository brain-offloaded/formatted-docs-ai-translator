import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const createStorage = (): Storage => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  const store = new Map<string, string>();

  const memoryStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };

  return memoryStorage as Storage;
};

interface ViewerPreferencesState {
  textFontSize: number;
  textBgOpacity: number;
  setTextFontSize: (value: number) => void;
  setTextBgOpacity: (value: number) => void;
  reset: () => void;
}

const defaultState: Pick<ViewerPreferencesState, 'textFontSize' | 'textBgOpacity'> = {
  textFontSize: 0.95,
  textBgOpacity: 0.45,
};

export const useViewerPreferencesStore = create<ViewerPreferencesState>()(
  persist(
    (set) => ({
      ...defaultState,
      setTextFontSize: (value) => {
        set((state) => ({
          ...state,
          textFontSize: Number.isFinite(value) ? value : defaultState.textFontSize,
        }));
      },
      setTextBgOpacity: (value) => {
        set((state) => ({
          ...state,
          textBgOpacity: Number.isFinite(value) ? value : defaultState.textBgOpacity,
        }));
      },
      reset: () => {
        set(defaultState);
      },
    }),
    {
      name: 'advanced_viewer_preferences',
      storage: createJSONStorage(createStorage),
      version: 1,
    }
  )
);

export const resetViewerPreferences = () => {
  useViewerPreferencesStore.getState().reset();
};
