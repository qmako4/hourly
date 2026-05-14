'use client';

import { motion } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Bin } from './Bin';
import { DayToggle } from './DayToggle';
import { Drawer } from './Drawer';
import { FocusStack, type FocusStackHandle } from './FocusStack';
import { useNotifications } from '@/hooks/useNotifications';
import { useTasks } from '@/hooks/useTasks';
import type { TargetDate } from '@/lib/types';

export function Home() {
  const { hydrated, pending, bin, addTask, completeTask, restoreTask, clearBin } = useTasks();
  const [day, setDay] = useState<TargetDate>('today');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wiggleKey, setWiggleKey] = useState(0);
  const focusRef = useRef<FocusStackHandle>(null);

  const todayTasks = useMemo(() => pending('today'), [pending]);
  const tomorrowTasks = useMemo(() => pending('tomorrow'), [pending]);
  const visibleTasks = day === 'today' ? todayTasks : tomorrowTasks;

  const getTodayTasks = useCallback(() => todayTasks, [todayTasks]);
  const { permission, request } = useNotifications(getTodayTasks);

  const handleAdd = useCallback(
    (text: string) => {
      addTask(text, day);
    },
    [addTask, day],
  );

  const handleComplete = useCallback(
    (id: string) => {
      completeTask(id);
      setWiggleKey((k) => k + 1);
    },
    [completeTask],
  );

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-white">
      {/* Hamburger top-right */}
      <div className="absolute right-5 top-5 z-20">
        <button
          type="button"
          onClick={() => setDrawerOpen((o) => !o)}
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          className="flex h-10 w-10 items-center justify-center"
        >
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            animate={{ rotate: drawerOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            <line x1="1" y1="4.5" x2="15" y2="4.5" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="1" y1="8" x2="15" y2="8" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="1" y1="11.5" x2="15" y2="11.5" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" />
          </motion.svg>
        </button>
      </div>

      {/* Day toggle top-center */}
      <div className="absolute left-0 right-0 top-7 z-10 flex justify-center">
        <DayToggle value={day} onChange={setDay} />
      </div>

      {/* Focus stack (vertically centered) */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full">
          {hydrated && (
            <FocusStack
              ref={focusRef}
              tasks={visibleTasks}
              onAdd={handleAdd}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>

      {/* Meta row: notifications pill, centered */}
      <div className="flex justify-center pb-3">
        {permission === 'default' && (
          <button
            type="button"
            onClick={() => {
              void request();
            }}
            className="rounded-full px-3.5 py-1.5"
            style={{ backgroundColor: '#0a0a0a', color: '#fff', fontSize: 11, fontWeight: 500 }}
          >
            Hourly nudges
          </button>
        )}
        {permission === 'granted' && (
          <span
            className="uppercase"
            style={{ fontSize: 9.5, letterSpacing: '0.18em', color: '#999', fontWeight: 600 }}
          >
            Reminding hourly
          </span>
        )}
      </div>

      {/* Bottom-left bin */}
      <div className="px-6 pb-6">
        <div className="flex items-end justify-start">
          <Bin items={bin} onRestore={restoreTask} onClear={clearBin} wiggleKey={wiggleKey} />
        </div>
      </div>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        todayTasks={todayTasks}
        tomorrowTasks={tomorrowTasks}
        onComplete={handleComplete}
      />
    </main>
  );
}
