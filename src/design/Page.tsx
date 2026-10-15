import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '../hooks/useResponsive';
import { layout } from './tokens';

/** Scrolling page with the editorial margins of each layout class. */
export function PageScroll({
  children,
  contentStyle,
  maxWidth = layout.maxContent,
}: {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  maxWidth?: number;
}) {
  const { isDesktop, isPhone, gutter } = useResponsive();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{
        paddingHorizontal: gutter,
        paddingTop: isDesktop ? 36 : 20,
        paddingBottom: (isPhone ? 40 : 64) + insets.bottom,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.inner, { maxWidth }, contentStyle]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { width: '100%', alignSelf: 'center', gap: 28 },
});
