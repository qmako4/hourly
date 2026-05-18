import type { Task } from './types';
import { findTimePhrase, formatTimeLabel } from './parseDeadline';

export type TaskView = {
  /** Text with the recognised "at 12pm" phrase removed, for clean display. */
  display: string;
  /** Compact deadline label for the chip, or null when there's no reminder. */
  timeLabel: string | null;
};

/**
 * Split a task into the text to show on the pill and an optional time chip.
 * Only strips the time phrase when a live deadline (`dueAt`) is set, so a
 * past/unparsed time stays visible in the raw text.
 */
export function taskView(task: Task): TaskView {
  if (task.dueAt == null) {
    return { display: task.text, timeLabel: null };
  }
  const found = findTimePhrase(task.text);
  if (!found) {
    return { display: task.text, timeLabel: formatTimeLabel(task.dueAt) };
  }
  const before = task.text.slice(0, found.index);
  const after = task.text.slice(found.index + found.phrase.length);
  const display = `${before}${after}`.replace(/\s{2,}/g, ' ').trim();
  return {
    display: display.length > 0 ? display : task.text,
    timeLabel: formatTimeLabel(task.dueAt),
  };
}
