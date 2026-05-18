/** Tiny tactile feedback. No-op where the Vibration API is unavailable
 *  (iOS Safari in a tab; supported in installed PWAs and on Android). */
export function buzz(ms = 8): void {
  if (typeof navigator === 'undefined') return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* some browsers throw if called without a user gesture */
  }
}
