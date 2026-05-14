'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task } from '@/lib/types';
import { isInQuietHours, msUntilNextHour } from '@/lib/dateUtils';

export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

const ICON_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/icon-192.png`;

/** Minute-thresholds (and labels) at which a task with a parsed `dueAt`
 *  should fire a pre-deadline reminder. */
const PRE_DEADLINE_THRESHOLDS: ReadonlyArray<{ mins: number; label: string }> = [
  { mins: 60, label: 'in 1 hr' },
  { mins: 30, label: 'in 30 min' },
  { mins: 15, label: 'in 15 min' },
];

function readPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

function fire(title: string, body: string, tag: string): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (isInQuietHours()) return;
  try {
    new Notification(title, {
      body,
      icon: ICON_URL,
      badge: ICON_URL,
      silent: false,
      tag,
    });
  } catch {
    /* permission may have been revoked, or running in a private context */
  }
}

export type GetPendingTasks = () => Task[];

export type UseNotifications = {
  permission: NotificationPermissionState;
  request: () => Promise<void>;
};

export function useNotifications(getPendingTasks: GetPendingTasks): UseNotifications {
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported');
  const hourlyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hourlyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minuteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const getTasksRef = useRef(getPendingTasks);
  /** Dedup pre-deadline firings within a session, keyed `${id}:${threshold}`. */
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    getTasksRef.current = getPendingTasks;
  }, [getPendingTasks]);

  useEffect(() => {
    setPermission(readPermission());
  }, []);

  // The hourly "front task" anchor — fires on the hour, only when there is
  // a Today task to surface.
  const fireHourly = useCallback(() => {
    const front = getTasksRef.current().find((t) => t.targetDate === 'today');
    if (!front) return;
    fire('hourly.', front.text, `hourly-front`);
  }, []);

  // Per-minute pass over all pending tasks: anything with a `dueAt` that
  // matches one of the pre-deadline thresholds fires a single notification.
  const fireDeadlineChecks = useCallback(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    if (isInQuietHours()) return;
    const now = Date.now();
    for (const task of getTasksRef.current()) {
      if (!task.dueAt) continue;
      const minsUntil = Math.round((task.dueAt - now) / 60_000);
      for (const { mins, label } of PRE_DEADLINE_THRESHOLDS) {
        if (minsUntil !== mins) continue;
        const key = `${task.id}:${mins}`;
        if (firedRef.current.has(key)) continue;
        firedRef.current.add(key);
        fire(`hourly. — ${label}`, task.text, `deadline-${task.id}-${mins}`);
      }
    }
  }, []);

  // Schedule both ticks once permission is granted.
  useEffect(() => {
    if (permission !== 'granted') return;
    if (hourlyTimeoutRef.current) clearTimeout(hourlyTimeoutRef.current);
    if (hourlyIntervalRef.current) clearInterval(hourlyIntervalRef.current);
    if (minuteIntervalRef.current) clearInterval(minuteIntervalRef.current);

    const ms = msUntilNextHour();
    hourlyTimeoutRef.current = setTimeout(() => {
      fireHourly();
      hourlyIntervalRef.current = setInterval(fireHourly, 60 * 60 * 1000);
    }, ms);

    // Per-minute deadline check.
    minuteIntervalRef.current = setInterval(fireDeadlineChecks, 60 * 1000);

    return () => {
      if (hourlyTimeoutRef.current) clearTimeout(hourlyTimeoutRef.current);
      if (hourlyIntervalRef.current) clearInterval(hourlyIntervalRef.current);
      if (minuteIntervalRef.current) clearInterval(minuteIntervalRef.current);
    };
  }, [permission, fireHourly, fireDeadlineChecks]);

  const request = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'default') {
      setPermission(Notification.permission as NotificationPermissionState);
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermissionState);
  }, []);

  return { permission, request };
}
