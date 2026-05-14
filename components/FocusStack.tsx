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

type StackPos = { blur: number; opacity: number; scale: number; y: number };

const BASE_STACK_POSITIONS: StackPos[] = [
  { blur: 0, opacity: 1, scale: 1, y: 0 },
  { blur: 4, opacity: 0.7, scale: 0.97, y: 10 },
  { blur: 8, opacity: 0.4, scale: 0.94, y: 20 },
  { blur: 12, opacity: 0.2, scale: 0.91, y: 30 },
];

/** Continues the cascade past 4 with exponential fall-off so deep piles remain
 *  visible as thin peeks without ever fully disappearing. */
function stackPositionAt(idx: number): StackPos {
  const base = BASE_STACK_POSITIONS[idx];
  if (base) return base;
  const overflow = idx - 3;
  return {
    blur: Math.min(20, 12 + overflow * 1.5),
    opacity: Math.max(0.04, 0.2 * Math.pow(0.7, overflow)),
    scale: Math.max(0.84, 0.91 - overflow * 0.015),
    y: Math.min(56, 30 + overflow * 6),
  };
}

export type FocusStackHandle = {
  focusInput: () => void;
};

type FocusStackProps = {
  tasks: Task[];
  onAdd: (text: string) => void;
  onComplete: (id: string) => void;
};

export const FocusStack = forwardRef<FocusStackHandle, FocusStackProps>(function FocusStack(
  { tasks, onAdd, onComplete },
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
      // Confirmation spring.
      void containerControls.start({
        scale: [1, 1.04, 1],
        transition: { duration: 0.35, times: [0, 0.5, 1], ease: [0.32, 0.72, 0, 1] },
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

  // Click-outside to dismiss compose
  useEffect(() => {
    if (!composing) return;
    const handler = (ev: MouseEvent) => {
      const node = inputRef.current;
      if (!node) return;
      const target = ev.target as Node | null;
      if (target && !node.contains(target)) {
        const composer = (target as HTMLElement).closest?.('[data-composer]');
        if (!composer) {
          if (!morphing) cancelCompose();
        }
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [composing, morphing, cancelCompose]);

  const visible = tasks;
  const isEmpty = visible.length === 0;
  // When composing, every pill shifts back by one slot so the input takes the
  // front position without colliding with the existing pile.
  const slotOffset = composing ? 1 : 0;
  // Stack height grows with the pile so the deepest peek isn't clipped by the +.
  const deepestY = isEmpty
    ? 0
    : stackPositionAt(visible.length - 1 + slotOffset).y;
  const stackHeight = 70 + deepestY;

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
              const isFront = idx === 0;
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
                    text={task.text}
                    size="focus"
                    blur={composedPos.blur}
                    opacity={composedPos.opacity}
                    scale={composedPos.scale}
                    translateY={composedPos.y}
                    interactive={isFront && !composing}
                    onComplete={isFront ? () => onComplete(task.id) : undefined}
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

      {/* + / × button. + adds a task; × (the + rotated 45°) dismisses the composer.
          Hidden in the empty state — the grey input is the only affordance. */}
      {!isEmpty && (
        <div className="mt-8 flex justify-center">
          <motion.button
            type="button"
            onClick={composing ? cancelCompose : beginCompose}
            whileTap={{ scale: 0.98, opacity: 0.95 }}
            animate={{ rotate: composing ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
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
