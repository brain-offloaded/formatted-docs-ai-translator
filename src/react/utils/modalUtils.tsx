/**
 * 모달 관련 유틸리티 함수 모음
 */
import React from 'react';
import { OpenModalFn, CloseModalFn } from '../contexts/ModalContext';

/**
 * 알림용 모달을 표시합니다
 */
export const openAlertModal = (
  options: {
    title?: string;
    message: string;
    onClose?: () => void;
  },
  openModal: OpenModalFn,
  closeModal: CloseModalFn
): string => {
  const { title = '알림', message, onClose } = options;

  // 모달 ID 생성
  const modalId = openModal({
    title,
    content: (
      <div className="alert-modal-content">
        <p>{message}</p>
        <div className="modal-footer">
          <button
            className="action-button confirm-button"
            onClick={() => {
              if (onClose) onClose();
              closeModal(modalId);
            }}
          >
            확인
          </button>
        </div>
      </div>
    ),
    size: 'small',
    className: 'alert-modal',
    onClose,
    showCloseButton: true,
    closeOnEscape: true,
    closeOnOutsideClick: true,
  });

  return modalId;
};
