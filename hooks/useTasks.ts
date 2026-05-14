'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task, TargetDate } from '@/lib/types';
import {
  SEVEN_DAYS_MS,
  resolveOriginalTargetStart,
  startOfDay,
  todayStart,
} from '@/lib/dateUtils';

const STORAGE_KEY = 'hourly:tasks:v1';

function makeId(): string {
  const cryptoObj =
    typeof crypto !== 'undefined' ? (crypto as Crypto & { randomUUID?: () => string }) : null;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function isTaskShape(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.text === 'string' &&
    (v.targetDate === 'today' || v.targetDate === 'tomorrow') &&
    typeof v.createdAt === 'number' &&
    (v.completedAt === null || typeof v.completedAt === 'number')
  );
}

function readStorage(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTaskShape);
  } catch {
    return [];
  }
}

function writeStorage(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* quota or unavailable - ignore */
  }
}

/**
 * Apply load-time cleanup:
 *  - Drop completed tasks older than 7 days.
 *  - Drop incomplete tasks whose resolved target day is before today.
 *  - Promote tomorrow→today when tomorrow has arrived.
 */
function applyCleanup(input: Task[], now: number): Task[] {
  const today = todayStart(now);
  const out: Task[] = [];
  for (const t of input) {
    if (t.completedAt !== null) {
      if (now - t.completedAt > SEVEN_DAYS_MS) continue;
      out.push(t);
      continue;
    }
    const originalTarget = resolveOriginalTargetStart(t.createdAt, t.targetDate);
    if (originalTarget < today) {
      // expired - fade it
      continue;
    }
    if (t.targetDate === 'tomorrow' && originalTarget <= today) {
      out.push({ ...t, targetDate: 'today' });
    } else {
      out.push(t);
    }
  }
  return out;
}

export type UseTasks = {
  tasks: Task[];
  hydrated: boolean;
  pending: (day: TargetDate) => Task[];
  bin: Task[];
  addTask: (text: string, targetDate: TargetDate) => Task | null;
  completeTask: (id: string) => void;
  restoreTask: (id: string) => void;
  clearBin: () => void;
};

export function useTasks(): UseTasks {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const skipNextWriteRef = useRef(true);

  useEffect(() => {
    const loaded = readStorage();
    const cleaned = applyCleanup(loaded, Date.now());
    setTasks(cleaned);
    setHydrated(true);
    // schedule a write only if cleanup mutated state
    if (cleaned.length !== loaded.length || cleaned.some((t, i) => t !== loaded[i])) {
      skipNextWriteRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }
    writeStorage(tasks);
  }, [tasks, hydrated]);

  const addTask = useCallback(
    (rawText: string, targetDate: TargetDate): Task | null => {
      const text = rawText.trim();
      if (!text) return null;
      const task: Task = {
        id: makeId(),
        text,
        targetDate,
        createdAt: Date.now(),
        completedAt: null,
      };
      setTasks((prev) => [...prev, task]);
      return task;
    },
    [],
  );

  const completeTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id && t.completedAt === null ? { ...t, completedAt: Date.now() } : t)),
    );
  }, []);

  const restoreTask = useCallback((id: string) => {
    const now = Date.now();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const originalTarget = resolveOriginalTargetStart(t.createdAt, t.targetDate);
        const stillValid = originalTarget >= startOfDay(now);
        if (!stillValid) {
          // restore into today
          return { ...t, completedAt: null, targetDate: 'today', createdAt: now };
        }
        return { ...t, completedAt: null };
      }),
    );
  }, []);

  const clearBin = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.completedAt === null));
  }, []);

  const pending = useCallback(
    (day: TargetDate): Task[] =>
      tasks
        .filter((t) => t.completedAt === null && t.targetDate === day)
        .sort((a, b) => a.createdAt - b.createdAt),
    [tasks],
  );

  const bin = tasks
    .filter((t): t is Task & { completedAt: number } => t.completedAt !== null)
    .sort((a, b) => b.completedAt - a.completedAt);

  return { tasks, hydrated, pending, bin, addTask, completeTask, restoreTask, clearBin };
}
