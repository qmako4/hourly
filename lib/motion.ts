import type { Transition } from 'framer-motion';

/** iOS-standard easing curve for the few duration-based tweens we keep
 *  (the strike line, the confirmation pop). */
export const EASE_IOS = [0.32, 0.72, 0, 1] as const;

/** Primary movement spring — stack reflow, the hero flight into the pile,
 *  the pile settling. Tight, fast settle, no perceptible overshoot. */
export const SPRING: Transition = { type: 'spring', stiffness: 260, damping: 30 };

/** Snappier spring for UI chrome — the day-toggle underline, the detail
 *  sheet, drag spring-back. A touch crisper than SPRING. */
export const SPRING_TIGHT: Transition = { type: 'spring', stiffness: 340, damping: 34 };

/** Quick opacity crossfade. */
export const FADE: Transition = { duration: 0.2, ease: EASE_IOS };

/** The strike-through draw — deliberately a duration so it reads as a
 *  single decisive stroke rather than a settle. */
export const STRIKE: Transition = { duration: 0.34, ease: EASE_IOS };
