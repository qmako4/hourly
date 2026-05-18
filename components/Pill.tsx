'use client';

import { motion, type PanInfo, useAnimationControls } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { SPRING, STRIKE } from '@/lib/motion';
import { buzz } from '@/lib/haptics';

type PillProps = {
  /** Display text (time phrase already stripped). */
  text: string;
  /** Full, unmodified text — what the inline editor starts from. */
  rawText?: string;
  /** Compact deadline chip, e.g. "12pm". */
  timeLabel?: string | null;
  recurring?: boolean;
  size?: 'focus' | 'list';
  onComplete?: () => void;
  onOpenDetail?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onEditText?: (next: string) => void;
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
const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;

export function Pill({
  text,
  rawText,
  timeLabel,
  recurring = false,
  size = 'focus',
  onComplete,
  onOpenDetail,
  onSwipeLeft,
  onSwipeRight,
  onEditText,
  hasDetail = false,
  layoutId,
  blur = 0,
  opacity = 1,
  scale = 1,
  translateY = 0,
  interactive = true,
}: PillProps) {
  const [completing, setCompleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const controls = useAnimationControls();
  const fontSizePx = size === 'focus' ? 22 : 15.5;
  const struckRef = useRef(false);
  const swipedRef = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const draggable = Boolean(onSwipeLeft || onSwipeRight);
  const canEdit = Boolean(onEditText) && interactive && !completing;

  useEffect(() => {
    void controls.start({
      filter: `blur(${blur}px)`,
      opacity,
      scale,
      y: translateY,
      transition: SPRING,
    });
  }, [blur, opacity, scale, translateY, controls]);

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing]);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const enterEdit = () => {
    setDraft(rawText ?? text);
    setEditing(true);
  };

  const commitEdit = () => {
    if (!editing) return;
    const next = draft.trim();
    setEditing(false);
    if (next && next !== (rawText ?? text)) onEditText?.(next);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canEdit || editing) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    longPressedRef.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressedRef.current = true;
      buzz(12);
      enterEdit();
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = pointerStart.current;
    if (!s) return;
    if (Math.abs(e.clientX - s.x) > MOVE_CANCEL_PX || Math.abs(e.clientY - s.y) > MOVE_CANCEL_PX) {
      clearLongPress();
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    clearLongPress();
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-detail-trigger]')) {
      e.preventDefault();
      e.stopPropagation();
      onOpenDetail?.();
      return;
    }
    if (editing) return;
    if (!interactive || completing || !onComplete || struckRef.current) return;
    struckRef.current = true;
    buzz(10);
    // onComplete fires from the strike line's onAnimationComplete so the
    // hand-off stays in lockstep with what's on screen.
    setCompleting(true);
  };

  const handleStrikeComplete = () => {
    if (struckRef.current && completing) {
      onComplete?.();
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    clearLongPress();
    if (swipedRef.current) return;
    const { x } = info.offset;
    const vx = info.velocity.x;
    if (x > SWIPE_DISTANCE_THRESHOLD || vx > SWIPE_VELOCITY_THRESHOLD) {
      swipedRef.current = true;
      buzz(12);
      onSwipeRight?.();
    } else if (x < -SWIPE_DISTANCE_THRESHOLD || vx < -SWIPE_VELOCITY_THRESHOLD) {
      swipedRef.current = true;
      buzz(12);
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearLongPress}
      onPointerCancel={clearLongPress}
      disabled={completing}
      animate={controls}
      initial={{
        filter: `blur(${blur}px)`,
        opacity,
        scale,
        y: translateY,
      }}
      whileTap={
        interactive && !completing && !editing
          ? { scale: scale * 0.98, opacity: opacity * 0.95 }
          : undefined
      }
      transition={SPRING}
      drag={draggable && !completing && !editing ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.55}
      dragMomentum={false}
      onDragStart={clearLongPress}
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
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitEdit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
            }
          }}
          onBlur={commitEdit}
          className="w-full bg-transparent text-center outline-none"
          style={{
            fontSize: fontSizePx,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: '#0a0a0a',
          }}
        />
      ) : (
        <motion.span
          className="relative flex w-full items-center justify-center gap-2 text-center"
          style={{ display: 'flex' }}
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
          {timeLabel && (
            <span
              aria-hidden
              className="shrink-0 rounded-full px-2 py-0.5"
              style={{
                backgroundColor: '#e7e7e7',
                color: '#737373',
                fontSize: size === 'focus' ? 12 : 10.5,
                fontWeight: 600,
                letterSpacing: '0',
              }}
            >
              {timeLabel}
            </span>
          )}
        </motion.span>
      )}

      {recurring && !editing && (
        <span
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2"
          title="Repeats daily"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 7a4.5 4.5 0 0 1 7.7-3.2M11.5 7a4.5 4.5 0 0 1-7.7 3.2M10 1.5V4H7.5M4 12.5V10h2.5"
              stroke="#999999"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}

      {onOpenDetail && !completing && !editing && (
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
