import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { T, trackingFor, useSurface } from '../design/Typography';
import { palette } from '../design/tokens';

/**
 * Current app mark, same drawing as the app icon: dial ring, indicator and knob.
 * Deliberately carries no numbers (1294 is never part of the brand).
 *
 * VAULT 2.0 asks for the approved minimalist keyhole mark. That file is not in
 * the project yet, so this drawing stays untouched until it arrives.
 */
export function VaultMark({ size = 28, tint }: { size?: number; tint?: string }) {
  const surface = useSurface();
  const c = tint ?? (surface === 'paper' ? palette.ink : palette.paper);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Path d="M13.6 0.8 H18.4 L16 4.2 Z" fill={c} />
        <Circle cx={16} cy={18} r={11.6} fill="none" stroke={c} strokeWidth={2} />
        <Circle cx={16} cy={18} r={5.6} fill="none" stroke={c} strokeOpacity={0.35} strokeWidth={1} />
        <Circle cx={16} cy={18} r={3.4} fill={c} />
      </Svg>
    </View>
  );
}

export type WordmarkSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<WordmarkSize, { word: number; publisher: number; gap: number }> = {
  sm: { word: 17, publisher: 8.5, gap: 1 },
  md: { word: 26, publisher: 9.5, gap: 3 },
  lg: { word: 40, publisher: 10.5, gap: 5 },
  xl: { word: 64, publisher: 12, gap: 8 },
};

/**
 * The VAULT wordmark: "VISUVAULT®" over "VAULT" in the brand face, uppercase,
 * tracked +0.12em. The only place the brand face is used — never set VAULT
 * inline with <T>.
 */
export function VaultWordmark({
  size = 'md',
  align = 'left',
  publisher = true,
  tint,
  asHeader = false,
  style,
}: {
  /** A preset, or the cap size in px for one-off mastheads. */
  size?: WordmarkSize | number;
  align?: 'left' | 'center';
  /** Shows "VISUVAULT®" above the wordmark. */
  publisher?: boolean;
  /** Raw colour; defaults to the primary text colour of the surface. */
  tint?: string;
  /** Marks it as the screen's heading for assistive technology. */
  asHeader?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const s = typeof size === 'number' ? { word: size, publisher: Math.min(16, Math.max(9, Math.round(size * 0.12))), gap: Math.round(size * 0.08) } : SIZES[size];
  return (
    <View
      accessible
      accessibilityRole={asHeader ? 'header' : 'image'}
      accessibilityLabel={publisher ? 'VAULT, VISUVAULT®' : 'VAULT'}
      style={[styles.stack, { gap: s.gap, alignItems: align === 'center' ? 'center' : 'flex-start' }, style]}
    >
      {publisher ? (
        <T
          variant="micro"
          size={s.publisher}
          tone="secondary"
          color={tint}
          // Tracking adds space after the last letter too; pull it back so caps centre optically.
          style={{ marginRight: -trackingFor('micro', s.publisher) }}
        >
          VISUVAULT®
        </T>
      ) : null}
      <T variant="wordmark" size={s.word} color={tint} style={{ marginRight: -trackingFor('wordmark', s.word) }}>
        VAULT
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'column' },
});
