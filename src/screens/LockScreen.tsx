import { useCallback, useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CombinationDial } from '../components/CombinationDial';
import { VaultMark, VaultWordmark } from '../components/VaultWordmark';
import { RegistrationMark, VintageKey } from '../design/engravings/Engravings';
import { ease, tween, useReducedMotion } from '../design/motion';
import { Rule } from '../design/primitives';
import { T } from '../design/Typography';
import { palette } from '../design/tokens';
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

const ERROR_RESET_MS = 1100;

const MESSAGES: Record<ComboState['status'], string> = {
  idle: 'Gire o disco até o número e pressione o centro para registrar.',
  progress: 'Número registrado. Continue a sequência.',
  error: 'Sequência incorreta. Tente novamente.',
  unlocked: 'Acesso liberado.',
};

const POSITIONS = ['I', 'II', 'III', 'IV'];

interface Props {
  onUnlocked: () => void;
  /** Starts the entrance animation (held back while the splash covers the screen). */
  active?: boolean;
}

/**
 * Login: a modern, tactile combination dial set in an archive's access room —
 * an index card for the reading, engraved key, printer's marks.
 */
export function LockScreen({ onUnlocked, active = true }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height, isWide, isPhone } = useResponsive();
  const reduced = useReducedMotion();

  const [combo, setCombo] = useState<ComboState>(INITIAL_COMBO_STATE);
  const [value, setValue] = useState(0);
  const [errorSignal, setErrorSignal] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const exit = useAnimatedValue(0);
  const enter = useAnimatedValue(0);

  useEffect(() => {
    if (!active) return;
    tween(enter, 1, reduced ? 1 : 760, ease.enter).start();
  }, [active, enter, reduced]);

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
    tween(exit, 1, 520, ease.exit).start(({ finished }) => finished && onUnlocked());
  }, [exit, onUnlocked]);

  const availH = height - insets.top - insets.bottom;
  const dialSize = Math.round(
    isWide ? Math.min(availH * 0.72, width * 0.42, 600) : Math.min(width - 40, availH * (isPhone ? 0.47 : 0.52), 460),
  );

  const unlocked = combo.status === 'unlocked';
  const isError = combo.status === 'error';

  const fadeOut = exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const lift = (offset: number) => ({
    opacity: Animated.multiply(enter, fadeOut),
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
  });
  const dialStyle = {
    opacity: Animated.multiply(enter, fadeOut),
    transform: [
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
      { scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
    ],
  };

  const digits = formatStep(value).split('');
  const reading = (
    <View
      style={styles.digits}
      accessible
      accessibilityLabel={`Número atual ${formatStep(value)}`}
      accessibilityLiveRegion="polite"
    >
      {digits.map((d, i) => (
        <View key={i} style={{ width: isWide ? 50 : 34, alignItems: 'center' }}>
          <T variant="display" size={isWide ? 92 : 60} accessible={false}>
            {d}
          </T>
        </View>
      ))}
    </View>
  );

  const slots = (
    <View style={styles.slots}>
      {UNLOCK_SEQUENCE.map((_, i) => {
        const entry = combo.entered[i];
        const filled = entry !== undefined;
        return (
          <View key={i} style={styles.slotWrap}>
            <T variant="micro" tone="muted">
              {POSITIONS[i]}
            </T>
            <View
              style={[
                styles.slot,
                filled && styles.slotFilled,
                isError && filled && styles.slotError,
                unlocked && styles.slotUnlocked,
              ]}
            >
              <T
                variant="labelStrong"
                size={14}
                color={unlocked ? palette.ink : filled ? palette.paper : palette.graphite500}
              >
                {filled ? formatStep(entry) : '––'}
              </T>
            </View>
          </View>
        );
      })}
    </View>
  );

  const message = (
    <T
      variant="caption"
      size={isWide ? 16 : 15}
      tone={isError ? 'signal' : 'secondary'}
      align={isWide ? 'left' : 'center'}
      style={styles.message}
      accessibilityLiveRegion="assertive"
    >
      {MESSAGES[combo.status]}
    </T>
  );

  const hint = (
    <View style={[styles.hint, isWide && styles.hintWide]}>
      {Platform.OS === 'web' && !isPhone ? (
        <T variant="micro" tone="muted">
          Arraste · roda do mouse · ← → · Enter registra
        </T>
      ) : null}
      <Pressable
        onPress={() => setShowHint((s) => !s)}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed }) => [styles.hintButton, pressed && styles.pressed]}
      >
        <T variant="micro" tone="secondary" style={styles.underline}>
          {showHint ? `Sequência demo: ${UNLOCK_SEQUENCE.map(formatStep).join(' → ')}` : 'Modo demonstrativo · ver dica'}
        </T>
      </Pressable>
    </View>
  );

  const dial = (
    <Animated.View style={dialStyle}>
      <CombinationDial
        size={dialSize}
        onConfirm={handleConfirm}
        onValueChange={setValue}
        disabled={unlocked || isError}
        unlocked={unlocked}
        onUnlockAnimationEnd={handleUnlockEnd}
        errorSignal={errorSignal}
      />
    </Animated.View>
  );

  const folio = (
    <Animated.View style={[styles.folio, lift(-6)]}>
      <View style={styles.folioRow}>
        <T variant="micro" tone="secondary">
          Cofre Nº 01
        </T>
        {!isPhone ? (
          <T variant="micro" tone="muted">
            Arquivo VISUVAULT
          </T>
        ) : null}
        <T variant="micro" tone="secondary">
          Acesso restrito
        </T>
      </View>
      <Rule weight="double" style={styles.folioRule} />
    </Animated.View>
  );

  if (isWide) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.mark, { top: insets.top + 10, left: 12 }]}>
          <RegistrationMark size={16} stroke={palette.graphite600} />
        </View>
        <View style={[styles.mark, { bottom: insets.bottom + 10, right: 12 }]}>
          <RegistrationMark size={16} stroke={palette.graphite600} />
        </View>
        {folio}
        <View style={styles.wideRow}>
          <Animated.View style={[styles.card, lift(12)]}>
            <View style={styles.brand}>
              <VaultMark size={30} />
              <VaultWordmark size="md" />
            </View>
            <T variant="display" style={styles.headline} accessibilityRole="header">
              Acesso{'\n'}
              <T variant="display" italic tone="secondary">
                restrito.
              </T>
            </T>
            <View style={styles.index}>
              <Rule strong />
              <View style={styles.indexRow}>
                <T variant="micro" tone="muted" style={styles.indexLabel}>
                  Leitura
                </T>
                {reading}
              </View>
              <Rule />
              <View style={styles.indexRow}>
                <T variant="micro" tone="muted" style={styles.indexLabel}>
                  Combinação
                </T>
                {slots}
              </View>
              <Rule />
              <View style={[styles.indexRow, styles.indexRowTop]}>
                <T variant="micro" tone="muted" style={[styles.indexLabel, styles.indexLabelTop]}>
                  Estado
                </T>
                <View style={styles.flex}>{message}</View>
              </View>
              <Rule strong />
            </View>
            {hint}
            <View style={styles.key}>
              <VintageKey width={190} stroke={palette.graphite500} opacity={0.8} />
            </View>
          </Animated.View>
          {dial}
        </View>
        <Animated.View style={[styles.colophon, lift(6)]}>
          <Rule />
          <View style={styles.folioRow}>
            <T variant="micro" tone="muted">
              VISUVAULT · Sistema editorial proprietário
            </T>
            <T variant="micro" tone="muted">
              Sessão demonstrativa — nenhum dado privado
            </T>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      {folio}
      <View style={styles.column}>
        <Animated.View style={[styles.brand, lift(8)]}>
          <VaultMark size={24} />
          <VaultWordmark size="sm" />
        </Animated.View>
        <Animated.View style={[styles.readoutPhone, lift(10)]}>
          {reading}
          {slots}
          {message}
        </Animated.View>
        {dial}
        <Animated.View style={lift(6)}>{hint}</Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: palette.ink,
    paddingHorizontal: 20,
  },
  folio: { width: '100%', maxWidth: 1240, alignSelf: 'center' },
  folioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  folioRule: { marginTop: 8 },
  mark: { position: 'absolute' },
  column: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly' },
  wideRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 56,
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
  },
  card: { width: 380, gap: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headline: { marginTop: 4 },
  index: { gap: 0 },
  indexRow: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingVertical: 10 },
  indexRowTop: { alignItems: 'flex-start', minHeight: 64 },
  indexLabel: { width: 108 },
  indexLabelTop: { marginTop: 4 },
  digits: { flexDirection: 'row' },
  slots: { flexDirection: 'row', gap: 12 },
  slotWrap: { alignItems: 'center', gap: 4 },
  slot: {
    minWidth: 54,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.graphite600,
    alignItems: 'center',
  },
  slotFilled: { borderColor: palette.paperDim },
  slotError: { borderColor: palette.paper, borderStyle: 'dashed' },
  slotUnlocked: { borderColor: palette.paper, backgroundColor: palette.paper },
  message: { maxWidth: 320, minHeight: 40 },
  readoutPhone: { alignItems: 'center', gap: 10 },
  hint: { alignItems: 'center', gap: 6 },
  hintWide: { alignItems: 'flex-start' },
  hintButton: { paddingVertical: 4 },
  underline: { textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
  key: { marginTop: 4 },
  colophon: { width: '100%', maxWidth: 1240, alignSelf: 'center', gap: 8 },
});
