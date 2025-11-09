import { useCallback, useEffect, useRef, useState } from 'react';
import { TRAY_AUTO_SHOW_ZONE } from '../constants';

export function useAutoHideUI() {
  const [uiVisible, setUiVisible] = useState(false);
  const uiVisibleRef = useRef(false);
  const hideTimer = useRef<number | null>(null);
  const [trayVisible, setTrayVisible] = useState(false);
  const trayHideTimer = useRef<number | null>(null);

  const resetHideUi = useCallback(() => {
    if (!uiVisibleRef.current) setUiVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setUiVisible(false), 1800);
  }, []);

  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        resetHideUi();
        const fromBottom = window.innerHeight - e.clientY;
        if (fromBottom <= TRAY_AUTO_SHOW_ZONE) {
          setTrayVisible(true);
          if (trayHideTimer.current) window.clearTimeout(trayHideTimer.current);
          trayHideTimer.current = window.setTimeout(() => setTrayVisible(false), 1800);
        }
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, [resetHideUi]);

  useEffect(() => {
    uiVisibleRef.current = uiVisible;
  }, [uiVisible]);

  return { uiVisible, trayVisible, setTrayVisible, trayHideTimer, resetHideUi } as const;
}
