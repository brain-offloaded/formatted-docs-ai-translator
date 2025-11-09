import type { ReactNode } from 'react';
import type { ConfirmModalProps } from '../components/common/ConfirmModal';
import type {
  CacheTagSummaryDto,
  CacheTranslationDto,
  TranslationHistoryDto,
} from '@/react/api/generated';
import type { LogDetail } from '@/react/views/LogView/types';

export type ModalSize = 'small' | 'medium' | 'large';

export interface ModalFrameOptions {
  title?: string;
  className?: string;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  preventClose?: boolean;
  onClose?: () => void;
}

export interface AlertModalPayload {
  title?: string;
  message: string;
  confirmText?: string;
  variant?: 'info' | 'warning' | 'danger';
  onClose?: () => void;
}

export interface DetailModalPayload {
  content: ReactNode;
  className?: string;
}

export interface TranslationHistoryPayload {
  translationHistory: TranslationHistoryDto[];
}

export interface TranslationDetailPayload {
  translation: CacheTranslationDto | null;
  onHistoryClick: (translationId: number) => void;
  onSave: (newTarget: string) => void;
  cacheTags: CacheTagSummaryDto[];
  onChangeCacheTag: (cacheTagId: number) => void;
  isProcessing: boolean;
}

export interface CacheTagDeletePayload {
  tag: CacheTagSummaryDto;
  cacheTags: CacheTagSummaryDto[];
  onSubmit: (action: {
    mode: 'cascade' | 'reassign' | 'skip';
    targetTagId?: number;
  }) => Promise<void>;
}

export interface LogDetailPayload {
  log: LogDetail | null;
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
}

export interface ModalPayloadMap {
  'ui.alert': AlertModalPayload;
  'ui.confirm': ConfirmModalProps;
  'ui.detail': DetailModalPayload;
  'cache.translationHistory': TranslationHistoryPayload;
  'cache.translationDetail': TranslationDetailPayload;
  'cache.deleteTag': CacheTagDeletePayload;
  'log.detail': LogDetailPayload;
}

export type ModalType = keyof ModalPayloadMap;

export interface ModalRendererContext<TType extends ModalType> {
  close: () => void;
  update: (payload: ModalPayloadMap[TType]) => void;
}

export interface ModalDefinition<TType extends ModalType> {
  render: (payload: ModalPayloadMap[TType], context: ModalRendererContext<TType>) => ReactNode;
  defaultFrameOptions?: Partial<ModalFrameOptions>;
  serialize?: (payload: ModalPayloadMap[TType]) => unknown;
  deserialize?: (snapshot: unknown) => ModalPayloadMap[TType];
}

export type ModalRegistry = {
  [Type in ModalType]: ModalDefinition<Type>;
};
