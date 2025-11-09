import React from 'react';
import { Modal } from './Modal';
import { useModal } from '../../contexts/ModalContext';

export const ModalRoot: React.FC = () => {
  const { modals, closeModal, definitions, updateModal } = useModal();

  return (
    <>
      {modals.map((instance) => {
        const definition = definitions[instance.type];
        if (!definition) {
          return null;
        }

        const content = definition.render(instance.payload as never, {
          close: () => closeModal(instance.id),
          update: (nextPayload) => updateModal(instance.id, nextPayload as never),
        });

        return (
          <Modal
            key={instance.id}
            isOpen
            onClose={() => {
              if (!instance.frameOptions.preventClose) {
                instance.frameOptions.onClose?.();
                closeModal(instance.id, { skipOnClose: true });
              }
            }}
            title={instance.frameOptions.title}
            className={instance.frameOptions.className}
            showCloseButton={instance.frameOptions.showCloseButton}
            closeOnEscape={instance.frameOptions.closeOnEscape}
            closeOnOutsideClick={instance.frameOptions.closeOnOutsideClick}
            size={instance.frameOptions.size}
            preventClose={instance.frameOptions.preventClose}
          >
            {content}
          </Modal>
        );
      })}
    </>
  );
};

export default ModalRoot;
