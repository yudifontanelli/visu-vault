import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'tick' | 'select' | 'lift' | 'press' | 'success' | 'warning' | 'error';

/**
 * Tactile feedback for mechanisms (iPhone). A no-op on the web build, where the
 * Vibration API would only buzz phones and never matches the gesture precisely.
 */
export function haptic(kind: HapticKind) {
  if (Platform.OS === 'web') return;
  const run = async () => {
    switch (kind) {
      case 'tick':
      case 'select':
        return Haptics.selectionAsync();
      case 'lift':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case 'press':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'error':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  run().catch(() => undefined);
}
