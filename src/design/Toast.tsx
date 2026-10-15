import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { ease, tween } from './motion';
import { T } from './Typography';
import { color, duration, palette, shadow } from './tokens';

export interface ToastMessage {
  text: string;
  /** Micro label before the text, e.g. "Nota" or "Arquivo". */
  kicker?: string;
  action?: { label: string; onPress: () => void };
}

const ToastContext = createContext<(m: ToastMessage) => void>(() => undefined);

export function useToast() {
  return useContext(ToastContext);
}

/** A slip of paper that slides in at the bottom: short confirmations with an optional action. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const progress = useAnimatedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    tween(progress, 0, duration.fast, ease.exit).start(({ finished }) => {
      if (finished) setMessage(null);
    });
  }, [progress]);

  const show = useCallback(
    (m: ToastMessage) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(m);
      progress.setValue(0);
      tween(progress, 1, duration.base, ease.enter).start();
      timer.current = setTimeout(hide, m.action ? 5200 : 3200);
    },
    [hide, progress],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.layer, { paddingBottom: insets.bottom + 20 }]}>
          <Animated.View
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              {
                opacity: progress,
                transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              },
            ]}
          >
            {message.kicker ? (
              <T variant="micro" tone="muted" style={styles.kicker}>
                {message.kicker}
              </T>
            ) : null}
            <T variant="bodySm" style={styles.text}>
              {message.text}
            </T>
            {message.action ? (
              <Pressable
                onPress={() => {
                  message.action?.onPress();
                  hide();
                }}
                accessibilityRole="button"
                hitSlop={8}
              >
                <T variant="labelStrong">{message.action.label} →</T>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  layer: { justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 16 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    maxWidth: 560,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: palette.ink2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.lineStrong,
    boxShadow: shadow.item,
  },
  kicker: { marginRight: -4 },
  text: { flexShrink: 1 },
});
