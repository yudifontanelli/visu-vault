import { createContext, ReactNode, useContext } from 'react';
import { StyleProp, Text, TextProps, TextStyle, useWindowDimensions } from 'react-native';

import { font, FontRole } from './fonts';
import { color, emphasis, layout, palette, Surface } from './tokens';

interface Scale {
  size: number;
  line: number;
  tracking?: number;
}

interface VariantSpec extends Scale {
  role: FontRole;
  upper?: boolean;
  /** Tracking in em, so it follows size overrides (px `tracking` wins if both are set). */
  trackingEm?: number;
  /** Tabular figures, so columns of numbers line up. */
  tabular?: boolean;
  /** Smaller scale used on phones, so headlines never need horizontal scrolling. */
  phone?: Scale;
}

/**
 * Type scale. The brand face sets only the VAULT wordmark; Instrument Serif
 * carries editorial voice (headlines, captions); Instrument Sans carries all
 * functional text — body, controls, labels and numbers.
 */
export const variants = {
  /** VAULT wordmark: brand face, uppercase, +0.12em. Use through <VaultWordmark>. */
  wordmark: { role: 'brand', size: 40, line: 44, trackingEm: 0.12, upper: true },
  masthead: { role: 'serif', size: 152, line: 132, tracking: -3, phone: { size: 78, line: 70, tracking: -1.5 } },
  display: { role: 'serif', size: 76, line: 74, tracking: -1.2, phone: { size: 46, line: 46, tracking: -0.6 } },
  headline: { role: 'serif', size: 46, line: 48, tracking: -0.6, phone: { size: 34, line: 37, tracking: -0.3 } },
  title: { role: 'serif', size: 30, line: 34, tracking: -0.2, phone: { size: 25, line: 29 } },
  heading: { role: 'serif', size: 22, line: 26 },
  subtitle: { role: 'serifItalic', size: 20, line: 26, phone: { size: 18, line: 24 } },
  caption: { role: 'serifItalic', size: 14, line: 19 },
  lead: { role: 'sans', size: 17, line: 26 },
  body: { role: 'sans', size: 15, line: 23 },
  bodySm: { role: 'sans', size: 13, line: 19 },
  ui: { role: 'sansMedium', size: 14, line: 18 },
  label: { role: 'sansMedium', size: 11, line: 15, trackingEm: 0.08, upper: true },
  labelStrong: { role: 'sansSemi', size: 11, line: 15, trackingEm: 0.08, upper: true },
  micro: { role: 'sansMedium', size: 10, line: 13, trackingEm: 0.1, upper: true },
  numeral: { role: 'sans', size: 12, line: 16, tabular: true },
} satisfies Record<string, VariantSpec>;

export type Variant = keyof typeof variants;
export type Tone = 'primary' | 'secondary' | 'muted' | 'signal' | 'inverse';

const SurfaceContext = createContext<Surface>('ink');

/** Declares the surface underneath, so text picks legible colours automatically. */
export function SurfaceProvider({ value, children }: { value: Surface; children: ReactNode }) {
  return <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>;
}

export function useSurface() {
  return useContext(SurfaceContext);
}

export function toneColor(surface: Surface, tone: Tone): string {
  if (surface === 'paper') {
    switch (tone) {
      case 'primary':
        return color.sheetText;
      case 'secondary':
      case 'muted':
        return color.sheetTextSecondary;
      case 'signal':
        return emphasis.paper;
      case 'inverse':
        return palette.paper;
    }
  }
  switch (tone) {
    case 'primary':
      return color.text;
    case 'secondary':
      return color.textSecondary;
    case 'muted':
      return color.textMuted;
    case 'signal':
      return emphasis.ink;
    case 'inverse':
      return palette.ink;
  }
}

export interface TProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  /** Raw colour, overrides `tone`. */
  color?: string;
  italic?: boolean;
  upper?: boolean;
  align?: TextStyle['textAlign'];
  /** Font size override (keeps the variant's family and tracking). */
  size?: number;
  style?: StyleProp<TextStyle>;
}

export function T({
  variant = 'body',
  tone = 'primary',
  color: rawColor,
  italic,
  upper,
  align,
  size,
  style,
  ...rest
}: TProps) {
  const surface = useSurface();
  const { width } = useWindowDimensions();
  const spec: VariantSpec = variants[variant];
  const scale = width < layout.breakpoints.tablet && spec.phone ? spec.phone : spec;
  let role = spec.role;
  if (italic && role === 'serif') role = 'serifItalic';
  const fontSize = size ?? scale.size;
  const lineHeight = size ? Math.round(size * (scale.line / scale.size)) : scale.line;
  const uppercase = upper ?? spec.upper ?? false;
  const letterSpacing = scale.tracking ?? spec.tracking ?? (spec.trackingEm ? round2(fontSize * spec.trackingEm) : 0);
  return (
    <Text
      {...rest}
      style={[
        font(role),
        {
          fontSize,
          lineHeight,
          letterSpacing,
          color: rawColor ?? toneColor(surface, tone),
          textAlign: align,
        },
        uppercase && upperStyle,
        spec.tabular && tabularStyle,
        italic && role !== 'serifItalic' && italicStyle,
        style,
      ]}
    />
  );
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Tracking in px for a variant at a given size, e.g. to optically centre tracked caps. */
export function trackingFor(variant: Variant, size?: number): number {
  const spec: VariantSpec = variants[variant];
  if (spec.tracking !== undefined) return spec.tracking;
  return spec.trackingEm ? round2((size ?? spec.size) * spec.trackingEm) : 0;
}

const upperStyle: TextStyle = { textTransform: 'uppercase' };
const tabularStyle: TextStyle = { fontVariant: ['tabular-nums'] };
const italicStyle: TextStyle = { fontStyle: 'italic' };
