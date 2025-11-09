import { normalizeCacheTag } from '@apps/common/dist/utils/cache-tag';

export const CACHE_KEY_SEPARATOR = '__@CACHE_TAG_SEPARATOR@__';

export const buildMemoryCacheKey = (source: string, cacheTag: string): string =>
  `${normalizeCacheTag(cacheTag)}${CACHE_KEY_SEPARATOR}${source}`;
