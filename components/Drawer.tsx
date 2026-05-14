'use client';

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import type { Task } from '@/lib/types';
import { Pill } from './Pill';

type DrawerProps = {
  open: boolean;
  todayTasks: Task[];
  tomorrowTasks: Task[];
  onComplete: (id: string) => void;
};

const headerClass = 'text-center uppercase mb-3';
const headerStyle: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  letterSpacing: '0.18em',
  color: '#999',
};

export function Drawer({ open, todayTasks, tomorrowTasks, onComplete }: DrawerProps) {
  const isEmpty = todayTasks.length === 0 && tomorrowTasks.length === 0;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 280, damping: 32 }}
          className="fixed inset-0 z-30 bg-white"
        >
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
                              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
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
                              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
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
