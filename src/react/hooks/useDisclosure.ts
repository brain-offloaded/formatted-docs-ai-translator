import { useState, useCallback } from 'react';

interface UseDisclosureReturn {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
}

/**
 * 모달, 드롭다운, 토글 상태 등을 관리하는 커스텀 훅
 * @param initialState 초기 열림/닫힘 상태 (기본값: false)
 * @returns isOpen, onOpen, onClose, onToggle 함수를 포함한 객체
 */
export function useDisclosure(initialState = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, onOpen, onClose, onToggle };
}

export default useDisclosure;
