'use client';

import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import { Pill } from './Pill';
import type { Task } from '@/lib/types';
import { EASE_IOS, FADE, SPRING_TIGHT } from '@/lib/motion';
import { taskView } from '@/lib/taskView';
import { buzz } from '@/lib/haptics';

type StackPos = { blur: number; opacity: number; scale: number; y: number };

/** Each pill gets its own vertical slot — building-blocks style — so every task
 *  is fully visible. The slot offset = pill height + gap between blocks. */
const PILL_SLOT_HEIGHT = 64;
const PILL_GAP = 8;
const SLOT_STRIDE = PILL_SLOT_HEIGHT + PILL_GAP;

function stackPositionAt(idx: number): StackPos {
  return {
    blur: 0,
    opacity: 1,
    scale: 1,
    y: idx * SLOT_STRIDE,
  };
}

export type FocusStackHandle = {
  focusInput: () => void;
};

type FocusStackProps = {
  tasks: Task[];
  onAdd: (text: string) => void;
  onComplete: (id: string) => void;
  onOpenDetail: (taskId: string) => void;
  onToggleDay: (id: string) => void;
  onEditText: (id: string, text: string) => void;
};

export const FocusStack = forwardRef<FocusStackHandle, FocusStackProps>(function FocusStack(
  { tasks, onAdd, onComplete, onOpenDetail, onToggleDay, onEditText },
  ref,
) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [morphing, setMorphing] = useState(false);
  const containerControls = useAnimationControls();
  const inputRef = useRef<HTMLInputElement>(null);

  const beginCompose = useCallback(() => {
    setComposing(true);
    setMorphing(false);
    setDraft('');
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const cancelCompose = useCallback(() => {
    setComposing(false);
    setMorphing(false);
    setDraft('');
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focusInput: () => {
        beginCompose();
      },
    }),
    [beginCompose],
  );

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        cancelCompose();
        return;
      }
      setMorphing(true);
      buzz(10);
      // Confirmation spring.
      void containerControls.start({
        scale: [1, 1.04, 1],
        transition: { duration: 0.35, times: [0, 0.5, 1], ease: EASE_IOS },
      });
      window.setTimeout(() => {
        onAdd(trimmed);
        setMorphing(false);
        setDraft('');
        // Keep input focused for rapid consecutive entry.
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }, 280);
    },
    [onAdd, containerControls, cancelCompose],
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(draft);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelCompose();
    }
  };

  // Click-outside to dismiss compose. Pills and their detail-triggers are
  // exempt so the user can complete a task or open its detail sheet without
  // losing their compose draft. Use the × button (or Escape) to dismiss.
  useEffect(() => {
    if (!composing) return;
    const handler = (ev: MouseEvent) => {
      const node = inputRef.current;
      if (!node) return;
      const target = ev.target as Node | null;
      if (target && !node.contains(target)) {
        const targetEl = target as HTMLElement;
        const composer = targetEl.closest?.('[data-composer]');
        const detail = targetEl.closest?.('[data-detail-trigger]');
        const pill = targetEl.closest?.('[data-task-pill]');
        if (!composer && !detail && !pill) {
          if (!morphing) cancelCompose();
        }
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [composing, morphing, cancelCompose]);

  const visible = tasks;
  const isEmpty = visible.length === 0;
  // When composing, every pill shifts down one slot so the input takes slot 0.
  const slotOffset = composing ? 1 : 0;
  const totalSlots = (isEmpty ? 0 : visible.length) + (composing || isEmpty ? 1 : 0);
  const stackHeight = Math.max(
    PILL_SLOT_HEIGHT,
    totalSlots * SLOT_STRIDE - PILL_GAP,
  );

  return (
    <motion.div
      animate={containerControls}
      className="relative mx-auto w-full"
      style={{ minHeight: 100 }}
    >
      {/* Stacked pills (back to front) */}
      <div className="relative w-full" style={{ height: stackHeight }}>
        <AnimatePresence initial={false}>
          {visible
            .map((task, idx) => ({ task, idx }))
            .reverse()
            .map(({ task, idx }) => {
              // Shift every pill back one slot while composing so the input
              // can occupy slot 0 cleanly.
              const composedPos = stackPositionAt(idx + slotOffset);
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  exit={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute left-0 right-0"
                  style={{ zIndex: 1000 - idx }}
                >
                  <Pill
                    text={taskView(task).display}
                    rawText={task.text}
                    timeLabel={taskView(task).timeLabel}
                    recurring={task.recurring === true}
                    size="focus"
                    layoutId={`pill-${task.id}`}
                    blur={composedPos.blur}
                    opacity={composedPos.opacity}
                    scale={composedPos.scale}
                    translateY={composedPos.y}
                    hasDetail={Boolean(task.detail && task.detail.length > 0)}
                    onComplete={() => onComplete(task.id)}
                    onOpenDetail={() => onOpenDetail(task.id)}
                    onSwipeLeft={() => onComplete(task.id)}
                    onSwipeRight={() => onToggleDay(task.id)}
                    onEditText={(next) => onEditText(task.id, next)}
                  />
                </motion.div>
              );
            })}
        </AnimatePresence>

        {/* Empty state / compose layer.
            Empty == the grey "what's first?" input is shown immediately and
            ready to be tapped/typed into. A breathing animated overlay sits
            on top of the (placeholder-less) input as the "type here" cue.
            zIndex must beat the pill stack (max 1000) so the input is tappable
            even when the just-added pill is pushed back beneath it. */}
        {(isEmpty || composing) && (
          <div className="absolute left-0 right-0 top-0" style={{ zIndex: 2000 }} data-composer>
            <form onSubmit={handleSubmit} data-composer>
              <div
                className="relative w-full rounded-full"
                style={{ backgroundColor: '#f3f3f3' }}
              >
                {draft === '' && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      fontSize: 22,
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                      color: '#c4c4c4',
                    }}
                  >
                    what&apos;s first?
                  </motion.div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKey}
                  onFocus={() => {
                    if (!composing) setComposing(true);
                  }}
                  disabled={morphing}
                  aria-label="What's first?"
                  className="w-full rounded-full bg-transparent px-6 py-5 text-center outline-none"
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: '#0a0a0a',
                  }}
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Hint: how to complete. Visible only when there are tasks and the user
          isn't actively composing. Light grey, small-caps, matches the other
          metadata text in the app. */}
      <motion.div
        aria-hidden={isEmpty || composing}
        animate={{ opacity: !isEmpty && !composing ? 1 : 0 }}
        transition={FADE}
        className="mt-5 text-center uppercase"
        style={{
          fontSize: 9.5,
          letterSpacing: '0.18em',
          color: '#c4c4c4',
          fontWeight: 600,
        }}
      >
        tap a task to complete
      </motion.div>

      {/* + / × button. + adds a task; × (the + rotated 45°) dismisses the composer.
          Hidden in the empty state — the grey input is the only affordance. */}
      {!isEmpty && (
        <div className="mt-4 flex justify-center">
          <motion.button
            type="button"
            onClick={composing ? cancelCompose : beginCompose}
            whileTap={{ scale: 0.98, opacity: 0.95 }}
            animate={{ rotate: composing ? 45 : 0 }}
            transition={SPRING_TIGHT}
            className="flex h-12 w-12 items-center justify-center rounded-full"
            aria-label={composing ? 'Cancel' : 'Add task'}
          >
            <svg width="26" height="26" viewBox="0 0 22 22" fill="none" aria-hidden>
              <path
                d="M11 4.5V17.5M4.5 11H17.5"
                stroke="#0a0a0a"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
});
