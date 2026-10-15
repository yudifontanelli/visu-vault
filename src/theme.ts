import { Platform } from 'react-native';

/** VAULT palette: black, off-white and graphite. */
export const colors = {
  black: '#0A0A0B',
  ink: '#111113',
  graphite900: '#17181A',
  graphite800: '#1F2023',
  graphite700: '#2A2B2F',
  graphite600: '#3A3B40',
  graphite500: '#55575D',
  graphite400: '#7A7C82',
  graphite300: '#A3A4A8',
  offWhite: '#EDEAE3',
  offWhiteDim: '#CFCBC2',
  error: '#C9867A',
} as const;

export const fonts = {
  sans: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif',
    default: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  }),
  /** Used inside SVG <Text>; web needs a CSS stack, native a single family. */
  svg: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif-medium',
    default: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  }),
} as const;

/** Responsive breakpoints shared by every screen (iPhone → desktop). */
export const breakpoints = {
  tablet: 640,
  desktop: 1024,
} as const;
