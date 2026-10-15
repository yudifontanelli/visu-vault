import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';

import { curves, duration } from './tokens';

export const useNativeDriver = Platform.OS !== 'web';

export const ease = {
  standard: Easing.bezier(...curves.standard),
  enter: Easing.bezier(...curves.enter),
  exit: Easing.bezier(...curves.exit),
  mechanical: Easing.bezier(...curves.mechanical),
};

let reducedMotion = false;
const listeners = new Set<(v: boolean) => void>();

AccessibilityInfo.isReduceMotionEnabled?.()
  .then((v) => {
    reducedMotion = v;
    listeners.forEach((l) => l(v));
  })
  .catch(() => undefined);
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
  reducedMotion = v;
  listeners.forEach((l) => l(v));
});

/** Honours the OS "reduce motion" setting (iOS, macOS and Windows browsers). */
export function useReducedMotion() {
  const [value, setValue] = useState(reducedMotion);
  useEffect(() => {
    listeners.add(setValue);
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
}

export function isReducedMotion() {
  return reducedMotion;
}

/** Timing helper with the house easing and native driver where available. */
export function tween(
  value: Animated.Value,
  toValue: number,
  ms: number = duration.base,
  easing: (t: number) => number = ease.standard,
  delay = 0,
) {
  return Animated.timing(value, { toValue, duration: ms, easing, delay, useNativeDriver });
}
