'use client';

import { motion, type PanInfo, useAnimationControls } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { SPRING, STRIKE } from '@/lib/motion';

type PillProps = {
  text: string;
  size?: 'focus' | 'list';
  onComplete?: () => void;
  onOpenDetail?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  hasDetail?: boolean;
  layoutId?: string;
  blur?: number;
  opacity?: number;
  scale?: number;
  translateY?: number;
  /** When true, the pill is interactive (frontmost / list pill). */
  interactive?: boolean;
};

const SWIPE_DISTANCE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

export function Pill({
  text,
  size = 'focus',
  onComplete,
  onOpenDetail,
  onSwipeLeft,
  onSwipeRight,
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
  const swipedRef = useRef(false);
  const draggable = Boolean(onSwipeLeft || onSwipeRight);

  useEffect(() => {
    void controls.start({
      filter: `blur(${blur}px)`,
      opacity,
      scale,
      y: translateY,
      transition: SPRING,
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
    // Just flip state — the actual onComplete fires from the strike line's
    // onAnimationComplete so the hand-off stays in lockstep with what's on
    // screen (no fixed timer that can desync on a frame hitch).
    setCompleting(true);
  };

  const handleStrikeComplete = () => {
    if (struckRef.current && completing) {
      onComplete?.();
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (swipedRef.current) return;
    const { x } = info.offset;
    const vx = info.velocity.x;
    if (x > SWIPE_DISTANCE_THRESHOLD || vx > SWIPE_VELOCITY_THRESHOLD) {
      swipedRef.current = true;
      onSwipeRight?.();
    } else if (x < -SWIPE_DISTANCE_THRESHOLD || vx < -SWIPE_VELOCITY_THRESHOLD) {
      swipedRef.current = true;
      onSwipeLeft?.();
    }
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
      transition={SPRING}
      drag={draggable && !completing ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.55}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
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
            transition={STRIKE}
            onAnimationComplete={handleStrikeComplete}
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
