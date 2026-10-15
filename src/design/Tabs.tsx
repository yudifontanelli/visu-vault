import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { haptic } from './haptics';
import { ease, useReducedMotion } from './motion';
import { T, useSurface } from './Typography';
import { duration, palette } from './tokens';

export interface TabItem<K extends string> {
  key: K;
  label: string;
  count?: number;
}

/** Text tabs with a sliding rule, like running heads in a magazine. */
export function Tabs<K extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
}) {
  const surface = useSurface();
  const reduced = useReducedMotion();
  const fg = surface === 'paper' ? palette.ink : palette.paper;
  const layouts = useRef<Record<string, { x: number; w: number }>>({});
  const [ready, setReady] = useState(false);
  const left = useAnimatedValue(0);
  const width = useAnimatedValue(0);

  const moveTo = (key: K, animate: boolean) => {
    const l = layouts.current[key];
    if (!l) return;
    if (!animate || reduced) {
      left.setValue(l.x);
      width.setValue(l.w);
      return;
    }
    Animated.parallel([
      Animated.timing(left, { toValue: l.x, duration: duration.base, easing: ease.standard, useNativeDriver: false }),
      Animated.timing(width, { toValue: l.w, duration: duration.base, easing: ease.standard, useNativeDriver: false }),
    ]).start();
  };

  useEffect(() => {
    moveTo(value, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onItemLayout = (key: K) => (e: LayoutChangeEvent) => {
    layouts.current[key] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
    if (key === value) {
      moveTo(key, false);
      if (!ready) setReady(true);
    }
  };

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onLayout={onItemLayout(it.key)}
            onPress={() => {
              if (!active) haptic('select');
              onChange(it.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            hitSlop={6}
          >
            <T variant="label" tone={active ? 'primary' : 'muted'}>
              {it.label}
              {it.count !== undefined ? ` · ${it.count}` : ''}
            </T>
          </Pressable>
        );
      })}
      <Animated.View
        pointerEvents="none"
        style={[styles.indicator, { backgroundColor: fg, left, width, opacity: ready ? 1 : 0 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 22, position: 'relative', alignSelf: 'flex-start' },
  tab: { paddingVertical: 8 },
  indicator: { position: 'absolute', bottom: 0, height: 1.5 },
  pressed: { opacity: 0.6 },
});
