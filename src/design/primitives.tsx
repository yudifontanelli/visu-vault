import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { T, Tone, useSurface } from './Typography';
import { border, color, palette } from './tokens';

type RuleWeight = 'hair' | 'thin' | 'heavy' | 'double';

function lineColor(surface: 'ink' | 'paper', strong?: boolean) {
  if (surface === 'paper') return strong ? palette.ink : color.sheetLine;
  return strong ? color.lineStrong : color.line;
}

/** Horizontal rule. `double` is the classic editorial section rule. */
export function Rule({
  weight = 'hair',
  strong,
  label,
  style,
  color: raw,
}: {
  weight?: RuleWeight;
  strong?: boolean;
  /** Micro label sitting on the rule, left-aligned. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  color?: string;
}) {
  const surface = useSurface();
  const c = raw ?? lineColor(surface, strong);
  const h = weight === 'heavy' ? border.heavy : weight === 'thin' ? border.thin : StyleSheet.hairlineWidth;
  const line =
    weight === 'double' ? (
      <View style={styles.flex}>
        <View style={{ height: border.thin, backgroundColor: c }} />
        <View style={{ height: 2 }} />
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c }} />
      </View>
    ) : (
      <View style={[styles.flex, { height: h, backgroundColor: c }]} />
    );
  if (!label) return <View style={[styles.row, style]}>{line}</View>;
  return (
    <View style={[styles.row, styles.center, style]}>
      <T variant="micro" tone="muted" style={styles.ruleLabel}>
        {label}
      </T>
      {line}
    </View>
  );
}

export function VRule({ style, strong }: { style?: StyleProp<ViewStyle>; strong?: boolean }) {
  const surface = useSurface();
  return <View style={[{ width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: lineColor(surface, strong) }, style]} />;
}

/** Table-of-contents dot leaders: "Brainstorm . . . . . . 14". Clipped, never ellipsised. */
export function Leaders({ tone = 'muted' }: { tone?: Tone }) {
  return (
    <View style={styles.leaders} accessible={false} importantForAccessibility="no-hide-descendants">
      <T variant="numeral" tone={tone} style={styles.leadersText}>
        {'. '.repeat(160)}
      </T>
    </View>
  );
}

/** Square hairline tag in mono micro caps. */
export function Tag({ children, tone = 'secondary', filled }: { children: ReactNode; tone?: Tone; filled?: boolean }) {
  const surface = useSurface();
  const borderColor = surface === 'paper' ? color.sheetLine : color.lineStrong;
  return (
    <View
      style={[
        styles.tag,
        { borderColor },
        filled && { backgroundColor: surface === 'paper' ? palette.ink : palette.paper, borderColor: 'transparent' },
      ]}
    >
      <T variant="micro" tone={filled ? 'inverse' : tone}>
        {children}
      </T>
    </View>
  );
}

/** Rubber stamp: double frame, slight rotation, mono caps. Used sparingly. */
export function Stamp({
  children,
  tone = 'primary',
  rotate = -5,
  style,
}: {
  children: ReactNode;
  tone?: 'primary' | 'signal' | 'secondary';
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const surface = useSurface();
  const c = tone === 'signal' ? color.signal : tone === 'secondary' ? (surface === 'paper' ? color.sheetTextSecondary : color.textSecondary) : surface === 'paper' ? palette.ink : palette.paper;
  return (
    <View style={[styles.stampOuter, { borderColor: c, transform: [{ rotate: `${rotate}deg` }] }, style]} accessibilityRole="text">
      <View style={[styles.stampInner, { borderColor: c }]}>
        <T variant="labelStrong" color={c} style={styles.stampText}>
          {children}
        </T>
      </View>
    </View>
  );
}

/** Small monogram square (team members). */
export function Monogram({ initials, size = 36, inverted }: { initials: string; size?: number; inverted?: boolean }) {
  const surface = useSurface();
  const fg = inverted ? (surface === 'paper' ? palette.paper : palette.ink) : surface === 'paper' ? palette.ink : palette.paper;
  const bg = inverted ? (surface === 'paper' ? palette.ink : palette.paper) : 'transparent';
  return (
    <View style={[styles.mono, { width: size, height: size, borderColor: fg, backgroundColor: bg }]}>
      <T variant="heading" color={fg} size={Math.round(size * 0.48)} style={styles.monoText}>
        {initials}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  center: { alignItems: 'center' },
  ruleLabel: { marginRight: 10 },
  leaders: { flex: 1, overflow: 'hidden', height: 15, marginHorizontal: 6 },
  leadersText: { width: 2400 },
  tag: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  stampOuter: {
    borderWidth: 1.5,
    padding: 2,
    alignSelf: 'flex-start',
    opacity: 0.82,
  },
  stampInner: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stampText: { letterSpacing: 3 },
  mono: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monoText: { marginTop: 2 },
});
