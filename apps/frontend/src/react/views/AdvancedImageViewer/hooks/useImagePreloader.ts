import { useCallback, useRef, useState } from 'react';
import { ImageLoadState } from '../types';

// LRU 캐시 크기: 동시에 표시/인접 프리로드를 고려해 16장 유지
const MAX_CACHE = 16;

export function useImagePreloader() {
  const [imageLoadStates, setImageLoadStates] = useState<Map<string, ImageLoadState>>(new Map());
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const inflightRef = useRef<Map<string, Promise<HTMLImageElement>>>(new Map());

  const updateImageLoadState = useCallback((url: string, state: Partial<ImageLoadState>) => {
    setImageLoadStates((prev) => {
      const next = new Map(prev);
      const existing = next.get(url) || { isLoading: false, hasError: false, progress: 0 };
      next.set(url, { ...existing, ...state });
      return next;
    });
  }, []);

  const touchLru = useCallback((url: string) => {
    const cache = cacheRef.current;
    const img = cache.get(url);
    if (!img) return;
    cache.delete(url);
    cache.set(url, img);
  }, []);

  const evictIfNeeded = useCallback(() => {
    const cache = cacheRef.current;
    while (cache.size > MAX_CACHE) {
      const firstKey = cache.keys().next().value as string | undefined;
      if (!firstKey) break;
      cache.delete(firstKey);
    }
  }, []);

  const preloadImage = useCallback(
    (url: string): Promise<HTMLImageElement> => {
      if (!url) return Promise.reject(new Error('Invalid URL'));

      const cached = cacheRef.current.get(url);
      if (cached) {
        touchLru(url);
        return Promise.resolve(cached);
      }

      const inflight = inflightRef.current.get(url);
      if (inflight) return inflight;

      const p = new Promise<HTMLImageElement>((resolve, reject) => {
        updateImageLoadState(url, { isLoading: true, hasError: false });

        const img = new Image();
        // 빠른 디코딩/표시를 위해 eager + async decoding
        img.loading = 'eager';
        // HTMLImageElement.decoding is a string union; 'async' is valid in modern browsers.
        // Cast via unknown to avoid older TS lib mismatch.
        (img as unknown as { decoding?: 'sync' | 'async' | 'auto' }).decoding = 'async';

        const cleanup = () => {
          img.onload = null;
          img.onerror = null;
        };

        img.onload = () => {
          // 디코드를 기다리지 않고 즉시 해제하여 체감 속도 개선
          // 브라우저는 decoding="async" 힌트를 바탕으로 백그라운드 디코딩을 수행
          cacheRef.current.set(url, img);
          evictIfNeeded();
          touchLru(url);
          updateImageLoadState(url, { isLoading: false, hasError: false, progress: 100 });
          cleanup();
          // 디코드는 비동기 힌트로 위임
          try {
            if ('decode' in img && typeof (img as HTMLImageElement).decode === 'function') {
              (img as HTMLImageElement).decode().catch(() => undefined);
            }
          } catch {
            // ignore optional decode errors
          }
          resolve(img);
        };
        img.onerror = () => {
          updateImageLoadState(url, { isLoading: false, hasError: true, progress: 0 });
          cleanup();
          reject(new Error(`Failed to load image: ${url}`));
        };
        img.src = url;
      }).finally(() => {
        inflightRef.current.delete(url);
      });

      inflightRef.current.set(url, p);
      return p;
    },
    [evictIfNeeded, touchLru, updateImageLoadState]
  );

  return { imageLoadStates, preloadImage } as const;
}
