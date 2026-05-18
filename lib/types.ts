export type TargetDate = 'today' | 'tomorrow';

export type Task = {
  id: string;
  text: string;
  targetDate: TargetDate;
  createdAt: number;
  completedAt: number | null;
  detail?: string;
  /** Parsed deadline timestamp, ms epoch. Set automatically when the task
   *  text contains an "at HH(:MM)?(am|pm)?" pattern. */
  dueAt?: number;
  /** When true the task repeats every day — completing it sends it to the
   *  pile for the day, then it returns fresh on the next load. */
  recurring?: boolean;
};
