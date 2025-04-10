import React from 'react';
import { Modal } from './Modal';
import { useModal } from '../../contexts/ModalContext';

/**
 * 모달 루트 컴포넌트
 *
 * 모달 컨텍스트에서 모든 활성화된 모달을 렌더링합니다.
 * 애플리케이션에서 이 컴포넌트는 최상위 레이어에 한 번만 렌더링해야 합니다.
 */
export const ModalRoot: React.FC = () => {
  const { modals, closeModal } = useModal();

  return (
    <>
      {Object.entries(modals).map(([id, options]) => (
        <Modal
          key={id}
          isOpen={true}
          onClose={() => {
            if (!options.preventClose) {
              closeModal(id);
            }
          }}
          title={options.title}
          className={options.className || ''}
          showCloseButton={options.showCloseButton !== false}
          closeOnEscape={options.closeOnEscape !== false}
          closeOnOutsideClick={options.closeOnOutsideClick !== false}
          size={options.size || 'medium'}
          preventClose={options.preventClose}
        >
          {options.content}
        </Modal>
      ))}
    </>
  );
};

export default ModalRoot;
