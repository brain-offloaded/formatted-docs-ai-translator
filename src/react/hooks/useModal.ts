import React, { ReactNode } from 'react';
import { useModal as useContextModal } from '../contexts/ModalContext';

/**
 * 다양한 종류의 모달 열기를 위한 편의 훅
 *
 * @deprecated 이 훅은 레거시 지원을 위해 유지됩니다.
 * 새로운 코드는 useContextModal 또는 useConfirmModal을 직접 사용하세요.
 */
export const useModal = () => {
  const { openModal, closeModal } = useContextModal();

  /**
   * 간단한 알림 모달 열기
   */
  const openAlertModal = (props: { title?: string; message: string; onClose?: () => void }) => {
    const { title = '알림', message, onClose } = props;

    // 모달 ID를 먼저 생성
    const modalId = openModal({
      title,
      content: null, // 임시로 null 설정
      size: 'small',
      className: 'alert-modal',
      onClose,
    });

    // 모달 콘텐츠 업데이트 (modalId를 클로저로 사용)
    const content = React.createElement('div', { className: 'alert-modal-content' }, [
      React.createElement('p', { key: 'message' }, message),
      React.createElement('div', { key: 'footer', className: 'modal-footer' }, [
        React.createElement(
          'button',
          {
            key: 'confirm',
            className: 'action-button confirm-button',
            onClick: () => {
              if (onClose) onClose();
              closeModal(modalId); // 모달 ID를 사용하여 모달 닫기
            },
            autoFocus: true,
          },
          '확인'
        ),
      ]),
    ]);

    // 모달 콘텐츠 업데이트
    const updatedModal = {
      title,
      content,
      size: 'small' as const,
      className: 'alert-modal',
      onClose,
    };

    // 모달 업데이트
    openModal({ ...updatedModal, id: modalId });

    return modalId;
  };

  /**
   * 커스텀 모달 열기
   */
  const openCustomModal = (props: {
    title?: string;
    content: ReactNode;
    size?: 'small' | 'medium' | 'large';
    className?: string;
    showCloseButton?: boolean;
    closeOnEscape?: boolean;
    closeOnOutsideClick?: boolean;
    onClose?: () => void;
  }) => {
    return openModal(props);
  };

  // 레거시 호환성을 위한 속성
  const isOpen = false;
  const openModal_ = () =>
    console.warn(
      '레거시 openModal은 지원되지 않습니다. useModal().openAlertModal/openCustomModal을 사용하세요.'
    );
  const closeModal_ = () =>
    console.warn('레거시 closeModal은 지원되지 않습니다. useModal().closeModal을 사용하세요.');
  const handleEscapeKey = () => {}; // 새 시스템에서는 자동 처리

  return {
    isOpen,
    openModal: openModal_,
    closeModal: closeModal_,
    handleEscapeKey,
    // 새로운 API
    openAlertModal,
    openCustomModal,
    closeModalById: closeModal,
  };
};
