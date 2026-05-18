'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Task } from '@/lib/types';
import { SPRING } from '@/lib/motion';
import { buzz } from '@/lib/haptics';
import { taskView } from '@/lib/taskView';

type CompletedPileProps = {
  items: Task[];
  onRestore: (id: string) => void;
  onClear: () => void;
};

const MAX_VISIBLE = 6;

export function CompletedPile({ items, onRestore, onClear }: CompletedPileProps) {
  const visible = items.slice(0, MAX_VISIBLE);
  const [confirming, setConfirming] = useState(false);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  const handleClear = () => {
    if (confirming) {
      if (resetRef.current) clearTimeout(resetRef.current);
      setConfirming(false);
      buzz(14);
      onClear();
      return;
    }
    setConfirming(true);
    resetRef.current = setTimeout(() => setConfirming(false), 2500);
  };

  const handleRestore = (id: string) => {
    buzz(10);
    onRestore(id);
  };

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-30 flex flex-col gap-1"
      style={{ width: 168 }}
    >
      {visible.map((t) => (
        <motion.button
          key={t.id}
          layoutId={`pill-${t.id}`}
          onClick={() => handleRestore(t.id)}
          whileTap={{ scale: 0.97, opacity: 0.9 }}
          transition={SPRING}
          className="overflow-hidden rounded-full px-3 py-1.5 text-left"
          style={{
            backgroundColor: '#f3f3f3',
            color: '#737373',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
          aria-label={`Restore: ${t.text}`}
        >
          <span
            className="block truncate"
            style={{
              textDecoration: 'line-through',
              textDecorationThickness: '1px',
              textDecorationColor: '#0a0a0a',
            }}
          >
            {taskView(t).display}
          </span>
        </motion.button>
      ))}

      <button
        type="button"
        onClick={handleClear}
        className="mt-1 self-start px-1 py-1 uppercase"
        style={{
          fontSize: 9.5,
          letterSpacing: '0.18em',
          fontWeight: 600,
          color: confirming ? '#0a0a0a' : '#c4c4c4',
        }}
        aria-label={confirming ? 'Confirm clear completed tasks' : 'Clear completed tasks'}
      >
        {confirming ? 'clear?' : 'clear'}
      </button>
    </div>
  );
}
