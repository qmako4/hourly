'use client';

import { AnimatePresence, LayoutGroup, motion, type PanInfo } from 'framer-motion';
import { useEffect } from 'react';
import type { Task } from '@/lib/types';
import { Pill } from './Pill';

type DrawerProps = {
  open: boolean;
  todayTasks: Task[];
  tomorrowTasks: Task[];
  onComplete: (id: string) => void;
  onClose: () => void;
};

const headerClass = 'text-center uppercase mb-3';
const headerStyle: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  letterSpacing: '0.18em',
  color: '#999',
};

const SPRING = { type: 'spring' as const, stiffness: 280, damping: 32 };

export function Drawer({ open, todayTasks, tomorrowTasks, onComplete, onClose }: DrawerProps) {
  const isEmpty = todayTasks.length === 0 && tomorrowTasks.length === 0;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 80 || info.velocity.x > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={SPRING}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.4 }}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          className="fixed inset-0 z-30 bg-white"
        >
          {/* Left-edge tap-to-close strip */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="absolute left-0 top-0 z-10 h-full w-7 bg-transparent"
          />

          <div className="mx-auto flex h-full max-w-[480px] flex-col px-6 pb-16 pt-20">
            <div className="flex-1 overflow-y-auto">
              {isEmpty && (
                <div className="flex h-full items-center justify-center">
                  <span
                    style={{
                      fontSize: 15.5,
                      fontWeight: 500,
                      color: '#c4c4c4',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    nothing here yet.
                  </span>
                </div>
              )}
              <LayoutGroup id="drawer">
                <div className="flex h-full flex-col justify-center gap-8">
                  {todayTasks.length > 0 && (
                    <section>
                      <h2 className={headerClass} style={headerStyle}>
                        Today
                      </h2>
                      <ul className="flex flex-col gap-2">
                        <AnimatePresence initial={false}>
                          {todayTasks.map((t) => (
                            <motion.li
                              key={t.id}
                              layout
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={SPRING}
                            >
                              <Pill
                                text={t.text}
                                size="list"
                                onComplete={() => onComplete(t.id)}
                              />
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    </section>
                  )}

                  {tomorrowTasks.length > 0 && (
                    <section>
                      <h2 className={headerClass} style={headerStyle}>
                        Tomorrow
                      </h2>
                      <ul className="flex flex-col gap-2">
                        <AnimatePresence initial={false}>
                          {tomorrowTasks.map((t) => (
                            <motion.li
                              key={t.id}
                              layout
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={SPRING}
                            >
                              <Pill
                                text={t.text}
                                size="list"
                                onComplete={() => onComplete(t.id)}
                              />
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    </section>
                  )}
                </div>
              </LayoutGroup>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
