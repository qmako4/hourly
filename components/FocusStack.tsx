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

const STACK_POSITIONS = [
  { blur: 0, opacity: 1, scale: 1, y: 0 },
  { blur: 4, opacity: 0.7, scale: 0.97, y: 10 },
  { blur: 8, opacity: 0.4, scale: 0.94, y: 20 },
  { blur: 12, opacity: 0.2, scale: 0.91, y: 30 },
];

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
  const morphBoxControls = useAnimationControls();
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
      // Animate border to transparent + background to pill fill simultaneously.
      void morphBoxControls.start({
        backgroundColor: '#f3f3f3',
        borderColor: 'rgba(10,10,10,0)',
        transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
      });
      // Confirmation spring.
      void containerControls.start({
        scale: [1, 1.04, 1],
        transition: { duration: 0.35, times: [0, 0.5, 1], ease: [0.32, 0.72, 0, 1] },
      });
      window.setTimeout(() => {
        onAdd(trimmed);
        setMorphing(false);
        setDraft('');
        void morphBoxControls.set({
          backgroundColor: 'rgba(255,255,255,0)',
          borderColor: 'rgba(10,10,10,1)',
        });
        // Keep input focused for rapid consecutive entry.
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }, 360);
    },
    [onAdd, containerControls, morphBoxControls, cancelCompose],
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

  const visible = tasks.slice(0, 4);
  const isEmpty = visible.length === 0;

  return (
    <motion.div
      animate={containerControls}
      className="relative mx-auto w-full"
      style={{ minHeight: 100 }}
    >
      {/* Stacked pills (back to front) */}
      <div className="relative w-full" style={{ height: 80 }}>
        <AnimatePresence initial={false}>
          {visible
            .map((task, idx) => ({ task, idx }))
            .reverse()
            .map(({ task, idx }) => {
              const pos = STACK_POSITIONS[Math.min(idx, STACK_POSITIONS.length - 1)] ?? STACK_POSITIONS[0]!;
              const isFront = idx === 0;
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  exit={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute left-0 right-0"
                  style={{ zIndex: 10 - idx }}
                >
                  {/* When composing, push the front pill back by one slot. */}
                  <Pill
                    text={task.text}
                    size="focus"
                    blur={composing && isFront ? STACK_POSITIONS[1]!.blur : pos.blur}
                    opacity={composing && isFront ? STACK_POSITIONS[1]!.opacity : pos.opacity}
                    scale={composing && isFront ? STACK_POSITIONS[1]!.scale : pos.scale}
                    translateY={composing && isFront ? STACK_POSITIONS[1]!.y : pos.y}
                    interactive={isFront && !composing}
                    onComplete={isFront ? () => onComplete(task.id) : undefined}
                  />
                </motion.div>
              );
            })}
        </AnimatePresence>

        {/* Empty state / compose layer */}
        {(isEmpty || composing) && (
          <div className="absolute left-0 right-0 top-0" style={{ zIndex: 20 }} data-composer>
            {!composing ? (
              <button
                type="button"
                onClick={beginCompose}
                className="w-full rounded-full px-6 py-5 text-center"
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: '#c4c4c4',
                }}
              >
                <motion.span
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-block"
                >
                  what&apos;s first?
                </motion.span>
              </button>
            ) : (
              <form onSubmit={handleSubmit} data-composer>
                <motion.div
                  animate={morphBoxControls}
                  initial={{
                    backgroundColor: 'rgba(255,255,255,0)',
                    borderColor: 'rgba(10,10,10,1)',
                  }}
                  className="w-full rounded-full"
                  style={{ borderWidth: 1.5, borderStyle: 'solid' }}
                >
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
                    disabled={morphing}
                    placeholder="what's first?"
                    className="w-full rounded-full bg-transparent px-6 py-5 text-center outline-none placeholder:text-placeholder"
                    style={{
                      fontSize: 22,
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                      color: '#0a0a0a',
                    }}
                  />
                </motion.div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* + button — only when tasks exist and not composing */}
      {!isEmpty && !composing && (
        <div className="mt-8 flex justify-center">
          <motion.button
            type="button"
            onClick={beginCompose}
            whileTap={{ scale: 0.98, opacity: 0.95 }}
            transition={{ duration: 0.08 }}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            aria-label="Add task"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
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
