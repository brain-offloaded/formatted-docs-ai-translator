import { useCallback, useRef } from 'react';
import type { CacheTagSummaryDto } from '@/react/api/generated';
import { CacheTagsService } from '@/react/api/generated';
import { buildLanguageScopedCacheTag, normalizeCacheTag } from '@apps/common/dist/utils/cache-tag';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import type { SourceLanguage, TargetLanguage } from '@apps/common/dist/language';
import { useConfirmModal } from '@/react/components/common/ConfirmModal';
import { useTranslation } from 'react-i18next';

export const useCacheTagGuard = (
  cacheTag: string | undefined,
  sourceLanguage: SourceLanguage,
  targetLanguage: TargetLanguage,
  showSnackbar: (message: string) => void
) => {
  const validatedCacheTagsRef = useRef<Set<string>>(new Set());
  const { openConfirmModal } = useConfirmModal();
  const { t } = useTranslation();

  return useCallback(async () => {
    const trimmed = cacheTag?.trim() ?? '';

    if (/\s/.test(trimmed)) {
      showSnackbar(t('cacheTag.whitespaceNotAllowed'));
      return false;
    }

    const normalizedBaseTag = normalizeCacheTag(trimmed);
    const languageScopedTag = buildLanguageScopedCacheTag(trimmed, sourceLanguage, targetLanguage);

    if (normalizedBaseTag === DEFAULT_CACHE_TAG) {
      validatedCacheTagsRef.current.add(languageScopedTag);
      validatedCacheTagsRef.current.add(normalizedBaseTag);
      return true;
    }

    if (
      validatedCacheTagsRef.current.has(languageScopedTag) ||
      validatedCacheTagsRef.current.has(normalizedBaseTag)
    ) {
      return true;
    }

    if (trimmed.length === 0) {
      validatedCacheTagsRef.current.add(languageScopedTag);
      validatedCacheTagsRef.current.add(normalizedBaseTag);
      return true;
    }

    try {
      const response = await CacheTagsService.cacheTagsControllerGetCacheTags({});
      if (!response?.success) {
        validatedCacheTagsRef.current.add(languageScopedTag);
        validatedCacheTagsRef.current.add(normalizedBaseTag);
        return true;
      }

      const tagList = (response.cacheTags ?? []) as CacheTagSummaryDto[];
      const exists = tagList.some(
        (tag) => tag.name === languageScopedTag || tag.name === normalizedBaseTag
      );
      if (exists) {
        validatedCacheTagsRef.current.add(languageScopedTag);
        validatedCacheTagsRef.current.add(normalizedBaseTag);
        return true;
      }

      const shouldCreate = await new Promise<boolean>((resolve) => {
        openConfirmModal({
          title: t('cacheTag.createConfirmTitle'),
          message: t('cacheTag.createConfirm'),
          confirmText: t('cacheTag.createConfirmAction'),
          cancelText: t('common.cancel'),
          variant: 'warning',
          onConfirm: () => {
            resolve(true);
          },
          onCancel: () => {
            resolve(false);
          },
        });
      });

      if (!shouldCreate) {
        showSnackbar(t('cacheTag.createCancelled'));
        return false;
      }

      validatedCacheTagsRef.current.add(languageScopedTag);
      validatedCacheTagsRef.current.add(normalizedBaseTag);
      return true;
    } catch (error) {
      console.error('캐시 태그 검증 중 오류:', error);
      validatedCacheTagsRef.current.add(languageScopedTag);
      validatedCacheTagsRef.current.add(normalizedBaseTag);
      return true;
    }
  }, [cacheTag, sourceLanguage, targetLanguage, showSnackbar, openConfirmModal, t]);
};
