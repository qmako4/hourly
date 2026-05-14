'use client';

import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type PillProps = {
  text: string;
  size?: 'focus' | 'list';
  onComplete?: () => void;
  onOpenDetail?: () => void;
  hasDetail?: boolean;
  layoutId?: string;
  blur?: number;
  opacity?: number;
  scale?: number;
  translateY?: number;
  /** When true, the pill is interactive (frontmost / list pill). */
  interactive?: boolean;
};

const STANDARD_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

export function Pill({
  text,
  size = 'focus',
  onComplete,
  onOpenDetail,
  hasDetail = false,
  layoutId,
  blur = 0,
  opacity = 1,
  scale = 1,
  translateY = 0,
  interactive = true,
}: PillProps) {
  const [completing, setCompleting] = useState(false);
  const controls = useAnimationControls();
  const fontSizePx = size === 'focus' ? 22 : 15.5;
  const struckRef = useRef(false);

  useEffect(() => {
    void controls.start({
      filter: `blur(${blur}px)`,
      opacity,
      scale,
      y: translateY,
      transition: { type: 'spring', stiffness: 100, damping: 18 },
    });
  }, [blur, opacity, scale, translateY, controls]);

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    // If the tap landed on the detail trigger (the … icon), open the sheet
    // and skip the complete animation.
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-detail-trigger]')) {
      e.preventDefault();
      e.stopPropagation();
      onOpenDetail?.();
      return;
    }
    if (!interactive || completing || !onComplete || struckRef.current) return;
    struckRef.current = true;
    setCompleting(true);
    // Strike line draws fully (~340ms), then hand off to the layoutId hero
    // animation, which morphs the pill into the completed pile.
    window.setTimeout(() => {
      onComplete();
    }, 380);
  };

  return (
    <motion.button
      type="button"
      data-task-pill
      layoutId={layoutId}
      layout
      onClick={handleTap}
      disabled={completing}
      animate={controls}
      initial={{
        filter: `blur(${blur}px)`,
        opacity,
        scale,
        y: translateY,
      }}
      whileTap={interactive && !completing ? { scale: scale * 0.98, opacity: opacity * 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 100, damping: 18 }}
      className="relative w-full select-none overflow-hidden rounded-full px-6 py-5 text-left"
      style={{
        backgroundColor: '#f3f3f3',
        color: '#0a0a0a',
        fontSize: fontSizePx,
        lineHeight: 1.25,
        fontWeight: 500,
        letterSpacing: '-0.01em',
        cursor: interactive ? 'pointer' : 'default',
      }}
      aria-label={interactive ? `Complete: ${text}` : text}
    >
      <motion.span
        className="relative inline-block whitespace-pre-wrap break-words text-center w-full"
        style={{ display: 'inline-block' }}
      >
        <span className="relative inline-block">
          {text}
          <motion.span
            aria-hidden
            className="absolute left-0 top-1/2 h-[1.5px] w-full origin-left -translate-y-1/2"
            style={{ backgroundColor: '#0a0a0a' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: completing ? 1 : 0 }}
            transition={{ duration: 0.34, ease: STANDARD_EASE }}
          />
        </span>
      </motion.span>

      {onOpenDetail && !completing && (
        <span
          data-detail-trigger
          role="button"
          aria-label={`Details for ${text}`}
          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center"
          style={{ pointerEvents: 'auto' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <circle cx="3.5" cy="9" r="1.1" fill={hasDetail ? '#0a0a0a' : '#999999'} />
            <circle cx="9" cy="9" r="1.1" fill={hasDetail ? '#0a0a0a' : '#999999'} />
            <circle cx="14.5" cy="9" r="1.1" fill={hasDetail ? '#0a0a0a' : '#999999'} />
          </svg>
        </span>
      )}
    </motion.button>
  );
}
