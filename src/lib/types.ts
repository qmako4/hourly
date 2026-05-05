export type Task = {
  id: string;
  text: string;
  targetDate: string;
  createdAt: number;
  completedAt: number | null;
  lastNotified: number | null;
  rolledOver: boolean;
};
