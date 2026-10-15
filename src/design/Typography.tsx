import { createContext, ReactNode, useContext } from 'react';
import { StyleProp, Text, TextProps, TextStyle, useWindowDimensions } from 'react-native';

import { font, FontRole } from './fonts';
import { color, layout, palette, Surface } from './tokens';

interface Scale {
  size: number;
  line: number;
  tracking?: number;
}

interface VariantSpec extends Scale {
  role: FontRole;
  upper?: boolean;
  /** Smaller scale used on phones, so headlines never need horizontal scrolling. */
  phone?: Scale;
}

/**
 * Editorial type scale. Serif carries voice (mastheads, headlines, captions),
 * sans carries work (body, interface), mono carries the archive (labels,
 * numbers, catalogue codes).
 */
export const variants = {
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
  label: { role: 'mono', size: 11, line: 15, tracking: 1.3, upper: true },
  labelStrong: { role: 'monoMedium', size: 11, line: 15, tracking: 1.3, upper: true },
  micro: { role: 'mono', size: 9.5, line: 13, tracking: 1.6, upper: true },
  numeral: { role: 'mono', size: 11, line: 15, tracking: 0.6 },
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
        return color.signal;
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
      return color.signal;
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
  return (
    <Text
      {...rest}
      style={[
        font(role),
        {
          fontSize,
          lineHeight,
          letterSpacing: scale.tracking ?? spec.tracking ?? 0,
          color: rawColor ?? toneColor(surface, tone),
          textAlign: align,
        },
        uppercase && upperStyle,
        italic && role !== 'serifItalic' && italicStyle,
        style,
      ]}
    />
  );
}

const upperStyle: TextStyle = { textTransform: 'uppercase' };
const italicStyle: TextStyle = { fontStyle: 'italic' };
