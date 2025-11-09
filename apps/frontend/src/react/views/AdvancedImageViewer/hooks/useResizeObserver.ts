import { useCallback, useEffect, useRef, useState } from 'react';

type ResizeObserverRef<T extends HTMLElement> = (node: T | null) => void;

export function useResizeObserver<T extends HTMLElement>() {
  const [entry, setEntry] = useState<{ width: number; height: number } | null>(null);
  const nodeRef = useRef<T | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const fallbackListenerRef = useRef<(() => void) | null>(null);

  const detach = useCallback(() => {
    if (roRef.current && nodeRef.current) {
      try {
        roRef.current.unobserve(nodeRef.current);
      } catch {
        // ignore observer detach errors
      }
      roRef.current.disconnect();
    }
    roRef.current = null;
    if (fallbackListenerRef.current) {
      fallbackListenerRef.current();
      fallbackListenerRef.current = null;
    }
  }, []);

  const ref = useCallback<ResizeObserverRef<T>>(
    (node: T | null) => {
      if (nodeRef.current === node) return;
      // detach previous
      detach();
      nodeRef.current = node;
      if (!node) return;

      const update = () =>
        setEntry((prev) => {
          const width = node.clientWidth;
          const height = node.clientHeight;
          if (prev && prev.width === width && prev.height === height) return prev;
          return { width, height };
        });
      update();
      if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
        const ro = new (window as Window & typeof globalThis).ResizeObserver(() => update());
        roRef.current = ro;
        ro.observe(node);
      } else if (typeof window !== 'undefined') {
        const onResize = () => update();
        (window as Window & typeof globalThis).addEventListener('resize', onResize);
        fallbackListenerRef.current = () =>
          (window as Window & typeof globalThis).removeEventListener('resize', onResize);
      }
    },
    [detach]
  );

  useEffect(() => () => detach(), [detach]);

  return { ref, size: entry } as const;
}
