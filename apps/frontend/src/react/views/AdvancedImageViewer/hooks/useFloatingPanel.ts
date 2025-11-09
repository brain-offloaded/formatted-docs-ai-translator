import { useCallback, useRef, useState } from 'react';

export interface FloatingState {
  x: number; // left px
  y: number; // top px
  w: number; // width
  h: number; // height
}

export interface UseFloatingPanelOptions {
  initial: FloatingState;
  minW?: number;
  minH?: number;
  key?: string; // scope key (side / overlay 등)
}

export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface UseFloatingPanelResult {
  state: FloatingState;
  reset: () => void;
  bindDrag: { onMouseDown: (e: React.MouseEvent) => void };
  getResizeBind: (dir: ResizeDir) => { onMouseDown: (e: React.MouseEvent) => void };
  setState: (next: FloatingState) => void;
}

// 전역 상태를 key 별로 분리 (모드 구분)
const globalFloatingMap = new Map<string, FloatingState>();
const globalResetters = new Map<string, () => void>();

export function resetFloatingPanels() {
  globalFloatingMap.clear();
  globalResetters.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function useFloatingPanel(options: UseFloatingPanelOptions): UseFloatingPanelResult {
  const { initial, minW = 160, minH = 90, key = 'default' } = options;
  const [state, setState] = useState<FloatingState>(() => globalFloatingMap.get(key) || initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const dragRef = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    start: FloatingState;
    dir: ResizeDir;
  } | null>(null);

  const commit = useCallback(
    (next: FloatingState) => {
      globalFloatingMap.set(key, next);
      setState(next);
    },
    [key]
  );

  const reset = useCallback(() => {
    commit(initial);
  }, [commit, initial]);

  globalResetters.set(key, reset);

  const onMove = useCallback(
    (e: MouseEvent) => {
      if (dragRef.current) {
        const { x, y, sx, sy } = dragRef.current;
        const nx = sx + (e.clientX - x);
        const ny = sy + (e.clientY - y);
        commit({ ...stateRef.current, x: nx, y: ny });
      } else if (resizeRef.current) {
        const { startX, startY, start, dir } = resizeRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let { x, y, w, h } = start;

        const handleN = () => {
          const newH = Math.max(minH, start.h - dy);
          const delta = start.h - newH;
          y = start.y + delta / 2;
          h = newH;
        };
        const handleS = () => {
          const newH = Math.max(minH, start.h + dy);
          const delta = newH - start.h;
          y = start.y + delta / 2;
          h = newH;
        };
        const handleW = () => {
          const newW = Math.max(minW, start.w - dx);
          const delta = start.w - newW;
          x = start.x + delta / 2;
          w = newW;
        };
        const handleE = () => {
          const newW = Math.max(minW, start.w + dx);
          const delta = newW - start.w;
          x = start.x + delta / 2;
          w = newW;
        };

        switch (dir) {
          case 'n':
            handleN();
            break;
          case 's':
            handleS();
            break;
          case 'w':
            handleW();
            break;
          case 'e':
            handleE();
            break;
          case 'ne':
            handleN();
            handleE();
            break;
          case 'nw':
            handleN();
            handleW();
            break;
          case 'se':
            handleS();
            handleE();
            break;
          case 'sw':
            handleS();
            handleW();
            break;
        }
        commit({ x, y, w, h });
      }
    },
    [commit, minW, minH]
  );

  const onUp = useCallback(() => {
    dragRef.current = null;
    resizeRef.current = null;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }, [onMove]);

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        sx: stateRef.current.x,
        sy: stateRef.current.y,
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [onMove, onUp]
  );

  const startResize = useCallback(
    (e: React.MouseEvent, dir: ResizeDir) => {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = { startX: e.clientX, startY: e.clientY, start: stateRef.current, dir };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [onMove, onUp]
  );

  return {
    state,
    reset,
    bindDrag: { onMouseDown: startDrag },
    getResizeBind: (dir: ResizeDir) => ({
      onMouseDown: (e: React.MouseEvent) => startResize(e, dir),
    }),
    setState: commit,
  };
}
