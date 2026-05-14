'use client';

import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Task } from '@/lib/types';
import { TumbleCount } from './TumbleCount';

type BinProps = {
  items: Task[];
  onRestore: (id: string) => void;
  onClear: () => void;
  /** Increments each time a new item enters the bin — triggers the wiggle. */
  wiggleKey: number;
};

export function Bin({ items, onRestore, onClear, wiggleKey }: BinProps) {
  const [open, setOpen] = useState(false);
  const iconControls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wiggleKey === 0) return;
    void iconControls.start({
      rotate: [0, -8, 6, 0],
      transition: { duration: 0.42, times: [0, 0.3, 0.7, 1], ease: [0.32, 0.72, 0, 1] },
    });
  }, [wiggleKey, iconControls]);

  useEffect(() => {
    if (!open) return;
    const handler = (ev: MouseEvent) => {
      const target = ev.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
        aria-label={`Bin (${items.length})`}
      >
        <motion.span animate={iconControls} className="inline-flex">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
              d="M3.5 5h11M7.5 3.5h3M5 5l.7 9a1.3 1.3 0 0 0 1.3 1.2h4a1.3 1.3 0 0 0 1.3-1.2L13 5"
              stroke="#0a0a0a"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.span>
        {items.length > 0 && <TumbleCount value={items.length} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="bin-popover"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="absolute bottom-10 left-0 z-40 w-[300px] origin-bottom-left rounded-2xl bg-white p-4"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)', maxHeight: 360 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>Completed</span>
              <button
                type="button"
                onClick={onClear}
                disabled={items.length === 0}
                className="disabled:opacity-30"
                style={{ fontSize: 12, color: '#0a0a0a' }}
              >
                Clear
              </button>
            </div>
            <div className="flex max-h-[240px] flex-col gap-1 overflow-y-auto pr-1">
              {items.length === 0 && (
                <span style={{ fontSize: 12.5, color: '#999' }}>nothing here.</span>
              )}
              {items.slice(0, 12).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                  style={{ backgroundColor: '#fafafa' }}
                >
                  <span
                    className="truncate"
                    style={{
                      fontSize: 13,
                      color: '#0a0a0a',
                      textDecoration: 'line-through',
                      textDecorationThickness: '1px',
                      opacity: 0.7,
                    }}
                  >
                    {t.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRestore(t.id)}
                    aria-label={`Restore ${t.text}`}
                    className="shrink-0 p-1"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path
                        d="M3 8a5 5 0 0 1 9-3M3 4v3.5h3.5"
                        stroke="#0a0a0a"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div
              className="mt-3 text-center uppercase"
              style={{ fontSize: 9.5, letterSpacing: '0.18em', color: '#999', fontWeight: 600 }}
            >
              auto-clears after a week
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
