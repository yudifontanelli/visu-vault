import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { Platform, TextStyle } from 'react-native';

/**
 * Typefaces (all SIL Open Font License, bundled with the app — no font service):
 * - Instrument Serif: editorial display, headlines, captions in italic.
 * - Instrument Sans: interface and body text.
 * - IBM Plex Mono: technical micro-typography (labels, numbers, catalogue codes).
 */
export const fontAssets = {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
};

export type FontRole = 'serif' | 'serifItalic' | 'sans' | 'sansMedium' | 'sansSemi' | 'mono' | 'monoMedium';

const web = (family: string, fallback: string) => `${family}, ${fallback}`;
const SERIF_FALLBACK = 'Georgia, "Times New Roman", serif';
const SANS_FALLBACK = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO_FALLBACK = 'ui-monospace, Menlo, Consolas, monospace';

const loaded: Record<FontRole, TextStyle> = {
  serif: { fontFamily: Platform.OS === 'web' ? web('InstrumentSerif_400Regular', SERIF_FALLBACK) : 'InstrumentSerif_400Regular' },
  serifItalic: {
    fontFamily: Platform.OS === 'web' ? web('InstrumentSerif_400Regular_Italic', SERIF_FALLBACK) : 'InstrumentSerif_400Regular_Italic',
  },
  sans: { fontFamily: Platform.OS === 'web' ? web('InstrumentSans_400Regular', SANS_FALLBACK) : 'InstrumentSans_400Regular' },
  sansMedium: { fontFamily: Platform.OS === 'web' ? web('InstrumentSans_500Medium', SANS_FALLBACK) : 'InstrumentSans_500Medium' },
  sansSemi: { fontFamily: Platform.OS === 'web' ? web('InstrumentSans_600SemiBold', SANS_FALLBACK) : 'InstrumentSans_600SemiBold' },
  mono: { fontFamily: Platform.OS === 'web' ? web('IBMPlexMono_400Regular', MONO_FALLBACK) : 'IBMPlexMono_400Regular' },
  monoMedium: { fontFamily: Platform.OS === 'web' ? web('IBMPlexMono_500Medium', MONO_FALLBACK) : 'IBMPlexMono_500Medium' },
};

const serifSystem = Platform.select({ ios: 'Georgia', android: 'serif', default: SERIF_FALLBACK });
const sansSystem = Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif', default: SANS_FALLBACK });
const monoSystem = Platform.select({ ios: 'Menlo', android: 'monospace', default: MONO_FALLBACK });

/** Used if the bundled fonts fail to load: same hierarchy, system faces. */
const fallback: Record<FontRole, TextStyle> = {
  serif: { fontFamily: serifSystem },
  serifItalic: { fontFamily: serifSystem, fontStyle: 'italic' },
  sans: { fontFamily: sansSystem },
  sansMedium: { fontFamily: sansSystem, fontWeight: '500' },
  sansSemi: { fontFamily: sansSystem, fontWeight: '600' },
  mono: { fontFamily: monoSystem },
  monoMedium: { fontFamily: monoSystem, fontWeight: '500' },
};

let active: Record<FontRole, TextStyle> = fallback;

/**
 * Called once by the app root, before any text renders. Native platforms log an
 * error for unknown families, so custom faces are only referenced after loading.
 */
export function setFontsAvailable(available: boolean) {
  active = available ? loaded : fallback;
}

export function font(role: FontRole): TextStyle {
  return active[role];
}

/** Families for SVG <Text>, which resolves names differently on iOS. */
export const svgFont = {
  sans: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif-medium',
    default: web('InstrumentSans_600SemiBold', SANS_FALLBACK),
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: web('IBMPlexMono_500Medium', MONO_FALLBACK),
  }),
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: web('InstrumentSerif_400Regular', SERIF_FALLBACK),
  }),
} as const;
