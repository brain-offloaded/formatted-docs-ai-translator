import React, { ReactNode, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, type DialogProps } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  size?: 'small' | 'medium' | 'large';
  preventClose?: boolean;
}

const sizeToMaxWidth: Record<NonNullable<ModalProps['size']>, DialogProps['maxWidth']> = {
  small: 'sm',
  medium: 'md',
  large: 'lg',
};

/**
 * MUI Dialog 기반의 모달 래퍼 컴포넌트
 * - 테마 토큰과 다크 모드를 자연스럽게 따르도록 개선
 * - 기존 API는 그대로 유지
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  size = 'medium',
  preventClose = false,
}) => {
  const maxWidth = useMemo(() => sizeToMaxWidth[size] ?? 'md', [size]);

  const handleClose = (_event: unknown, reason?: 'backdropClick' | 'escapeKeyDown') => {
    if (preventClose) {
      return;
    }

    if (!closeOnOutsideClick && reason === 'backdropClick') {
      return;
    }

    if (!closeOnEscape && reason === 'escapeKeyDown') {
      return;
    }

    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullWidth
      maxWidth={maxWidth}
      PaperProps={{
        className,
        sx: {
          borderRadius: 3,
          boxShadow: (theme) => theme.shadows[6],
        },
      }}
    >
      {title && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pr: showCloseButton && !preventClose ? 1 : 3,
          }}
        >
          {title}
          {showCloseButton && !preventClose && (
            <IconButton edge="end" onClick={onClose} aria-label="닫기" size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
};

export default Modal;
