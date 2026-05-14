export type TargetDate = 'today' | 'tomorrow';

export type Task = {
  id: string;
  text: string;
  targetDate: TargetDate;
  createdAt: number;
  completedAt: number | null;
  detail?: string;
};
