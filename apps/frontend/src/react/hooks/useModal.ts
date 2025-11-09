import type { ReactNode } from 'react';
import { createModalId, useModal as useContextModal } from '../contexts/ModalContext';
import { openAlertModal as openAlertModalUtil } from '../utils/modalUtils';

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
    const modalId = openAlertModalUtil(
      {
        ...props,
        id: createModalId('ui.alert'),
      },
      openModal
    );

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
    const modalId = createModalId('ui.detail');

    openModal({
      id: modalId,
      type: 'ui.detail',
      payload: {
        content: props.content,
        className: props.className,
      },
      frameOptions: {
        title: props.title,
        size: props.size,
        className: props.className ? `detail-modal ${props.className}` : 'detail-modal',
        showCloseButton: props.showCloseButton,
        closeOnEscape: props.closeOnEscape,
        closeOnOutsideClick: props.closeOnOutsideClick,
        onClose: props.onClose,
      },
    });

    return modalId;
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
