import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { T, useSurface } from '../design/Typography';
import { palette } from '../design/tokens';

/**
 * Brand mark, same drawing as the app icon: dial ring, indicator and knob.
 * Deliberately carries no numbers.
 */
export function VaultMark({ size = 28, tint }: { size?: number; tint?: string }) {
  const surface = useSurface();
  const c = tint ?? (surface === 'paper' ? palette.ink : palette.paper);
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden>
      <Path d="M13.6 0.8 H18.4 L16 4.2 Z" fill={c} />
      <Circle cx={16} cy={18} r={11.6} fill="none" stroke={c} strokeWidth={2} />
      <Circle cx={16} cy={18} r={5.6} fill="none" stroke={c} strokeOpacity={0.35} strokeWidth={1} />
      <Circle cx={16} cy={18} r={3.4} fill={c} />
    </Svg>
  );
}

/** Wordmark: the mark, VAULT in the editorial serif, and the publisher line. */
export function VaultWordmark({ size = 'lg', showTagline = true }: { size?: 'sm' | 'lg'; showTagline?: boolean }) {
  const lg = size === 'lg';
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="VAULT by VISUVAULT">
      <VaultMark size={lg ? 30 : 22} />
      <View>
        <T variant={lg ? 'title' : 'heading'} style={lg ? styles.wordLg : styles.wordSm}>
          VAULT
        </T>
        {showTagline ? (
          <T variant="micro" tone="muted">
            by VISUVAULT
          </T>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordLg: { letterSpacing: 8 },
  wordSm: { letterSpacing: 6 },
});
