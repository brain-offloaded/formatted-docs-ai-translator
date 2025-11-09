import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageItem } from '../types';
import { THUMB_W, THUMB_H, THUMB_GAP } from '../constants';
import { useResizeObserver } from '../hooks/useResizeObserver';

export interface VirtualThumbListProps {
  pages: PageItem[];
  currentIndex: number;
  visible: boolean;
  active: boolean; // 이미지 로드를 지연/중지하는 스위치
  onSelect: (i: number) => void;
  overscan?: number; // 양 옆으로 추가로 그릴 아이템 수
}

const VirtualThumbListInner: React.FC<VirtualThumbListProps> = ({
  pages,
  currentIndex,
  visible,
  active,
  onSelect,
  overscan,
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const { ref: sizeRef, size } = useResizeObserver<HTMLDivElement>();
  const [range, setRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  const itemSpan = THUMB_W + THUMB_GAP;
  const overscanCount = typeof overscan === 'number' && overscan >= 0 ? overscan : 12;
  const recalcRange = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const viewportW = el.clientWidth;
    const scrollLeft = el.scrollLeft;
    const perView = Math.max(1, Math.ceil(viewportW / itemSpan));
    const start = Math.max(0, Math.floor(scrollLeft / itemSpan) - overscanCount);
    const end = Math.min(pages.length - 1, start + perView + overscanCount * 2);
    setRange({ start, end });
  }, [pages.length, itemSpan, overscanCount]);

  useEffect(() => {
    recalcRange();
  }, [recalcRange, visible, pages.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => recalcRange();
    el.addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions);
    // attach ResizeObserver
    sizeRef(el);
    return () => {
      el.removeEventListener('scroll', onScroll as unknown as EventListener);
      sizeRef(null);
    };
  }, [recalcRange, sizeRef]);

  useEffect(() => {
    if (size) recalcRange();
  }, [size, recalcRange]);

  useEffect(() => {
    if (!visible) return;
    const el = listRef.current;
    if (!el) return;
    if (range.start === 0 && range.end === 0) {
      const targetLeft = Math.max(0, currentIndex * itemSpan - (el.clientWidth - THUMB_W) / 2);
      el.scrollTo({ left: targetLeft, behavior: 'auto' });
      setTimeout(recalcRange, 0);
    }
  }, [visible, currentIndex, recalcRange, range.start, range.end, itemSpan]);

  // also keep active item roughly centered when currentIndex changes
  useEffect(() => {
    if (!visible) return;
    const el = listRef.current;
    if (!el) return;
    const targetLeft = Math.max(0, currentIndex * itemSpan - (el.clientWidth - THUMB_W) / 2);
    el.scrollTo({ left: targetLeft, behavior: 'smooth' });
  }, [currentIndex, visible, itemSpan]);

  const leftPad = range.start * itemSpan;
  const renderedCount = Math.max(0, range.end - range.start + 1);
  const totalWidth = pages.length * itemSpan;
  const centerWidth = renderedCount * itemSpan;
  const rightPad = Math.max(0, totalWidth - leftPad - centerWidth);

  // Lightweight thumbnail pipeline using createImageBitmap + canvas (with caching)
  // Fallback to <img> if browser APIs fail.
  const DPR =
    typeof window !== 'undefined' ? Math.max(1, Math.min(2, window.devicePixelRatio || 1)) : 1;
  type ThumbCacheEntry = { bmp: ImageBitmap; w: number; h: number };
  const thumbBitmapCacheRef = useRef<Map<string, ThumbCacheEntry>>(new Map());
  const inflightRef = useRef<Map<string, Promise<ThumbCacheEntry>>>(new Map());

  // Lazy singleton inline worker (Blob URL) for http(s) thumbnails
  const workerRef = useRef<Worker | null>(null);
  const workerMsgId = useRef(1);
  const workerPending = useRef<
    Map<number, { resolve: (v: ThumbCacheEntry) => void; reject: (e: unknown) => void }>
  >(new Map());

  const ensureWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!('Worker' in window)) return null;
    if (workerRef.current) return workerRef.current;
    const code = `self.onmessage = async (e) => {\n  const d = e.data || {};\n  const id = d.id;\n  const src = d.src;\n  const w = d.width|0;\n  const h = d.height|0;\n  try {\n    if (typeof src !== 'string' || !w || !h) throw new Error('BAD_REQ');\n    if (src.startsWith('file:')) throw new Error('UNSUPPORTED_PROTOCOL');\n    const resp = await fetch(src);\n    const blob = await resp.blob();\n    let bitmap;\n    try {\n      bitmap = await createImageBitmap(blob, { resizeWidth: Math.max(1, w), resizeHeight: Math.max(1, h), resizeQuality: 'high' });\n    } catch (err) {\n      const tmp = await createImageBitmap(blob);\n      const W = Math.max(1, w);\n      const H = Math.max(1, h);\n      const off = new OffscreenCanvas(W, H);\n      const ctx = off.getContext('2d');\n      if (ctx) {\n        const scale = Math.max(W / tmp.width, H / tmp.height);\n        const dw = Math.floor(tmp.width * scale);\n        const dh = Math.floor(tmp.height * scale);\n        const dx = Math.floor((W - dw) / 2);\n        const dy = Math.floor((H - dh) / 2);\n        ctx.clearRect(0,0,W,H);\n        ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, dx, dy, dw, dh);\n        bitmap = await off.transferToImageBitmap();\n      } else {\n        bitmap = tmp;\n      }\n    }\n    self.postMessage({ id, ok: true, width: w, height: h, bitmap }, [bitmap]);\n  } catch (e) {\n    self.postMessage({ id, ok: false, error: (e && e.message) || String(e) });\n  }\n};`;
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const wkr = new Worker(url);
    URL.revokeObjectURL(url); // revocation is safe after construction
    wkr.onmessage = (ev: MessageEvent) => {
      const { id, ok, error, bitmap, width, height } = ev.data || {};
      const pending = workerPending.current.get(id);
      if (!pending) {
        if (bitmap && typeof (bitmap as ImageBitmap).close === 'function') {
          try {
            (bitmap as ImageBitmap).close();
          } catch {
            // ignore
          }
        }
        return;
      }
      workerPending.current.delete(id);
      if (ok && bitmap) {
        pending.resolve({ bmp: bitmap as ImageBitmap, w: width, h: height });
      } else {
        pending.reject(new Error(error || 'WorkerError'));
      }
    };
    workerRef.current = wkr;
    return wkr;
  }, []);

  const loadViaWorker = useCallback(
    async (src: string, targetW: number, targetH: number): Promise<ThumbCacheEntry> => {
      const wkr = ensureWorker();
      if (!wkr) throw new Error('NoWorker');
      const id = workerMsgId.current++;
      const p = new Promise<ThumbCacheEntry>((resolve, reject) => {
        workerPending.current.set(id, { resolve, reject });
      });
      wkr.postMessage({ id, src, width: targetW, height: targetH });
      return p;
    },
    [ensureWorker]
  );

  const evictIfNeeded = useCallback(() => {
    const cache = thumbBitmapCacheRef.current;
    const MAX = 500; // up to ~500 thumbs (500 * 56x72x4 bytes ~= 8MB as bitmaps)
    if (cache.size > MAX) {
      const toDelete = cache.size - MAX;
      let i = 0;
      for (const [k, v] of cache.entries()) {
        v.bmp.close();
        cache.delete(k);
        if (++i >= toDelete) break;
      }
    }
  }, []);

  const loadThumbBitmap = useCallback(
    async (src: string): Promise<ThumbCacheEntry> => {
      const cached = thumbBitmapCacheRef.current.get(src);
      if (cached) return cached;
      const inflight = inflightRef.current.get(src);
      if (inflight) return inflight;

      const promise: Promise<ThumbCacheEntry> = (async () => {
        const targetW = Math.max(1, Math.floor(THUMB_W * DPR));
        const targetH = Math.max(1, Math.floor(THUMB_H * DPR));
        // Try worker for http(s)
        if (!src.startsWith('file:')) {
          try {
            const entry = await loadViaWorker(src, targetW, targetH);
            thumbBitmapCacheRef.current.set(src, entry);
            evictIfNeeded();
            return entry;
          } catch {
            // ignore and fall back below
          }
        }
        // Fallback: load <img> then draw to bitmap via canvas
        const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.decoding = 'async';
          img.loading = 'eager';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('thumb img error'));
          img.src = src;
        });
        // Use OffscreenCanvas if available, else regular canvas
        let off: OffscreenCanvas | undefined = undefined;
        if (typeof OffscreenCanvas !== 'undefined') {
          off = new OffscreenCanvas(targetW, targetH);
        }
        if (off) {
          const ctx = off.getContext('2d');
          if (!ctx) throw new Error('No 2d');
          // drawImage with object-fit: cover equivalent
          const iw = imgEl.naturalWidth || imgEl.width;
          const ih = imgEl.naturalHeight || imgEl.height;
          const scale = Math.max(targetW / iw, targetH / ih);
          const dw = Math.floor(iw * scale);
          const dh = Math.floor(ih * scale);
          const dx = Math.floor((targetW - dw) / 2);
          const dy = Math.floor((targetH - dh) / 2);
          ctx.clearRect(0, 0, targetW, targetH);
          ctx.drawImage(imgEl, 0, 0, iw, ih, dx, dy, dw, dh);
          const bmp = await off.transferToImageBitmap();
          const entry = { bmp, w: targetW, h: targetH };
          thumbBitmapCacheRef.current.set(src, entry);
          evictIfNeeded();
          return entry;
        } else {
          // Last resort: create bitmap via in-DOM canvas
          const cvs = document.createElement('canvas');
          cvs.width = targetW;
          cvs.height = targetH;
          const ctx = cvs.getContext('2d');
          if (!ctx) throw new Error('No 2d');
          const iw = imgEl.naturalWidth || imgEl.width;
          const ih = imgEl.naturalHeight || imgEl.height;
          const scale = Math.max(targetW / iw, targetH / ih);
          const dw = Math.floor(iw * scale);
          const dh = Math.floor(ih * scale);
          const dx = Math.floor((targetW - dw) / 2);
          const dy = Math.floor((targetH - dh) / 2);
          ctx.clearRect(0, 0, targetW, targetH);
          ctx.drawImage(imgEl, 0, 0, iw, ih, dx, dy, dw, dh);
          const bmp = await createImageBitmap(cvs);
          const entry = { bmp, w: targetW, h: targetH };
          thumbBitmapCacheRef.current.set(src, entry);
          evictIfNeeded();
          return entry;
        }
      })();

      inflightRef.current.set(src, promise);
      try {
        const res = await promise;
        return res;
      } finally {
        inflightRef.current.delete(src);
      }
    },
    [DPR, evictIfNeeded, loadViaWorker]
  );

  // cleanup cached bitmaps on unmount to avoid memory leaks
  useEffect(() => {
    const cache = thumbBitmapCacheRef.current;
    const inflight = inflightRef.current;
    return () => {
      for (const [, v] of cache) {
        try {
          v.bmp.close();
        } catch {
          // ignore
        }
      }
      cache.clear();
      inflight.clear();
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const ThumbCanvas: React.FC<{ src: string; alt: string; style?: React.CSSProperties }> = ({
    src,
    alt,
    style,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const holderRef = useRef<HTMLDivElement | null>(null);
    const [assigned, setAssigned] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [fallback, setFallback] = useState(false);
    const activeRef = useRef(active);
    activeRef.current = active;

    useEffect(() => {
      const root = listRef.current;
      const el = holderRef.current;
      if (!root || !el || typeof IntersectionObserver === 'undefined') {
        setAssigned(true);
        return;
      }
      let stopped = false;
      const maybeAssign = () => {
        if (!stopped && activeRef.current) setAssigned(true);
      };
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) requestAnimationFrame(maybeAssign);
          }
        },
        { root, rootMargin: '500px 80px', threshold: 0.01 }
      );
      io.observe(el);
      return () => {
        stopped = true;
        io.disconnect();
      };
    }, [src]);

    useEffect(() => {
      if (!assigned || !src) return;
      let cancelled = false;
      (async () => {
        try {
          const entry = await loadThumbBitmap(src);
          if (cancelled) return;
          const cvs = canvasRef.current;
          if (!cvs) return;
          // set backing size (DPR) and CSS size
          cvs.width = entry.w;
          cvs.height = entry.h;
          cvs.style.width = `${THUMB_W}px`;
          cvs.style.height = `${THUMB_H}px`;
          const ctx = cvs.getContext('2d');
          if (!ctx) throw new Error('No ctx');
          ctx.clearRect(0, 0, entry.w, entry.h);
          ctx.drawImage(entry.bmp, 0, 0, entry.w, entry.h);
          setLoaded(true);
        } catch {
          if (!cancelled) setFallback(true);
        }
      })();
      return () => {
        cancelled = true;
      };
      // loadThumbBitmap is stable; ignore exhaustive-deps for this effect
    }, [assigned, src]);

    if (fallback) {
      // Safe fallback to <img> path
      return (
        <img
          src={assigned ? src : undefined}
          alt={alt}
          decoding="async"
          loading="lazy"
          data-fetch-priority="low"
          style={{
            ...style,
            width: THUMB_W,
            height: THUMB_H,
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0.001,
            transition: 'opacity 120ms ease-out',
            background: 'rgba(255,255,255,0.06)',
          }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setAssigned(false);
            setLoaded(false);
          }}
        />
      );
    }

    return (
      <div ref={holderRef} style={{ width: THUMB_W, height: THUMB_H }}>
        <canvas
          ref={canvasRef}
          aria-label={alt}
          style={{
            ...style,
            display: 'block',
            width: THUMB_W,
            height: THUMB_H,
            opacity: loaded ? 1 : 0.001,
            transition: 'opacity 120ms ease-out',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
      </div>
    );
  };

  const items = useMemo(
    () => pages.slice(range.start, range.end + 1),
    [pages, range.end, range.start]
  );

  const attachRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (listRef.current === node) return;
      listRef.current = node;
      sizeRef(node);
    },
    [sizeRef]
  );

  return (
    <div
      ref={attachRef}
      style={{
        marginTop: 4,
        display: 'flex',
        overflowX: 'auto',
        maxWidth: '100%',
        paddingBottom: 8,
        scrollbarGutter: 'stable both-edges',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'auto',
      }}
    >
      <div style={{ flex: '0 0 auto', width: leftPad }} />
      <div style={{ display: 'flex', gap: `${THUMB_GAP}px` }}>
        {items.map((p, rel) => {
          const i = range.start + rel;
          const src = p.originalUrl;
          const isActive = i === currentIndex;
          const border = isActive ? '2px solid #90caf9' : '1px solid rgba(255,255,255,0.25)';
          return (
            <div
              key={p.key}
              onClick={() => onSelect(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(i);
              }}
              style={{
                borderRadius: 4,
                border,
                overflow: 'hidden',
                cursor: 'pointer',
                backgroundColor: 'rgba(0,0,0,0.3)',
                flex: '0 0 auto',
                width: THUMB_W,
              }}
              title={`${i + 1}`}
            >
              {src ? (
                <ThumbCanvas src={src} alt={`thumb-${i + 1}`} />
              ) : (
                <div
                  style={{
                    height: THUMB_H,
                    width: THUMB_W,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  N/A
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ flex: '0 0 auto', width: rightPad }} />
    </div>
  );
};

export const VirtualThumbList = React.memo(VirtualThumbListInner);
VirtualThumbList.displayName = 'VirtualThumbList';
