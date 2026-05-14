'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task } from '@/lib/types';
import { isInQuietHours, msUntilNextHour } from '@/lib/dateUtils';

export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

function readPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

function buildBody(todayTasks: Task[]): string {
  if (todayTasks.length === 0) return 'Nothing on the board.';
  const shown = todayTasks.slice(0, 3).map((t) => `• ${t.text}`);
  const extra = todayTasks.length - 3;
  return extra > 0 ? `${shown.join('\n')}\n+${extra} more` : shown.join('\n');
}

function fireNotification(todayTasks: Task[]): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (isInQuietHours()) return;
  if (todayTasks.length === 0) return;
  try {
    new Notification('hourly.', {
      body: buildBody(todayTasks),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      silent: false,
      tag: 'hourly-nudge',
    });
  } catch {
    /* notifications may throw if permission was revoked or in private mode */
  }
}

export type UseNotifications = {
  permission: NotificationPermissionState;
  request: () => Promise<void>;
};

export function useNotifications(getTodayTasks: () => Task[]): UseNotifications {
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getTasksRef = useRef(getTodayTasks);

  // Keep latest getter without restarting the schedule.
  useEffect(() => {
    getTasksRef.current = getTodayTasks;
  }, [getTodayTasks]);

  useEffect(() => {
    setPermission(readPermission());
  }, []);

  const startSchedule = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const ms = msUntilNextHour();
    timeoutRef.current = setTimeout(() => {
      fireNotification(getTasksRef.current());
      intervalRef.current = setInterval(
        () => {
          fireNotification(getTasksRef.current());
        },
        60 * 60 * 1000,
      );
    }, ms);
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;
    startSchedule();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [permission, startSchedule]);

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
