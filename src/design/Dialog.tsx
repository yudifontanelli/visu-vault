import { ReactNode, useEffect } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '../hooks/useResponsive';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { ease, tween } from './motion';
import { Rule } from './primitives';
import { Sheet } from './Sheet';
import { T } from './Typography';
import { color, duration } from './tokens';

/**
 * Forms open as an index card on paper: centred on desktop, rising from the
 * bottom edge on iPhone. Escape (web) and the system back gesture close it.
 */
export function Dialog({
  visible,
  onClose,
  kicker,
  title,
  children,
  footer,
  width = 520,
}: {
  visible: boolean;
  onClose: () => void;
  kicker?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const { isPhone, height } = useResponsive();
  const insets = useSafeAreaInsets();
  const progress = useAnimatedValue(0);

  useEffect(() => {
    if (visible) {
      progress.setValue(0);
      tween(progress, 1, duration.slow, ease.enter).start();
    }
  }, [visible, progress]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={[styles.backdropWrap, isPhone ? styles.alignBottom : styles.alignCenter]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
          <Pressable style={[StyleSheet.absoluteFill, styles.scrim]} onPress={onClose} accessibilityLabel="Fechar" />
        </Animated.View>
        <Animated.View
          style={{
            width: isPhone ? '100%' : width,
            maxHeight: height * (isPhone ? 0.92 : 0.86),
            opacity: progress,
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [isPhone ? 40 : 16, 0] }) }],
          }}
        >
          <Sheet style={[styles.card, isPhone && { paddingBottom: insets.bottom + 16 }]} marks={!isPhone}>
            <View style={styles.header}>
              <View style={styles.flex}>
                {kicker ? (
                  <T variant="micro" tone="secondary">
                    {kicker}
                  </T>
                ) : null}
                <T variant="title" accessibilityRole="header">
                  {title}
                </T>
              </View>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={10}>
                <T variant="label">Fechar ×</T>
              </Pressable>
            </View>
            <Rule weight="double" strong style={styles.rule} />
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Sheet>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdropWrap: { flex: 1, padding: 16 },
  alignCenter: { alignItems: 'center', justifyContent: 'center' },
  alignBottom: { justifyContent: 'flex-end', padding: 0 },
  scrim: { backgroundColor: color.scrim },
  card: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  rule: { marginTop: 14, marginBottom: 4 },
  body: { flexGrow: 0 },
  bodyContent: { paddingVertical: 14, gap: 16 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingTop: 8 },
});
