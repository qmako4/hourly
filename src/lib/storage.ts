import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from './types';

const TASKS_KEY = 'today.tasks.v1';

export async function loadTasks(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(TASKS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTask);
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function isTask(v: unknown): v is Task {
  if (!v || typeof v !== 'object') return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.text === 'string' &&
    typeof t.targetDate === 'string' &&
    typeof t.createdAt === 'number' &&
    (t.completedAt === null || typeof t.completedAt === 'number') &&
    (t.lastNotified === null || typeof t.lastNotified === 'number') &&
    typeof t.rolledOver === 'boolean'
  );
}
