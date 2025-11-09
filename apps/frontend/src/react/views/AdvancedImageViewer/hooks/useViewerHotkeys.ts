import { useEffect, startTransition } from 'react';
import { Mode, PageItem } from '../types';

export interface UseViewerHotkeysParams {
  pages: PageItem[];
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  setIdx: React.Dispatch<React.SetStateAction<number>>;
  setTrayVisible: React.Dispatch<React.SetStateAction<boolean>>;
  preloadImage: (url: string) => Promise<HTMLImageElement>;
  toggleHelp?: () => void; // 단축키 도움말 토글 (선택)
  resetPanels?: () => void; // 플로팅 패널 리셋
}

export function useViewerHotkeys({
  pages,
  mode,
  setMode,
  setIdx,
  setTrayVisible,
  preloadImage,
  toggleHelp,
  resetPanels,
}: UseViewerHotkeysParams) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pages.length === 0) return;
      if (e.key === 'ArrowRight') {
        setIdx((i: number) => {
          const nextIdx = Math.min(pages.length - 1, i + 1);
          if (nextIdx < pages.length - 1) {
            const nextPage = pages[nextIdx + 1];
            const nextUrl =
              mode === 'applied'
                ? nextPage.appliedUrl || nextPage.originalUrl
                : nextPage.originalUrl;
            if (nextUrl) preloadImage(nextUrl).catch(() => {});
          }
          return nextIdx;
        });
      } else if (e.key === 'ArrowLeft') {
        setIdx((i: number) => {
          const prevIdx = Math.max(0, i - 1);
          if (prevIdx > 0) {
            const prevPage = pages[prevIdx - 1];
            const prevUrl =
              mode === 'applied'
                ? prevPage.appliedUrl || prevPage.originalUrl
                : prevPage.originalUrl;
            if (prevUrl) preloadImage(prevUrl).catch(() => {});
          }
          return prevIdx;
        });
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setMode((m: Mode) => (m === 'applied' ? 'original-text' : 'applied'));
      } else if (e.key.toLowerCase() === 'g') {
        startTransition(() => setTrayVisible((v) => !v));
      } else if (e.key.toLowerCase() === 'h') {
        // 도움말 토글
        if (typeof toggleHelp === 'function') toggleHelp();
      } else if (e.key.toLowerCase() === 'r') {
        if (typeof resetPanels === 'function') resetPanels();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pages, mode, setMode, setIdx, setTrayVisible, preloadImage, toggleHelp, resetPanels]);
}
