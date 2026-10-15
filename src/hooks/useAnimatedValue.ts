import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * Stable Animated.Value for the component's lifetime. React Native ships its
 * own `useAnimatedValue`, but react-native-web does not, so we keep one here.
 */
export function useAnimatedValue(initial: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initial));
  return value;
}
