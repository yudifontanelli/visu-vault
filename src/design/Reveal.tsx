import { ReactNode, useEffect } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { ease, tween, useReducedMotion } from './motion';
import { duration, stagger } from './tokens';

/**
 * Editorial entrance: content settles into place like a sheet slid onto the desk.
 * `index` staggers siblings; reduced-motion users get the content immediately.
 */
export function Reveal({
  children,
  index = 0,
  delay = 0,
  from = 10,
  axis = 'y',
  style,
}: {
  children: ReactNode;
  index?: number;
  delay?: number;
  from?: number;
  axis?: 'x' | 'y';
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const progress = useAnimatedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = tween(progress, 1, duration.slow + 120, ease.enter, delay + index * stagger);
    anim.start();
    return () => anim.stop();
  }, [delay, index, progress, reduced]);

  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] });
  return (
    <Animated.View
      style={[
        { opacity: progress, transform: axis === 'y' ? [{ translateY: offset }] : [{ translateX: offset }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
