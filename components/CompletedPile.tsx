'use client';

import { motion } from 'framer-motion';
import type { Task } from '@/lib/types';

type CompletedPileProps = {
  items: Task[];
  onRestore: (id: string) => void;
};

const MAX_VISIBLE = 6;

export function CompletedPile({ items, onRestore }: CompletedPileProps) {
  const visible = items.slice(0, MAX_VISIBLE);

  return (
    <div
      className="fixed bottom-6 left-6 z-30 flex flex-col gap-1"
      style={{ width: 168 }}
    >
      {visible.map((t) => (
        <motion.button
          key={t.id}
          layoutId={`pill-${t.id}`}
          onClick={() => onRestore(t.id)}
          whileTap={{ scale: 0.97, opacity: 0.9 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
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
            {t.text}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
