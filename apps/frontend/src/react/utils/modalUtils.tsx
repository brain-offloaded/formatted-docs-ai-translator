import { createModalId, type OpenModalFn } from '../contexts/ModalContext';

interface AlertModalOptions {
  id?: string;
  title?: string;
  message: string;
  confirmText?: string;
  variant?: 'info' | 'warning' | 'danger';
  onClose?: () => void;
}

export const openAlertModal = (options: AlertModalOptions, openModal: OpenModalFn): string => {
  const { id, title = '알림', message, confirmText, variant, onClose } = options;

  const modalId = id ?? createModalId('ui.alert');

  openModal({
    id: modalId,
    type: 'ui.alert',
    payload: {
      title,
      message,
      confirmText,
      variant,
      onClose,
    },
    frameOptions: {
      title,
      className: `alert-modal ${variant ?? ''}`.trim(),
      size: 'small',
      showCloseButton: true,
      closeOnEscape: true,
      closeOnOutsideClick: true,
      onClose,
    },
  });

  return modalId;
};
