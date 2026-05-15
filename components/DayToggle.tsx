'use client';

import { motion } from 'framer-motion';
import type { TargetDate } from '@/lib/types';
import { SPRING_TIGHT } from '@/lib/motion';

type DayToggleProps = {
  value: TargetDate;
  onChange: (value: TargetDate) => void;
};

export function DayToggle({ value, onChange }: DayToggleProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {(['today', 'tomorrow'] as TargetDate[]).map((d) => {
        const active = d === value;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className="relative px-4 py-2 text-[12px] font-medium transition-colors"
            style={{ color: active ? '#0a0a0a' : '#737373' }}
          >
            <span className="relative z-10">{d === 'today' ? 'Today' : 'Tomorrow'}</span>
            {active && (
              <motion.span
                layoutId="day-toggle-underline"
                className="absolute bottom-1 left-3 right-3 h-px"
                style={{ backgroundColor: '#0a0a0a' }}
                transition={SPRING_TIGHT}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
