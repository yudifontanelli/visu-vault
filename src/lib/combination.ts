/**
 * Pure combination-lock logic for the VAULT dial.
 *
 * The dial carries a 00–99 scale laid out clockwise. Rotation is measured in
 * degrees, clockwise positive, with 0° meaning "00 sits under the indicator".
 * Like a physical safe dial, turning clockwise makes the number under the
 * indicator go down.
 *
 * Kept free of React / React Native imports so it can be unit-tested with the
 * Node test runner.
 */

export const DIAL_STEPS = 100;
export const DEGREES_PER_STEP = 360 / DIAL_STEPS;

/**
 * Symbolic demo sequence "1294", read on a 00–99 dial as two stops: 12 → 94.
 * Demo-only: it gates a demonstration Home and protects no private data.
 */
export const UNLOCK_SEQUENCE: readonly number[] = [12, 94];

export type ComboStatus = 'idle' | 'progress' | 'error' | 'unlocked';

export interface ComboState {
  entered: number[];
  status: ComboStatus;
}

export const INITIAL_COMBO_STATE: ComboState = { entered: [], status: 'idle' };

/** Wraps any integer into the 0–99 range. */
export function normalizeStep(step: number): number {
  const n = Math.round(step) % DIAL_STEPS;
  // `+ 0` turns -0 into 0.
  return n < 0 ? n + DIAL_STEPS : n + 0;
}

/** The scale value currently under the fixed indicator for a given rotation. */
export function valueAtRotation(rotationDeg: number): number {
  return normalizeStep(-rotationDeg / DEGREES_PER_STEP);
}

/** Nearest rotation (keeping continuity with the current one) that rests exactly on a step. */
export function snapRotation(rotationDeg: number): number {
  const snapped = Math.round(rotationDeg / DEGREES_PER_STEP) * DEGREES_PER_STEP;
  // Avoid returning -0, which makes comparisons and snapshots noisy.
  return snapped === 0 ? 0 : snapped;
}

/** Shortest signed angular difference from `from` to `to`, in (-180, 180]. */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * Angle of a point relative to the dial centre, in degrees:
 * 0° at 12 o'clock, increasing clockwise (screen coordinates, y down).
 */
export function pointerAngle(dx: number, dy: number): number {
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return deg < 0 ? deg + 360 : deg;
}

/** Formats a scale value as two digits, e.g. 7 → "07". */
export function formatStep(value: number): string {
  return normalizeStep(value).toString().padStart(2, '0');
}

/**
 * Registers one dialled number. A wrong number puts the lock in `error`; the
 * caller shows feedback and then calls `resetCombo`. Completing the sequence
 * yields `unlocked`. Input after `unlocked` or `error` is ignored.
 */
export function enterValue(
  state: ComboState,
  value: number,
  sequence: readonly number[] = UNLOCK_SEQUENCE,
): ComboState {
  if (state.status === 'unlocked' || state.status === 'error') return state;
  const entered = [...state.entered, normalizeStep(value)];
  const index = entered.length - 1;
  if (entered[index] !== sequence[index]) {
    return { entered, status: 'error' };
  }
  if (entered.length === sequence.length) {
    return { entered, status: 'unlocked' };
  }
  return { entered, status: 'progress' };
}

export function resetCombo(): ComboState {
  return { entered: [], status: 'idle' };
}
