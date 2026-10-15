/**
 * VAULT design tokens — 2.0 "Editorial + Mesa Criativa".
 *
 * Four official colours and nothing else: black, off-white, graphite and warm
 * grey. The ramp below only fills the steps between them (lines, hover,
 * secondary text). No gradients, no neon, no alert colour: errors and overdue
 * states are said in words and contrast, never by colour alone.
 */

/** The official brand palette. Everything else derives from these four. */
export const brand = {
  black: '#0A0A0A',
  offWhite: '#F5F1E8',
  graphite: '#262626',
  warmGray: '#A8A39A',
} as const;

export const palette = {
  ink: brand.black,
  ink2: '#101010',
  graphite900: '#161616',
  graphite800: '#1D1D1D',
  graphite700: brand.graphite,
  graphite600: '#3A3936',
  graphite500: '#57544F',
  graphite400: '#8A867E',
  graphite300: brand.warmGray,
  graphite200: '#C8C2B7',
  paperDim: '#EAE5DA',
  paper: brand.offWhite,
} as const;

/** Semantic roles. `ink` is the dark surface; `sheet` is off-white paper. */
export const color = {
  bg: palette.ink,
  surface: palette.graphite900,
  surfaceRaised: palette.graphite800,
  line: palette.graphite700,
  lineStrong: palette.graphite500,
  text: palette.paper,
  textSecondary: palette.graphite300,
  /** Smallest text allowed on ink (≥4.5:1). Anything dimmer is decoration only. */
  textMuted: palette.graphite400,
  sheet: palette.paper,
  sheetDim: palette.paperDim,
  sheetText: palette.ink,
  /** Smallest text allowed on paper (≥4.5:1). Warm grey is never text on paper. */
  sheetTextSecondary: palette.graphite500,
  sheetLine: '#D3CCBF',
  scrim: 'rgba(5,5,5,0.86)',
} as const;

export type Surface = 'ink' | 'paper';

/**
 * Emphasis for errors, conflicts and overdue items: the strongest colour on the
 * surface. Always paired with words ("Atrasada", "Conflito"), never colour alone.
 */
export const emphasis: Record<Surface, string> = {
  ink: palette.paper,
  paper: palette.ink,
};

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

/** Mostly square. Corners stay sharp, as on a printed sheet. */
export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
} as const;

export const border = {
  hair: 0.5,
  thin: 1,
  heavy: 2,
} as const;

/** Soft and short. Depth is a hint, never a drop-shadow effect. */
export const shadow = {
  /** A sheet resting on the desk. */
  sheet: '0px 6px 18px rgba(0,0,0,0.22)',
  /** An object lifted while dragged. */
  lift: '0px 12px 28px rgba(0,0,0,0.30)',
  item: '0px 2px 8px rgba(0,0,0,0.18)',
} as const;

export const layout = {
  breakpoints: { tablet: 640, desktop: 1024, wide: 1440 },
  gutter: { phone: 20, tablet: 28, desktop: 40 },
  maxContent: 1320,
  sidebar: 264,
  inspector: 320,
  headerHeight: 52,
} as const;

/** Motion durations in ms. Precise and short: mechanisms, not theatre. */
export const duration = {
  instant: 90,
  fast: 160,
  base: 240,
  slow: 380,
  page: 520,
  reveal: 700,
} as const;

/** Cubic-bezier control points, consumed by `design/motion.ts`. */
export const curves = {
  standard: [0.2, 0, 0, 1],
  enter: [0.05, 0.7, 0.1, 1],
  exit: [0.3, 0, 0.8, 0.15],
  mechanical: [0.65, 0, 0.35, 1],
} as const;

export const stagger = 45;
