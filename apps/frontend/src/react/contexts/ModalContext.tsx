import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import defaultModalDefinitions from './modalDefinitions';
import type {
  ModalDefinition,
  ModalFrameOptions,
  ModalPayloadMap,
  ModalRegistry,
  ModalType,
} from './modalTypes';

interface ModalInstance<TType extends ModalType = ModalType> {
  id: string;
  type: TType;
  payload: ModalPayloadMap[TType];
  frameOptions: ModalFrameOptions;
}

type ModalState = Map<string, ModalInstance>;

type ModalAction =
  | { type: 'OPEN'; payload: ModalInstance }
  | { type: 'CLOSE'; payload: { id: string } }
  | { type: 'UPDATE'; payload: ModalInstance }
  | { type: 'RESET' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'OPEN': {
      const next = new Map(state);
      next.set(action.payload.id, action.payload);
      return next;
    }
    case 'UPDATE': {
      const next = new Map(state);
      next.set(action.payload.id, action.payload);
      return next;
    }
    case 'CLOSE': {
      if (!state.has(action.payload.id)) {
        return state;
      }
      const next = new Map(state);
      next.delete(action.payload.id);
      return next;
    }
    case 'RESET':
      return new Map();
    default:
      return state;
  }
};

export interface ModalDescriptor<TType extends ModalType> {
  type: TType;
  payload: ModalPayloadMap[TType];
  id?: string;
  frameOptions?: Partial<ModalFrameOptions>;
}

type ModalPayloadUpdater<TPayload> = TPayload | ((previous: TPayload) => TPayload);

export type OpenModalFn = <TType extends ModalType>(descriptor: ModalDescriptor<TType>) => string;

export interface CloseModalOptions {
  skipOnClose?: boolean;
}

export type CloseModalFn = (id: string, options?: CloseModalOptions) => void;

export type UpdateModalFn = <TType extends ModalType>(
  id: string,
  payload: ModalPayloadUpdater<ModalPayloadMap[TType]>,
  frameOptions?: Partial<ModalFrameOptions>
) => void;

export interface ModalContextValue {
  modals: ModalInstance[];
  definitions: ModalRegistry;
  openModal: OpenModalFn;
  closeModal: CloseModalFn;
  closeAllModals: () => void;
  updateModal: UpdateModalFn;
  getModalById: <TType extends ModalType>(id: string) => ModalInstance<TType> | undefined;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

let modalSequence = 0;

export const createModalId = (type: ModalType, key?: string) => {
  if (key) {
    return `${type}:${key}`;
  }
  modalSequence += 1;
  return `${type}:${modalSequence}`;
};

const mergeFrameOptions = (
  definition: ModalDefinition<ModalType>,
  overrides?: Partial<ModalFrameOptions>
): ModalFrameOptions => {
  return {
    title: overrides?.title ?? definition.defaultFrameOptions?.title,
    className: overrides?.className ?? definition.defaultFrameOptions?.className ?? '',
    size: overrides?.size ?? definition.defaultFrameOptions?.size ?? 'medium',
    showCloseButton:
      overrides?.showCloseButton ?? definition.defaultFrameOptions?.showCloseButton ?? true,
    closeOnEscape:
      overrides?.closeOnEscape ?? definition.defaultFrameOptions?.closeOnEscape ?? true,
    closeOnOutsideClick:
      overrides?.closeOnOutsideClick ?? definition.defaultFrameOptions?.closeOnOutsideClick ?? true,
    preventClose: overrides?.preventClose ?? definition.defaultFrameOptions?.preventClose ?? false,
    onClose: overrides?.onClose ?? definition.defaultFrameOptions?.onClose,
  };
};

export interface ModalProviderProps {
  children: ReactNode;
  definitions?: ModalRegistry;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({
  children,
  definitions = defaultModalDefinitions,
}) => {
  const [state, dispatch] = useReducer(modalReducer, new Map());
  const stateRef = useRef(state);

  stateRef.current = state;

  const openModal: OpenModalFn = useCallback(
    ({ type, payload, id, frameOptions }) => {
      const definition = definitions[type];
      if (!definition) {
        throw new Error(`등록되지 않은 모달 타입입니다: ${type}`);
      }

      const resolvedId = id ?? createModalId(type);
      const resolvedFrameOptions = mergeFrameOptions(
        definition as ModalDefinition<ModalType>,
        frameOptions
      );

      const instance: ModalInstance = {
        id: resolvedId,
        type,
        payload,
        frameOptions: resolvedFrameOptions,
      };

      dispatch({ type: 'OPEN', payload: instance });
      return resolvedId;
    },
    [definitions]
  );

  const closeModal: CloseModalFn = useCallback((id, options) => {
    const instance = stateRef.current.get(id);
    if (!options?.skipOnClose) {
      instance?.frameOptions.onClose?.();
    }
    dispatch({ type: 'CLOSE', payload: { id } });
  }, []);

  const closeAllModals = useCallback(() => {
    stateRef.current.forEach((instance) => {
      instance.frameOptions.onClose?.();
    });
    dispatch({ type: 'RESET' });
  }, []);

  const updateModal: UpdateModalFn = useCallback(
    (id, payload, frameOptions) => {
      const instance = stateRef.current.get(id);
      if (!instance) {
        return;
      }

      const modalType = instance.type as ModalType;
      const definition = definitions[modalType];
      const typedPayload = instance.payload as ModalPayloadMap[ModalType];
      const payloadUpdater = payload as
        | ModalPayloadMap[ModalType]
        | ((prev: ModalPayloadMap[ModalType]) => ModalPayloadMap[ModalType]);
      const nextPayload =
        typeof payloadUpdater === 'function'
          ? (payloadUpdater as (prev: ModalPayloadMap[ModalType]) => ModalPayloadMap[ModalType])(
              typedPayload
            )
          : payloadUpdater;

      const nextFrameOptions = frameOptions
        ? mergeFrameOptions(definition as ModalDefinition<ModalType>, {
            ...instance.frameOptions,
            ...frameOptions,
          })
        : instance.frameOptions;

      const nextInstance: ModalInstance = {
        id,
        type: modalType,
        payload: nextPayload as ModalPayloadMap[ModalType],
        frameOptions: nextFrameOptions,
      };

      dispatch({ type: 'UPDATE', payload: nextInstance });
    },
    [definitions]
  );

  const getModalById = useCallback(<TType extends ModalType>(id: string) => {
    return stateRef.current.get(id) as ModalInstance<TType> | undefined;
  }, []);

  const contextValue = useMemo<ModalContextValue>(() => {
    const modals = Array.from(state.values());
    return {
      modals,
      definitions,
      openModal,
      closeModal,
      closeAllModals,
      updateModal,
      getModalById,
    };
  }, [state, definitions, openModal, closeModal, closeAllModals, updateModal, getModalById]);

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal 훅은 ModalProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};

export default ModalContext;
