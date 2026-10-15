import { ReactNode, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { haptic } from './haptics';
import { T, useSurface } from './Typography';
import { color, palette } from './tokens';

type Variant = 'solid' | 'outline' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'sm' | 'md';
  /** Glyph before the label, e.g. "+". */
  leading?: string;
  /** Glyph after the label, e.g. "→". Nudges forward on hover. */
  trailing?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  /** Marks the control as selected (toggle buttons). */
  selected?: boolean;
  children?: ReactNode;
}

/** Square, mono-labelled button. Looks like a control on a technical drawing. */
export function Button({
  label,
  onPress,
  variant = 'outline',
  size = 'md',
  leading,
  trailing,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  style,
  selected,
}: ButtonProps) {
  const surface = useSurface();
  const [hovered, setHovered] = useState(false);
  const onPaper = surface === 'paper';
  const fg = onPaper ? palette.ink : palette.paper;
  const bg = onPaper ? palette.paper : palette.ink;

  let containerStyle: ViewStyle = {};
  let textColor: string = fg;
  switch (variant) {
    case 'solid':
      containerStyle = { backgroundColor: hovered ? (onPaper ? palette.graphite700 : palette.paperDim) : fg, borderColor: fg };
      textColor = bg;
      break;
    case 'outline':
      containerStyle = {
        borderColor: hovered || selected ? fg : onPaper ? color.sheetLine : color.lineStrong,
        backgroundColor: selected ? (onPaper ? palette.paperDim : palette.graphite800) : 'transparent',
      };
      break;
    case 'ghost':
      containerStyle = { borderColor: 'transparent' };
      textColor = hovered || selected ? fg : onPaper ? color.sheetTextSecondary : color.textSecondary;
      break;
    case 'danger':
      containerStyle = { borderColor: hovered ? color.signal : onPaper ? color.sheetLine : color.lineStrong };
      textColor = color.signal;
      break;
  }

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        haptic('select');
        onPress?.();
      }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      hitSlop={size === 'sm' ? 6 : 4}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        variant === 'ghost' && styles.ghost,
        containerStyle,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {leading ? (
        <T variant="label" color={textColor} style={styles.glyph}>
          {leading}
        </T>
      ) : null}
      <T variant="label" color={textColor} numberOfLines={1}>
        {label}
      </T>
      {trailing ? (
        <View style={{ transform: [{ translateX: hovered ? 3 : 0 }] }}>
          <T variant="label" color={textColor} style={styles.trailing}>
            {trailing}
          </T>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  md: { minHeight: 38, paddingHorizontal: 14 },
  sm: { minHeight: 30, paddingHorizontal: 10 },
  ghost: { paddingHorizontal: 4 },
  glyph: { marginRight: 6 },
  trailing: { marginLeft: 8 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.38 },
});
