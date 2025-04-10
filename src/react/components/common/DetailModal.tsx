import React from 'react';
import { useModal } from '../../contexts/ModalContext';

interface DetailModalProps {
  children: React.ReactNode;
  className?: string;
}

interface DetailModalOpenOptions {
  title: string;
  content: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

/**
 * 상세 정보를 표시하는 모달 컴포넌트 (콘텐츠만 제공)
 * 새로운 모달 시스템과 호환됨
 */
const DetailModalBase: React.FC<DetailModalProps> = ({ children, className = '' }) => {
  return <div className={`detail-modal-content ${className}`}>{children}</div>;
};

// 정적 메서드를 갖는 확장된 컴포넌트
export const DetailModal = Object.assign(DetailModalBase, {
  open: (options: DetailModalOpenOptions) => {
    // 경고 메시지 출력
    console.warn(
      '[Deprecated] DetailModal.open은 곧 지원이 중단됩니다. useDetailModal 훅을 사용하세요.'
    );

    // 전역 Modal 컨텍스트 사용
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      const newModalRoot = document.createElement('div');
      newModalRoot.id = 'modal-root';
      document.body.appendChild(newModalRoot);
    }

    const event = new CustomEvent('openDetailModal', { detail: options });
    document.dispatchEvent(event);
  },
}) as React.FC<DetailModalProps> & {
  open: (options: DetailModalOpenOptions) => void;
};

/**
 * 상세 모달을 열기 위한 hook
 */
export const useDetailModal = () => {
  const { openModal, closeModal } = useModal();

  /**
   * 상세 모달 열기
   */
  const openDetailModal = (props: {
    title: string;
    content: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
    className?: string;
    onClose?: () => void;
  }) => {
    const { content, size = 'medium', className = '', onClose } = props;
    const _title = props.title; // 언더스코어 접두사 사용

    // 새로운 모달 시스템으로 모달 열기
    const modalId = openModal({
      title: _title,
      content: <DetailModal className={className}>{content}</DetailModal>,
      size,
      className: `detail-modal ${className}`,
      onClose,
    });

    return {
      modalId,
      close: () => closeModal(modalId),
    };
  };

  return { openDetailModal };
};

export default DetailModal;
