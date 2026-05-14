'use client';

import { AnimatePresence, motion } from 'framer-motion';

type TumbleCountProps = {
  value: number;
};

const STANDARD_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

export function TumbleCount({ value }: TumbleCountProps) {
  return (
    <span
      className="relative inline-block overflow-hidden text-[12px] leading-none tabular-nums"
      style={{ color: '#0a0a0a', height: '1em', minWidth: '1ch' }}
      aria-label={`${value} in bin`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.32, ease: STANDARD_EASE }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
