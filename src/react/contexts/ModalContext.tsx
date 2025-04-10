import React, { createContext, useState, useContext, ReactNode } from 'react';

// 모달 옵션 인터페이스
export interface ModalOptions {
  id?: string;
  title?: string;
  content: ReactNode;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  preventClose?: boolean;
  onClose?: () => void;
}

// 모달 상태 인터페이스 - 호환성 유지
export interface ModalState extends ModalOptions {
  id: string;
  isOpen: boolean;
  title: string; // 상태에서는 필수
}

// 모달 열기 함수 타입
export type OpenModalFn = (options: ModalOptions) => string;

// 모달 닫기 함수 타입
export type CloseModalFn = (id: string) => void;

// 모달 컨텍스트 인터페이스
interface ModalContextType {
  modals: Record<string, ModalOptions>;
  openModal: OpenModalFn;
  closeModal: CloseModalFn;
  closeAllModals: () => void;
  updateModal: (id: string, options: Partial<ModalOptions>) => void;
  getModalById: (id: string) => ModalOptions | undefined;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modals, setModals] = useState<Record<string, ModalOptions>>({});

  // 고유한 ID 생성 함수
  const generateId = (): string => {
    return `modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  // 모달 열기
  const openModal = (options: ModalOptions): string => {
    const id = options.id || generateId();
    setModals((prevModals) => ({
      ...prevModals,
      [id]: { ...options, id },
    }));
    return id;
  };

  // 모달 닫기
  const closeModal = (id: string): void => {
    setModals((prevModals) => {
      const modal = prevModals[id];

      // 닫기 이벤트 핸들러 호출
      if (modal && modal.onClose) {
        modal.onClose();
      }

      const newModals = { ...prevModals };
      delete newModals[id];
      return newModals;
    });
  };

  // 모든 모달 닫기
  const closeAllModals = (): void => {
    // 각 모달의 onClose 핸들러를 호출
    Object.entries(modals).forEach(([_id, modal]) => {
      if (modal.onClose) {
        modal.onClose();
      }
    });

    setModals({});
  };

  // 모달 업데이트
  const updateModal = (id: string, options: Partial<ModalOptions>): void => {
    setModals((prevModals) => {
      if (!prevModals[id]) return prevModals;

      return {
        ...prevModals,
        [id]: { ...prevModals[id], ...options },
      };
    });
  };

  // ID로 모달 찾기
  const getModalById = (id: string): ModalOptions | undefined => {
    return modals[id];
  };

  const contextValue: ModalContextType = {
    openModal,
    closeModal,
    closeAllModals,
    updateModal,
    getModalById,
    modals,
  };

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>;
};
