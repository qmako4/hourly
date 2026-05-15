'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Task } from '@/lib/types';
import { FADE, SPRING_TIGHT } from '@/lib/motion';

type DetailSheetProps = {
  task: Task | null;
  onClose: () => void;
  onChange: (id: string, detail: string) => void;
};

export function DetailSheet({ task, onClose, onChange }: DetailSheetProps) {
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      setDraft(task.detail ?? '');
      // Defer the focus so the slide-in animation can complete first.
      const id = window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 220);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [task]);

  // Escape closes the sheet.
  useEffect(() => {
    if (!task) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [task, onClose]);

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          key="detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FADE}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={onClose}
        >
          <motion.div
            key="detail-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SPRING_TIGHT}
            className="w-full max-w-[480px] rounded-t-3xl bg-white px-6 pb-6 pt-5"
            style={{ boxShadow: '0 -12px 40px rgba(0,0,0,0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull-handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: '#e5e5e5' }} />

            <div
              className="mb-1 text-center uppercase"
              style={{
                fontSize: 9.5,
                letterSpacing: '0.18em',
                color: '#999',
                fontWeight: 600,
              }}
            >
              Details
            </div>

            <div
              className="mb-4 text-center"
              style={{
                fontSize: 17,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: '#0a0a0a',
                lineHeight: 1.3,
              }}
            >
              {task.text}
            </div>

            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                onChange(task.id, e.target.value);
              }}
              rows={5}
              placeholder="add more detail..."
              className="w-full resize-none rounded-2xl border-0 px-4 py-3 outline-none placeholder:text-placeholder"
              style={{
                backgroundColor: '#f3f3f3',
                fontSize: 15,
                lineHeight: 1.45,
                color: '#0a0a0a',
              }}
            />

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full py-3"
              style={{ backgroundColor: '#0a0a0a', color: '#fff', fontSize: 13, fontWeight: 500 }}
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
