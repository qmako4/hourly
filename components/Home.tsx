'use client';

import { LayoutGroup } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompletedPile } from './CompletedPile';
import { DayToggle } from './DayToggle';
import { DetailSheet } from './DetailSheet';
import { FocusStack, type FocusStackHandle } from './FocusStack';
import { useNotifications } from '@/hooks/useNotifications';
import { useTasks } from '@/hooks/useTasks';
import type { TargetDate } from '@/lib/types';

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export function Home() {
  const {
    hydrated,
    pending,
    bin,
    tasks,
    addTask,
    completeTask,
    restoreTask,
    clearBin,
    updateTaskDetail,
    toggleTaskDay,
  } = useTasks();
  const [day, setDay] = useState<TargetDate>('today');
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);
  const [showInstallSheet, setShowInstallSheet] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const focusRef = useRef<FocusStackHandle>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const nav = window.navigator as NavigatorWithStandalone;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
    setIosNeedsInstall(isIOS && !isStandalone);
  }, []);

  const todayTasks = useMemo(() => pending('today'), [pending]);
  const tomorrowTasks = useMemo(() => pending('tomorrow'), [pending]);
  const visibleTasks = day === 'today' ? todayTasks : tomorrowTasks;

  const allPending = useMemo(
    () => [...todayTasks, ...tomorrowTasks],
    [todayTasks, tomorrowTasks],
  );
  const getPending = useCallback(() => allPending, [allPending]);
  const { permission, request } = useNotifications(getPending);

  const handleAdd = useCallback(
    (text: string) => {
      addTask(text, day);
    },
    [addTask, day],
  );

  const handleComplete = useCallback(
    (id: string) => {
      completeTask(id);
    },
    [completeTask],
  );

  const handleOpenDetail = useCallback((id: string) => {
    setDetailTaskId(id);
  }, []);

  const detailTask = useMemo(
    () => (detailTaskId ? tasks.find((t) => t.id === detailTaskId) ?? null : null),
    [detailTaskId, tasks],
  );

  return (
    <LayoutGroup id="tasks">
      <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-white">
      {/* Day toggle top-center */}
      <div className="absolute left-0 right-0 top-7 z-10 flex justify-center">
        <DayToggle value={day} onChange={setDay} />
      </div>

      {/* Focus stack — centered when short, scrollable when the pile gets tall */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 pt-20">
        <div className="my-auto w-full">
          {hydrated && (
            <FocusStack
              ref={focusRef}
              tasks={visibleTasks}
              onAdd={handleAdd}
              onComplete={handleComplete}
              onOpenDetail={handleOpenDetail}
              onToggleDay={toggleTaskDay}
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
            className="rounded-full px-4 py-2.5"
            style={{ backgroundColor: '#0a0a0a', color: '#fff', fontSize: 12, fontWeight: 500 }}
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
        {permission === 'unsupported' && iosNeedsInstall && (
          <button
            type="button"
            onClick={() => setShowInstallSheet(true)}
            className="rounded-full px-4 py-2.5"
            style={{ backgroundColor: '#0a0a0a', color: '#fff', fontSize: 12, fontWeight: 500 }}
          >
            Add to Home Screen for nudges
          </button>
        )}
      </div>

      {/* iOS install sheet */}
      {showInstallSheet && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 px-4 pb-4"
          onClick={() => setShowInstallSheet(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl bg-white p-5"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0a0a0a' }}>Install for hourly nudges</h2>
            <p className="mt-2" style={{ fontSize: 13, color: '#0a0a0a', lineHeight: 1.5 }}>
              iOS only allows web notifications from apps added to the Home Screen (iOS 16.4+).
            </p>
            <ol className="mt-3 space-y-2" style={{ fontSize: 13, color: '#0a0a0a' }}>
              <li>
                <strong>1.</strong> Tap the <strong>Share</strong> button at the bottom of Safari
                (square with an up-arrow).
              </li>
              <li>
                <strong>2.</strong> Scroll and tap <strong>Add to Home Screen</strong>.
              </li>
              <li>
                <strong>3.</strong> Open hourly from your Home Screen, then tap{' '}
                <strong>Hourly nudges</strong> again to grant permission.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowInstallSheet(false)}
              className="mt-4 w-full rounded-full py-3"
              style={{ backgroundColor: '#0a0a0a', color: '#fff', fontSize: 13, fontWeight: 500 }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Completed-tasks pile, bottom-left, visible. Newest sits on top of
          the pile; tap any item to restore. */}
      <CompletedPile items={bin} onRestore={restoreTask} onClear={clearBin} />

      {/* Per-task detail bottom sheet */}
      <DetailSheet
        task={detailTask}
        onClose={() => setDetailTaskId(null)}
        onChange={updateTaskDetail}
      />
      </main>
    </LayoutGroup>
  );
}
