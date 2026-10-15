import { ReactNode, useState } from 'react';
import { AccessibilityRole, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

import { haptic as fireHaptic, HapticKind } from './haptics';

export interface InteractionState {
  hovered: boolean;
  pressed: boolean;
}

/**
 * Pressable that exposes hover (desktop pointer) and press state to its
 * children, so rows can shift, reveal arrows or underline on hover.
 */
export function Hoverable({
  children,
  style,
  onPress,
  haptic = 'select',
  accessibilityRole = 'button',
  ...rest
}: Omit<PressableProps, 'children' | 'style'> & {
  children: (state: InteractionState) => ReactNode;
  style?: StyleProp<ViewStyle> | ((state: InteractionState) => StyleProp<ViewStyle>);
  haptic?: HapticKind | null;
  accessibilityRole?: AccessibilityRole;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...rest}
      accessibilityRole={accessibilityRole}
      onHoverIn={(e) => {
        setHovered(true);
        rest.onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        setHovered(false);
        rest.onHoverOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) fireHaptic(haptic);
        onPress?.(e);
      }}
      style={({ pressed }) => (typeof style === 'function' ? style({ hovered, pressed }) : style)}
    >
      {({ pressed }) => children({ hovered, pressed })}
    </Pressable>
  );
}
