import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import { CategorizedFile } from '@apps/common/dist/types/temp-workspace';
import { Mode, PageItem } from './types';
import { ProgressiveImage } from './components/ProgressiveImage';
import { useImagePreloader } from './hooks/useImagePreloader';
import { useViewerHotkeys } from './hooks/useViewerHotkeys';
import { TextPanel } from './components/TextPanel';
import { TopBar } from './components/TopBar';
import { BottomTray } from './components/BottomTray';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useResizeObserver } from './hooks/useResizeObserver';
import { useFloatingPanel, resetFloatingPanels } from './hooks/useFloatingPanel';
import type { ResizeDir } from './hooks/useFloatingPanel';
import type { SxProps, Theme } from '@mui/material';
import { useViewerPreferencesStore } from './state/viewerPreferences.store';
import { TempWorkspacesService } from '@/react/api/generated';
import { ipcClient } from '@/react/ipc/ipcClient';
import { IpcChannel } from '@apps/common/dist/ipc/ipc-channel';

const AdvancedImageViewer: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('applied');
  const [pages, setPages] = useState<PageItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [trayVisible, setTrayVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(true);
  const textFontSize = useViewerPreferencesStore((state) => state.textFontSize);
  const textBgOpacity = useViewerPreferencesStore((state) => state.textBgOpacity);
  const setTextFontSize = useViewerPreferencesStore((state) => state.setTextFontSize);
  const setTextBgOpacity = useViewerPreferencesStore((state) => state.setTextBgOpacity);

  const { preloadImage } = useImagePreloader();

  const preloadAdjacentImages = useCallback(() => {
    if (pages.length === 0) return;
    const urls: string[] = [];
    for (let o = -2; o <= 2; o++) {
      const t = idx + o;
      if (t >= 0 && t < pages.length) {
        const page = pages[t];
        const u = mode === 'applied' ? page.appliedUrl || page.originalUrl : page.originalUrl;
        if (u) urls.push(u);
      }
    }
    const sched = (cb: () => void) => {
      interface IdleCapable {
        requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => void;
      }
      const g = globalThis as unknown as IdleCapable;
      if (g.requestIdleCallback) g.requestIdleCallback(cb, { timeout: 1200 });
      else setTimeout(cb, 0);
    };
    urls.forEach((u) => sched(() => preloadImage(u).catch(() => {})));
  }, [pages, idx, mode, preloadImage]);
  useEffect(() => {
    const t = setTimeout(preloadAdjacentImages, 100);
    return () => clearTimeout(t);
  }, [preloadAdjacentImages]);

  useViewerHotkeys({
    pages,
    mode,
    setMode,
    setIdx,
    setTrayVisible,
    preloadImage,
    toggleHelp: () => setHelpOpen((v) => !v),
    resetPanels: () => resetFloatingPanels(),
  });

  const buildPagesFromCategorizedFiles = useCallback(
    (categorizedFiles: CategorizedFile[]) => {
      setIsLoading(true);
      setLoadingMessage(t('advancedImageViewer.configuringFiles'));
      const newPages: PageItem[] = categorizedFiles.map((file) => ({
        key: file.key,
        originalUrl: file.original ? `file://${file.original}` : null,
        appliedUrl: file.applied ? `file://${file.applied}` : null,
        texts: (file.texts || []).map((t) => t.replaceAll('\n', ' ')),
      }));
      setPages(newPages);
      setIdx(0);
      setIsLoading(false);
      setLoadingMessage('');
    },
    [t]
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = ipcClient.subscribe(IpcChannel.AdvancedViewerLoadZip, (payload) => {
        if (!payload || typeof payload !== 'object') {
          return;
        }
        const typedPayload = payload as {
          workspaceId?: string;
          categorizedFiles?: CategorizedFile[];
        };
        if (typedPayload.workspaceId && Array.isArray(typedPayload.categorizedFiles)) {
          setWorkspaceId(typedPayload.workspaceId);
          buildPagesFromCategorizedFiles(typedPayload.categorizedFiles);
        }
      });
    } catch (error) {
      console.warn('AdvancedViewerLoadZip 구독 중 오류가 발생했습니다.', error);
    }

    return () => {
      unsubscribe?.();
    };
  }, [buildPagesFromCategorizedFiles]);

  useEffect(() => {
    return () => {
      if (workspaceId) {
        void TempWorkspacesService.tempWorkspaceControllerDeleteTempWorkspace({
          workspaceId,
        }).catch((error) => console.error('임시 작업공간 정리 중 오류가 발생했습니다.', error));
      }
    };
  }, [workspaceId]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { ref: resizeRef } = useResizeObserver<HTMLDivElement>();

  const content = useMemo(() => {
    const p = pages[idx];
    if (!p) return null;
    if (mode === 'applied') {
      const src = p.appliedUrl || p.originalUrl;
      if (!src) return null;
      return (
        <ProgressiveImage
          src={src}
          alt={`page-${idx + 1}`}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          preloadImage={preloadImage}
        />
      );
    }
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {p.originalUrl ? (
            <ProgressiveImage
              src={p.originalUrl}
              alt={`original-${idx + 1}`}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              preloadImage={preloadImage}
            />
          ) : null}
        </Box>
        <FloatingTextPanel texts={p.texts} fontSizeRem={textFontSize} bgOpacity={textBgOpacity} />
      </Box>
    );
  }, [pages, idx, mode, preloadImage, textFontSize, textBgOpacity]);

  return (
    <ErrorBoundary>
      <Box
        ref={useCallback(
          (node: HTMLDivElement | null) => {
            if (containerRef.current === node) return;
            containerRef.current = node;
            resizeRef(node);
          },
          [resizeRef]
        )}
        sx={{ position: 'fixed', inset: 0, bgcolor: 'black', color: 'white', overflow: 'hidden' }}
      >
        <TopBar
          pagesLength={pages.length}
          idx={idx}
          mode={mode}
          helpOpen={helpOpen}
          onToggleHelp={() => setHelpOpen((v) => !v)}
          textFontSize={textFontSize}
          textBgOpacity={textBgOpacity}
          onChangeFontSize={setTextFontSize}
          onChangeBgOpacity={setTextBgOpacity}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {pages.length === 0 ? (
            isLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  color: 'rgba(255,255,255,0.9)',
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTop: '3px solid #90caf9',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                <Typography variant="body1">
                  {loadingMessage || t('advancedImageViewer.loading')}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  border: '1px dashed rgba(255,255,255,0.3)',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {t('advancedImageViewer.waitingForData')}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {t('advancedImageViewer.openFromMain')}
                </Typography>
              </Box>
            )
          ) : (
            content
          )}
        </Box>
        <BottomTray
          visible={trayVisible}
          pages={pages}
          idx={idx}
          onChangeIndex={useCallback((i: number) => setIdx(i), [])}
        />
      </Box>
    </ErrorBoundary>
  );
};

export default AdvancedImageViewer;

const FloatingTextPanel: React.FC<{ texts: string[]; fontSizeRem: number; bgOpacity: number }> = ({
  texts,
  fontSizeRem,
  bgOpacity,
}) => {
  const { state, bindDrag, getResizeBind } = useFloatingPanel({
    key: 'floating-text-panel',
    initial: { x: 0, y: 0, w: 380, h: 320 },
  });
  interface HandleDef {
    dir: ResizeDir;
    sx: SxProps<Theme>;
  }
  const handles: HandleDef[] = [
    {
      dir: 'e',
      sx: {
        top: '50%',
        right: 0,
        transform: 'translateY(-50%)',
        cursor: 'ew-resize',
        width: 8,
        height: '40%',
      },
    },
    {
      dir: 'w',
      sx: {
        top: '50%',
        left: 0,
        transform: 'translateY(-50%)',
        cursor: 'ew-resize',
        width: 8,
        height: '40%',
      },
    },
    {
      dir: 's',
      sx: {
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        cursor: 'ns-resize',
        width: '40%',
        height: 8,
      },
    },
    {
      dir: 'n',
      sx: {
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        cursor: 'ns-resize',
        width: '40%',
        height: 8,
      },
    },
    {
      dir: 'se',
      sx: { right: 0, bottom: 0, width: 14, height: 14, cursor: 'nwse-resize' },
    },
    {
      dir: 'ne',
      sx: { right: 0, top: 0, width: 14, height: 14, cursor: 'nesw-resize' },
    },
    {
      dir: 'sw',
      sx: { left: 0, bottom: 0, width: 14, height: 14, cursor: 'nesw-resize' },
    },
    {
      dir: 'nw',
      sx: { left: 0, top: 0, width: 14, height: 14, cursor: 'nwse-resize' },
    },
  ];
  return (
    <Box
      sx={{
        position: 'absolute',
        top: `calc(50% + ${state.y}px)`,
        left: `calc(50% + ${state.x}px)`,
        transform: 'translate(-50%, -50%)',
        width: state.w,
        height: state.h,
        maxWidth: 720,
        cursor: 'move',
      }}
      {...bindDrag}
    >
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <TextPanel texts={texts} width={state.w} fontSizeRem={fontSizeRem} bgOpacity={bgOpacity} />
        {handles.map((h) => (
          <Box
            key={h.dir}
            sx={{ position: 'absolute', opacity: 0.6, ...h.sx }}
            {...getResizeBind(h.dir)}
          />
        ))}
      </Box>
    </Box>
  );
};
