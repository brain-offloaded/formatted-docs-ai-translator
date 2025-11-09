import { useCallback, useEffect, useRef } from 'react';
import type { UIState } from './types';

interface UseSnackbarControllerParams {
  setUIState: React.Dispatch<React.SetStateAction<UIState>>;
  autoHideDuration?: number;
}

export function useSnackbarController({
  setUIState,
  autoHideDuration = 3000,
}: UseSnackbarControllerParams) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showSnackbar = useCallback(
    (message: string) => {
      setUIState((prev) => ({
        ...prev,
        snackbarOpen: true,
        snackbarMessage: message,
      }));

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(
        () =>
          setUIState((prev) => ({
            ...prev,
            snackbarOpen: false,
          })),
        autoHideDuration
      );
    },
    [autoHideDuration, setUIState]
  );

  return { showSnackbar };
}
