import { useState, useCallback } from 'react';

interface UseSnackbarReturn {
  isOpen: boolean;
  message: string;
  showSnackbar: (message: string, duration?: number) => void;
  closeSnackbar: () => void;
}

/**
 * 스낵바(토스트 메시지) 상태와 동작을 관리하는 커스텀 훅
 * @param defaultDuration 스낵바가 표시되는 기본 시간(ms) (기본값: 3000)
 * @returns 스낵바 상태와 제어 함수를 포함한 객체
 */
export function useSnackbar(defaultDuration = 3000): UseSnackbarReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const closeSnackbar = useCallback(() => {
    setIsOpen(false);
  }, []);

  const showSnackbar = useCallback(
    (message: string, duration?: number) => {
      // 이전 타이머가 있으면 제거
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      setMessage(message);
      setIsOpen(true);

      // 새 타이머 설정
      const id = setTimeout(() => {
        setIsOpen(false);
      }, duration || defaultDuration);

      setTimeoutId(id);
    },
    [defaultDuration, timeoutId]
  );

  return { isOpen, message, showSnackbar, closeSnackbar };
}

export default useSnackbar;
