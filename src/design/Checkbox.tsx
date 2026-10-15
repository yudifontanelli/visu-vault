import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { haptic } from './haptics';
import { T, useSurface } from './Typography';
import { color, palette } from './tokens';

/** Square box with a pen-drawn tick, as on a printed checklist. */
export function Checkbox({
  checked,
  onChange,
  label,
  detail,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  detail?: string;
  disabled?: boolean;
}) {
  const surface = useSurface();
  const [hovered, setHovered] = useState(false);
  const fg = surface === 'paper' ? palette.ink : palette.paper;
  const boxBorder = checked || hovered ? fg : surface === 'paper' ? palette.graphite400 : color.lineStrong;
  return (
    <Pressable
      onPress={() => {
        haptic('select');
        onChange(!checked);
      }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      hitSlop={4}
    >
      <View style={[styles.box, { borderColor: boxBorder }]}>
        {checked ? (
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Path d="M2.2 7.6 L5.6 10.8 L11.8 2.8" stroke={fg} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        ) : null}
      </View>
      <View style={styles.texts}>
        {typeof label === 'string' ? (
          <T variant="body" tone={checked ? 'secondary' : 'primary'} style={checked && styles.struck}>
            {label}
          </T>
        ) : (
          label
        )}
        {detail ? (
          <T variant="micro" tone="muted">
            {detail}
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  box: {
    width: 18,
    height: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  texts: { flex: 1, gap: 2 },
  struck: { textDecorationLine: 'line-through' },
  pressed: { opacity: 0.7 },
});
