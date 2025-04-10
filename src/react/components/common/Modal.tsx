import React, { useEffect, useRef, useCallback, useId, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import '../../styles/Modal.css';

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

/**
 * 개선된 모달 컴포넌트
 *
 * React Portal을 사용하여 DOM 트리의 다른 위치에 모달을 렌더링합니다.
 * 접근성 기능, 모바일 지원 및 키보드 인터랙션이 개선되었습니다.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  size = 'medium',
  preventClose = false,
}) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const titleId = `modal-title-${uniqueId}`;
  const contentId = `modal-content-${uniqueId}`;

  // ESC 키 이벤트 핸들러
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && !preventClose && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose, preventClose]
  );

  // 배경 클릭 핸들러
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // 모달 콘텐츠 내부 클릭은 무시하고 배경 클릭 시에만 닫기
      if (closeOnOutsideClick && !preventClose && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnOutsideClick, onClose, preventClose]
  );

  // 모달 내 포커스 상태 유지 함수
  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (!modalRef.current || e.key !== 'Tab') return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Shift + Tab 키 조합 - 처음 요소에서 마지막 요소로
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    }
    // Tab 키 - 마지막 요소에서 처음 요소로
    else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }, []);

  // 모달 열릴 때 이전 포커스 요소 저장 및 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // 모달로 포커스 이동
      if (modalRef.current) {
        // 모달 내 포커스 가능한 요소를 찾아 포커스
        const focusableElement = modalRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;

        if (focusableElement) {
          focusableElement.focus();
        } else {
          modalRef.current.focus();
        }
      }

      // 이벤트 리스너 추가
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', trapFocus);
    }

    // 모달 닫힐 때 정리
    return () => {
      if (isOpen) {
        document.body.style.overflow = 'auto';
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', trapFocus);

        // 이전 포커스 요소로 복원
        if (previousFocusRef.current) {
          previousFocusRef.current?.focus();
        }
      }
    };
  }, [isOpen, handleKeyDown, trapFocus]);

  // 모달이 닫혀있을 때는 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  // 모달 콘텐츠
  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleKeyDown(e as unknown as KeyboardEvent);
      }}
      tabIndex={-1}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`modal modal-${size} ${className}`}
        role="dialog"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={contentId}
        tabIndex={-1}
      >
        {title && (
          <div className="modal-header">
            <h3 id={titleId}>{title}</h3>
            {showCloseButton && !preventClose && (
              <button className="close-button" onClick={onClose} aria-label="닫기">
                &times;
              </button>
            )}
          </div>
        )}
        <div className="modal-content" id={contentId}>
          {children}
        </div>
      </div>
    </div>
  );

  // React Portal을 사용하여 DOM 트리의 다른 위치에 모달을 렌더링
  return ReactDOM.createPortal(
    modalContent,
    document.getElementById('modal-root') || document.body
  );
};

export default Modal;
