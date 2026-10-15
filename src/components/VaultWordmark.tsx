import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fonts } from '../theme';

/**
 * Brand mark, same drawing as the app icon: dial ring, indicator and knob.
 * Deliberately carries no numbers.
 */
export function VaultMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden>
      <Path d="M13.6 0.8 H18.4 L16 4.2 Z" fill={colors.offWhite} />
      <Circle cx={16} cy={18} r={11.6} fill="none" stroke={colors.offWhite} strokeWidth={2} />
      <Circle cx={16} cy={18} r={5.6} fill="none" stroke={colors.offWhite} strokeOpacity={0.35} strokeWidth={1} />
      <Circle cx={16} cy={18} r={3.4} fill={colors.offWhite} />
    </Svg>
  );
}

interface Props {
  size?: 'sm' | 'lg';
  showTagline?: boolean;
}

export function VaultWordmark({ size = 'lg', showTagline = true }: Props) {
  const lg = size === 'lg';
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="VAULT by VISUVAULT">
      <VaultMark size={lg ? 34 : 24} />
      <View style={styles.texts}>
        <Text style={[styles.word, lg ? styles.wordLg : styles.wordSm]}>VAULT</Text>
        {showTagline && <Text style={styles.tagline}>BY VISUVAULT</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  texts: {
    justifyContent: 'center',
  },
  word: {
    color: colors.offWhite,
    fontFamily: fonts.sans,
    fontWeight: '300',
  },
  wordLg: {
    fontSize: 28,
    letterSpacing: 11,
  },
  wordSm: {
    fontSize: 18,
    letterSpacing: 7,
  },
  tagline: {
    color: colors.graphite300,
    fontFamily: fonts.sans,
    fontSize: 9,
    letterSpacing: 3.5,
    marginTop: 2,
  },
});
