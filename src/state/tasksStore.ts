import { create } from 'zustand';
import type { Task } from '../lib/types';
import { loadTasks, saveTasks } from '../lib/storage';
import { runCleanup } from '../lib/cleanup';

type TasksState = {
  tasks: Task[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addTask: (t: Task) => void;
  completeTask: (id: string) => void;
  restoreTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearBin: () => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
};

let saveQueue: Promise<void> = Promise.resolve();
function persist(tasks: Task[]) {
  saveQueue = saveQueue.then(() => saveTasks(tasks)).catch(() => undefined);
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  hydrated: false,
  hydrate: async () => {
    const loaded = await loadTasks();
    const cleaned = runCleanup(loaded);
    set({ tasks: cleaned, hydrated: true });
    if (cleaned.length !== loaded.length || cleaned.some((t, i) => t !== loaded[i])) {
      persist(cleaned);
    }
  },
  addTask: (t) => {
    const next = [...get().tasks, t];
    set({ tasks: next });
    persist(next);
  },
  completeTask: (id) => {
    const now = Date.now();
    const next = get().tasks.map((t) =>
      t.id === id ? { ...t, completedAt: now } : t
    );
    set({ tasks: next });
    persist(next);
  },
  restoreTask: (id) => {
    const next = get().tasks.map((t) =>
      t.id === id ? { ...t, completedAt: null } : t
    );
    set({ tasks: next });
    persist(next);
  },
  removeTask: (id) => {
    const next = get().tasks.filter((t) => t.id !== id);
    set({ tasks: next });
    persist(next);
  },
  clearBin: () => {
    const next = get().tasks.filter((t) => t.completedAt === null);
    set({ tasks: next });
    persist(next);
  },
  updateTask: (id, patch) => {
    const next = get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    set({ tasks: next });
    persist(next);
  },
}));
