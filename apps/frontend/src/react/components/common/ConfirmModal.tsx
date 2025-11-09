import React, { useRef, useEffect } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';
import { createModalId, useModal } from '../../contexts/ModalContext';

export interface ConfirmModalProps {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'warning' | 'danger' | 'info';
}

const CONFIRM_VARIANT_COLOR_MAP: Record<
  NonNullable<ConfirmModalProps['variant']>,
  ButtonProps['color']
> = {
  info: 'primary',
  warning: 'warning',
  danger: 'error',
};

/**
 * 확인 모달 컴포넌트
 * 새로운 모달 시스템과 통합된 버전
 */
const ConfirmModalBase: React.FC<ConfirmModalProps> = ({
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  variant = 'info',
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // autoFocus 대신 useEffect 사용
  useEffect(() => {
    if (confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, []);

  return (
    <Stack spacing={3} sx={{ minWidth: { xs: 0, sm: 320 } }}>
      <Typography
        variant="body1"
        sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        color="text.primary"
      >
        {message}
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        justifyContent="flex-end"
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Button
          variant="contained"
          color={CONFIRM_VARIANT_COLOR_MAP[variant] ?? 'primary'}
          onClick={onConfirm}
          ref={confirmButtonRef}
          sx={{ fontWeight: 600 }}
        >
          {confirmText}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => {
            if (onCancel) {
              onCancel();
            }
          }}
        >
          {cancelText}
        </Button>
      </Stack>
    </Stack>
  );
};

// 정적 메서드를 갖는 확장된 컴포넌트
export const ConfirmModal = Object.assign(ConfirmModalBase, {
  open: (options: ConfirmModalProps) => {
    // 기존 DOM 기반 모달 열기 구현은 제거하고, 콘솔에 경고 메시지 출력
    console.warn(
      '[Deprecated] ConfirmModal.open은 곧 지원이 중단됩니다. useConfirmModal 훅을 사용하세요.'
    );

    // 전역 Modal 컨텍스트 사용
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      const newModalRoot = document.createElement('div');
      newModalRoot.id = 'modal-root';
      document.body.appendChild(newModalRoot);
    }

    const event = new CustomEvent('openConfirmModal', { detail: options });
    document.dispatchEvent(event);
  },
}) as React.FC<ConfirmModalProps> & {
  open: (options: ConfirmModalProps) => void;
};

/**
 * 확인 모달을 열기 위한 정적 메서드 (새로운 모달 시스템 활용)
 */
export const useConfirmModal = () => {
  const { openModal, closeModal } = useModal();

  /**
   * 확인 모달 열기
   */
  const openConfirmModal = ({
    title = '확인',
    message,
    confirmText = '확인',
    cancelText = '취소',
    onConfirm,
    onCancel,
    variant = 'info',
  }: ConfirmModalProps) => {
    const modalId = createModalId('ui.confirm');

    openModal({
      id: modalId,
      type: 'ui.confirm',
      payload: {
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          onConfirm();
          closeModal(modalId, { skipOnClose: true });
        },
        onCancel: () => {
          if (onCancel) {
            onCancel();
          }
          closeModal(modalId, { skipOnClose: true });
        },
        variant,
      },
      frameOptions: {
        title,
        className: `confirm-modal ${variant}`,
        size: 'small',
        showCloseButton: false,
        closeOnOutsideClick: false,
        onClose: () => {
          if (onCancel) {
            onCancel();
          }
        },
      },
    });

    return modalId;
  };

  return { openConfirmModal };
};

export default ConfirmModal;
