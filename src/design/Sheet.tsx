import { ReactNode } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { SurfaceProvider } from './Typography';
import { color, palette, shadow as shadows } from './tokens';

const grainDark = require('../../assets/textures/grain-dark.png');
const grainLight = require('../../assets/textures/grain-light.png');

/** Paper grain, tiled. Kept faint: atmosphere, never noise. */
export function Grain({ tone = 'dark', opacity = 0.55 }: { tone?: 'dark' | 'light'; opacity?: number }) {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={tone === 'dark' ? grainDark : grainLight}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, { opacity, width: '100%', height: '100%' }]}
      />
    </View>
  );
}

/** Printer's crop marks drawn just outside a box's corners. */
export function CropMarks({ inset = -14, length = 10, tint }: { inset?: number; length?: number; tint?: string }) {
  const c = tint ?? palette.graphite500;
  const h = { position: 'absolute' as const, height: StyleSheet.hairlineWidth, width: length, backgroundColor: c };
  const v = { position: 'absolute' as const, width: StyleSheet.hairlineWidth, height: length, backgroundColor: c };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      <View style={[h, { top: 0, left: inset - length + 4 }]} />
      <View style={[v, { left: 0, top: inset - length + 4 }]} />
      <View style={[h, { top: 0, right: inset - length + 4 }]} />
      <View style={[v, { right: 0, top: inset - length + 4 }]} />
      <View style={[h, { bottom: 0, left: inset - length + 4 }]} />
      <View style={[v, { left: 0, bottom: inset - length + 4 }]} />
      <View style={[h, { bottom: 0, right: inset - length + 4 }]} />
      <View style={[v, { right: 0, bottom: inset - length + 4 }]} />
    </View>
  );
}

/**
 * A printed sheet laid on the dark desk: paper, faint grain, optional crop marks.
 * Children inherit the paper surface (ink text).
 */
export function Sheet({
  children,
  style,
  grain = true,
  marks = false,
  raised = true,
  tone = 'paper',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  grain?: boolean;
  marks?: boolean;
  raised?: boolean;
  tone?: 'paper' | 'dim';
}) {
  return (
    <View
      style={[
        styles.sheet,
        { backgroundColor: tone === 'dim' ? color.sheetDim : color.sheet },
        raised && { boxShadow: shadows.sheet },
        style,
      ]}
    >
      {grain ? <Grain tone="dark" opacity={0.5} /> : null}
      {marks ? <CropMarks /> : null}
      <SurfaceProvider value="paper">{children}</SurfaceProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'relative',
  },
});
