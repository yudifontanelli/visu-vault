/**
 * VAULT design tokens.
 *
 * Contemporary structure, vintage-editorial soul: ink black, paper off-white and
 * a warm graphite ramp. One signal colour (oxide) exists only for errors and
 * overdue states. No gradients beyond the dial's metal, no neon, no decoration
 * without a job.
 */

export const palette = {
  ink: '#0A0A0A',
  ink2: '#101010',
  graphite900: '#161615',
  graphite800: '#1D1C1B',
  graphite700: '#2A2927',
  graphite600: '#3A3936',
  graphite500: '#57544F',
  graphite400: '#7E7A73',
  graphite300: '#A29D94',
  graphite200: '#C8C2B7',
  paperDim: '#E7E1D4',
  paper: '#F5F1E8',
  oxide: '#B4442F',
} as const;

/** Semantic roles. `on ink` is the app's default surface; `sheet` is printed paper. */
export const color = {
  bg: palette.ink,
  surface: palette.graphite900,
  surfaceRaised: palette.graphite800,
  line: palette.graphite700,
  lineStrong: palette.graphite500,
  text: palette.paper,
  textSecondary: palette.graphite300,
  /** Smallest text allowed on ink (≈4.6:1). Anything dimmer is decoration only. */
  textMuted: palette.graphite400,
  sheet: palette.paper,
  sheetDim: palette.paperDim,
  sheetText: palette.ink,
  /** Smallest text allowed on paper (≈6.7:1). */
  sheetTextSecondary: palette.graphite500,
  sheetLine: '#CFC8BA',
  signal: palette.oxide,
  scrim: 'rgba(5,5,5,0.86)',
} as const;

export type Surface = 'ink' | 'paper';

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

export const shadow = {
  /** A sheet resting on the desk. */
  sheet: '0px 18px 40px rgba(0,0,0,0.45)',
  /** An object lifted while dragged. */
  lift: '0px 26px 50px rgba(0,0,0,0.55)',
  item: '0px 8px 22px rgba(0,0,0,0.38)',
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
