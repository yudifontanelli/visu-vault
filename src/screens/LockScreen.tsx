import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CombinationDial } from '../components/CombinationDial';
import { VaultWordmark } from '../components/VaultWordmark';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { useResponsive } from '../hooks/useResponsive';
import {
  ComboState,
  INITIAL_COMBO_STATE,
  UNLOCK_SEQUENCE,
  enterValue,
  formatStep,
  resetCombo,
} from '../lib/combination';
import { colors, fonts } from '../theme';

const useNativeDriver = Platform.OS !== 'web';
const ERROR_RESET_MS = 1100;

const MESSAGES: Record<ComboState['status'], string> = {
  idle: 'Gire o disco até o número e pressione o centro para registrar.',
  progress: 'Número registrado. Continue a sequência.',
  error: 'Sequência incorreta. Tente novamente.',
  unlocked: 'Acesso liberado.',
};

interface Props {
  onUnlocked: () => void;
}

export function LockScreen({ onUnlocked }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height, isWide, isPhone } = useResponsive();

  const [combo, setCombo] = useState<ComboState>(INITIAL_COMBO_STATE);
  const [value, setValue] = useState(0);
  const [errorSignal, setErrorSignal] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const exit = useAnimatedValue(0);
  const enter = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    }).start();
  }, [enter]);

  useEffect(() => {
    if (combo.status !== 'error') return;
    const t = setTimeout(() => setCombo(resetCombo()), ERROR_RESET_MS);
    return () => clearTimeout(t);
  }, [combo.status]);

  const handleConfirm = useCallback(
    (dialled: number) => {
      const next = enterValue(combo, dialled);
      if (next === combo) return;
      setCombo(next);
      if (next.status === 'error') setErrorSignal((n) => n + 1);
    },
    [combo],
  );

  const handleUnlockEnd = useCallback(() => {
    Animated.timing(exit, {
      toValue: 1,
      duration: 520,
      easing: Easing.in(Easing.cubic),
      useNativeDriver,
    }).start(({ finished }) => finished && onUnlocked());
  }, [exit, onUnlocked]);

  const availH = height - insets.top - insets.bottom;
  const dialSize = Math.round(
    isWide
      ? Math.min(availH * 0.74, width * 0.44, 580)
      : Math.min(width - 40, availH * (isPhone ? 0.5 : 0.55), 460),
  );

  const unlocked = combo.status === 'unlocked';
  const isError = combo.status === 'error';

  const screenStyle = {
    opacity: Animated.multiply(enter, exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })),
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
    ],
  };

  const readout = (
    <View style={[styles.readoutBlock, isWide && styles.readoutBlockWide]}>
      <Text style={styles.eyebrow}>COMBINAÇÃO</Text>
      <Text
        style={[styles.readout, isWide && styles.readoutWide]}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Número atual ${formatStep(value)}`}
      >
        {formatStep(value)}
      </Text>
      <View style={styles.slots}>
        {UNLOCK_SEQUENCE.map((_, i) => {
          const entry = combo.entered[i];
          const filled = entry !== undefined;
          return (
            <View
              key={i}
              style={[
                styles.slot,
                filled && styles.slotFilled,
                isError && filled && styles.slotError,
                unlocked && styles.slotUnlocked,
              ]}
            >
              <Text style={[styles.slotText, filled && styles.slotTextFilled, unlocked && styles.slotTextUnlocked]}>
                {filled ? formatStep(entry) : '––'}
              </Text>
            </View>
          );
        })}
      </View>
      <Text
        style={[styles.message, isError && styles.messageError, isWide && styles.textLeft]}
        accessibilityLiveRegion="assertive"
      >
        {MESSAGES[combo.status]}
      </Text>
    </View>
  );

  const footer = (
    <View style={[styles.footer, isWide && styles.footerWide]}>
      {Platform.OS === 'web' && !isPhone && (
        <Text style={[styles.footnote, isWide && styles.textLeft]}>
          Arraste com o mouse, use a roda ou ← → · Enter registra
        </Text>
      )}
      <Pressable
        onPress={() => setShowHint((s) => !s)}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed }) => [styles.hintButton, pressed && styles.pressed]}
      >
        <Text style={styles.hintButtonText}>
          {showHint
            ? `Sequência demo: ${UNLOCK_SEQUENCE.map(formatStep).join(' → ')}`
            : 'Modo demonstrativo · ver dica'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.screen,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
        screenStyle,
      ]}
    >
      {isWide ? (
        <View style={styles.wideRow}>
          <View style={styles.wideCopy}>
            <VaultWordmark />
            <Text style={styles.title}>Workspace criativo privado.</Text>
            {readout}
            {footer}
          </View>
          <CombinationDial
            size={dialSize}
            onConfirm={handleConfirm}
            onValueChange={setValue}
            disabled={unlocked || isError}
            unlocked={unlocked}
            onUnlockAnimationEnd={handleUnlockEnd}
            errorSignal={errorSignal}
          />
        </View>
      ) : (
        <View style={styles.column}>
          <VaultWordmark size={isPhone ? 'sm' : 'lg'} />
          {readout}
          <CombinationDial
            size={dialSize}
            onConfirm={handleConfirm}
            onValueChange={setValue}
            disabled={unlocked || isError}
            unlocked={unlocked}
            onUnlockAnimationEnd={handleUnlockEnd}
            errorSignal={errorSignal}
          />
          {footer}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: 20,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  wideRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 72,
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
  },
  wideCopy: {
    width: 360,
    gap: 28,
  },
  title: {
    color: colors.graphite300,
    fontFamily: fonts.sans,
    fontSize: 15,
    letterSpacing: 0.4,
  },
  readoutBlock: {
    alignItems: 'center',
    gap: 10,
  },
  readoutBlockWide: {
    alignItems: 'flex-start',
  },
  eyebrow: {
    color: colors.graphite400,
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 4,
  },
  readout: {
    color: colors.offWhite,
    fontFamily: fonts.sans,
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  readoutWide: {
    fontSize: 80,
  },
  slots: {
    flexDirection: 'row',
    gap: 10,
  },
  slot: {
    minWidth: 54,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.graphite600,
    alignItems: 'center',
  },
  slotFilled: {
    borderColor: colors.offWhiteDim,
  },
  slotError: {
    borderColor: colors.error,
  },
  slotUnlocked: {
    borderColor: colors.offWhite,
    backgroundColor: colors.offWhite,
  },
  slotText: {
    color: colors.graphite500,
    fontFamily: fonts.sans,
    fontSize: 15,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  slotTextFilled: {
    color: colors.offWhite,
  },
  slotTextUnlocked: {
    color: colors.black,
  },
  message: {
    color: colors.graphite300,
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    minHeight: 34,
  },
  messageError: {
    color: colors.error,
  },
  textLeft: {
    textAlign: 'left',
  },
  footer: {
    alignItems: 'center',
    gap: 8,
  },
  footerWide: {
    alignItems: 'flex-start',
  },
  footnote: {
    color: colors.graphite500,
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  hintButton: {
    paddingVertical: 6,
  },
  hintButtonText: {
    color: colors.graphite400,
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: 0.6,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.6,
  },
});
